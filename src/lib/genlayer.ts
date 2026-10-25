import { createClient } from "genlayer-js";
import { TransactionStatus, type GenLayerClient, type GenLayerTransaction } from "genlayer-js/types";
import { CHAIN, CONTRACT_ADDRESS, NETWORK_NAME } from "./chain";
import { normalize } from "./normalize";
import {
  ContractRevertError,
  type EvidenceRevision,
  type Hex,
  type LedgerStats,
  type Limits,
  type PromiseRecord,
  type PromisorRecord,
  type VerificationReport,
} from "./types";

type AnyClient = GenLayerClient<typeof CHAIN>;

const ADDRESS = CONTRACT_ADDRESS as Hex;

/** Read-only client. Works without a connected wallet: GenLayer reads are public RPC calls. */
export const readClient: AnyClient = createClient({ chain: CHAIN });

/** One write-capable client per connected wallet address. Reads still use plain RPC; only the signing methods route through `provider`. */
export function makeWriteClient(address: Hex): AnyClient {
  return createClient({
    chain: CHAIN,
    account: address,
    provider: (typeof window !== "undefined" ? window.ethereum : undefined) as any,
  });
}

/** Best-effort switch of the injected wallet onto GenLayer Studionet. Never fatal. */
export async function ensureWalletOnCorrectNetwork(client: AnyClient): Promise<void> {
  try {
    await client.connect(NETWORK_NAME);
    return;
  } catch {
    // Some wallets don't support the Snap-installation step inside client.connect().
  }
  const eth = typeof window !== "undefined" ? window.ethereum : undefined;
  if (!eth) return;
  const hexId = `0x${CHAIN.id.toString(16)}`;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch (err: any) {
    if (err?.code === 4902) {
      try {
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
      } catch {
        // isWalletOnCorrectChain() is what ultimately decides whether a write is safe.
      }
    }
  }
}

/** The wallet's actual active chain id, as the wallet itself sees it. `eth_sendTransaction`
 * always broadcasts to the wallet's selected network, so this is the check that predicts
 * whether a signed write can reach the contract. */
export async function getWalletChainId(): Promise<number | null> {
  const eth = typeof window !== "undefined" ? window.ethereum : undefined;
  if (!eth) return null;
  try {
    const hex: string = await eth.request({ method: "eth_chainId" });
    return parseInt(hex, 16);
  } catch {
    return null;
  }
}

export async function isWalletOnCorrectChain(): Promise<boolean> {
  return (await getWalletChainId()) === CHAIN.id;
}

export function stripTag(message: string): string {
  const m = message.match(/\[(EXPECTED|EXTERNAL)\]\s*(.*)/s);
  return (m ? m[2] : message).trim();
}

/** Hunts a decoded receipt for the contract's own "[EXPECTED] ..." / "[EXTERNAL] ..." message. */
export function findTaggedMessage(value: unknown, depth = 0): string | null {
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
  if (isUserRejection(err)) return new ContractRevertError("Cancelled in the wallet.");
  const msg = String(err?.message ?? err ?? "");
  if (msg.startsWith("Wallet is on chain")) {
    return new ContractRevertError(
      "Your wallet is on the wrong network. Switch it to GenLayer Studio Network (studionet) and try again.",
    );
  }
  if (msg.toLowerCase().includes("insufficient funds")) {
    return new ContractRevertError(
      "This wallet has no GEN on Studionet. Open studio.genlayer.com, select this same address in the account picker, and use the faucet button to fund it.",
    );
  }
  return new ContractRevertError(msg || "The transaction failed.");
}

async function submitWrite(
  client: AnyClient,
  functionName: string,
  args: unknown[],
): Promise<{ hash: string; receipt: GenLayerTransaction }> {
  if (!(await isWalletOnCorrectChain())) {
    throw new ContractRevertError(
      "Your wallet isn't on GenLayer Studio Network right now. Open the wallet menu to switch, then try again.",
    );
  }

  // Dry-run first: a UserError surfaces immediately as "gen_call failed: <message>",
  // with no signature and no wait on consensus.
  try {
    await client.simulateWriteContract({ address: ADDRESS, functionName, args: args as any[] });
  } catch (err: any) {
    const m = String(err?.message ?? "").match(/^gen_call failed:\s*(.*)$/s);
    if (m) throw new ContractRevertError(stripTag(m[1]));
    // Any other failure here is not proof the real write would fail.
  }

  let hash: string;
  try {
    hash = await client.writeContract({ address: ADDRESS, functionName, args: args as any[], value: 0n });
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

  if ((receipt as any).txExecutionResultName === "FINISHED_WITH_ERROR") {
    throw new ContractRevertError(
      findTaggedMessage(receipt) ??
        "The contract rejected this action. It may be a cooldown, a permission check, or the evidence page couldn't be reached. Reload and check the entry's current state.",
    );
  }
  return { hash, receipt };
}

// ---------------------------------------------------------------------
// Reads (all results are normalised to plain JSON)
// ---------------------------------------------------------------------

async function readOne<T>(functionName: string, args: unknown[] = []): Promise<T> {
  const raw = await readClient.readContract({ address: ADDRESS, functionName, args: args as any[] });
  return normalize<T>(raw);
}

export const chainReads = {
  getVersion: () => readOne<string>("get_version"),
  getLimits: () => readOne<Limits>("get_limits"),
  getStats: () => readOne<LedgerStats>("get_stats"),
  getPromise: (id: number) => readOne<PromiseRecord>("get_promise", [id]),
  getReport: (id: number) => readOne<VerificationReport>("get_report", [id]),
  getReportSnapshot: (id: number) => readOne<string>("get_report_snapshot", [id]),
  listPromises: (offset: number, limit: number) => readOne<PromiseRecord[]>("list_promises", [offset, limit]),
  listPromiseReports: (promiseId: number, offset: number, limit: number) =>
    readOne<VerificationReport[]>("list_promise_reports", [promiseId, offset, limit]),
  getEvidenceRevisions: (promiseId: number) => readOne<EvidenceRevision[]>("get_evidence_revisions", [promiseId]),
  listSubmitterPromises: (submitter: string) => readOne<number[]>("list_submitter_promises", [submitter]),
  getPromisor: (name: string) => readOne<PromisorRecord>("get_promisor", [name]),
  listPromisors: (offset: number, limit: number) => readOne<PromisorRecord[]>("list_promisors", [offset, limit]),
  listPromisorPromises: (name: string, offset: number, limit: number) =>
    readOne<PromiseRecord[]>("list_promisor_promises", [name, offset, limit]),
};

// ---------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------

export async function registerPromise(
  client: AnyClient,
  address: string,
  input: { title: string; description: string; promisor: string; evidenceUrl: string; deadlineAtUnix: number },
): Promise<{ hash: string; promiseId: number | null }> {
  const { hash } = await submitWrite(client, "register_promise", [
    input.title,
    input.description,
    input.promisor,
    input.evidenceUrl,
    input.deadlineAtUnix,
  ]);
  // The new id is the last entry of this submitter's own list, which cannot
  // race with other people's filings the way a global counter would.
  try {
    const ids = await chainReads.listSubmitterPromises(address);
    return { hash, promiseId: ids.length ? ids[ids.length - 1] : null };
  } catch {
    return { hash, promiseId: null };
  }
}

export const verifyPromise = (client: AnyClient, promiseId: number) => submitWrite(client, "verify_promise", [promiseId]);
export const disputeReport = (client: AnyClient, reportId: number) => submitWrite(client, "dispute_report", [reportId]);
export const updateEvidenceUrl = (client: AnyClient, promiseId: number, newUrl: string) =>
  submitWrite(client, "update_evidence_url", [promiseId, newUrl]);
