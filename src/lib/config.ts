/**
 * The v1 deployment. It speaks the OLD ABI (no `get_version`, no promisors,
 * `register_promise` without a promisor argument) and is kept here only so
 * the app can recognise it and explain why it cannot be used with this
 * frontend. Never point VITE_CONTRACT_ADDRESS at it.
 */
export const LEGACY_V1_ADDRESS = "0x5FA7e3fA2ddE37F3cA7b61E1C89D9396a57E264e";

/**
 * The active v2 deployment comes from `VITE_CONTRACT_ADDRESS` only. There is
 * deliberately no baked-in default: an empty value puts the app in its
 * "contract not configured" state, which offers the labelled demo mode.
 */
export const CONTRACT_ADDRESS: string = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "").trim();

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
