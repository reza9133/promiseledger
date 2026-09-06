import { createClient } from "genlayer-js";
import { TransactionStatus, type GenLayerClient, type GenLayerTransaction } from "genlayer-js/types";
import { CHAIN, CONTRACT_ADDRESS, NETWORK_NAME } from "./chain";
import { ContractRevertError, type LedgerStats, type PromiseRecord, type VerificationReport } from "./types";

type AnyClient = GenLayerClient<typeof CHAIN>;

/** Read-only client. Works without a connected wallet — GenLayer reads are public RPC calls. */
export const readClient: AnyClient = createClient({ chain: CHAIN });

/** One write-capable client per connected wallet address. Reads still go over plain RPC (see genlayer-js internals); only the four signing methods route through `provider`. */
export function makeWriteClient(address: `0x${string}`): AnyClient {
  return createClient({
    chain: CHAIN,
    account: address,
    provider: (typeof window !== "undefined" ? window.ethereum : undefined) as any,
  });
}

/** Best-effort switch of the injected wallet onto GenLayer Studionet. Never fatal — writeContract re-checks the chain itself and we surface a clear error if it's still wrong. */
export async function ensureWalletOnCorrectNetwork(client: AnyClient): Promise<void> {
  try {
    await client.connect(NETWORK_NAME);
    return;
  } catch {
    // Fall through to a manual chain switch — some wallets don't support the
    // Snap-installation step inside client.connect().
  }
  const eth = typeof window !== "undefined" ? window.ethereum : undefined;
  if (!eth) return;
  const hexId = `0x${CHAIN.id.toString(16)}`;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch (err: any) {
    if (err?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexId,
            chainName: CHAIN.name,
            rpcUrls: CHAIN.rpcUrls.default.http,
            nativeCurrency: CHAIN.nativeCurrency,
            blockExplorerUrls: [CHAIN.blockExplorers?.default.url],
          },
        ],
      });
    }
    // Any other failure (user declined the switch, etc.) is left for the
    // caller to discover on the next write attempt.
  }
}

function stripTag(message: string): string {
  const m = message.match(/\[(EXPECTED|EXTERNAL)\]\s*(.*)/s);
  return (m ? m[2] : message).trim();
}

/** Recursively hunts a decoded transaction receipt for the contract's own
 * `"[EXPECTED] ..."` / `"[EXTERNAL] ..."` message, the convention every
 * `gl.vm.UserError` in promise_ledger.py follows. Field names inside the
 * on-chain receipt shift between SDK versions, so we scan for the tag
 * itself rather than trust one specific path. This is a last-resort net —
 * `simulateWriteContract` (below) is what actually catches most reverts. */
function findTaggedMessage(value: unknown, depth = 0): string | null {
  if (depth > 6 || value == null) return null;
  if (typeof value === "string") {
    const m = value.match(/\[(EXPECTED|EXTERNAL)\][^"]*/);
    return m ? stripTag(m[0]) : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTaggedMessage(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const found = findTaggedMessage(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function isUserRejection(err: any): boolean {
  const code = err?.code;
  const msg = String(err?.message ?? err ?? "").toLowerCase();
  return code === 4001 || msg.includes("user rejected") || msg.includes("user denied");
}

function friendlyWriteError(err: any): Error {
  if (isUserRejection(err)) {
    return new ContractRevertError("Cancelled in the wallet.");
  }
  const msg = String(err?.message ?? err ?? "");
  if (msg.startsWith("Wallet is on chain")) {
    return new ContractRevertError(
      "Your wallet is on the wrong network. Switch it to GenLayer Studio Network (studionet) and try again.",
    );
  }
  if (msg.toLowerCase().includes("insufficient funds")) {
    return new ContractRevertError(
      "This wallet has no GEN on Studionet. Open studio.genlayer.com, select this same address in the account picker, and use the faucet (💧) button to fund it.",
    );
  }
  return new ContractRevertError(msg || "The transaction failed.");
}

/** Submits a write, waits for it to be accepted, and turns a failed
 * execution into a ContractRevertError with the contract's own message. */
async function submitWrite(
  client: AnyClient,
  functionName: string,
  args: unknown[],
): Promise<{ hash: string; receipt: GenLayerTransaction }> {
  // Dry-run first: `simulateWriteContract` runs the same call as a plain
  // `gen_call`, so a UserError surfaces immediately as a thrown
  // `"gen_call failed: <message>"` — no wallet signature, no waiting on
  // consensus, no gas spent on something that was always going to revert.
  try {
    await client.simulateWriteContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args: args as any[],
    });
  } catch (err: any) {
    const msg = String(err?.message ?? "");
    const m = msg.match(/^gen_call failed:\s*(.*)$/s);
    if (m) {
      throw new ContractRevertError(stripTag(m[1]));
    }
    // Any other failure here (a flaky RPC call, a transient network hiccup)
    // isn't proof the real write would fail — fall through and let the
    // actual transaction be the judge.
  }

  let hash: string;
  try {
    hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args: args as any[],
      value: 0n,
    });
  } catch (err) {
    throw friendlyWriteError(err);
  }

  const receipt = await client.waitForTransactionReceipt({
    hash: hash as any,
    status: TransactionStatus.ACCEPTED,
    interval: 2000,
    retries: 90,
    fullTransaction: true,
  } as any);

  const succeeded = (receipt as any).txExecutionResultName !== "FINISHED_WITH_ERROR";
  if (!succeeded) {
    const tagged = findTaggedMessage(receipt);
    throw new ContractRevertError(
      tagged ??
        "The contract rejected this action. It may be a cooldown, a permission check, or the evidence page couldn't be reached — reload and check the entry's current state.",
    );
  }

  return { hash, receipt };
}

// ---------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------

async function readOne<T>(functionName: string, args: unknown[] = []): Promise<T> {
  return readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args: args as any[],
  }) as Promise<T>;
}

export const getPromise = (id: number) => readOne<PromiseRecord>("get_promise", [id]);

export const getReport = (id: number) => readOne<VerificationReport>("get_report", [id]);

export const listPromises = (offset: number, limit: number) =>
  readOne<PromiseRecord[]>("list_promises", [offset, limit]);

export const listPromiseReports = (promiseId: number, offset: number, limit: number) =>
  readOne<VerificationReport[]>("list_promise_reports", [promiseId, offset, limit]);

export const listSubmitterPromises = (submitter: string) =>
  readOne<number[]>("list_submitter_promises", [submitter]);

export const getStats = () => readOne<LedgerStats>("get_stats");

// ---------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------

export async function registerPromise(
  client: AnyClient,
  title: string,
  description: string,
  evidenceUrl: string,
  deadlineAtUnix: number,
): Promise<{ hash: string; promiseId: number }> {
  const { hash } = await submitWrite(client, "register_promise", [
    title,
    description,
    evidenceUrl,
    deadlineAtUnix,
  ]);
  // Promise ids are assigned sequentially starting at 1 with no gaps, so
  // the id just minted is exactly the new total — more reliable than
  // picking a return-value field out of a receipt shape that varies
  // between SDK versions.
  const stats = await getStats();
  return { hash, promiseId: stats.total_promises };
}

export async function verifyPromise(client: AnyClient, promiseId: number) {
  return submitWrite(client, "verify_promise", [promiseId]);
}

export async function disputeReport(client: AnyClient, reportId: number) {
  return submitWrite(client, "dispute_report", [reportId]);
}

export async function updateEvidenceUrl(client: AnyClient, promiseId: number, newUrl: string) {
  return submitWrite(client, "update_evidence_url", [promiseId, newUrl]);
}
