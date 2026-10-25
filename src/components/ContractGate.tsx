import type { ReactNode } from "react";
import { useContract } from "../hooks/useContract";
import { setDemo, useDemo } from "../lib/mode";
import { CONTRACT_ADDRESS, LEGACY_V1_ADDRESS } from "../lib/config";
import { LoadingRows } from "./Skeleton";

/** Persistent banner shown on every page while demo data is active. */
export function DemoBanner() {
  const demo = useDemo();
  if (!demo) return null;
  return (
    <div className="demo-banner" role="region" aria-label="Demo mode">
      <strong>Demo data — not on-chain.</strong>
      <span>Everything here is invented sample data. Writes are disabled.</span>
      <button className="link-btn" onClick={() => setDemo(false)}>
        Exit demo
      </button>
    </div>
  );
}

/**
 * Renders children only when the contract can serve reads (a healthy v2
 * deployment, or labelled demo mode). Otherwise explains exactly what is
 * wrong and offers the demo instead of a dead screen.
 */
export function RequireContract({ children }: { children: ReactNode }) {
  const { gate, recheck } = useContract();
  if (gate.kind === "ok" || gate.kind === "demo") return <>{children}</>;
  if (gate.kind === "checking") return <LoadingRows count={3} />;

  const copy: Record<string, { title: string; body: ReactNode }> = {
    "not-configured": {
      title: "No contract is configured yet",
      body: (
        <>
          This build has no <code>VITE_CONTRACT_ADDRESS</code>. Deploy <code>contracts/promise_ledger.py</code> (v2) to
          GenLayer Studionet and set the variable, or look around with sample data first.
        </>
      ),
    },
    "legacy-v1": {
      title: "That address runs the old v1 contract",
      body: (
        <>
          <code>{CONTRACT_ADDRESS || LEGACY_V1_ADDRESS}</code> does not answer <code>get_version</code>, so it speaks the v1 ABI
          (no promisors, no evidence revision log). Deploy the v2 contract and point <code>VITE_CONTRACT_ADDRESS</code> at it.
        </>
      ),
    },
    unreachable: {
      title: "The contract could not be reached",
      body: (
        <>
          The RPC did not answer for <code>{CONTRACT_ADDRESS}</code>
          {gate.kind === "unreachable" && gate.message ? ` (${gate.message})` : ""}. Studionet may be down or may have been
          reset, in which case the contract needs redeploying.
        </>
      ),
    },
  };
  const c = copy[gate.kind];
  return (
    <div className="gate-wall" role="alert">
      <h2>{c.title}</h2>
      <p>{c.body}</p>
      <div className="gate-actions">
        <button className="btn btn-primary" onClick={() => setDemo(true)}>
          Try the demo with sample data
        </button>
        {gate.kind !== "not-configured" && (
          <button className="btn btn-outline" onClick={recheck}>
            Check again
          </button>
        )}
      </div>
    </div>
  );
}
