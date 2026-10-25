# Security model and limitations

| Threat | Mitigation | Test |
|---|---|---|
| SSRF through the evidence URL (private, loopback, link-local, CGNAT, reserved ranges; hex/octal/integer IPs; IPv6 literals; userinfo; odd ports; rebinding hosts) | strict `_looks_like_public_https_url`, applied on register and repoint; mirrored client-side | `test_url_vectors_match_contract` (101 shared vectors), `test_ssrf_*`, mutation `SSRF:*` |
| Prompt injection in the evidence page | delimiters neutralised in the prompt; page declared untrusted; quote must be verbatim; `injection_flagged` recorded | `test_prompt_delimiters_in_evidence_*`, `test_page_that_tries_to_dictate_the_verdict_cannot` |
| Prompt injection in title/description/promisor | `<<<` / `>>>` rejected at the door | `test_injection_in_every_user_field_*` |
| Leader fabricates a quote or snapshot | validators re-fetch and re-check both in plain Python | `test_validators.py` |
| Leader lies about a fetch failure | accepted only if the validator cannot read the page | `test_leader_fetch_failure_*` |
| Submitter swaps in friendlier evidence | repoint only when stale, capped, logged, verdict untouched | `test_repoint_*`, mutation `v1 bug` |
| Dispute griefing by outage | unreachable page reverts without consuming the dispute | `test_unreachable_page_does_not_burn_the_dispute` |
| Spam / duplicates | fingerprint guard, 30 per address, deadline window | `test_duplicate_*`, `test_per_submitter_cap` |
| Counter drift | counters moved in one helper; randomised invariant test | `test_random_operation_sequences_*` |

## Honest limitations
- The summary sentence is model text. Validators agree on the verdict, the snapshot and the quote, not on the wording of the summary.
- `injection_flagged` is a phrase heuristic, informational only; it never changes a verdict.
- Verdicts are only as good as the evidence page and the validators' models. A page that is edited after a check changes what a later check sees; the dispute function exists to show exactly that.
- Studionet is a shared simulator and can be reset.
- The frontend's client-side rules are a convenience; the contract is the authority.
