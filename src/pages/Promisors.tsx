import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ReliabilityBar } from "../components/Charts";
import { RequireContract } from "../components/ContractGate";
import { LedgerEntry } from "../components/LedgerEntry";
import { EmptyState, ErrorState, LoadingRows } from "../components/Skeleton";
import { useLimits, useTitle } from "../hooks/useData";
import { useQuery } from "../hooks/useQuery";
import { useNow } from "../hooks/useNow";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { reliability, type PromisorRecord } from "../lib/types";

export const SMALL_SAMPLE = 5;

function Reliability({ r }: { r: PromisorRecord }) {
  const rel = reliability(r);
  return (
    <div className="rel">
      <ReliabilityBar fulfilled={r.fulfilled} broken={r.broken} inProgress={r.in_progress} pending={r.pending} unverifiable={r.unverifiable} />
      <p className="rel-line">
        {rel ? (
          <>
            <strong>{rel.pct}%</strong> kept of {rel.judged} judged
            {rel.judged < SMALL_SAMPLE && <span className="tag tag-neutral">small sample</span>}
          </>
        ) : (
          <span className="muted">Nothing judged yet</span>
        )}
      </p>
    </div>
  );
}

type Sort = "total" | "kept" | "broken" | "reliability";

function sortPromisors(items: PromisorRecord[], sort: Sort): PromisorRecord[] {
  const out = [...items];
  if (sort === "total") out.sort((a, b) => b.total - a.total);
  if (sort === "kept") out.sort((a, b) => b.fulfilled - a.fulfilled);
  if (sort === "broken") out.sort((a, b) => b.broken - a.broken);
  if (sort === "reliability")
    // Reliability is only meaningful with enough judged promises, so unrated and tiny samples sink.
    out.sort((a, b) => {
      const ra = reliability(a);
      const rb = reliability(b);
      const sa = ra && ra.judged >= 3 ? ra.pct : -1;
      const sb = rb && rb.judged >= 3 ? rb.pct : -1;
      return sb - sa || (rb?.judged ?? 0) - (ra?.judged ?? 0);
    });
  return out;
}

function PromisorsBody() {
  const limits = useLimits();
  const [sort, setSort] = useState<Sort>("total");
  const list = useQuery("promisors", () => api.listPromisors(0, limits.max_page_size), { ttl: 15_000 });
  const rows = useMemo(() => sortPromisors(list.data ?? [], sort), [list.data, sort]);
  if (list.loading) return <LoadingRows count={5} />;
  if (list.error) return <ErrorState error={list.error} onRetry={list.reload} />;
  if (rows.length === 0) return <EmptyState title="No promisors yet." hint="A promisor appears the first time someone files a promise in their name." />;
  return (
    <>
      <div className="toolbar">
        <label className="select">
          <span className="sr-only">Sort promisors</span>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="total">Most promises</option>
            <option value="kept">Most kept</option>
            <option value="broken">Most broken</option>
            <option value="reliability">Reliability (3+ judged)</option>
          </select>
        </label>
      </div>
      <ul className="promisor-grid">
        {rows.map((r) => (
          <li key={r.key}>
            <Link to={`/promisors/${encodeURIComponent(r.key)}`} className="promisor-card tilt">
              <h2>{r.name}</h2>
              <p className="muted small">
                {r.total} {r.total === 1 ? "promise" : "promises"} · since {formatDate(r.first_filed_at)}
              </p>
              <Reliability r={r} />
            </Link>
          </li>
        ))}
      </ul>
      <p className="muted small">
        Reliability = fulfilled ÷ (fulfilled + broken). Promises still in progress, unverifiable or never checked do not count either way, so
        read the sample size next to every percentage.
      </p>
    </>
  );
}

export function Promisors() {
  useTitle("Promisors");
  return (
    <main id="main" className="page">
      <div className="page-head">
        <h1 className="page-title">Track records</h1>
      </div>
      <p className="lede">Everyone who has a promise on the ledger, and how those promises are standing.</p>
      <RequireContract>
        <PromisorsBody />
      </RequireContract>
    </main>
  );
}

function ProfileBody({ keyName }: { keyName: string }) {
  const limits = useLimits();
  const now = useNow(60_000);
  const rec = useQuery(`promisor:${keyName}`, () => api.getPromisor(keyName), { ttl: 15_000 });
  const items = useQuery(`promisor-promises:${keyName}`, () => api.listPromisorPromises(keyName, 0, limits.max_page_size), { ttl: 15_000 });
  useTitle(rec.data?.name ?? "Promisor");
  if (rec.loading) return <LoadingRows count={3} />;
  if (rec.error || !rec.data) return <EmptyState title="No such promisor." hint="Names are matched ignoring case and spacing." />;
  const r = rec.data;
  return (
    <>
      <h1 className="page-title">{r.name}</h1>
      <div className="profile-grid">
        <div className="panel">
          <h2 className="panel-title">Standing</h2>
          <Reliability r={r} />
          <dl className="mini-dl">
            <div><dt>Filed</dt><dd>{r.total}</dd></div>
            <div><dt>Fulfilled</dt><dd>{r.fulfilled}</dd></div>
            <div><dt>In progress</dt><dd>{r.in_progress}</dd></div>
            <div><dt>Broken</dt><dd>{r.broken}</dd></div>
            <div><dt>Not yet checked</dt><dd>{r.pending}</dd></div>
            <div><dt>Unverifiable</dt><dd>{r.unverifiable}</dd></div>
          </dl>
        </div>
      </div>
      <h2 className="section-title">Promises</h2>
      {items.loading ? (
        <LoadingRows count={3} />
      ) : (
        <div className="ledger-list long-list">
          {[...(items.data ?? [])].reverse().map((p) => (
            <LedgerEntry key={p.id} promise={p} nowUnix={now} />
          ))}
        </div>
      )}
    </>
  );
}

export function PromisorProfile() {
  const { key } = useParams<{ key: string }>();
  return (
    <main id="main" className="page">
      <Link to="/promisors" className="back-link">
        ← All track records
      </Link>
      <RequireContract>{key ? <ProfileBody keyName={decodeURIComponent(key)} /> : null}</RequireContract>
    </main>
  );
}
