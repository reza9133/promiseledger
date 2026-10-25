import { Link } from "react-router-dom";
import { LogoMark } from "../components/Logo";
import { useTitle } from "../hooks/useData";

export function NotFound() {
  useTitle("Page not found");
  return (
    <main id="main" className="page page-narrow not-found">
      <LogoMark size={72} stamp />
      <h1 className="page-title">No such page</h1>
      <p className="lede">That address isn't in the ledger. It may have moved, or never existed.</p>
      <div className="hero-cta">
        <Link to="/" className="btn btn-primary">
          Back to the start
        </Link>
        <Link to="/ledger" className="btn btn-outline">
          Browse the ledger
        </Link>
      </div>
    </main>
  );
}
