import { useState } from "react";

const DISMISS_KEY = "promiseledger:intro-dismissed";

export function HowItWorks() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage can be unavailable (private browsing, etc.) — fine,
      // it just won't stay dismissed across visits.
    }
  }

  return (
    <div className="intro-panel">
      <button className="btn-icon intro-dismiss" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
      <ol className="intro-steps">
        <li>
          <span className="intro-step-num">1</span>
          <div>
            <strong>File a promise</strong> with a link to the page where progress should show up.
            Validators take a baseline snapshot of that page the moment you file it.
          </div>
        </li>
        <li>
          <span className="intro-step-num">2</span>
          <div>
            <strong>Anyone can verify it</strong>, any time. GenLayer validators re-fetch the evidence
            page and judge fulfilled / in progress / broken — and store the exact sentence the verdict
            came from.
          </div>
        </li>
        <li>
          <span className="intro-step-num">3</span>
          <div>
            <strong>Anyone can dispute a report</strong> by asking the same page again. If the page has
            since changed, the dispute <em>overturns</em> that report on the spot; if it reads exactly
            the same, the dispute is <em>upheld</em> and the report stands.
          </div>
        </li>
      </ol>
    </div>
  );
}
