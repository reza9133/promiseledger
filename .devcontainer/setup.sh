#!/usr/bin/env bash
# Runs once when the Codespace is created.
set -euo pipefail
npm ci
python3 -m venv .venv
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements-dev.txt
cat <<'MSG'

PromiseLedger v2 is ready.

  npm run test:all     frontend + contract tests (no network, no wallet)
  npm run mutation     mutation check: proves the contract tests catch real bugs
  npm run deploy       deploy contracts/promise_ledger.py to Studionet, prints the address
  npm run e2e          live Studionet end-to-end run + report in reports/

Live runs need the e2e fixtures to be on the repository's default branch
(raw.githubusercontent.com), or E2E_FIXTURE_BASE pointing at another host.
MSG
