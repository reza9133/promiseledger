# Performance

## Contract (on-chain work and payload size)
| Item | v1 | v2 |
|---|---|---|
| `get_stats` | loops over every promise (O(n)) | nine counters (O(1)) |
| `list_promises` | copies the whole id array each call | indexes only the requested slice; page size capped at 50 |
| `list_promise_reports` | returns up to 8 KB of snapshot per report | no snapshot; `get_report_snapshot(id)` on demand |
| `list_submitter_promises` | copies array | bounded by the 30-per-address cap |
| Failure reports | stored a full record each time with no cap | bounded by the stale rule (3) |

## Frontend (`npm run build`, measured)
- Initial route: 730 kB raw / 183 kB gzip JS (react 45 kB gz, router 8 kB gz, app 20 kB gz, genlayer-js 114 kB gz) and 6.9 kB gzip CSS.
- three.js (220 kB gz) is a separate chunk loaded only when the home hero is visible and WebGL is usable; every other page is its own 1–4 kB gz chunk.
- Fonts are self-hosted woff2 (no third-party request), `font-display: swap`.
- Reads go through a stale-while-revalidate cache with in-flight de-duplication (memory + sessionStorage), lists never fetch snapshots, list items are memoised, long lists use `content-visibility`.
- The 3D scene caps DPR, pauses when the tab is hidden or scrolled out of view, and falls back to SVG for reduced-motion, small screens and missing WebGL.

Known gap: `genlayer-js` is part of the initial route because live reads need it; it is not loaded in demo mode but the HTML still preloads it. Not measured: Lighthouse scores on a real device.
