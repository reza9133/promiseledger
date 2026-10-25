import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LedgerStats, PromiseStatus } from "../lib/types";
import { sealTokens } from "../lib/seals";
import { statusLabel } from "../lib/format";
import { useReducedMotion } from "../hooks/useMotion";
import { SealField } from "./SealField";

const Scene = lazy(() => import("./three/Scene"));

/** Capability check, cheap and side-effect free. */
export function canUse3D(): { ok: boolean; reason?: string } {
  try {
    if (typeof window === "undefined") return { ok: false, reason: "no window" };
    if (window.innerWidth < 720) return { ok: false, reason: "small screen" };
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (nav.connection?.saveData) return { ok: false, reason: "data saver" };
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return { ok: false, reason: "low memory" };
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return { ok: false, reason: "no WebGL" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Hero3D({ stats, dark }: { stats: LedgerStats | undefined; dark: boolean }) {
  const reduced = useReducedMotion();
  const [capable] = useState(() => canUse3D());
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [docVisible, setDocVisible] = useState(true);
  const [hover, setHover] = useState<{ index: number; status: PromiseStatus } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const tokens = useMemo(() => sealTokens(stats, 90), [stats]);

  useEffect(() => {
    const onVis = () => setDocVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => {
    if (!box.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((e) => setVisible(e.some((x) => x.isIntersecting)), { threshold: 0 });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);

  const use3D = capable.ok && !reduced;
  const fallback = <SealField stats={stats} />;
  return (
    <div className="hero-visual" ref={box} data-mode={use3D ? "3d" : "svg"}>
      {use3D ? (
        <SceneBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <Scene tokens={tokens} active={visible && docVisible && !paused} dark={dark} onHover={setHover} />
          </Suspense>
        </SceneBoundary>
      ) : (
        fallback
      )}
      {use3D && (
        <>
          <button type="button" className="btn btn-ghost btn-xs hero-pause" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
            {paused ? "Resume animation" : "Pause animation"}
          </button>
          <div className="hero-tip" aria-live="polite">
            {hover ? `${statusLabel(hover.status)} promise` : "Each seal is a filed promise"}
          </div>
        </>
      )}
    </div>
  );
}
