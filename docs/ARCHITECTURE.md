# Architecture

```
 browser (React, no backend)                GenLayer Studionet
 ┌──────────────────────────┐   gen_call    ┌────────────────────────────┐
 │ pages ─ hooks ─ api.ts   │ ───reads────▶ │ PromiseLedger (v2)         │
 │   │        │             │               │  promises / reports /      │
 │   │   cache (SWR + dedupe)│  signed tx   │  revisions / promisors     │
 │   └─ genlayer.ts ────────┼ ───writes───▶ │                            │
 │ wallet (EIP-1193)        │               │  leader + validators fetch │
 └──────────────────────────┘               │  the evidence page, judge  │
                                            │  it, and reach consensus   │
                                            └────────────────────────────┘
```

## Verdict pipeline (`verify_promise`)
1. Leader fetches the evidence page, collapses whitespace, truncates to 8000 chars → *snapshot*.
2. Leader asks the model for `{status, summary, citation}`; the citation must be a verbatim substring of the snapshot or it is dropped.
3. Each validator independently re-fetches and checks: identical snapshot and hash; the leader's citation is verbatim in *its* snapshot (plain Python); its own model verdict equals the leader's.
4. After consensus the contract applies deterministic rules: no quote → UNVERIFIABLE (for FULFILLED/BROKEN); past deadline and not FULFILLED → BROKEN; FULFILLED after deadline → kept late.
5. The report stores raw and final status, the quote, the snapshot hash, and (separately) the snapshot text.

Fetch failures follow the same path: the leader reports `{ok:false, reason:"fetch"}`, validators accept it only if they cannot read the page either. Three consecutive failures flag the promise stale; only its submitter can repoint it, and the change is appended to the revision log.

## Storage layout
`promises`, `reports`, `report_snapshots`, `revisions` (per promise), `fingerprints` (duplicate guard), `promisors` + `promisor_keys` + `promisor_promises`, `submitter_promises`, `promise_reports`, and nine `u256` counters that make `get_stats` O(1).

## Frontend layout
`src/lib` (config, rules mirror, normaliser, cache, demo fixture, chain I/O), `src/hooks`, `src/components`, `src/pages` (one file per route, lazily imported), `src/components/three` (3D scene, only loaded by the home hero).
