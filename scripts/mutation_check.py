#!/usr/bin/env python3
"""Mutation check: prove the contract test-suite has teeth.

Each mutation re-introduces one realistic bug (an old v1 bug, or a guard that
v2 added) into a temporary copy of the contract. The suite must FAIL for every
mutation ("killed"). A surviving mutation means a guard is untested.

    python scripts/mutation_check.py            # all mutations
    python scripts/mutation_check.py --json out.json
"""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = (ROOT / "contracts" / "promise_ledger.py").read_text()

MUTATIONS = [
    ("v1 bug: validator rejects a reported fetch failure (stale path unreachable)",
     'return leader_data.get("reason") == "fetch" and mine_snapshot is None', "return False"),
    ("validator rubber-stamps any leader failure",
     'return leader_data.get("reason") == "fetch" and mine_snapshot is None', "return True"),
    ("validator stops checking the leader's quote",
     'if citation and _ground_citation(citation, mine_snapshot) != citation:\n                return False', "pass"),
    ("validator stops comparing snapshots",
     'if leader_data.get("snapshot") != mine_snapshot:\n                return False', "pass"),
    ("validator ignores its own model verdict",
     'return mine["status"] == leader_data.get("status")', "return True"),
    ("v1 bug: evidence URL can be swapped while not stale",
     'if not promise.flagged_stale:\n            raise gl.vm.UserError(\n                "[EXPECTED] the evidence url can only change', 'if False:\n            raise gl.vm.UserError(\n                "[EXPECTED] the evidence url can only change'),
    ("repoint ignores the submitter check",
     'if promise.submitter != gl.message.sender_address:', 'if False:'),
    ("prompt delimiters are no longer neutralised",
     'return text.replace("<<<", "\\u2039\\u2039\\u2039").replace(">>>", "\\u203a\\u203a\\u203a")', "return text"),
    ("no-quote-no-verdict rule removed",
     'if status in _QUOTE_REQUIRED and not citation:', 'if False:'),
    ("deadline override removed",
     'if status != STATUS_FULFILLED and now > deadline_at:', 'if False:'),
    ("deadline boundary becomes inclusive",
     'if status != STATUS_FULFILLED and now > deadline_at:', 'if status != STATUS_FULFILLED and now >= deadline_at:'),
    ("v1 bug: an unreachable page burns the dispute",
     'if current_hash == "unavailable":', 'if False:'),
    ("SSRF: 172.16/12 allowed", 'if a == 172 and 16 <= b <= 31:\n        return False', "pass"),
    ("SSRF: CGNAT 100.64/10 allowed", 'if a == 100 and 64 <= b <= 127:  # carrier-grade NAT\n        return False', "pass"),
    ("SSRF: non-443 ports allowed", 'if sep and port not in ("", "443"):\n        return False', "pass"),
    ("SSRF: hex / octal / integer IPv4 allowed", 'if octets is None:\n            return False', "if octets is None:\n            return True"),
    ("SSRF: DNS label validation removed", 'if not all(_valid_dns_label(label) for label in labels):\n        return False', "pass"),
    ("duplicate guard removed", 'if existing is not None:', 'if False:'),
    ("per-submitter cap removed", 'len(mine) >= MAX_PROMISES_PER_SUBMITTER', 'False'),
    ("deadline lower bound removed", 'if deadline < now + MIN_DEADLINE_LEAD_SECONDS:', 'if deadline <= 0:'),
    ("deadline horizon removed", 'if deadline > now + MAX_DEADLINE_HORIZON_SECONDS:', 'if False:'),
    ("status counters not moved on verify", 'self._bump_status(old_status, -1)\n        self._bump_status(new_status, 1)', "pass"),
    ("promisor counters not moved on verify", 'self._bump_promisor(record, old_status, -1)\n            self._bump_promisor(record, new_status, 1)', "pass"),
    ("kept_late counter never decremented", 'max(0, int(self.n_kept_late) + (1 if kept_late else -1))', 'int(self.n_kept_late) + (1 if kept_late else 0)'),
    ("cooldown removed", 'if last and now - last < MIN_VERIFY_INTERVAL_SECONDS:', 'if False:'),
    ("stale promise can still be verified", 'if promise.flagged_stale:\n            raise gl.vm.UserError(\n                "[EXPECTED] promise flagged stale after', 'if False:\n            raise gl.vm.UserError(\n                "[EXPECTED] promise flagged stale after'),
    ("dispute allowed after repoint", 'if int(report.evidence_revision) != int(promise.revision_count) - 1:', 'if False:'),
    ("page size not clamped", 'min(int(limit), MAX_PAGE_SIZE), total)\n        return [self.promises[self.promise_ids[i]]', 'int(limit), total)\n        return [self.promises[self.promise_ids[i]]'),
    ("injection marker detection removed", 'return any(marker in low for marker in _INJECTION_MARKERS)', 'return False'),
    ("revision cap removed", 'if int(promise.revision_count) >= MAX_EVIDENCE_REVISIONS:', 'if False:'),
    ("evidence not truncated", '[:MAX_EVIDENCE_CHARS]\n        if not snapshot', '\n        if not snapshot'),
]


def main():
    out = None
    if "--json" in sys.argv:
        out = sys.argv[sys.argv.index("--json") + 1]
    py = os.environ.get("PYTHON", sys.executable)
    results = []
    with tempfile.TemporaryDirectory() as tmp:
        target = Path(tmp) / "promise_ledger.py"
        for name, old, new in MUTATIONS:
            if SRC.count(old) != 1:
                results.append({"mutation": name, "result": "INVALID", "detail": f"pattern matches {SRC.count(old)}x"})
                print(f"[INVALID ] {name}")
                continue
            target.write_text(SRC.replace(old, new))
            env = dict(os.environ, PL_CONTRACT=str(target))
            proc = subprocess.run([py, "-m", "pytest", str(ROOT / "tests" / "contract"), "-x", "-q", "-p", "no:cacheprovider"],
                                  capture_output=True, text=True, env=env, cwd=ROOT)
            killed = proc.returncode != 0
            results.append({"mutation": name, "result": "KILLED" if killed else "SURVIVED"})
            print(f"[{'KILLED  ' if killed else 'SURVIVED'}] {name}")
    killed = sum(r["result"] == "KILLED" for r in results)
    bad = [r for r in results if r["result"] != "KILLED"]
    print(f"\n{killed}/{len(results)} mutations killed")
    if out:
        Path(out).write_text(json.dumps({"killed": killed, "total": len(results), "results": results}, indent=2))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
