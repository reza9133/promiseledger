import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RequireContract } from "../components/ContractGate";
import { ReportCard } from "../components/ReportCard";
import { StatusSeal } from "../components/StatusSeal";
import { UpdateEvidenceForm } from "../components/UpdateEvidenceForm";
import { EmptyState, ErrorState, LoadingRows } from "../components/Skeleton";
import { useLimits, useTitle } from "../hooks/useData";
import { invalidateAll, useQuery } from "../hooks/useQuery";
import { useNow } from "../hooks/useNow";
import { useToast } from "../hooks/useToast";
import { useWallet } from "../hooks/useWallet";
import { api } from "../lib/api";
import { explorerTxUrl } from "../lib/config";
import { cooldownRemaining, entryNumber, formatDateTime, formatSeconds, relativeToDeadline, shortAddr, shortHash, statusDescription } from "../lib/format";
import { verifyPromise } from "../lib/genlayer";
import { isDemo } from "../lib/mode";
import { ContractRevertError } from "../lib/types";

function CaseBody({ promiseId }: { promiseId: number }) {
  const { client, address, connect } = useWallet();
  const { push } = useToast();
  const limits = useLimits();
  const now = useNow();
  const [verifying, setVerifying] = useState(false);

  const promise = useQuery(`promise:${promiseId}`, () => api.getPromise(promiseId), { ttl: 8_000 });
  const reports = useQuery(`reports:${promiseId}`, () => api.listPromiseReports(promiseId, 0, limits.max_page_size), { ttl: 8_000 });
  const revisions = useQuery(`revisions:${promiseId}`, () => api.getEvidenceRevisions(promiseId), { ttl: 30_000 });
  const p = promise.data;
  useTitle(p ? p.title : `Entry ${entryNumber(promiseId)}`);

  function reloadAll() {
    invalidateAll();
    promise.reload();
    reports.reload();
    revisions.reload();
  }

  async function handleVerify() {
    if (isDemo()) return push("info", "Demo mode is read-only. Exit demo mode and connect a wallet to verify on-chain.");
    if (!client || !address) return void connect();
    setVerifying(true);
    try {
      const { hash } = await verifyPromise(client, promiseId);
      push("success", "Verification recorded on-chain.", { href: explorerTxUrl(hash), hrefLabel: "View transaction" });
      reloadAll();
    } catch (err) {
      push("error", err instanceof ContractRevertError ? err.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  if (promise.loading) return <LoadingRows count={4} />;
  if (promise.error || !p) {
    return promise.error && !/not found/i.test(promise.error.message) ? (
      <ErrorState error={promise.error} onRetry={promise.reload} />
    ) : (
      <EmptyState title="This entry doesn't exist." hint="It may not be filed yet, or the id in the URL is wrong." />
    );
  }

  const remaining = cooldownRemaining(p.last_verified_at, limits.min_verify_interval_seconds, now);
  const isSubmitter = !!address && p.submitter.toLowerCase() === address.toLowerCase();
  const verifyDisabled = verifying || p.flagged_stale || remaining > 0;
  const hint = p.flagged_stale
    ? "Paused until the submitter points it at a readable evidence page."
    : remaining > 0
      ? `Cooldown: try again in ${formatSeconds(remaining)}.`
      : null;
  const list = reports.data ? [...reports.data].reverse() : [];
  const overdue = p.deadline_at < now && p.status !== "FULFILLED";

  return (
    <article className="case">
      <div className="case-head">
        <span className="case-id">Entry {entryNumber(p.id)}</span>
        <StatusSeal status={p.status} size="lg" stamp />
        {p.kept_late && <span className="tag tag-warn">kept late: delivered after the deadline</span>}
      </div>
      <h1 className="case-title">{p.title}</h1>
      <p className="case-sub">
        Promised by <Link to={`/promisors/${encodeURIComponent(p.promisor_key)}`}>{p.promisor}</Link> · <span className="muted">{statusDescription(p.status)}</span>
      </p>

      <dl className="case-meta">
        <div>
          <dt>Filed by</dt>
          <dd title={p.submitter}>{shortAddr(p.submitter)}</dd>
        </div>
        <div>
          <dt>Filed on</dt>
          <dd>{formatDateTime(p.created_at)}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd className={overdue ? "is-overdue" : ""}>
            {formatDateTime(p.deadline_at)} · {relativeToDeadline(p.deadline_at, now)}
          </dd>
        </div>
        <div>
          <dt>Checked</dt>
          <dd>
            {p.verify_count}×{p.last_verified_at > 0 && ` · last ${formatDateTime(p.last_verified_at)}`}
          </dd>
        </div>
      </dl>

      <section className="case-block">
        <h2 className="case-block-title">What fulfilment means</h2>
        <p className="case-description">{p.description}</p>
      </section>

      <section className="case-block">
        <h2 className="case-block-title">Evidence page being watched</h2>
        <a className="case-evidence-link" href={p.evidence_url} target="_blank" rel="noreferrer">
          {p.evidence_url} ↗
        </a>
        <div className="case-hash-row">
          <span className="mono-chip" title={p.baseline_hash}>
            baseline {shortHash(p.baseline_hash)}
          </span>
        </div>
        <h3 className="case-sub-title">Evidence revision log</h3>
        {revisions.loading ? (
          <LoadingRows count={1} />
        ) : (
          <ol className="timeline">
            {(revisions.data ?? []).map((r) => (
              <li key={r.index} className={r.index === p.revision_count - 1 ? "is-current" : ""}>
                <span className="timeline-dot" aria-hidden="true" />
                <div>
                  <strong>v{r.index + 1}</strong> · {r.reason} · {formatDateTime(r.changed_at)} by {shortAddr(r.changed_by)}
                  <div className="timeline-url">{r.url}</div>
                  <span className="mono-chip" title={r.baseline_hash}>
                    {shortHash(r.baseline_hash)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="muted small">The log is append-only. The link can change only after three failed checks, and a repoint never changes the current verdict.</p>
      </section>

      {p.flagged_stale && isSubmitter && <UpdateEvidenceForm promiseId={p.id} currentUrl={p.evidence_url} onUpdated={reloadAll} />}
      {p.flagged_stale && !isSubmitter && (
        <p className="stale-note">
          Paused after repeated fetch failures. Only {shortAddr(p.submitter)} can point it at a new evidence link.
        </p>
      )}

      <div className="case-verify-row">
        <button className="btn btn-primary" onClick={handleVerify} disabled={verifyDisabled}>
          {verifying ? "Fetching evidence & asking validators…" : "Verify now"}
        </button>
        {hint && <span className="verify-hint">{hint}</span>}
      </div>

      <h2 className="case-history-title">Verification history</h2>
      {reports.loading ? (
        <LoadingRows count={2} />
      ) : list.length === 0 ? (
        <EmptyState title="Not checked yet." hint="Anyone can trigger the first check with Verify now." />
      ) : (
        <ul className="exhibit-list">
          {list.map((r, i) => (
            <ReportCard key={r.id} report={r} isLatest={i === 0} onDisputed={reloadAll} />
          ))}
        </ul>
      )}
    </article>
  );
}

export function Case() {
  const { id } = useParams<{ id: string }>();
  const promiseId = Number(id);
  return (
    <main id="main" className="page case-page">
      <Link to="/ledger" className="back-link">
        ← Back to the ledger
      </Link>
      <RequireContract>
        {Number.isInteger(promiseId) && promiseId > 0 ? <CaseBody promiseId={promiseId} /> : <EmptyState title="This entry doesn't exist." hint="The id in the URL is not a valid entry number." />}
      </RequireContract>
    </main>
  );
}
