import { memo, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { useQuery } from "../hooks/useQuery";
import { api } from "../lib/api";
import { disputeReport } from "../lib/genlayer";
import { explorerTxUrl } from "../lib/config";
import { isDemo } from "../lib/mode";
import { formatBytes, formatDateTime, shortAddr, shortHash, verdictExplanation } from "../lib/format";
import { ContractRevertError, type VerificationReport } from "../lib/types";
import { DisputeTag, StatusSeal } from "./StatusSeal";
import { LoadingRows } from "./Skeleton";

function highlight(snapshot: string, citation: string): React.ReactNode {
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

/** Fetched only when the reader asks for it: snapshots can be up to 8 KB each. */
function Snapshot({ report }: { report: VerificationReport }) {
  const { data, loading, error } = useQuery(`snapshot:${report.id}`, () => api.getReportSnapshot(report.id), { ttl: 3_600_000 });
  if (loading) return <LoadingRows count={1} />;
  if (error) return <p className="exhibit-empty">Couldn't load the snapshot: {error.message}</p>;
  return (
    <blockquote className="exhibit-quote">
      “{highlight(data ?? "", report.citation)}”
    </blockquote>
  );
}

function ReportCardBase({ report, isLatest, onDisputed }: { report: VerificationReport; isLatest: boolean; onDisputed: () => void }) {
  const { client, address, connect } = useWallet();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [disputing, setDisputing] = useState(false);

  const failed = !report.snapshot_hash;
  const canDispute = !report.disputed && !failed;
  const why = verdictExplanation(report);

  async function handleDispute() {
    if (isDemo()) return push("info", "Demo mode is read-only.");
    if (!client || !address) return void connect();
    setDisputing(true);
    try {
      const { hash } = await disputeReport(client, report.id);
      push("success", "Dispute settled: the live page was re-hashed and compared.", { href: explorerTxUrl(hash), hrefLabel: "View transaction" });
      onDisputed();
    } catch (err) {
      push("error", err instanceof ContractRevertError ? err.message : "Could not dispute this report.");
    } finally {
      setDisputing(false);
    }
  }

  return (
    <li className="exhibit">
      <div className="exhibit-body">
        <div className="exhibit-head">
          <StatusSeal status={report.status} size="sm" stamp={isLatest} />
          {report.deadline_forced && <span className="tag tag-bad">deadline forced this verdict</span>}
          {report.status === "FULFILLED" && report.after_deadline && <span className="tag tag-warn">kept late</span>}
          {report.injection_flagged && (
            <span className="tag tag-bad" title="The captured page contains text that tries to instruct an AI reviewer. The verdict was not changed, but read the quote with care.">
              page addresses the reviewer
            </span>
          )}
          {report.disputed && <DisputeTag status={report.dispute_status} />}
          <span className="exhibit-meta">
            report #{report.id} · {formatDateTime(report.created_at)} · evidence v{report.evidence_revision + 1}
          </span>
        </div>

        <p className="exhibit-summary">{report.summary}</p>
        {why && <p className="exhibit-why">{why}</p>}
        {report.citation && (
          <p className="exhibit-cite">
            <span className="exhibit-cite-label">Verbatim quote</span> “{report.citation}”
          </p>
        )}

        {failed ? (
          <p className="exhibit-empty">No readable snapshot was captured on this check.</p>
        ) : (
          <>
            <button type="button" className="link-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {open ? "Hide captured page text" : `Show captured page text (${formatBytes(report.snapshot_len)})`}
            </button>
            {open && <Snapshot report={report} />}
          </>
        )}

        <div className="exhibit-foot">
          {report.snapshot_hash && (
            <span className="mono-chip" title={report.snapshot_hash}>
              {shortHash(report.snapshot_hash)}
            </span>
          )}
          <span className="exhibit-requester">requested by {shortAddr(report.requester)}</span>
          {report.disputed && report.dispute_hash && (
            <span className="mono-chip" title={`Live hash at dispute time: ${report.dispute_hash}`}>
              live {shortHash(report.dispute_hash)}
            </span>
          )}
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

export const ReportCard = memo(ReportCardBase);
