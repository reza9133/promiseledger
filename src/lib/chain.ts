import { studionet } from "genlayer-js/chains";

/**
 * PromiseLedger runs on GenLayer Studionet (the hosted Studio environment),
 * not a persistent testnet. State can be reset by GenLayer without notice.
 * To target another network (Bradbury, Asimov, localnet) swap this import;
 * `genlayer-js/chains` exports all of them. Kept apart from config.ts so the
 * heavy SDK is only pulled in by code that really talks to the chain.
 */
export const CHAIN = studionet;
export const NETWORK_NAME = "studionet" as const;
export * from "./config";
