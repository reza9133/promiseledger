import { STATUS_COLORS } from "../lib/seals";
import { statusLabel } from "../lib/format";
import type { PromiseStatus } from "../lib/types";

export interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Hand-written SVG donut with an accessible data table. */
export function Donut({ slices, size = 220, thickness = 28, centerLabel }: { slices: Slice[]; size?: number; thickness?: number; centerLabel?: string }) {
  const total = slices.reduce((n, s) => n + s.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <figure className="donut">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`Distribution of ${total} items`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness} />
        {total > 0 &&
          slices
            .filter((s) => s.value > 0)
            .map((s) => {
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={s.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${Math.max(len - 2, 0.5)} ${c - Math.max(len - 2, 0.5)}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              );
              offset += len;
              return el;
            })}
        <text x="50%" y="48%" textAnchor="middle" className="donut-total">
          {total}
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="donut-caption">
          {centerLabel ?? "total"}
        </text>
      </svg>
      <figcaption>
        <ul className="legend">
          {slices.map((s) => (
            <li key={s.key}>
              <span className="swatch" style={{ background: s.color }} aria-hidden="true" />
              {s.label} <strong>{s.value}</strong>
              {total > 0 && <span className="legend-pct"> {Math.round((s.value / total) * 100)}%</span>}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

export function statusSlices(counts: Record<PromiseStatus, number>): Slice[] {
  return (Object.keys(counts) as PromiseStatus[]).map((k) => ({
    key: k,
    label: statusLabel(k),
    value: counts[k],
    color: STATUS_COLORS[k],
  }));
}

/** Horizontal bar list, bars scaled to the largest value. */
export function Bars({ rows }: { rows: { label: string; value: number; color: string; hint?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="bars-label">{r.label}</span>
          <span className="bars-track" aria-hidden="true">
            <span className="bars-fill" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </span>
          <span className="bars-value">
            {r.value}
            {r.hint && <span className="bars-hint"> {r.hint}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Kept vs broken bar with the sample size shown next to it. */
export function ReliabilityBar({ fulfilled, broken, inProgress, pending, unverifiable }: { fulfilled: number; broken: number; inProgress: number; pending: number; unverifiable: number }) {
  const total = fulfilled + broken + inProgress + pending + unverifiable;
  const seg = (n: number, color: string, label: string) =>
    n > 0 ? <span key={label} className="rbar-seg" style={{ flexGrow: n, background: color }} title={`${label}: ${n}`} /> : null;
  return (
    <span className="rbar" role="img" aria-label={`${fulfilled} fulfilled, ${broken} broken, ${inProgress} in progress, ${pending} filed, ${unverifiable} unverifiable of ${total}`}>
      {seg(fulfilled, STATUS_COLORS.FULFILLED, "Fulfilled")}
      {seg(inProgress, STATUS_COLORS.IN_PROGRESS, "In progress")}
      {seg(broken, STATUS_COLORS.BROKEN, "Broken")}
      {seg(pending, STATUS_COLORS.PENDING, "Filed")}
      {seg(unverifiable, STATUS_COLORS.UNVERIFIABLE, "Unverifiable")}
    </span>
  );
}
