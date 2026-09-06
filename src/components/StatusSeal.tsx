import { statusLabel } from "../lib/format";

export function StatusSeal({ status, size = "md" }: { status: string; size?: "sm" | "md" | "lg" }) {
  const cls = `seal seal-${size} seal-${status.toLowerCase()}`;
  return (
    <span className={cls}>
      <span className="seal-ring" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}

export function DisputeTag({ status }: { status: string }) {
  if (!status) {
    return <span className="tag tag-dispute-pending">disputed · pending</span>;
  }
  const cls = status === "UPHELD" ? "tag-dispute-upheld" : "tag-dispute-overturned";
  const label = status === "UPHELD" ? "disputed · upheld" : "disputed · overturned";
  return <span className={`tag ${cls}`}>{label}</span>;
}
