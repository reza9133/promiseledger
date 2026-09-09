/** Mirrors contracts/promise_ledger.py — field names match exactly. */

export type PromiseStatus =
  | "PENDING"
  | "FULFILLED"
  | "IN_PROGRESS"
  | "BROKEN"
  | "UNVERIFIABLE";

export type DisputeStatus = "" | "UPHELD" | "OVERTURNED";

export interface PromiseRecord {
  id: number;
  submitter: `0x${string}`;
  title: string;
  description: string;
  evidence_url: string;
  deadline_at: number;
  created_at: number;
  baseline_hash: string;
  status: PromiseStatus;
  verify_count: number;
  consecutive_failures: number;
  last_verified_at: number;
  last_report_id: number;
  flagged_stale: boolean;
}

export interface VerificationReport {
  id: number;
  promise_id: number;
  requester: `0x${string}`;
  status: PromiseStatus;
  summary: string;
  citation: string;
  snapshot_hash: string;
  snapshot: string;
  deadline_forced: boolean;
  created_at: number;
  disputed: boolean;
  dispute_status: DisputeStatus;
}

export interface LedgerStats {
  total_promises: number;
  fulfilled: number;
  broken: number;
  pending: number;
  report_count: number;
}

/** A revert surfaced by the contract, with the "[EXPECTED]"/"[EXTERNAL]" tag stripped. */
export class ContractRevertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractRevertError";
  }
}
