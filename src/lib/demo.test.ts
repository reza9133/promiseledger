import { describe, expect, it } from "vitest";
import { __demoData, demoApi, demoStats } from "./demo";

describe("demo fixture is internally consistent", () => {
  it("stats equal the counted promises", () => {
    const d = __demoData();
    const s = demoStats();
    expect(s.total_promises).toBe(d.promises.length);
    for (const key of ["pending", "fulfilled", "in_progress", "broken", "unverifiable"] as const) {
      expect(s[key]).toBe(d.promises.filter((p) => p.status.toLowerCase() === key).length);
    }
    expect(s.promisor_count).toBe(d.promisors.length);
  });
  it("promisor counters match their promises", () => {
    const d = __demoData();
    for (const r of d.promisors) {
      const mine = d.promises.filter((p) => p.promisor_key === r.key);
      expect(r.total).toBe(mine.length);
      expect(r.fulfilled).toBe(mine.filter((p) => p.status === "FULFILLED").length);
      expect(r.broken).toBe(mine.filter((p) => p.status === "BROKEN").length);
    }
  });
  it("every citation is a verbatim substring of its snapshot", () => {
    const d = __demoData();
    for (const r of d.reports) {
      const snap = d.snapshots.get(r.id) ?? "";
      if (r.citation) expect(snap.toLowerCase()).toContain(r.citation.toLowerCase());
    }
  });
  it("final status honours the no-quote and deadline rules", () => {
    for (const r of __demoData().reports) {
      if (["FULFILLED", "BROKEN"].includes(r.raw_status) && !r.citation && !r.deadline_forced) {
        expect(r.status).not.toBe(r.raw_status === "FULFILLED" ? "FULFILLED" : "BROKEN");
      }
    }
  });
  it("pagination is capped", async () => {
    expect((await demoApi.listPromises(0, 9999)).length).toBeLessThanOrEqual(50);
  });
  it("unknown ids throw", async () => {
    await expect(demoApi.getPromise(99999)).rejects.toThrow();
  });
});
