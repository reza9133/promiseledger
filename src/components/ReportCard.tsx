import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { disputeReport } from "../lib/genlayer";
import { explorerTxUrl } from "../lib/chain";
import { formatDateTime, shortAddr, shortHash } from "../lib/format";
import { ContractRevertError, type VerificationReport } from "../lib/types";
import { DisputeTag, StatusSeal } from "./StatusSeal";

function highlightCitation(snapshot: string, citation: string): React.ReactNode {
  if (!citation) return snapshot;
  const idx = snapshot.toLowerCase().indexOf(citation.toLowerCase());
  if (idx === -1) return snapshot;
  return (
    <>
      {snapshot.slice(0, idx)}
      <mark>{snapshot.slice(idx, idx + citation.length)}</mark>
      {snapshot.slice(idx + citation.length)}
    </>
  );
}

export function ReportCard({
  report,
  onDisputed,
}: {
  report: VerificationReport;
  onDisputed: () => void;
}) {
  const { client, address, connect } = useWallet();
  const { push } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [disputing, setDisputing] = useState(false);

  const canDispute = !report.disputed && report.status !== "UNVERIFIABLE";
  const excerpt = report.snapshot.length > 320 && !expanded ? `${report.snapshot.slice(0, 320)}…` : report.snapshot;

  async function handleDispute() {
    if (!client || !address) {
      await connect();
      return;
    }
    setDisputing(true);
    try {
      const { hash } = await disputeReport(client, report.id);
      push("success", "Dispute settled — the current page was re-hashed and compared.", {
        href: explorerTxUrl(hash),
        hrefLabel: "View transaction",
      });
      onDisputed();
    } catch (err) {
      const msg = err instanceof ContractRevertError ? err.message : "Could not dispute this report.";
      push("error", msg);
    } finally {
      setDisputing(false);
    }
  }

  return (
    <li className="exhibit">
      <div className="exhibit-rule" aria-hidden="true" />
      <div className="exhibit-body">
        <div className="exhibit-head">
          <StatusSeal status={report.status} size="sm" />
          {report.deadline_forced && <span className="tag tag-forced">deadline forced this verdict</span>}
          {report.disputed && <DisputeTag status={report.dispute_status} />}
          <span className="exhibit-meta">report #{report.id} · {formatDateTime(report.created_at)}</span>
        </div>

        <p className="exhibit-summary">{report.summary}</p>

        {report.snapshot ? (
          <blockquote className="exhibit-quote">
            “{highlightCitation(excerpt, report.citation)}”
            {report.snapshot.length > 320 && (
              <button type="button" className="link-btn" onClick={() => setExpanded((v) => !v)}>
                {expanded ? "show less" : "show full snapshot"}
              </button>
            )}
          </blockquote>
        ) : (
          <p className="exhibit-empty">No readable snapshot was captured on this check.</p>
        )}

        <div className="exhibit-foot">
          {report.snapshot_hash && (
            <span className="mono-chip" title={report.snapshot_hash}>
              {shortHash(report.snapshot_hash)}
            </span>
          )}
          <span className="exhibit-requester">requested by {shortAddr(report.requester)}</span>
          {canDispute && (
            <button type="button" className="btn btn-outline btn-xs" onClick={handleDispute} disabled={disputing}>
              {disputing ? "Checking live page…" : "Dispute this report"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
