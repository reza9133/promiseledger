import { describe, expect, it } from "vitest";
import { cooldownRemaining, entryNumber, formatBytes, formatSeconds, shortAddr, shortHash, statusLabel, verdictExplanation } from "./format";
import { reliability } from "./types";

describe("format", () => {
  it("short forms", () => {
    expect(shortAddr("0x2bd806c97F0e00aF1a1fC3328fA763a9269723C8")).toContain("…");
    expect(shortAddr(undefined)).toBe("—");
    expect(shortHash("a".repeat(64))).toContain("…");
    expect(entryNumber(7)).toBe("#0007");
  });
  it("cooldown never goes negative", () => {
    expect(cooldownRemaining(1000, 300, 2000)).toBe(0);
    expect(cooldownRemaining(1000, 300, 1100)).toBe(200);
    expect(cooldownRemaining(0, 300, 1100)).toBe(0);
  });
  it("durations and bytes", () => {
    expect(formatSeconds(75)).toMatch(/1/);
    expect(formatBytes(2048)).toMatch(/KB|kB|KiB/i);
  });
  it("labels", () => expect(statusLabel("IN_PROGRESS").length).toBeGreaterThan(0));
  it("explains downgrades and deadline forcing, silent otherwise", () => {
    expect(verdictExplanation({ raw_status: "FULFILLED", status: "FULFILLED", deadline_forced: false, citation: "x" })).toBeNull();
    expect(verdictExplanation({ raw_status: "FULFILLED", status: "UNVERIFIABLE", deadline_forced: false, citation: "" })).toMatch(/No quote, no verdict/);
    expect(verdictExplanation({ raw_status: "IN_PROGRESS", status: "BROKEN", deadline_forced: true, citation: "q" })).toMatch(/deadline/);
  });
  it("reliability is null until something was judged, and shows the sample size", () => {
    expect(reliability({ fulfilled: 0, broken: 0 })).toBeNull();
    expect(reliability({ fulfilled: 3, broken: 1 })).toEqual({ pct: 75, judged: 4 });
  });
});
