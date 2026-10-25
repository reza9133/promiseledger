import { memo } from "react";
import { Link } from "react-router-dom";
import type { PromiseRecord } from "../lib/types";
import { entryNumber, formatDate, relativeToDeadline } from "../lib/format";
import { StatusSeal } from "./StatusSeal";
import { useTilt } from "../hooks/useMotion";

function LedgerEntryBase({ promise: p, nowUnix }: { promise: PromiseRecord; nowUnix: number }) {
  const tiltRef = useTilt<HTMLAnchorElement>(3);
  const overdue = p.deadline_at < nowUnix && p.status !== "FULFILLED";
  return (
    <Link ref={tiltRef} to={`/promise/${p.id}`} className="entry tilt" data-status={p.status}>
      <span className="entry-id">{entryNumber(p.id)}</span>
      <span className="entry-main">
        <span className="entry-title">{p.title}</span>
        <span className="entry-sub">
          <span className="entry-promisor">{p.promisor}</span>
          <span aria-hidden="true">·</span>
          <span className={overdue ? "is-overdue" : ""}>
            due {formatDate(p.deadline_at)} · {relativeToDeadline(p.deadline_at, nowUnix)}
          </span>
        </span>
        {(p.kept_late || p.flagged_stale || p.revision_count > 1) && (
          <span className="entry-tags">
            {p.kept_late && <span className="tag tag-warn">kept late</span>}
            {p.flagged_stale && <span className="tag tag-bad">paused: evidence unreadable</span>}
            {p.revision_count > 1 && <span className="tag tag-neutral">evidence repointed ×{p.revision_count - 1}</span>}
          </span>
        )}
      </span>
      <StatusSeal status={p.status} />
    </Link>
  );
}

export const LedgerEntry = memo(LedgerEntryBase);
