"""Shared helpers for the PromiseLedger direct-mode contract tests."""
import json
import datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
import os

CONTRACT = os.environ.get("PL_CONTRACT") or str(ROOT / "contracts" / "promise_ledger.py")
VECTORS = json.loads((ROOT / "tests" / "fixtures" / "url_vectors.json").read_text())["vectors"]

KEPT = "Changelog. v2.0 released on May 3: Single sign-on (SSO) is now available to every customer."
PROGRESS = "Roadmap. SSO is in private beta with three design partners; general availability is planned."
CANCELLED = "Update: the SSO project has been cancelled and will not ship."
UNRELATED = "Welcome to our cooking blog. Today: sourdough."

URL = "https://example.com/changelog"
DESC = "Counts as kept once SSO is available to every customer, not just in beta."


def iso(ts: int) -> str:
    return dt.datetime.fromtimestamp(ts, dt.timezone.utc).isoformat().replace("+00:00", "Z")


def llm_json(status="FULFILLED", summary="A one sentence summary.", citation=""):
    return json.dumps({"status": status, "summary": summary, "citation": citation})


class Env:
    """A deployed ledger plus the VM and a few conveniences."""

    def __init__(self, vm, contract, accounts):
        self.vm = vm
        self.c = contract
        self.alice, self.bob, self.carol = accounts

    # ---- time -------------------------------------------------------
    def now(self) -> int:
        raw = self.vm._datetime
        return int(dt.datetime.fromisoformat(raw.replace("Z", "+00:00")).timestamp())

    def warp_to(self, ts: int):
        # gltest's warp() updates the VM clock but does not refresh the cached
        # gl.message_raw["datetime"] the contract reads, so do it here too.
        import sys

        self.vm.warp(iso(ts))
        gl = sys.modules.get("genlayer.gl")
        if gl is not None and getattr(gl, "message_raw", None) is not None:
            gl.message_raw["datetime"] = iso(ts)

    def advance(self, seconds: int):
        self.warp_to(self.now() + seconds)

    # ---- mocks ------------------------------------------------------
    def page(self, body: str, pattern=r"example\.com.*"):
        """Replace web mocks with a single page; keeps LLM mocks."""
        self.vm._web_mocks.clear()
        self.vm.mock_web(pattern, {"status": 200, "body": body})

    def llm(self, status="FULFILLED", summary="A one sentence summary.", citation=""):
        self.vm._llm_mocks.clear()
        self.vm.mock_llm(r".*", llm_json(status, summary, citation))

    def llm_raw(self, text: str):
        self.vm._llm_mocks.clear()
        self.vm.mock_llm(r".*", text)

    def no_web(self):
        self.vm._web_mocks.clear()

    # ---- actions ----------------------------------------------------
    def register(self, title="Ship SSO login", promisor="Acme Corp", url=URL, deadline=None,
                 description=DESC, sender=None, body=PROGRESS):
        if sender is not None:
            self.vm.sender = sender
        if body is not None:
            self.page(body)
        if deadline is None:
            deadline = self.now() + 30 * 86400
        return int(self.c.register_promise(title, description, promisor, url, deadline))

    def verify(self, pid=1, status="FULFILLED", citation="", body=None, sender=None, summary="Summary."):
        if sender is not None:
            self.vm.sender = sender
        if body is not None:
            self.page(body)
        self.llm(status, summary, citation)
        return int(self.c.verify_promise(pid))

    def cooldown(self):
        self.advance(301)

    def stats(self):
        return dict(self.c.get_stats())

    def revert(self, text):
        return self.vm.expect_revert(text)


def user_error(message: str):
    """A GenVM UserError; the SDK only becomes importable once a contract was loaded."""
    from genlayer import gl

    return gl.vm.UserError(message)
