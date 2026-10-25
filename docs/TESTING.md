# Testing

| Layer | Command | What it covers |
|---|---|---|
| Contract (direct mode) | `npm run test:contract` | 195 tests: registration, verification, deadline rules, disputes, repointing, validator consensus logic, adversarial inputs, randomised invariants |
| Mutation check | `npm run mutation` | re-introduces 31 bugs (the v1 bugs and every v2 guard) into a temp copy; every one must make the suite fail |
| Frontend | `npm test` | 160 tests: URL vectors, limits drift vs contract source, cache, gate, format, demo fixture, components, page smoke tests |
| Typecheck / lint / build | `npm run typecheck && npm run lint && npm run build` | |
| Live Studionet | `npm run e2e` | real deployment, real validators, report in `reports/` |

Direct mode (`genlayer-test`) executes the contract natively with mocked web and LLM calls. It runs the leader once and captures the validator closure; `vm.run_validator()` replays it against different mocks to model a validator that sees another world. It does not simulate real network consensus, which is why the live script exists.

Shared fixtures: `tests/fixtures/url_vectors.json` is read by both the Python and the TypeScript suites, so the two URL validators cannot drift apart.

Harness note: `vm.warp()` does not refresh the cached `gl.message_raw["datetime"]`; `tests/contract/helpers.py` sets it explicitly.

## Live end-to-end (Codespaces)
1. Push this repo (the fixtures in `e2e/fixtures/` must be on the default branch).
2. Open a Codespace (the devcontainer installs everything).
3. `npm run deploy` → prints the contract address (or pass `PL_CONTRACT_ADDRESS`).
4. `PL_CONTRACT_ADDRESS=0x… npm run e2e` (add `-- --quick` to skip the deadline scenario, `-- --strict` to fail on model-dependent differences).
5. Commit `reports/e2e-latest.md` (or download the artifact from the *Live Studionet E2E* workflow) and link it in the submission.

Steps are HARD (deterministic contract behaviour) or MODEL (depends on what real validators or the web renderer do); only HARD failures fail the run unless `--strict`.
