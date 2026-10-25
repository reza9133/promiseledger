import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetCacheForTests, cached, dedupe, invalidate, peek, put } from "./cache";

beforeEach(() => __resetCacheForTests());

describe("cache", () => {
  it("shares one in-flight request between concurrent callers", async () => {
    const fetcher = vi.fn(async () => 42);
    const [a, b, c] = await Promise.all([dedupe("k", fetcher), dedupe("k", fetcher), dedupe("k", fetcher)]);
    expect([a, b, c]).toEqual([42, 42, 42]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("serves fresh hits without the network", async () => {
    put("x", 1);
    const fetcher = vi.fn(async () => 2);
    expect(await cached("x", fetcher, { ttl: 10_000 })).toBe(1);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("returns stale data and revalidates in the background", async () => {
    put("s", "old");
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 60_000);
    const fetcher = vi.fn(async () => "new");
    expect(await cached("s", fetcher, { ttl: 1000 })).toBe("old");
    vi.useRealTimers();
    await new Promise((r) => setTimeout(r, 5));
    expect(peek<string>("s", 10_000)?.value).toBe("new");
  });
  it("invalidates by prefix", () => {
    put("a:1", 1);
    put("a:2", 2);
    put("b:1", 3);
    invalidate("a:");
    expect(peek("a:1", 1000)).toBeUndefined();
    expect(peek("b:1", 1000)?.value).toBe(3);
  });
  it("does not poison the cache when the fetch fails", async () => {
    await expect(dedupe("f", async () => Promise.reject(new Error("rpc down")))).rejects.toThrow("rpc down");
    expect(peek("f", 1000)).toBeUndefined();
    expect(await dedupe("f", async () => 7)).toBe(7);
  });
  it("survives unavailable sessionStorage", async () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(await dedupe("q", async () => 5)).toBe(5);
    spy.mockRestore();
  });
});
