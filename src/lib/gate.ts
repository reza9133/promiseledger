import { CONTRACT_ADDRESS, LEGACY_V1_ADDRESS, isConfiguredAddress } from "./config";

export type GateState =
  | { kind: "checking" }
  | { kind: "demo" }
  | { kind: "not-configured" }
  | { kind: "legacy-v1" }
  | { kind: "unreachable"; message: string }
  | { kind: "ok"; version: string };

interface Probe {
  getVersion: () => Promise<string>;
  getStats: () => Promise<unknown>;
}

/**
 * Classifies the configured contract:
 *  - no address            -> not-configured
 *  - get_version works     -> ok
 *  - get_version fails but get_stats works -> legacy-v1 (an old-ABI deployment)
 *  - both fail             -> unreachable (RPC down, wrong address, Studionet reset)
 */
export async function probeContract(
  probe: Probe,
  address: string = CONTRACT_ADDRESS,
): Promise<GateState> {
  if (!isConfiguredAddress(address)) return { kind: "not-configured" };
  if (address.toLowerCase() === LEGACY_V1_ADDRESS.toLowerCase()) return { kind: "legacy-v1" };
  try {
    const version = String(await probe.getVersion());
    if (version.startsWith("2.")) return { kind: "ok", version };
    return { kind: "legacy-v1" };
  } catch (versionErr) {
    try {
      await probe.getStats();
      return { kind: "legacy-v1" };
    } catch {
      return { kind: "unreachable", message: String((versionErr as Error)?.message ?? versionErr).slice(0, 200) };
    }
  }
}
