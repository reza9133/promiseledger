import pytest
from helpers import CANCELLED, KEPT, PROGRESS

QUOTE = "Single sign-on (SSO) is now available to every customer"


def _verified(env):
    env.register(body=KEPT)
    return env.verify(1, "FULFILLED", QUOTE, body=KEPT)


# ---- disputes --------------------------------------------------------------

def test_dispute_upheld_when_page_is_unchanged(env):
    rid = _verified(env)
    env.vm.sender = env.bob
    env.c.dispute_report(rid)
    r = env.c.get_report(rid)
    assert r.disputed and r.dispute_status == "UPHELD" and r.dispute_hash == r.snapshot_hash
    assert r.disputed_by == env.bob and r.disputed_at > 0
    s = env.stats()
    assert (s["disputes_upheld"], s["disputes_overturned"]) == (1, 0)
    assert env.c.get_promise(1).status == "FULFILLED"  # a dispute never rewrites the verdict


def test_dispute_overturned_when_page_changed(env):
    rid = _verified(env)
    env.page(KEPT + " Update: SSO was rolled back.")
    env.c.dispute_report(rid)
    r = env.c.get_report(rid)
    assert r.dispute_status == "OVERTURNED" and r.dispute_hash != r.snapshot_hash
    assert env.stats()["disputes_overturned"] == 1
    assert env.c.get_promise(1).status == "FULFILLED"


def test_dispute_only_once(env):
    rid = _verified(env)
    env.c.dispute_report(rid)
    with env.revert("already been disputed"):
        env.c.dispute_report(rid)
    assert env.stats()["disputes_upheld"] == 1


def test_unreachable_page_does_not_burn_the_dispute(env):
    rid = _verified(env)
    env.no_web()
    with env.revert("dispute was not consumed"):
        env.c.dispute_report(rid)
    r = env.c.get_report(rid)
    assert not r.disputed and r.dispute_status == ""
    env.page(KEPT)
    env.c.dispute_report(rid)
    assert env.c.get_report(rid).dispute_status == "UPHELD"


def test_cannot_dispute_a_failed_check_or_unknown_report(env):
    env.register()
    env.no_web(); env.llm("FULFILLED")
    rid = int(env.c.verify_promise(1))
    env.page(KEPT)
    with env.revert("captured no snapshot"):
        env.c.dispute_report(rid)
    with env.revert("report not found"):
        env.c.dispute_report(42)


def test_unverifiable_report_with_snapshot_can_be_disputed(env):
    env.register()
    rid = env.verify(1, "UNVERIFIABLE", "", body=KEPT)
    env.c.dispute_report(rid)
    assert env.c.get_report(rid).dispute_status == "UPHELD"


# ---- repointing ------------------------------------------------------------

def _make_stale(env, pid=1):
    for _ in range(3):
        env.no_web(); env.llm("FULFILLED")
        env.c.verify_promise(pid)
        env.cooldown()


def test_repoint_is_refused_unless_stale(env):
    env.register()
    env.page(KEPT, pattern=r".*")
    with env.revert("only change after three failed checks"):
        env.c.update_evidence_url(1, "https://evil.example.org/friendly-page")
    assert env.c.get_promise(1).evidence_url == "https://example.com/changelog"
    assert env.stats()["revision_count"] == 1


def test_repoint_after_stale_logs_a_revision_and_keeps_the_verdict(env):
    env.register()
    env.verify(1, "BROKEN", "has been cancelled", body=CANCELLED)
    env.cooldown()
    _make_stale(env)
    env.page(KEPT, pattern=r".*")
    env.c.update_evidence_url(1, "https://newhost.example.net/changelog")
    p = env.c.get_promise(1)
    assert p.evidence_url == "https://newhost.example.net/changelog"
    assert not p.flagged_stale and p.consecutive_failures == 0 and p.revision_count == 2
    assert p.status == "BROKEN"  # cannot launder a verdict by repointing
    revs = env.c.get_evidence_revisions(1)
    assert [int(r.index) for r in revs] == [0, 1] and revs[1].reason == "repointed after stale"
    assert revs[0].url == "https://example.com/changelog"  # history is preserved
    assert env.stats()["revision_count"] == 2
    # new reports are tied to the new revision
    env.llm("IN_PROGRESS", citation="Single sign-on")
    rid = int(env.c.verify_promise(1))
    assert env.c.get_report(rid).evidence_revision == 1


def test_only_the_submitter_may_repoint(env):
    env.register()
    _make_stale(env)
    env.page(KEPT, pattern=r".*")
    env.vm.sender = env.bob
    with env.revert("only the original submitter"):
        env.c.update_evidence_url(1, "https://example.com/new")
    env.vm.sender = env.alice
    env.c.update_evidence_url(1, "https://example.com/new")


def test_repoint_validates_the_new_url_and_fetches_it(env):
    env.register()
    _make_stale(env)
    env.page(KEPT, pattern=r".*")
    for bad in ["http://example.com/x", "https://127.0.0.1/x", "https://172.16.0.9/x", "https://example.com:8443/x"]:
        with env.revert("public https"):
            env.c.update_evidence_url(1, bad)
    env.no_web()
    with env.revert("could not be fetched"):
        env.c.update_evidence_url(1, "https://example.com/new")
    assert env.c.get_promise(1).flagged_stale  # still stale, nothing half-applied


def test_revision_cap(env):
    env.register()
    for i in range(7):  # initial + 7 = 8 == MAX_EVIDENCE_REVISIONS
        _make_stale(env)
        env.page(KEPT, pattern=r".*")
        env.c.update_evidence_url(1, f"https://example.com/r{i}")
    _make_stale(env)
    env.page(KEPT, pattern=r".*")
    with env.revert("maximum number of evidence revisions"):
        env.c.update_evidence_url(1, "https://example.com/one-too-many")
    assert env.c.get_promise(1).revision_count == 8


def test_dispute_refused_after_repoint(env):
    rid = _verified(env)
    env.cooldown()
    _make_stale(env)
    env.page(KEPT, pattern=r".*")
    env.c.update_evidence_url(1, "https://example.com/moved")
    with env.revert("repointed after this report"):
        env.c.dispute_report(rid)
