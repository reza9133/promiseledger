/**
 * Tiny stale-while-revalidate cache with in-flight de-duplication.
 *
 *  - memory first, sessionStorage as a warm start across reloads (try/catch:
 *    storage can be absent or throw in private windows)
 *  - `cached()` returns fresh data immediately, stale data while revalidating,
 *    and shares one network promise between concurrent callers
 */
interface Entry<T> {
  value: T;
  at: number;
}

const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const STORAGE_PREFIX = "pl2:cache:";

function now() {
  return Date.now();
}

function readStorage<T>(key: string): Entry<T> | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as Entry<T>) : undefined;
  } catch {
    return undefined;
  }
}

function writeStorage(key: string, entry: Entry<unknown>) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* quota or unavailable: memory cache still works */
  }
}

/** Synchronous look-up. `fresh` is false once the entry is older than `ttl`. */
export function peek<T>(key: string, ttl: number, persist = true): { value: T; fresh: boolean } | undefined {
  let entry = memory.get(key) as Entry<T> | undefined;
  if (!entry && persist) {
    entry = readStorage<T>(key);
    if (entry) memory.set(key, entry);
  }
  if (!entry) return undefined;
  return { value: entry.value, fresh: now() - entry.at < ttl };
}

export function put<T>(key: string, value: T, persist = true) {
  const entry: Entry<T> = { value, at: now() };
  memory.set(key, entry);
  if (persist) writeStorage(key, entry);
}

export function invalidate(prefix = "") {
  for (const k of [...memory.keys()]) if (k.startsWith(prefix)) memory.delete(k);
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX + prefix)) sessionStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/** Fetch with de-duplication. Always hits the network unless a call is already in flight. */
export function dedupe<T>(key: string, fetcher: () => Promise<T>, persist = true): Promise<T> {
  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) return running;
  const p = fetcher()
    .then((value) => {
      put(key, value, persist);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

/** Fresh cache hit -> no network. Stale hit -> returns stale value and revalidates in the background. */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: { ttl?: number; persist?: boolean } = {},
): Promise<T> {
  const { ttl = 15_000, persist = true } = opts;
  const hit = peek<T>(key, ttl, persist);
  if (hit?.fresh) return hit.value;
  if (hit) {
    void dedupe(key, fetcher, persist).catch(() => undefined);
    return hit.value;
  }
  return dedupe(key, fetcher, persist);
}

export function __resetCacheForTests() {
  memory.clear();
  inflight.clear();
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}
