import { useMemo } from "react";
import type { LedgerStats } from "../lib/types";
import { STATUS_COLORS, orbitSlot, sealTokens } from "../lib/seals";

/** Static SVG version of the hero field. Used when WebGL is missing, motion is reduced, or the screen is small. */
export function SealField({ stats }: { stats: LedgerStats | undefined }) {
  const tokens = useMemo(() => sealTokens(stats, 72), [stats]);
  return (
    <svg className="seal-field" viewBox="-6 -4 12 8" role="img" aria-label="A field of seals, one per filed promise, coloured by status">
      <defs>
        <radialGradient id="sf-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="var(--accent)" stopOpacity=".22" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="3.6" fill="url(#sf-glow)" />
      {[2.4, 3.45, 4.5].map((r) => (
        <ellipse key={r} rx={r} ry={r * 0.52} fill="none" stroke="var(--line)" strokeWidth=".025" />
      ))}
      {tokens.map((status, i) => {
        const s = orbitSlot(i, tokens.length);
        const x = Math.cos(s.angle) * s.radius;
        const y = Math.sin(s.angle) * s.radius * 0.52 + s.y * 0.25;
        return (
          <g key={i} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
            <circle r=".32" fill={STATUS_COLORS[status]} />
            <circle r=".2" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".04" />
          </g>
        );
      })}
      <g>
        <circle r="1.05" fill="var(--logo-seal)" />
        <circle r=".82" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth=".05" />
        <path d="M-.42 .02 L-.1 .34 L.46 -.32" fill="none" stroke="var(--logo-tick)" strokeWidth=".17" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
