import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  href?: string;
  hrefLabel?: string;
}

interface ToastContextValue {
  push: (kind: ToastKind, message: string, opts?: { href?: string; hrefLabel?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const push = useCallback<ToastContextValue["push"]>((kind, message, opts) => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, kind, message, ...opts }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 9000 : 6000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span className="toast-dot" aria-hidden="true" />
            <span className="toast-msg">{t.message}</span>
            {t.href && (
              <a className="toast-link" href={t.href} target="_blank" rel="noreferrer">
                {t.hrefLabel ?? "View"}
              </a>
            )}
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
