import { useEffect } from "react";
import { api } from "../lib/api";
import { DEFAULT_LIMITS } from "../lib/rules";
import type { Limits } from "../lib/types";
import { useQuery } from "./useQuery";
import { useContract } from "./useContract";

export function useStats() {
  const { ready } = useContract();
  return useQuery(ready ? "stats" : null, () => api.getStats(), { ttl: 10_000 });
}

/** Live limits from `get_limits`, falling back to the compiled-in defaults. */
export function useLimits(): Limits {
  const { ready } = useContract();
  const q = useQuery(ready ? "limits" : null, () => api.getLimits(), { ttl: 3_600_000 });
  return q.data ?? DEFAULT_LIMITS;
}

export function useTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} · PromiseLedger`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
