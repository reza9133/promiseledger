import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatsStrip } from "../components/StatsStrip";
import { LedgerEntry } from "../components/LedgerEntry";
import { RegisterForm } from "../components/RegisterForm";
import { EmptyState, LoadingRows } from "../components/Loading";
import { useWallet } from "../hooks/useWallet";
import { getStats, listPromises, listSubmitterPromises } from "../lib/genlayer";
import type { LedgerStats, PromiseRecord } from "../lib/types";

const PAGE_SIZE = 15;

export function LedgerPage() {
  const { address } = useWallet();
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [promises, setPromises] = useState<PromiseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [mineIds, setMineIds] = useState<number[] | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getStats();
      setStats(s);
      const total = s.total_promises;
      const start = Math.max(0, total - PAGE_SIZE);
      const page = await listPromises(start, PAGE_SIZE);
      setPromises([...page].reverse());
      setHasMore(start > 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage, refreshTick]);

  useEffect(() => {
    if (!address) {
      setMineIds(null);
      return;
    }
    let cancelled = false;
    listSubmitterPromises(address).then((ids) => {
      if (!cancelled) setMineIds([...ids].reverse());
    });
    return () => {
      cancelled = true;
    };
  }, [address, refreshTick]);

  async function loadMore() {
    if (!stats || loadingMore) return;
    setLoadingMore(true);
    try {
      const alreadyLoaded = promises.length;
      const remaining = stats.total_promises - alreadyLoaded;
      if (remaining <= 0) {
        setHasMore(false);
        return;
      }
      const start = Math.max(0, remaining - PAGE_SIZE);
      const limit = remaining - start;
      const page = await listPromises(start, limit);
      setPromises((prev) => [...prev, ...[...page].reverse()]);
      setHasMore(start > 0);
    } finally {
      setLoadingMore(false);
    }
  }

  const refresh = () => setRefreshTick((t) => t + 1);

  return (
    <main className="page">
      <StatsStrip stats={stats} />

      {address && mineIds && mineIds.length > 0 && (
        <div className="mine-strip">
          <span className="mine-strip-label">Filed by you:</span>
          {mineIds.slice(0, 8).map((id) => (
            <Link key={id} to={`/promise/${id}`} className="mine-chip">
              #{String(id).padStart(4, "0")}
            </Link>
          ))}
          {mineIds.length > 8 && <span className="mine-strip-more">+{mineIds.length - 8} more</span>}
        </div>
      )}

      <div className="page-toolbar">
        <h1 className="page-title">The register</h1>
        <button className="btn btn-primary" onClick={() => setShowRegister(true)}>
          + File a new promise
        </button>
      </div>

      {showRegister && (
        <RegisterForm onClose={() => setShowRegister(false)} onRegistered={refresh} />
      )}

      {loading ? (
        <LoadingRows count={5} />
      ) : promises.length === 0 ? (
        <EmptyState
          title="No promises filed yet."
          hint="Be the first — file one and validators will take a baseline snapshot of your evidence page immediately."
        />
      ) : (
        <>
          <div className="ledger-list">
            {promises.map((p) => (
              <LedgerEntry key={p.id} promise={p} />
            ))}
          </div>
          {hasMore && (
            <div className="load-more-row">
              <button className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load older entries"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
