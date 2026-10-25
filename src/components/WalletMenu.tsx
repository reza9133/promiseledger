import { useEffect, useRef, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { shortAddr } from "../lib/format";
import { STUDIO_URL } from "../lib/config";

export function WalletMenu() {
  const { address, chainOk, switchNetwork, disconnect } = useWallet();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!address) return null;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address!);
      push("info", "Address copied.");
    } catch {
      push("error", "Couldn't copy that. Select and copy it by hand.");
    }
    setOpen(false);
  }

  return (
    <div className="wallet-menu" ref={rootRef}>
      <button
        type="button"
        className={`wallet-chip ${chainOk === false ? "wallet-chip-warn" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {chainOk === false ? "Wrong network" : shortAddr(address)}
        <span aria-hidden="true"> ▾</span>
      </button>
      {open && (
        <div className="wallet-dropdown">
          <div className="wallet-dropdown-address" title={address}>
            {address}
          </div>
          {chainOk === false && (
            <button
              type="button"
              className="wallet-dropdown-item wallet-dropdown-warn"
              onClick={async () => {
                await switchNetwork();
                setOpen(false);
              }}
            >
              Switch to GenLayer Studio
            </button>
          )}
          <button type="button" className="wallet-dropdown-item" onClick={copyAddress}>
            Copy address
          </button>
          <a className="wallet-dropdown-item" href={STUDIO_URL} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            Fund on Studio ↗
          </a>
          <button
            type="button"
            className="wallet-dropdown-item wallet-dropdown-danger"
            onClick={async () => {
              await disconnect();
              setOpen(false);
              push("info", "Wallet disconnected.");
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
