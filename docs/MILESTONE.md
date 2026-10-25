# Milestone v2: submission pack

**Linked project:** PromiseLedger (`github.com/reza9133/promiseledger`), saved as milestone v1 → v2.
**Contribution date:** 10/24/2026 · **Type:** Builder → Milestones

## Title (optional)
PromiseLedger v2: promisor track records, hardened consensus, new deployment

## Changes & Improvements (limit 1000 characters; this text is 862)
```
New v2 Intelligent Contract (new ABI, new deployment). Fixes: the stale-evidence path was unreachable (validators rejected leader fetch failures); outages burned disputes; submitters could swap evidence any time; SSRF gaps (172.16/12, CGNAT, hex/octal IPs, odd ports); prompt-delimiter breakout. New: promisor track records, append-only evidence revision log, "no quote, no verdict" (validators re-check the leader's quote in their own snapshot), kept-late tracking, raw-vs-final verdicts, duplicate/spam guards, O(1) stats, paginated lightweight views. Frontend: original logo, 11 lazy-loaded pages, 3D hero with fallbacks, light/dark, demo mode, SWR cache. Verification: 195 contract tests (normal, adversarial, consensus, randomized invariants), 31/31 injected bugs caught, 160 frontend tests, live Studionet E2E script + report in reports/. See CHANGELOG.md.
```

## Evidence links (fill in after pushing)
1. Pull request / commit range: `<PR or compare URL v1..v2>`
2. Live E2E report: `reports/e2e-latest.md` (commit link) and the Actions run
3. New contract on the Studio explorer: `<address from npm run deploy>`
4. Live site: `<Cloudflare Pages URL>`
5. CHANGELOG: `CHANGELOG.md`
