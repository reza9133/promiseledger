import { useCallback, useEffect, useRef, useState } from "react";
import { invalidate, peek, dedupe } from "../lib/cache";
import { useDemo } from "../lib/mode";

export interface QueryState<T> {
  data: T | undefined;
  error: Error | null;
  /** True only while there is nothing to show yet. */
  loading: boolean;
  /** True while revalidating behind data that is already on screen. */
  refreshing: boolean;
  reload: () => void;
}

/**
 * Stale-while-revalidate data hook on top of lib/cache. `key === null` disables it.
 * Keys are namespaced by mode so demo and on-chain data can never mix.
 */
export function useQuery<T>(key: string | null, fetcher: () => Promise<T>, opts: { ttl?: number } = {}): QueryState<T> {
  const ttl = opts.ttl ?? 15_000;
  const demo = useDemo();
  const fullKey = key === null ? null : `${demo ? "demo" : "chain"}:${key}`;
  const persist = !demo;

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const initial = fullKey ? peek<T>(fullKey, ttl, persist) : undefined;
  const [data, setData] = useState<T | undefined>(initial?.value);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(!!fullKey && !initial);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const keyRef = useRef(fullKey);

  useEffect(() => {
    if (!fullKey) {
      setData(undefined);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const hit = peek<T>(fullKey, ttl, persist);
    if (keyRef.current !== fullKey) {
      keyRef.current = fullKey;
      setData(hit?.value);
    }
    setError(null);
    if (hit) setData(hit.value);
    if (hit?.fresh && tick === 0) {
      setLoading(false);
      return;
    }
    if (hit) setRefreshing(true);
    else setLoading(true);
    dedupe(fullKey, () => fetcherRef.current(), persist)
      .then((value) => {
        if (cancelled) return;
        setData(value);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fullKey, tick, ttl, persist]);

  const reload = useCallback(() => {
    if (fullKey) invalidate(fullKey);
    setTick((t) => t + 1);
  }, [fullKey]);

  return { data, error, loading, refreshing, reload };
}

/** Invalidate every cached read, e.g. after a successful write. */
export function invalidateAll() {
  invalidate("");
}
