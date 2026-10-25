import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LedgerEntry } from "../components/LedgerEntry";
import { RequireContract } from "../components/ContractGate";
import { EmptyState, ErrorState, LoadingRows } from "../components/Skeleton";
import { useStats, useTitle } from "../hooks/useData";
import { useQuery } from "../hooks/useQuery";
import { useNow } from "../hooks/useNow";
import { api } from "../lib/api";
import { statusLabel } from "../lib/format";
import { ALL_STATUSES, type PromiseRecord, type PromiseStatus } from "../lib/types";

const PAGE = 50;
type Sort = "new" | "old" | "deadline";

interface Chunk {
  start: number;
  items: PromiseRecord[];
}

export function filterPromises(
  items: PromiseRecord[],
  f: { status: string; q: string; promisor: string; sort: Sort },
): PromiseRecord[] {
  const q = f.q.trim().toLowerCase();
  const out = items.filter(
    (p) =>
      (f.status === "all" || p.status === f.status) &&
      (!f.promisor || p.promisor_key === f.promisor) &&
      (!q || p.title.toLowerCase().includes(q) || p.promisor.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
  );
  const sorted = [...out];
  if (f.sort === "new") sorted.sort((a, b) => b.id - a.id);
  else if (f.sort === "old") sorted.sort((a, b) => a.id - b.id);
  else sorted.sort((a, b) => a.deadline_at - b.deadline_at);
  return sorted;
}

function LedgerBody() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "all";
  const q = params.get("q") ?? "";
  const promisor = params.get("promisor") ?? "";
  const sort = (params.get("sort") as Sort) || "new";
  const now = useNow(60_000);

  const stats = useStats();
  const total = stats.data?.total_promises;
  const first = useQuery<Chunk>(total !== undefined && total > 0 ? `ledger:${total}` : null, async () => {
    const start = Math.max(0, (total as number) - PAGE);
    return { start, items: await api.listPromises(start, PAGE) };
  });
  const [older, setOlder] = useState<Chunk[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => setOlder([]), [total]);

  const all = useMemo(() => [...(first.data?.items ?? []), ...older.flatMap((c) => c.items)], [first.data, older]);
  const oldestLoaded = older.length ? older[older.length - 1].start : first.data?.start ?? 0;
  const hasMore = oldestLoaded > 0;

  async function loadMore() {
    setLoadingMore(true);
    try {
      const start = Math.max(0, oldestLoaded - PAGE);
      const items = await api.listPromises(start, oldestLoaded - start);
      setOlder((o) => [...o, { start, items }]);
    } finally {
      setLoadingMore(false);
    }
  }

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "all" && !(key === "sort" && value === "new")) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const promisors = useMemo(() => {
    const m = new Map<string, string>();
    all.forEach((p) => m.set(p.promisor_key, p.promisor));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [all]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    ALL_STATUSES.forEach((s) => (c[s] = all.filter((p) => p.status === s).length));
    return c;
  }, [all]);
  const shown = useMemo(() => filterPromises(all, { status, q, promisor, sort }), [all, status, q, promisor, sort]);

  const tabs: ("all" | PromiseStatus)[] = ["all", "FULFILLED", "IN_PROGRESS", "BROKEN", "PENDING", "UNVERIFIABLE"];

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <label className="sr-only" htmlFor="ledger-q">
            Search promises
          </label>
          <input id="ledger-q" className="input" type="search" placeholder="Search title, promisor, description…" value={q} onChange={(e) => set("q", e.target.value)} />
        </div>
        <label className="select">
          <span className="sr-only">Promisor</span>
          <select className="input" value={promisor} onChange={(e) => set("promisor", e.target.value)}>
            <option value="">All promisors</option>
            {promisors.map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="select">
          <span className="sr-only">Sort</span>
          <select className="input" value={sort} onChange={(e) => set("sort", e.target.value)}>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="deadline">Deadline soonest</option>
          </select>
        </label>
      </div>

      <div className="tabs" role="tablist" aria-label="Filter by status">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={status === t} className={`tab ${status === t ? "is-active" : ""}`} onClick={() => set("status", t)}>
            {t === "all" ? "All" : statusLabel(t)} <span className="tab-count">{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      {stats.error ? (
        <ErrorState error={stats.error} onRetry={stats.reload} />
      ) : total === 0 ? (
        <EmptyState title="No promises filed yet." hint="Be the first. Validators will baseline your evidence page immediately." action={<Link to="/file" className="btn btn-primary">File a promise</Link>} />
      ) : first.loading || stats.loading ? (
        <LoadingRows count={6} />
      ) : first.error ? (
        <ErrorState error={first.error} onRetry={first.reload} />
      ) : shown.length === 0 ? (
        <EmptyState title="Nothing matches those filters." hint={hasMore ? "Only loaded entries are searched. Load older entries to widen the search." : undefined} />
      ) : (
        <div className="ledger-list long-list">
          {shown.map((p) => (
            <LedgerEntry key={p.id} promise={p} nowUnix={now} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="load-more-row">
          <p className="muted small">
            Showing {all.length} of {total} entries. Filters apply to loaded entries only (the contract has no server-side search).
          </p>
          <button className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load older entries"}
          </button>
        </div>
      )}
    </>
  );
}

export function Ledger() {
  useTitle("The ledger");
  return (
    <main id="main" className="page">
      <div className="page-head">
        <h1 className="page-title">The ledger</h1>
        <Link to="/file" className="btn btn-primary">
          File a promise
        </Link>
      </div>
      <RequireContract>
        <LedgerBody />
      </RequireContract>
    </main>
  );
}
