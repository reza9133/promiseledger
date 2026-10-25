# PromiseLedger v2 — live Studionet end-to-end report

**Overall: PASS** — 36/36 steps passed, 0 deterministic failure(s), 0 model-dependent observation(s) differing from expectation.

| | |
|---|---|
| Run id | `mvnx513n` |
| Date (UTC) | 2026-10-25T14:32:28.038Z |
| Network | GenLayer Studionet |
| Contract | [`0x139A49E5fa487483D09F3bF6F1d029E2eE6a9B43`](https://explorer-studio.genlayer.com/contracts/0x139A49E5fa487483D09F3bF6F1d029E2eE6a9B43) |
| Fixtures | https://raw.githubusercontent.com/reza9133/promiseledger/main/e2e/fixtures |
| Mode | full |
| Node | v20.19.2 |

HARD steps assert deterministic contract behaviour (access control, validation, counters, hashes, cooldowns). MODEL steps record what real LLM validators (or the web renderer) did with a fixture page; a ⚠️ means the observation differed from the expectation, which is information about the validators or renderer, not a contract defect.

## Steps

| | ID | Kind | Step | Result | Time |
|---|---|---|---|---|---|
| ✅ | S01 | HARD | Accounts created and funded | alice 0x802dc259d5Bc32636f532065fB3EB647117B5bb3, bob 0x7eC24E5A5c87BC30A3B4e55e3A9fd2EB40Aff9E8 | 0.8s |
| ✅ | S02 | HARD | Evidence fixtures are reachable and match the local files | base https://raw.githubusercontent.com/reza9133/promiseledger/main/e2e/fixtures | 0.7s |
| ✅ | S03 | HARD | Contract deployed (or existing v2 reused) | reusing 0x139A49E5fa487483D09F3bF6F1d029E2eE6a9B43 | 0.0s |
| ✅ | S04 | HARD | get_version is 2.x and get_limits matches the source constants | version 2.0.0 | 2.3s |
| ✅ | R01 | HARD | Rejected: private IPv4 literal | rejected (control call passes; node hides the reason) | 3.6s |
| ✅ | R02 | HARD | Rejected: cloud metadata address | rejected (control call passes; node hides the reason) | 1.1s |
| ✅ | R03 | HARD | Rejected: CGNAT range | rejected (control call passes; node hides the reason) | 1.1s |
| ✅ | R04 | HARD | Rejected: 172.16/12 range | rejected (control call passes; node hides the reason) | 1.1s |
| ✅ | R05 | HARD | Rejected: hex-encoded loopback | rejected (control call passes; node hides the reason) | 1.1s |
| ✅ | R06 | HARD | Rejected: non-443 port | rejected (control call passes; node hides the reason) | 1.2s |
| ✅ | R07 | HARD | Rejected: userinfo in URL | rejected (control call passes; node hides the reason) | 1.2s |
| ✅ | R08 | HARD | Rejected: plain http | rejected (control call passes; node hides the reason) | 1.1s |
| ✅ | R09 | HARD | Rejected: title too short | rejected (control call passes; node hides the reason) | 1.1s |
| ✅ | R10 | HARD | Rejected: prompt delimiter in description | rejected (control call passes; node hides the reason) | 1.1s |
| ✅ | R11 | HARD | Rejected: deadline in the past | on-chain: no promise created; reason "deadline_at must be at least one minute in the future" | 42.9s |
| ✅ | R12 | HARD | Rejected: deadline under one minute | on-chain: no promise created; reason "deadline_at must be at least one minute in the future" | 14.4s |
| ✅ | R13 | HARD | Rejected: blank promisor | rejected (control call passes; node hides the reason) | 1.2s |
| ✅ | R14 | HARD | No rejected input created a promise | total_promises unchanged at 0 | 1.2s |
| ✅ | H01 | HARD | File a promise; baseline recorded, promisor + revision log created | entry #1 | 43.9s |
| ✅ | H03 | MODEL | Baseline hash equals keccak256 of the fixture text recomputed locally | baseline hash independently reproduced | 1.1s |
| ✅ | H02 | HARD | Duplicate filing is refused | rejected (control call passes; node hides the reason) | 3.3s |
| ✅ | V01 | MODEL | Verify the kept promise: evidence-grounded verdict | FULFILLED, quote: "Single sign-on (SSO) is now available to every customer on all plans, including the free tier." | 26.2s |
| ✅ | V02 | HARD | Report integrity: quote is verbatim in the stored snapshot; hash recomputes | 231 chars, hash reproduced | 1.2s |
| ✅ | V03 | HARD | No quote, no verdict: FULFILLED/BROKEN never stands without a citation | ok | 0.0s |
| ✅ | V04 | HARD | Immediate re-verification is blocked by the cooldown | rejected (node hides the reason) | 1.1s |
| ✅ | D01 | MODEL | Dispute by a different address re-hashes the live page | UPHELD; hash fb2628e5b9… | 28.2s |
| ✅ | D02 | HARD | A report can be disputed only once | rejected (node hides the reason) | 1.1s |
| ✅ | V05 | MODEL | In-progress evidence -> IN_PROGRESS | IN_PROGRESS, quote: "General availability for all customers is planned but has no release date yet." | 57.8s |
| ✅ | V06 | MODEL | Cancellation evidence -> BROKEN | BROKEN, quote: "the single sign-on (SSO) project has been cancelled and will not ship" | 58.9s |
| ✅ | A01 | HARD | Prompt-injection page cannot force FULFILLED and is flagged | status IN_PROGRESS (raw IN_PROGRESS), flagged | 43.2s |
| ✅ | P01 | HARD | Only the submitter may repoint, and only after three failed checks | rejected (node hides the reason); rejected (node hides the reason) | 10.3s |
| ✅ | T01 | HARD | Deadline passes: non-fulfilled verdict is forced to BROKEN by the contract | final BROKEN, raw IN_PROGRESS, deadline_forced=true | 137.9s |
| ✅ | C01 | HARD | Statistics equal a brute-force recount of every promise | 5 promises, 5 reports | 3.0s |
| ✅ | C02 | HARD | Promisor track record equals a recount of its promises | 5 promises; reliability 33% over 3 judged | 2.3s |
| ✅ | C03 | HARD | Views are paginated and report lists carry no snapshot text | ok | 2.3s |
| ✅ | C04 | HARD | Reads need no wallet (anonymous client) | ok | 1.1s |

## Transactions

| Action | Wait | Link |
|---|---|---|
| expected rejection: register_promise | 40s | [0x6f669be2ae…](https://explorer-studio.genlayer.com/tx/0x6f669be2ae7dd8796eb07ff32729f4cf13e61fb8bbff086fca5f47079ee80495) |
| expected rejection: register_promise | 6s | [0xb1b1ba16c5…](https://explorer-studio.genlayer.com/tx/0xb1b1ba16c58fcbdb6fcf07010d993d2dae60684167abc492e80b2711afbe7d28) |
| register: Ship SSO to every customer | 5s | [0xa22b74ae09…](https://explorer-studio.genlayer.com/tx/0xa22b74ae097268a4bae4be4742560b5b97bfbf4ecea9ee22dbef4cbc1e2f9e4e) |
| verify #1 | 16s | [0x97fd0512b2…](https://explorer-studio.genlayer.com/tx/0x97fd0512b28d9547dfa76d1ac586598f1dfc85a51864de493d3a1c9cfeba85fc) |
| dispute (bob) | 1s | [0x91104650b7…](https://explorer-studio.genlayer.com/tx/0x91104650b71a8ab4adfc61a9c8e373556111a5a8e4d2a306d72a3765d18e3f85) |
| register: Release SSO in beta | 10s | [0x413d64626e…](https://explorer-studio.genlayer.com/tx/0x413d64626e92ce232c608e0cad69df5aa30d7f2dba7457cc88244809f8e20101) |
| verify #2 | 22s | [0x0394b261ce…](https://explorer-studio.genlayer.com/tx/0x0394b261ce86b7707c1a3b02dfdde97c42ff4395d0f73834500f6aaa8073f29a) |
| register: Deliver SSO after cancellation | 12s | [0xb23548ae42…](https://explorer-studio.genlayer.com/tx/0xb23548ae42971929573af9f8bcf682c53fd0d8f532bd4f9876e8ba5940a289fa) |
| verify #3 | 22s | [0x5fbeee8761…](https://explorer-studio.genlayer.com/tx/0x5fbeee87610ee3335f5eed3249311560a471d6d2e39ddc1ad124ee60668a7f23) |
| register: Release SSO with a hostile page | 5s | [0x646019ef54…](https://explorer-studio.genlayer.com/tx/0x646019ef5445f8f30b8ccd91c30e458528036e66ea9c7e22d35b27cd0a8d91e2) |
| verify #4 | 11s | [0x249c732ec3…](https://explorer-studio.genlayer.com/tx/0x249c732ec31cef576a3ee56a7594f24be64b5cece32601f458dd95d745eb3b91) |
| register: Release SSO before a short deadline | 11s | [0x45ebde6618…](https://explorer-studio.genlayer.com/tx/0x45ebde6618d40a4264b37a816262c8fae52e1b702ca6d7c5357f037f3684674f) |
| verify #5 | 10s | [0xbb693857c4…](https://explorer-studio.genlayer.com/tx/0xbb693857c4440e53e3e7dcb024098d309f23a53893e71285209da4fb56d38b72) |

## Not covered by this run

- The stale-evidence path (three failed fetches, then a repoint) needs a page that stops loading mid-test; it is covered by the direct-mode contract tests (`tests/contract`) instead.
- Browser wallet signing in the web app is not exercised here; this script signs with local keys.
- Validator disagreement and leader rotation are properties of the network; the validator logic itself is unit-tested in `tests/contract/test_validators.py`.
