/**
 * The v1 deployment. It speaks the OLD ABI (no `get_version`, no promisors,
 * `register_promise` without a promisor argument) and is kept here only so
 * the app can recognise it and explain why it cannot be used with this
 * frontend. Never point VITE_CONTRACT_ADDRESS at it.
 */
export const LEGACY_V1_ADDRESS = "0x5FA7e3fA2ddE37F3cA7b61E1C89D9396a57E264e";

/**
 * The v2 deployment on GenLayer Studionet (verified by the live end-to-end
 * run in reports/e2e-latest.md). `VITE_CONTRACT_ADDRESS` overrides it, for a
 * redeploy or another network. Studionet is a shared simulator and can be
 * reset; if it is, redeploy with `npm run deploy` and update this constant or
 * the variable.
 */
export const DEPLOYED_V2_ADDRESS = "0x139A49E5fa487483D09F3bF6F1d029E2eE6a9B43";

export const CONTRACT_ADDRESS: string = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "").trim() || DEPLOYED_V2_ADDRESS;

export function isConfiguredAddress(address: string = CONTRACT_ADDRESS): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export const EXPLORER_BASE = "https://explorer-studio.genlayer.com";
// Studio's explorer keys contracts under /contracts/, not /address/ like the
// Bradbury/Asimov explorers.
export const CONTRACT_EXPLORER_URL = isConfiguredAddress()
  ? `${EXPLORER_BASE}/contracts/${CONTRACT_ADDRESS}`
  : EXPLORER_BASE;
export const explorerTxUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;

/** Studionet has no separate faucet URL; funding is the 💧 button inside Studio's account selector. */
export const STUDIO_URL = "https://studio.genlayer.com";

export const REPO_URL = "https://github.com/reza9133/promiseledger";
export const AUTHOR_X_URL = "https://x.com/amirhp771";
