import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ensureWalletOnCorrectNetwork, isWalletOnCorrectChain, makeWriteClient } from "../lib/genlayer";

type WalletStatus = "idle" | "connecting" | "connected" | "unavailable";

interface WalletState {
  status: WalletStatus;
  address: `0x${string}` | null;
  client: ReturnType<typeof makeWriteClient> | null;
  error: string | null;
  /** null = not checked yet, true/false = last known chain-match result. */
  chainOk: boolean | null;
  connect: () => Promise<void>;
  /** Re-attempts the add/switch flow, then re-checks. Call this from a
   * "wrong network" banner or button. */
  switchNetwork: () => Promise<void>;
  /** Clears this app's own connected state, and best-effort revokes the
   * wallet's permission on extensions that support it (most don't — see
   * the comment above the implementation). */
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

// MetaMask (and most injected wallets) don't have a "log out" concept the
// way a session cookie does — the permission grant lives in the extension
// itself and persists across reloads regardless of what this app does.
// `wallet_revokePermissions` exists on newer wallet versions and we try it,
// but the reliable part of "disconnect" is local: forget our own state, and
// remember that the user asked to disconnect so the auto-reconnect-on-load
// effect below doesn't immediately undo it.
const DISCONNECTED_KEY = "promiseledger:wallet-disconnected";

function markDisconnected() {
  try {
    localStorage.setItem(DISCONNECTED_KEY, "1");
  } catch {
    // ignore — worst case, auto-reconnect fires next load
  }
}

function clearDisconnectedMark() {
  try {
    localStorage.removeItem(DISCONNECTED_KEY);
  } catch {
    // ignore
  }
}

function wasManuallyDisconnected(): boolean {
  try {
    return localStorage.getItem(DISCONNECTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chainOk, setChainOk] = useState<boolean | null>(null);
  const clientRef = useRef<ReturnType<typeof makeWriteClient> | null>(null);

  const recheckChain = useCallback(async () => {
    setChainOk(await isWalletOnCorrectChain());
  }, []);

  const setupFor = useCallback(
    async (addr: `0x${string}`) => {
      clearDisconnectedMark();
      const client = makeWriteClient(addr);
      clientRef.current = client;
      setAddress(addr);
      setStatus("connected");
      await ensureWalletOnCorrectNetwork(client);
      await recheckChain();
    },
    [recheckChain],
  );

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setStatus("unavailable");
      setError("No wallet found. Install MetaMask (or another injected wallet) to file or verify promises.");
      return;
    }
    setStatus("connecting");
    setError(null);
    try {
      const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts?.[0]) throw new Error("No account returned by the wallet.");
      await setupFor(accounts[0] as `0x${string}`);
    } catch (err: any) {
      setStatus("idle");
      setError(err?.message ?? "Could not connect the wallet.");
    }
  }, [setupFor]);

  const switchNetwork = useCallback(async () => {
    if (!clientRef.current) return;
    await ensureWalletOnCorrectNetwork(clientRef.current);
    await recheckChain();
  }, [recheckChain]);

  const disconnect = useCallback(async () => {
    const eth = typeof window !== "undefined" ? window.ethereum : undefined;
    try {
      // Supported on newer MetaMask; silently ignored elsewhere.
      await eth?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
      // Not supported, or the user dismissed the revoke prompt — the local
      // state below still gets cleared, which is what actually matters for
      // this app.
    }
    markDisconnected();
    clientRef.current = null;
    setAddress(null);
    setStatus("idle");
    setChainOk(null);
    setError(null);
  }, []);

  useEffect(() => {
    const eth = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!eth?.on) return;
    const onAccounts = (accounts: string[]) => {
      if (accounts?.[0]) void setupFor(accounts[0] as `0x${string}`);
      else {
        markDisconnected();
        setAddress(null);
        setStatus("idle");
        setChainOk(null);
        clientRef.current = null;
      }
    };
    const onChain = () => {
      void recheckChain();
    };
    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, [setupFor, recheckChain]);

  // Reconnect silently if the site already has permission from a previous
  // visit — unless the user explicitly disconnected last time.
  useEffect(() => {
    const eth = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!eth || wasManuallyDisconnected()) return;
    eth
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts?.[0]) void setupFor(accounts[0] as `0x${string}`);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<WalletState>(
    () => ({ status, address, client: clientRef.current, error, chainOk, connect, switchNetwork, disconnect }),
    [status, address, error, chainOk, connect, switchNetwork, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
