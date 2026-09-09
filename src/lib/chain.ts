import { studionet } from "genlayer-js/chains";

/**
 * PromiseLedger is deployed on GenLayer Studionet (the hosted Studio
 * environment), not a persistent testnet. If you redeploy — including onto
 * Bradbury or Asimov later — update CONTRACT_ADDRESS and swap this import
 * (genlayer-js/chains also exports localnet, testnetAsimov, testnetBradbury).
 *
 * Studionet is a shared, hosted simulator: state can be reset by GenLayer
 * without notice, so don't treat entries filed here as permanent.
 */
export const CHAIN = studionet;
export const NETWORK_NAME = "studionet" as const;

const DEPLOYED_ADDRESS = "0x5FA7e3fA2ddE37F3cA7b61E1C89D9396a57E264e";

/** Override with VITE_CONTRACT_ADDRESS in .env if you deploy your own copy. */
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS?.trim() ||
  DEPLOYED_ADDRESS) as `0x${string}`;

export const EXPLORER_BASE = "https://explorer-studio.genlayer.com";
// Studio's explorer keys contracts under /contracts/, not /address/ like the
// Bradbury/Asimov explorers — different route, same idea.
export const CONTRACT_EXPLORER_URL = `${EXPLORER_BASE}/contracts/${CONTRACT_ADDRESS}`;
export const explorerTxUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;

/** Studionet has no separate faucet URL — funding happens from Studio's own
 * account selector (the 💧 button), for whichever address you connect here. */
export const STUDIO_URL = "https://studio.genlayer.com";
