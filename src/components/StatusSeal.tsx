import { statusLabel } from "../lib/format";

const GLYPH: Record<string, string> = {
  PENDING: "○",
  IN_PROGRESS: "◐",
  FULFILLED: "✓",
  BROKEN: "✕",
  UNVERIFIABLE: "?",
};

export function StatusSeal({ status, size = "md", stamp = false }: { status: string; size?: "sm" | "md" | "lg"; stamp?: boolean }) {
  return (
    <span className={`seal seal-${size} seal-${status.toLowerCase()} ${stamp ? "seal-stamp" : ""}`.trim()}>
      <span className="seal-glyph" aria-hidden="true">
        {GLYPH[status] ?? "·"}
      </span>
      {statusLabel(status)}
    </span>
  );
}

export function DisputeTag({ status }: { status: string }) {
  if (!status) return <span className="tag tag-neutral">disputed · pending</span>;
  return status === "UPHELD" ? (
    <span className="tag tag-good">dispute upheld · page unchanged</span>
  ) : (
    <span className="tag tag-warn">dispute overturned · page changed</span>
  );
}
