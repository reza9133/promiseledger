import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { WalletMenu } from "./WalletMenu";
import { CONTRACT_EXPLORER_URL } from "../lib/chain";

export function Header() {
  const { status, chainOk, connect, error } = useWallet();

  return (
    <header className="site-header">
      <div className="site-header-row">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <circle cx="16" cy="16" r="15" fill="currentColor" opacity="0.14" />
              <path
                d="M9 16.8 13.6 21.4 23 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="brand-text">
            PromiseLedger
            <span className="brand-tagline">a register of kept &amp; broken promises</span>
          </span>
        </Link>

        <div className="site-header-actions">
          <a className="network-chip" href={CONTRACT_EXPLORER_URL} target="_blank" rel="noreferrer">
            <span className="network-dot" aria-hidden="true" />
            GenLayer Studio
          </a>

          {status === "connected" ? (
            <WalletMenu />
          ) : (
            <button className="btn btn-primary" onClick={connect} disabled={status === "connecting"}>
              {status === "connecting" ? "Connecting…" : "Connect wallet"}
            </button>
          )}
        </div>
      </div>
      {status === "unavailable" && error && <div className="header-notice">{error}</div>}
      {status === "connected" && chainOk === false && (
        <div className="header-notice header-notice-warn">
          Your wallet is connected but pointed at a different network, so filing, verifying, or disputing
          will fail. Open the wallet menu above and switch (or by hand: chain id <strong>61999</strong>,
          RPC <code>https://studio.genlayer.com/api</code>).
        </div>
      )}
    </header>
  );
}
