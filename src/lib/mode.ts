import { useSyncExternalStore } from "react";

/**
 * Demo mode serves labelled sample data instead of reading the chain. It is
 * only ever switched on by an explicit user action (the footer toggle, the
 * "Try the demo" button, or a ?demo=1 link) and is remembered for the tab's
 * session only. Demo data is never mixed with on-chain data.
 */
const KEY = "pl2:demo";
const listeners = new Set<() => void>();

function readInitial(): boolean {
  try {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("demo") === "1") {
      sessionStorage.setItem(KEY, "1");
      return true;
    }
    if (sp.get("demo") === "0") {
      sessionStorage.removeItem(KEY);
      return false;
    }
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

let demo = typeof window === "undefined" ? false : readInitial();

export function isDemo(): boolean {
  return demo;
}

export function setDemo(next: boolean) {
  if (next === demo) return;
  demo = next;
  try {
    if (next) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    /* tab storage unavailable: the in-memory flag still works */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useDemo(): boolean {
  return useSyncExternalStore(subscribe, isDemo, () => false);
}
