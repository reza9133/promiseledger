import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { probeContract, type GateState } from "../lib/gate";
import { useDemo } from "../lib/mode";

interface ContractCtx {
  gate: GateState;
  /** True when reads/writes can be served: a healthy v2 contract, or labelled demo data. */
  ready: boolean;
  recheck: () => void;
}

const Ctx = createContext<ContractCtx | null>(null);

export function ContractProvider({ children, probe }: { children: ReactNode; probe?: () => Promise<GateState> }) {
  const demo = useDemo();
  const [state, setState] = useState<GateState>({ kind: "checking" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    setState({ kind: "checking" });
    const run =
      probe ??
      (async () => {
        const { chainReads } = await import("../lib/genlayer");
        return probeContract({ getVersion: chainReads.getVersion, getStats: chainReads.getStats });
      });
    run().then((s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
    };
  }, [demo, tick, probe]);

  const recheck = useCallback(() => setTick((t) => t + 1), []);
  const value = useMemo(() => {
    const gate: GateState = demo ? { kind: "demo" } : state;
    return { gate, ready: gate.kind === "ok" || gate.kind === "demo", recheck };
  }, [demo, state, recheck]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContract(): ContractCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useContract must be used inside <ContractProvider>");
  return ctx;
}
