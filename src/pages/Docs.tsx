import { Link } from "react-router-dom";
import { useTitle, useLimits } from "../hooks/useData";
import { LEGACY_V1_ADDRESS } from "../lib/config";

const TOC = [
  ["overview", "Overview"],
  ["pipeline", "The verdict pipeline"],
  ["rules", "Deterministic rules"],
  ["consensus", "Consensus design"],
  ["urls", "Evidence URL rules"],
  ["limits", "Limits"],
  ["wallet", "Wallet & network"],
  ["faq", "FAQ"],
  ["limitations", "Honest limitations"],
] as const;

function Pipeline() {
  const steps = ["Fetch page", "Snapshot + hash", "Model verdict", "Quote check", "Contract rules", "Stored report"];
  return (
    <svg className="diagram" viewBox="0 0 720 120" role="img" aria-label="Pipeline: fetch page, snapshot and hash, model verdict, quote check, contract rules, stored report">
      {steps.map((s, i) => (
        <g key={s} transform={`translate(${i * 120 + 6} 24)`}>
          <rect width="108" height="64" rx="10" fill="var(--panel)" stroke="var(--line-strong)" />
          <text x="54" y="28" textAnchor="middle" className="diagram-n">{`0${i + 1}`}</text>
          <text x="54" y="48" textAnchor="middle" className="diagram-t">{s}</text>
          {i < steps.length - 1 && <path d="M110 32h10" stroke="var(--accent)" strokeWidth="2" markerEnd="" />}
        </g>
      ))}
    </svg>
  );
}

export function Docs() {
  useTitle("Documentation");
  const L = useLimits();
  const rows: [string, string | number, string][] = [
    ["max_title_chars", L.max_title_chars, "Promise title"],
    ["max_description_chars", L.max_description_chars, "What “fulfilled” means"],
    ["max_promisor_chars", L.max_promisor_chars, "Promisor name (min " + L.min_promisor_chars + ")"],
    ["max_url_chars", L.max_url_chars, "Evidence URL"],
    ["max_evidence_chars", L.max_evidence_chars, "Characters of the page that are kept and judged"],
    ["min_citation_chars", L.min_citation_chars, "Shortest accepted verbatim quote"],
    ["min_verify_interval_seconds", L.min_verify_interval_seconds, "Cooldown between checks of one promise"],
    ["max_consecutive_failures", L.max_consecutive_failures, "Failed reads before a promise is paused"],
    ["min_deadline_lead_seconds", L.min_deadline_lead_seconds, "Deadline must be at least this far ahead"],
    ["max_deadline_horizon_seconds", L.max_deadline_horizon_seconds, "…and at most five years away"],
    ["max_promises_per_submitter", L.max_promises_per_submitter, "Per address"],
    ["max_evidence_revisions", L.max_evidence_revisions, "Including the first link"],
    ["max_page_size", L.max_page_size, "Largest page any list view returns"],
  ];
  return (
    <main id="main" className="page docs">
      <aside className="docs-toc" aria-label="On this page">
        <ul>
          {TOC.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ul>
      </aside>
      <div className="docs-body prose">
        <h1 className="page-title">Documentation</h1>

        <section id="overview">
          <h2>Overview</h2>
          <p>
            PromiseLedger is an Intelligent Contract on GenLayer. Someone files a public promise together with the page where proof
            should appear. Anyone can later ask validators to re-read that page and judge the promise as <strong>fulfilled</strong>,{" "}
            <strong>in progress</strong>, <strong>broken</strong> or <strong>unverifiable</strong>. The contract stores the verdict, the
            exact page text it was drawn from, the hash of that text and a verbatim quote.
          </p>
          <p>
            Each promise also names its <strong>promisor</strong>, the company, project or person who made it. Promises under the same
            name build a public <Link to="/promisors">track record</Link>.
          </p>
        </section>

        <section id="pipeline">
          <h2>The verdict pipeline</h2>
          <Pipeline />
          <ol>
            <li>Validators fetch the evidence page as text, collapse whitespace and keep the first {L.max_evidence_chars.toLocaleString()} characters.</li>
            <li>The snapshot is hashed with Keccak-256. Every validator must obtain byte-identical text.</li>
            <li>A model is shown the title, the submitter's definition of “fulfilled”, and the snapshot, and returns a status, a one-line summary and a quote.</li>
            <li>Plain Python checks the quote really is a substring of the snapshot.</li>
            <li>The contract applies its own rules (below) to the agreed verdict.</li>
            <li>The report, the snapshot and its hash are stored. Reports show both the model's <em>raw</em> status and the final one, so you can see what the rules changed.</li>
          </ol>
        </section>

        <section id="rules">
          <h2>Deterministic rules</h2>
          <p>These run in ordinary contract code after consensus. The model never decides them.</p>
          <ol>
            <li><strong>No quote, no verdict.</strong> A fulfilled or broken verdict without a grounded verbatim quote becomes unverifiable.</li>
            <li><strong>The clock belongs to the contract.</strong> Past the deadline, any verdict other than fulfilled becomes broken.</li>
            <li><strong>Late is recorded.</strong> A fulfilled verdict reached after the deadline is stored as <em>kept late</em>.</li>
            <li><strong>Evidence cannot be swapped.</strong> The link can change only after {L.max_consecutive_failures} failed reads in a row, only by the submitter, and every change is appended to a permanent revision log. A repoint never alters the current verdict.</li>
          </ol>
        </section>

        <section id="consensus">
          <h2>Consensus design</h2>
          <p>
            A verification uses a custom leader/validator pair. A validator agrees only when (a) its own fetch is byte-identical to the
            leader's, (b) the leader's quote is verbatim in <em>its own</em> snapshot, checked without any model, and (c) its own
            independent model verdict matches. A reported fetch failure is accepted only if the validator cannot read the page either, and
            a model failure is never rubber-stamped.
          </p>
          <p>
            Disputes use strict equality: every validator hashes the live page and the contract compares with the report's hash. A page that
            cannot be read never settles a dispute, so an outage cannot burn the one dispute a report allows.
          </p>
        </section>

        <section id="urls">
          <h2>Evidence URL rules</h2>
          <p>
            Only plain public <code>https://</code> pages on port 443 are accepted. The contract rejects private, loopback, link-local,
            carrier-grade-NAT and reserved IPv4 ranges; every non-canonical IP spelling (hex, octal, decimal integer, short forms); IPv6
            literals; user-info; backslashes; percent signs and non-ASCII characters in the host; malformed DNS labels; and internal or
            test-only suffixes such as <code>.local</code>, <code>.internal</code>, <code>.onion</code> or wildcard-DNS services like <code>nip.io</code>.
            This app runs the same checks before you sign anything.
          </p>
        </section>

        <section id="limits">
          <h2>Limits</h2>
          <p>Read live from the contract's <code>get_limits</code> (falling back to the values compiled into this build).</p>
          <div className="table-wrap">
            <table className="limits-table">
              <thead>
                <tr><th>Key</th><th>Value</th><th>Meaning</th></tr>
              </thead>
              <tbody>
                {rows.map(([k, v, d]) => (
                  <tr key={k}><td><code>{k}</code></td><td>{typeof v === "number" ? v.toLocaleString() : v}</td><td>{d}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="wallet">
          <h2>Wallet &amp; network</h2>
          <p>
            Reading needs no wallet. Writing needs an injected wallet on <strong>GenLayer Studio Network</strong> (chain id 61999) and some GEN.
            Studionet has no external faucet: open studio.genlayer.com, select the same address and use the faucet button there. The app
            dry-runs every write first, so most reverts appear before you are asked to sign.
          </p>
        </section>

        <section id="faq">
          <h2>FAQ</h2>
          <details><summary>Who can verify a promise?</summary><p>Anyone, once per cooldown ({L.min_verify_interval_seconds / 60} minutes) per promise.</p></details>
          <details><summary>Can the submitter hide a broken promise?</summary><p>No. There is no delete and no withdraw. The evidence link can only be repointed after repeated failures, it is logged, and the verdict stays.</p></details>
          <details><summary>Why did a fulfilled verdict turn into unverifiable?</summary><p>The model gave no verbatim quote the contract could find in the page. That downgrade is deliberate: no quote, no verdict.</p></details>
          <details><summary>What does “page addresses the reviewer” mean?</summary><p>The captured text contains phrases aimed at an AI reviewer (for example “ignore previous instructions”). It is a heuristic flag shown for transparency; it never changes a verdict.</p></details>
          <details><summary>What is demo mode?</summary><p>Labelled sample data so you can explore every page without a deployed contract. It is never mixed with on-chain data and cannot write.</p></details>
          <details><summary>The v1 contract?</summary><p>The old deployment at <code>{LEGACY_V1_ADDRESS}</code> uses a different interface and is not supported by this frontend.</p></details>
        </section>

        <section id="limitations">
          <h2>Honest limitations</h2>
          <ul>
            <li>The one-line <em>summary</em> is model-written and validators do not compare its wording. The quote, the hash and the status are the verifiable parts.</li>
            <li>A page can be edited after a verdict. Disputes tell you whether it still matches; they do not re-judge.</li>
            <li>Evidence is limited to what a text rendering of one URL shows, truncated to {L.max_evidence_chars.toLocaleString()} characters. Content behind logins, images and scripts-only pages may be invisible.</li>
            <li>The injection-marker flag is a keyword heuristic and will miss paraphrases.</li>
            <li>Ledger search and filters run on loaded entries only; the contract has no server-side search.</li>
            <li>Studionet is a shared simulator and can be reset without notice.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
