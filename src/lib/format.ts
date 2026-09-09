export function shortAddr(addr: string | undefined | null): string {
  if (!addr) return "—";
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export function shortHash(hash: string | undefined | null, lead = 8, tail = 6): string {
  if (!hash) return "—";
  return hash.length > lead + tail + 1 ? `${hash.slice(0, lead)}…${hash.slice(-tail)}` : hash;
}

export function formatDate(unixSeconds: number | undefined | null): string {
  if (!unixSeconds) return "—";
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(unixSeconds: number | undefined | null): string {
  if (!unixSeconds) return "—";
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3 days left" / "overdue by 3 days" relative to now. */
export function relativeToDeadline(deadlineUnix: number, nowUnix = Date.now() / 1000): string {
  const diff = deadlineUnix - nowUnix;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const chunk = days > 0 ? `${days}d` : `${Math.max(hours, 1)}h`;
  return diff >= 0 ? `${chunk} left` : `overdue by ${chunk}`;
}

export function timeAgo(unixSeconds: number, nowUnix = Date.now() / 1000): string {
  const diff = Math.max(0, nowUnix - unixSeconds);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(unixSeconds);
}

export function cooldownRemaining(
  lastVerifiedAt: number,
  minIntervalSeconds: number,
  nowUnix = Date.now() / 1000,
): number {
  if (!lastVerifiedAt) return 0;
  return Math.max(0, lastVerifiedAt + minIntervalSeconds - nowUnix);
}

export function formatSeconds(total: number): string {
  const s = Math.ceil(total);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

const STATUS_COPY: Record<string, { label: string; description: string }> = {
  PENDING: { label: "Filed", description: "Registered, not yet checked against evidence." },
  FULFILLED: { label: "Fulfilled", description: "Evidence shows the promise was delivered." },
  IN_PROGRESS: { label: "In progress", description: "Evidence shows real movement, not complete." },
  BROKEN: { label: "Broken", description: "Evidence shows it was dropped, or the deadline passed." },
  UNVERIFIABLE: { label: "Unverifiable", description: "The evidence page couldn't be read." },
};

export function statusLabel(status: string): string {
  return STATUS_COPY[status]?.label ?? status;
}

export function statusDescription(status: string): string {
  return STATUS_COPY[status]?.description ?? "";
}
