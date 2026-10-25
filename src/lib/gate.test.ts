import { describe, expect, it } from "vitest";
import { probeContract } from "./gate";
import { CONTRACT_ADDRESS, DEPLOYED_V2_ADDRESS, LEGACY_V1_ADDRESS, isConfiguredAddress } from "./config";

const ADDR = "0x1111111111111111111111111111111111111111";
const ok = { getVersion: async () => "2.0.0", getStats: async () => ({}) };

describe("probeContract", () => {
  it("not configured", async () => expect((await probeContract(ok, "")).kind).toBe("not-configured"));
  it("legacy v1 address is recognised without a network call", async () => {
    expect((await probeContract(ok, LEGACY_V1_ADDRESS)).kind).toBe("legacy-v1");
  });
  it("ok on a v2 contract", async () => expect(await probeContract(ok, ADDR)).toEqual({ kind: "ok", version: "2.0.0" }));
  it("legacy when get_version is missing but get_stats works", async () => {
    const p = { getVersion: async () => Promise.reject(new Error("no such method")), getStats: async () => ({}) };
    expect((await probeContract(p, ADDR)).kind).toBe("legacy-v1");
  });
  it("legacy when version is 1.x", async () => {
    expect((await probeContract({ ...ok, getVersion: async () => "1.0.0" }, ADDR)).kind).toBe("legacy-v1");
  });
  it("unreachable when everything fails", async () => {
    const p = { getVersion: async () => Promise.reject(new Error("boom")), getStats: async () => Promise.reject(new Error("boom")) };
    const r = await probeContract(p, ADDR);
    expect(r.kind).toBe("unreachable");
  });
  it("the build ships with a configured v2 address that is not the legacy v1 one", () => {
    expect(isConfiguredAddress(DEPLOYED_V2_ADDRESS)).toBe(true);
    expect(DEPLOYED_V2_ADDRESS.toLowerCase()).not.toBe(LEGACY_V1_ADDRESS.toLowerCase());
    expect(isConfiguredAddress(CONTRACT_ADDRESS)).toBe(true);
  });
});
