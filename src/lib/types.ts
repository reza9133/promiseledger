/** Mirrors contracts/promise_ledger.py (v2). Field names match the dataclasses exactly. */

export type PromiseStatus = "PENDING" | "FULFILLED" | "IN_PROGRESS" | "BROKEN" | "UNVERIFIABLE";
export type DisputeStatus = "" | "UPHELD" | "OVERTURNED";
export type Hex = `0x${string}`;

export const ALL_STATUSES: PromiseStatus[] = ["PENDING", "IN_PROGRESS", "FULFILLED", "BROKEN", "UNVERIFIABLE"];

export interface PromiseRecord {
  id: number;
  submitter: Hex;
  title: string;
  description: string;
  promisor: string;
  promisor_key: string;
  evidence_url: string;
  deadline_at: number;
  created_at: number;
  baseline_hash: string;
  status: PromiseStatus;
  kept_late: boolean;
  verify_count: number;
  consecutive_failures: number;
  last_verified_at: number;
  last_report_id: number;
  revision_count: number;
  flagged_stale: boolean;
}

/** A report no longer carries the snapshot text; fetch it lazily with `get_report_snapshot`. */
export interface VerificationReport {
  id: number;
  promise_id: number;
  requester: Hex;
  status: PromiseStatus;
  raw_status: PromiseStatus;
  summary: string;
  citation: string;
  snapshot_hash: string;
  snapshot_len: number;
  evidence_revision: number;
  deadline_forced: boolean;
  after_deadline: boolean;
  injection_flagged: boolean;
  created_at: number;
  disputed: boolean;
  dispute_status: DisputeStatus;
  dispute_hash: string;
  disputed_by: Hex;
  disputed_at: number;
}

export interface EvidenceRevision {
  promise_id: number;
  index: number;
  url: string;
  baseline_hash: string;
  changed_by: Hex;
  changed_at: number;
  reason: string;
}

export interface PromisorRecord {
  key: string;
  name: string;
  total: number;
  pending: number;
  fulfilled: number;
  in_progress: number;
  broken: number;
  unverifiable: number;
  first_filed_at: number;
  last_filed_at: number;
}

export interface LedgerStats {
  version: string;
  total_promises: number;
  pending: number;
  fulfilled: number;
  in_progress: number;
  broken: number;
  unverifiable: number;
  kept_late: number;
  report_count: number;
  promisor_count: number;
  revision_count: number;
  disputes_upheld: number;
  disputes_overturned: number;
}

/** Keys are exactly those returned by `get_limits` (a test enforces this). */
export interface Limits {
  version: string;
  max_title_chars: number;
  max_description_chars: number;
  max_promisor_chars: number;
  min_promisor_chars: number;
  max_url_chars: number;
  max_evidence_chars: number;
  min_citation_chars: number;
  min_verify_interval_seconds: number;
  max_consecutive_failures: number;
  min_deadline_lead_seconds: number;
  max_deadline_horizon_seconds: number;
  max_promises_per_submitter: number;
  max_evidence_revisions: number;
  max_page_size: number;
}

/** A revert surfaced by the contract, with the "[EXPECTED]"/"[EXTERNAL]" tag stripped. */
export class ContractRevertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractRevertError";
  }
}

/** Raised by demo mode when something tries to write. */
export class DemoWriteError extends Error {
  constructor() {
    super("Demo mode is read-only. Exit demo mode and connect a wallet to write on-chain.");
    this.name = "DemoWriteError";
  }
}

/** Reliability = kept / (kept + broken). Returns null when nothing has been judged yet. */
export function reliability(r: Pick<PromisorRecord, "fulfilled" | "broken">): { pct: number; judged: number } | null {
  const judged = r.fulfilled + r.broken;
  if (judged === 0) return null;
  return { pct: Math.round((r.fulfilled / judged) * 100), judged };
}
