import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusSeal } from "../components/StatusSeal";
import { ReportCard } from "../components/ReportCard";
import { UpdateEvidenceForm } from "../components/UpdateEvidenceForm";
import { EmptyState, LoadingRows } from "../components/Loading";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { useNow } from "../hooks/useNow";
import { getPromise, listPromiseReports, verifyPromise } from "../lib/genlayer";
import { explorerTxUrl } from "../lib/chain";
import { cooldownRemaining, formatDateTime, formatSeconds, relativeToDeadline, shortAddr, shortHash } from "../lib/format";
import { RULES } from "../lib/rules";
import { ContractRevertError, type PromiseRecord, type VerificationReport } from "../lib/types";

export function CasePage() {
  const { id } = useParams<{ id: string }>();
  const promiseId = Number(id);
  const { client, address, connect } = useWallet();
  const { push } = useToast();
  const now = useNow();

  const [promise, setPromise] = useState<PromiseRecord | null>(null);
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(promiseId) || promiseId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        getPromise(promiseId),
        listPromiseReports(promiseId, 0, 200),
      ]);
      setPromise(p);
      setReports([...r].reverse());
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [promiseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleVerify() {
    if (!client || !address) {
      await connect();
      return;
    }
    setVerifying(true);
    try {
      const { hash } = await verifyPromise(client, promiseId);
      push("success", "Verification recorded on-chain.", { href: explorerTxUrl(hash), hrefLabel: "View transaction" });
      await load();
    } catch (err) {
      const msg = err instanceof ContractRevertError ? err.message : "Verification failed.";
      push("error", msg);
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <Link to="/" className="back-link">
          ← Back to the ledger
        </Link>
        <LoadingRows count={4} />
      </main>
    );
  }

  if (notFound || !promise) {
    return (
      <main className="page">
        <Link to="/" className="back-link">
          ← Back to the ledger
        </Link>
        <EmptyState title="This entry doesn't exist." hint="It may not be filed yet, or the id in the URL is wrong." />
      </main>
    );
  }

  const remaining = cooldownRemaining(promise.last_verified_at, RULES.MIN_VERIFY_INTERVAL_SECONDS, now);
  const isSubmitter = address && promise.submitter.toLowerCase() === address.toLowerCase();
  const verifyDisabled = verifying || promise.flagged_stale || remaining > 0;

  let verifyHint: string | null = null;
  if (promise.flagged_stale) verifyHint = "Paused until the submitter updates the evidence link (see below).";
  else if (remaining > 0) verifyHint = `Cooldown — try again in ${formatSeconds(remaining)}.`;

  return (
    <main className="page case-page">
      <Link to="/" className="back-link">
        ← Back to the ledger
      </Link>

      <div className="case-head">
        <span className="case-id">Entry #{String(promise.id).padStart(4, "0")}</span>
        <StatusSeal status={promise.status} size="lg" />
      </div>
      <h1 className="case-title">{promise.title}</h1>

      <dl className="case-meta">
        <div>
          <dt>Filed by</dt>
          <dd title={promise.submitter}>{shortAddr(promise.submitter)}</dd>
        </div>
        <div>
          <dt>Filed on</dt>
          <dd>{formatDateTime(promise.created_at)}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd className={promise.deadline_at < now && promise.status !== "FULFILLED" ? "is-overdue" : ""}>
            {formatDateTime(promise.deadline_at)} · {relativeToDeadline(promise.deadline_at, now)}
          </dd>
        </div>
        <div>
          <dt>Checked</dt>
          <dd>
            {promise.verify_count}× {promise.last_verified_at > 0 && `· last ${formatDateTime(promise.last_verified_at)}`}
          </dd>
        </div>
      </dl>

      <div className="case-block">
        <h2 className="case-block-title">What fulfillment means</h2>
        <p className="case-description">{promise.description}</p>
      </div>

      <div className="case-block">
        <h2 className="case-block-title">Evidence page being watched</h2>
        <a className="case-evidence-link" href={promise.evidence_url} target="_blank" rel="noreferrer">
          {promise.evidence_url} ↗
        </a>
        <div className="case-hash-row">
          <span className="mono-chip" title={promise.baseline_hash}>
            baseline {shortHash(promise.baseline_hash)}
          </span>
        </div>
      </div>

      {promise.flagged_stale && isSubmitter && (
        <UpdateEvidenceForm promiseId={promise.id} currentUrl={promise.evidence_url} onUpdated={load} />
      )}
      {promise.flagged_stale && !isSubmitter && (
        <p className="stale-note">
          Paused after repeated fetch failures. Only {shortAddr(promise.submitter)} can point it at a new
          evidence link.
        </p>
      )}

      <div className="case-verify-row">
        <button className="btn btn-primary" onClick={handleVerify} disabled={verifyDisabled}>
          {verifying ? "Fetching evidence & asking validators…" : "Verify now"}
        </button>
        {verifyHint && <span className="verify-hint">{verifyHint}</span>}
      </div>

      <h2 className="case-history-title">Verification history</h2>
      {reports.length === 0 ? (
        <EmptyState title="Not checked yet." hint="Anyone can trigger the first check with Verify now." />
      ) : (
        <ul className="exhibit-list">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} onDisputed={load} />
          ))}
        </ul>
      )}
    </main>
  );
}
