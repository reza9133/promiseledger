"""Consensus logic: what a validator accepts or rejects, given the leader's result.

gltest's direct mode runs the leader once and captures the validator closure;
`run_validator` then replays it against the *current* mocks, so swapping mocks
simulates a validator that sees a different world than the leader."""
import pytest
from helpers import KEPT, PROGRESS, user_error

QUOTE = "Single sign-on (SSO) is now available to every customer"


def _leader_result(env, status="FULFILLED", citation=QUOTE, body=KEPT):
    env.register(body=body)
    env.vm.clear_validators()
    env.page(body)
    env.llm(status, "Summary.", citation)
    env.c.verify_promise(1)
    return env.vm._captured_validators[-1][0]


def test_honest_leader_is_accepted(env):
    leader = _leader_result(env)
    assert leader["ok"] and leader["status"] == "FULFILLED" and leader["citation"] == QUOTE
    assert env.vm.run_validator() is True


def test_validator_accepts_different_summary_wording_but_same_verdict(env):
    _leader_result(env)
    env.llm("FULFILLED", "Completely different words.", "something else entirely")
    assert env.vm.run_validator() is True  # the leader's citation is what is checked, not mine


def test_rejects_when_validator_sees_a_different_page(env):
    _leader_result(env)
    env.page(KEPT + " (edited)")
    assert env.vm.run_validator() is False


def test_rejects_when_validator_model_disagrees(env):
    _leader_result(env)
    env.llm("IN_PROGRESS", "x", "private beta")
    assert env.vm.run_validator() is False


def test_rejects_a_leader_that_invents_a_quote(env):
    leader = _leader_result(env)
    forged = dict(leader, citation="SSO shipped to every customer on Tuesday")
    assert env.vm.run_validator(leader_result=forged) is False


def test_rejects_a_leader_with_a_forged_snapshot_or_hash(env):
    leader = _leader_result(env)
    assert env.vm.run_validator(leader_result=dict(leader, snapshot=KEPT + "!")) is False
    assert env.vm.run_validator(leader_result=dict(leader, snapshot_hash="00" * 32)) is False


def test_rejects_malformed_leader_results(env):
    _leader_result(env)
    for bad in ["nope", 7, None, [], {}]:
        assert env.vm.run_validator(leader_result=bad) is False


def test_rejects_a_leader_that_crashed(env):
    _leader_result(env)
    assert env.vm.run_validator(leader_error=user_error("boom")) is False


def test_leader_fetch_failure_is_accepted_only_if_validator_cannot_read_either(env):
    env.register()
    env.vm.clear_validators()
    env.no_web(); env.llm("FULFILLED")
    env.c.verify_promise(1)
    assert env.vm._captured_validators[-1][0] == {"ok": False, "reason": "fetch"}
    assert env.vm.run_validator() is True           # I can't read it either
    env.page(KEPT)
    assert env.vm.run_validator() is False          # I can: the leader lied or was unlucky


def test_leader_model_failure_is_never_rubber_stamped(env):
    env.register()
    env.vm.clear_validators()
    env.page(KEPT); env.llm_raw("garbage")
    env.c.verify_promise(1)
    assert env.vm._captured_validators[-1][0] == {"ok": False, "reason": "model"}
    assert env.vm.run_validator() is False
    env.no_web()
    assert env.vm.run_validator() is False


def test_leader_cannot_claim_fetch_failure_when_it_was_a_model_failure(env):
    env.register()
    env.vm.clear_validators()
    env.page(KEPT); env.llm_raw("garbage")
    env.c.verify_promise(1)
    env.no_web()
    assert env.vm.run_validator(leader_result={"ok": False, "reason": "fetch"}) is True  # page unreadable for me too
    env.page(KEPT)
    assert env.vm.run_validator(leader_result={"ok": False, "reason": "fetch"}) is False


def test_baseline_validator(env):
    env.page(KEPT)
    env.vm.clear_validators()
    env.c.register_promise("Ship SSO login", "Counts as kept once SSO is available to all.", "Acme", "https://example.com/c", env.now() + 86400)
    assert env.vm.run_validator() is True
    env.page(KEPT + " changed")
    assert env.vm.run_validator() is False
    env.no_web()
    assert env.vm.run_validator() is False
    assert env.vm.run_validator(leader_error=user_error("x")) is False
