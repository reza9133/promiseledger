# Milestone v2: submission pack

**Linked project:** PromiseLedger (`github.com/reza9133/promiseledger`), saved as milestone v1 -> v2.
**Contribution date:** 10/25/2026 · **Type:** Builder -> Milestones

## Title (optional)
PromiseLedger v2: promisor track records, hardened consensus, live-verified deployment

## Changes & Improvements (limit 1000 characters; this text is 909)
```
PromiseLedger v2: new Intelligent Contract (new ABI) deployed on Studionet at 0x139A49E5fa487483D09F3bF6F1d029E2eE6a9B43. Fixed: unreachable stale-evidence path (validators rejected leader fetch failures), outages burning disputes, submitters swapping evidence at will, SSRF gaps (172.16/12, CGNAT, hex/octal IPs, odd ports), prompt-delimiter breakout. New: promisor track records, append-only evidence revision log, "no quote, no verdict" (validators re-check the leader's quote in their own snapshot), kept-late tracking, raw-vs-final verdicts, duplicate/spam guards, O(1) stats, paginated lightweight views. Frontend: original logo, 11 pages (10 lazy-loaded), 3D hero with fallbacks, light/dark, SWR cache. Verification: 195 contract tests (normal, adversarial, consensus, randomized), 31/31 injected bugs caught, 161 frontend tests, live Studionet E2E 36/36 PASS (reports/e2e-latest.md). See CHANGELOG.md.
```

## Evidence links
1. Live E2E report: https://github.com/reza9133/promiseledger/blob/main/reports/e2e-latest.md
2. Contract on the Studio explorer: https://explorer-studio.genlayer.com/contracts/0x139A49E5fa487483D09F3bF6F1d029E2eE6a9B43
3. Live site: https://promiseledger-3gd.pages.dev
4. Changelog: https://github.com/reza9133/promiseledger/blob/main/CHANGELOG.md
