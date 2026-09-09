import { useEffect, useRef, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { shortAddr } from "../lib/format";
import { STUDIO_URL } from "../lib/chain";

export function WalletMenu() {
  const { address, chainOk, switchNetwork, disconnect } = useWallet();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!address) return null;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address!);
      push("info", "Address copied.");
    } catch {
      push("error", "Couldn't copy that — select and copy it by hand.");
    }
    setOpen(false);
  }

  async function handleSwitch() {
    await switchNetwork();
    setOpen(false);
  }

  async function handleDisconnect() {
    await disconnect();
    setOpen(false);
    push("info", "Wallet disconnected.");
  }

  return (
    <div className="wallet-menu" ref={rootRef}>
      <button
        type="button"
        className={`wallet-chip ${chainOk === false ? "wallet-chip-warn" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {chainOk === false ? "Wrong network" : shortAddr(address)}
        <span className="wallet-chip-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="wallet-dropdown" role="menu">
          <div className="wallet-dropdown-address" title={address}>
            {address}
          </div>

          {chainOk === false && (
            <button type="button" className="wallet-dropdown-item wallet-dropdown-warn" onClick={handleSwitch}>
              Switch to GenLayer Studio
            </button>
          )}

          <button type="button" className="wallet-dropdown-item" onClick={copyAddress}>
            Copy address
          </button>

          <a
            className="wallet-dropdown-item"
            href={STUDIO_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            Fund on Studio ↗
          </a>

          <button type="button" className="wallet-dropdown-item wallet-dropdown-danger" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
