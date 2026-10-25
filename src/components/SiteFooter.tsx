import { Link } from "react-router-dom";
import { AUTHOR_X_URL, CONTRACT_EXPLORER_URL, REPO_URL, isConfiguredAddress } from "../lib/config";
import { setDemo, useDemo } from "../lib/mode";
import { LogoMark } from "./Logo";

export function SiteFooter() {
  const demo = useDemo();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <LogoMark size={28} />
          <p>
            PromiseLedger keeps public promises next to the evidence that proves or disproves them, judged by GenLayer
            validators and quoted verbatim.
          </p>
        </div>
        <nav aria-label="Footer" className="footer-links">
          <Link to="/ledger">Ledger</Link>
          <Link to="/promisors">Promisors</Link>
          <Link to="/stats">Stats</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/about">What's new in v2</Link>
        </nav>
        <div className="footer-links">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={AUTHOR_X_URL} target="_blank" rel="noreferrer">
            X · @amirhp771
          </a>
          {isConfiguredAddress() && (
            <a href={CONTRACT_EXPLORER_URL} target="_blank" rel="noreferrer">
              Contract on the explorer ↗
            </a>
          )}
        </div>
      </div>
      <div className="footer-base">
        <p>
          Studionet is a shared hosted simulator, not a persistent testnet. Entries can disappear when it resets.
        </p>
        <label className="demo-switch">
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
          <span>Demo data (sample, not on-chain)</span>
        </label>
      </div>
    </footer>
  );
}
