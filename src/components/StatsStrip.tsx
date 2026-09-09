import type { LedgerStats } from "../lib/types";

export function StatsStrip({ stats }: { stats: LedgerStats | null }) {
  const items: Array<{ label: string; value: number | string }> = stats
    ? [
        { label: "entries filed", value: stats.total_promises },
        { label: "fulfilled", value: stats.fulfilled },
        { label: "broken", value: stats.broken },
        { label: "never checked", value: stats.pending },
        { label: "reports written", value: stats.report_count },
      ]
    : [
        { label: "entries filed", value: "…" },
        { label: "fulfilled", value: "…" },
        { label: "broken", value: "…" },
        { label: "never checked", value: "…" },
        { label: "reports written", value: "…" },
      ];

  return (
    <div className="stats-strip">
      {items.map((it) => (
        <div className="stats-item" key={it.label}>
          <span className="stats-value">{it.value}</span>
          <span className="stats-label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
