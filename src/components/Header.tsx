import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useTheme } from "../hooks/useTheme";
import { WalletMenu } from "./WalletMenu";
import { LogoLockup } from "./Logo";

const NAV = [
  { to: "/ledger", label: "Ledger" },
  { to: "/promisors", label: "Promisors" },
  { to: "/stats", label: "Stats" },
  { to: "/docs", label: "Docs" },
  { to: "/about", label: "What's new" },
];

export function Header() {
  const { status, chainOk, connect, error } = useWallet();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="site-header-row">
        <Link to="/" className="brand" aria-label="PromiseLedger home">
          <LogoLockup size={34} />
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden="true">{open ? "×" : "☰"}</span>
        </button>

        <nav id="primary-nav" className={`site-nav ${open ? "is-open" : ""}`} aria-label="Primary">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              {n.label}
            </NavLink>
          ))}
          <NavLink to="/me" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
            My filings
          </NavLink>
        </nav>

        <div className="site-header-actions">
          <Link to="/file" className="btn btn-primary btn-sm">
            File a promise
          </Link>
          <button
            type="button"
            className="btn-icon theme-toggle"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
          {status === "connected" ? (
            <WalletMenu />
          ) : (
            <button className="btn btn-outline btn-sm" onClick={connect} disabled={status === "connecting"}>
              {status === "connecting" ? "Connecting…" : "Connect wallet"}
            </button>
          )}
        </div>
      </div>
      {status === "unavailable" && error && <div className="header-notice">{error}</div>}
      {status === "connected" && chainOk === false && (
        <div className="header-notice header-notice-warn" role="alert">
          Your wallet is on a different network, so filing, verifying and disputing will fail. Open the wallet menu to switch
          (chain id <strong>61999</strong>, RPC <code>https://studio.genlayer.com/api</code>).
        </div>
      )}
    </header>
  );
}
