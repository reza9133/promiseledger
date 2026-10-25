import { Link } from "react-router-dom";
import { LogoMark } from "../components/Logo";
import { useTitle } from "../hooks/useData";
import { REPO_URL } from "../lib/config";

const DELTA: [string, string, string][] = [
  ["Who made the promise", "Only a title", "Required promisor field and per-promisor track records"],
  ["Evidence link", "Submitter could repoint at any time", "Stale-only repoint, permanent revision log, verdict untouched"],
  ["Failed reads", "Validators rejected a reported failure, so the pause logic could never trigger", "Failure is agreed on only when validators cannot read the page either"],
  ["Verdicts", "Model verdict taken as-is", "No quote, no verdict; quote re-checked by every validator; raw vs final status stored"],
  ["Late delivery", "Not distinguished", "Recorded as kept late"],
  ["Evidence URLs", "Partial private-range blocklist", "Full IPv4 range logic, canonical-form only, port 443, DNS label rules, wildcard-DNS hosts blocked"],
  ["Prompt injection", "Delimiters could be forged by page text", "Delimiters neutralised, rejected in inputs, heuristic injection flag"],
  ["Disputes", "An outage counted as “overturned”", "An unreadable page reverts and keeps the dispute; live hash stored"],
  ["Spam", "Unlimited, duplicates allowed", "Per-address cap, duplicate fingerprint, deadline window"],
  ["Statistics", "Scanned every promise", "O(1) counters"],
  ["Report lists", "Shipped up to 8 KB of snapshot per report", "Lightweight reports, snapshot fetched on demand"],
  ["Frontend", "Two pages", "Eleven lazy-loaded pages, 3D hero, demo mode, light/dark, tests"],
];

export function About() {
  useTitle("What's new in v2");
  return (
    <main id="main" className="page prose-page">
      <div className="about-head">
        <LogoMark size={64} stamp title="PromiseLedger" />
        <div>
          <p className="eyebrow">Milestone</p>
          <h1 className="page-title">What's new in v2</h1>
        </div>
      </div>
      <p className="lede">
        v2 keeps the idea (a public register of promises judged against evidence) and hardens everything around it, adds who-promised-what
        accountability, and rebuilds the app.
      </p>
      <div className="table-wrap">
        <table className="delta-table">
          <thead>
            <tr><th>Area</th><th>v1</th><th>v2</th></tr>
          </thead>
          <tbody>
            {DELTA.map(([a, b, c]) => (
              <tr key={a}><th scope="row">{a}</th><td>{b}</td><td>{c}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Full changelog, tests and the live end-to-end report are in the{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer">repository</a>. Details of the rules are in the <Link to="/docs">docs</Link>.
      </p>
    </main>
  );
}
