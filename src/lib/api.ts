import { demoApi } from "./demo";
import { isDemo } from "./mode";
import type { chainReads as ChainReads } from "./genlayer";

type ReadApi = typeof ChainReads;

/**
 * Reads go to the chain, or to the labelled sample fixture in demo mode. Never both.
 * The SDK is imported lazily so demo mode and static pages never download it.
 */
type Fn = (...args: any[]) => Promise<any>;
const lazyChain = (name: keyof ReadApi): Fn => async (...args) => {
  const { chainReads } = await import("./genlayer");
  return (chainReads[name] as Fn)(...args);
};

function route(name: keyof ReadApi): Fn {
  const chain = lazyChain(name);
  return (...args) => (isDemo() ? (demoApi[name as keyof typeof demoApi] as Fn)(...args) : chain(...args));
}

export const api = {
  getVersion: route("getVersion"),
  getLimits: route("getLimits"),
  getStats: route("getStats"),
  getPromise: route("getPromise"),
  getReport: route("getReport"),
  getReportSnapshot: route("getReportSnapshot"),
  listPromises: route("listPromises"),
  listPromiseReports: route("listPromiseReports"),
  getEvidenceRevisions: route("getEvidenceRevisions"),
  listSubmitterPromises: route("listSubmitterPromises"),
  getPromisor: route("getPromisor"),
  listPromisors: route("listPromisors"),
  listPromisorPromises: route("listPromisorPromises"),
} as unknown as ReadApi;
