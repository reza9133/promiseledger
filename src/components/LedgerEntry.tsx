import { Link } from "react-router-dom";
import type { PromiseRecord } from "../lib/types";
import { formatDate, relativeToDeadline, shortAddr } from "../lib/format";
import { StatusSeal } from "./StatusSeal";

export function LedgerEntry({ promise }: { promise: PromiseRecord }) {
  const overdue = promise.status !== "FULFILLED" && promise.deadline_at < Date.now() / 1000;
  return (
    <Link to={`/promise/${promise.id}`} className={`ledger-row ledger-row-${promise.status.toLowerCase()}`}>
      <div className="ledger-row-edge" aria-hidden="true" />
      <div className="ledger-row-main">
        <div className="ledger-row-top">
          <h3 className="ledger-row-title">{promise.title}</h3>
          <span className="ledger-row-id">#{String(promise.id).padStart(4, "0")}</span>
        </div>
        <div className="ledger-row-meta">
          <StatusSeal status={promise.status} size="sm" />
          {promise.flagged_stale && <span className="tag tag-stale">stale — needs new evidence</span>}
          <span className="ledger-row-sep">filed by {shortAddr(promise.submitter)}</span>
          <span className="ledger-row-sep">{formatDate(promise.created_at)}</span>
          <span className="ledger-row-sep">
            verified {promise.verify_count}×
          </span>
          <span className={`ledger-row-sep ${overdue ? "is-overdue" : ""}`}>
            {relativeToDeadline(promise.deadline_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
