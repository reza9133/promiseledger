# Changelog

## 2.0.0 — milestone "v2"

Builds on the accepted v1 (a register of public promises judged by GenLayer validators against an evidence page). Everything below is new or changed relative to v1; `git diff v1..v2` shows each item.

### Contract (`contracts/promise_ledger.py`, 556 → 1051 lines, new ABI, **new deployment required**)

**Bugs fixed (each has a regression test and a mutation that re-introduces it)**
- The "three failed fetches → paused" path was unreachable: the validator returned `False` whenever the leader reported a failure, so consensus never accepted it. Now a validator accepts a fetch failure only if it cannot read the page either; a model failure is never rubber-stamped.
- A transient outage could burn a report's single dispute (an unreachable page counted as "overturned"). It now reverts without consuming the dispute.
- The submitter could repoint the evidence URL at any time, swapping in friendlier evidence. It is now allowed only after the promise was flagged stale, is capped, and never changes the current verdict.
- URL validation missed `172.16/12`, `100.64/10` (CGNAT), hex/octal/integer IPv4 spellings, non-443 ports, `198.18/15`, documentation ranges and rebinding hosts (`nip.io`, `sslip.io`, `localtest.me`…).
- Untrusted text could close the prompt's `<<<EVIDENCE>>>` block. Delimiters are now neutralised inside the prompt and rejected in user fields.
- `get_stats` iterated every promise (O(n)); `list_promises` copied the whole id array; report lists shipped up to 8 KB of snapshot per report.

**New functionality**
- *Promisor track records*: every promise names who made it; per-promisor counters, listing and profile views (`get_promisor`, `list_promisors`, `list_promisor_promises`).
- *Evidence revision log*: append-only history of every evidence URL a promise has used (`get_evidence_revisions`); each report records which revision it was drawn from.
- *No quote, no verdict*: a FULFILLED or BROKEN verdict without a verbatim citation is downgraded to UNVERIFIABLE; validators check the leader's quote against their own snapshot in plain Python.
- *Kept late*: a FULFILLED verdict reached after the deadline is recorded as such (`kept_late`, `after_deadline`).
- *Auditable verdicts*: reports keep the model's `raw_status` next to the final `status`, plus `injection_flagged`, `dispute_hash`, `disputed_by`, `disputed_at`.
- *Anti-spam*: duplicate promises rejected, 30 promises per address, deadline window (1 minute to 5 years).
- *O(1) statistics and capped pagination*; snapshots moved to `get_report_snapshot`; `get_version` / `get_limits` for clients.

### Frontend
- New original logo and brand kit (`public/brand/`), favicon, OG image.
- 11 routes (home, ledger, case file, filing, promisors, promisor profile, my filings, stats, docs, about, 404); every page except the home page is lazy-loaded.
- Lazy 3D hero (three.js) with SVG / reduced-motion / no-WebGL fallbacks; light and dark themes.
- Stale-while-revalidate cache with request de-duplication; lazy snapshots; contract-version gate; labelled, read-only demo mode.
- 161 unit/component/page tests; typecheck, lint, build green.

### Tests and tooling
- 195 contract tests in direct mode: normal, adversarial, consensus-logic (validator) and randomised invariant tests.
- Mutation check: 31 deliberately injected bugs, all caught.
- `e2e/live-e2e.mjs`: live Studionet end-to-end run with a Markdown/JSON report; Codespaces devcontainer; CI and manual E2E workflows.

### Upgrade notes
The ABI changed (`register_promise` takes a `promisor`; reports no longer carry `snapshot`), so v2 must be deployed as a **new contract** (`npm run deploy`) and the frontend pointed at it with `VITE_CONTRACT_ADDRESS`. The v1 address remains readable only by v1 clients.
