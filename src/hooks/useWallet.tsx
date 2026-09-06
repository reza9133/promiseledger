import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ensureWalletOnCorrectNetwork, makeWriteClient } from "../lib/genlayer";

type WalletStatus = "idle" | "connecting" | "connected" | "unavailable";

interface WalletState {
  status: WalletStatus;
  address: `0x${string}` | null;
  client: ReturnType<typeof makeWriteClient> | null;
  error: string | null;
  connect: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ReturnType<typeof makeWriteClient> | null>(null);

  const setupFor = useCallback(async (addr: `0x${string}`) => {
    const client = makeWriteClient(addr);
    clientRef.current = client;
    setAddress(addr);
    setStatus("connected");
    void ensureWalletOnCorrectNetwork(client);
  }, []);

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

  useEffect(() => {
    const eth = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!eth?.on) return;
    const onAccounts = (accounts: string[]) => {
      if (accounts?.[0]) void setupFor(accounts[0] as `0x${string}`);
      else {
        setAddress(null);
        setStatus("idle");
        clientRef.current = null;
      }
    };
    const onChain = () => {
      // A chain switch invalidates nothing about the address itself; the
      // client's transport re-checks the chain on the next write.
    };
    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, [setupFor]);

  // Reconnect silently if the site already has permission from a previous visit.
  useEffect(() => {
    const eth = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!eth) return;
    eth
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts?.[0]) void setupFor(accounts[0] as `0x${string}`);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<WalletState>(
    () => ({ status, address, client: clientRef.current, error, connect }),
    [status, address, error, connect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
