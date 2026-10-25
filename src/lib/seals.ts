import type { LedgerStats, PromiseStatus } from "./types";

export const STATUS_COLORS: Record<PromiseStatus, string> = {
  FULFILLED: "#2f7d5b",
  IN_PROGRESS: "#c98a1b",
  BROKEN: "#b23a2e",
  PENDING: "#5a78a8",
  UNVERIFIABLE: "#8b8f99",
};

const ORDER: PromiseStatus[] = ["FULFILLED", "IN_PROGRESS", "BROKEN", "PENDING", "UNVERIFIABLE"];

export function statusCounts(s: LedgerStats): Record<PromiseStatus, number> {
  return {
    FULFILLED: s.fulfilled,
    IN_PROGRESS: s.in_progress,
    BROKEN: s.broken,
    PENDING: s.pending,
    UNVERIFIABLE: s.unverifiable,
  };
}

/**
 * One token per promise, scaled down proportionally to at most `max` tokens
 * (every non-empty status keeps at least one). Deterministic, so the SVG
 * fallback and the 3D scene always show the same field.
 */
export function sealTokens(stats: LedgerStats | undefined, max = 90): PromiseStatus[] {
  if (!stats || stats.total_promises === 0) return [];
  const counts = statusCounts(stats);
  const total = ORDER.reduce((n, k) => n + counts[k], 0);
  if (total === 0) return [];
  const scale = total > max ? max / total : 1;
  const out: PromiseStatus[] = [];
  for (const k of ORDER) {
    const n = counts[k] === 0 ? 0 : Math.max(1, Math.round(counts[k] * scale));
    for (let i = 0; i < n; i++) out.push(k);
  }
  return out;
}

/** Deterministic pseudo-random in [0,1) from an integer. */
export function rand(i: number, salt = 0): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Orbit layout shared by SVG and 3D: ring radius, angle, height. */
export function orbitSlot(i: number, n: number) {
  const ring = i % 3;
  const radius = 2.3 + ring * 1.05 + rand(i, 1) * 0.35;
  const angle = (i / Math.max(n, 1)) * Math.PI * 2 * 3 + rand(i, 2) * 0.6;
  const y = (rand(i, 3) - 0.5) * 1.5;
  return { ring, radius, angle, y };
}
