import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { registerPromise } from "../lib/genlayer";
import { RULES, looksLikePublicHttpsUrl, validateDeadline, validateDescription, validateTitle } from "../lib/rules";
import { explorerTxUrl } from "../lib/chain";
import { ContractRevertError } from "../lib/types";

function defaultDeadlineLocal(): string {
  const d = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // +30 days, a sane default
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RegisterForm({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => void }) {
  const { client, address, status, connect } = useWallet();
  const { push } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [deadlineLocal, setDeadlineLocal] = useState(defaultDeadlineLocal());
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const deadlineUnix = useMemo(() => {
    const t = new Date(deadlineLocal).getTime();
    return Number.isFinite(t) ? Math.floor(t / 1000) : NaN;
  }, [deadlineLocal]);

  const errors = {
    title: validateTitle(title),
    description: validateDescription(description),
    evidenceUrl: looksLikePublicHttpsUrl(evidenceUrl),
    deadline: validateDeadline(deadlineUnix),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    if (!client || !address) {
      await connect();
      return;
    }
    setSubmitting(true);
    try {
      const { hash, promiseId } = await registerPromise(
        client,
        title.trim(),
        description.trim(),
        evidenceUrl.trim(),
        deadlineUnix,
      );
      push("success", "Promise filed and its baseline evidence recorded.", {
        href: explorerTxUrl(hash),
        hrefLabel: "View transaction",
      });
      onRegistered();
      if (Number.isFinite(promiseId) && promiseId > 0) {
        navigate(`/promise/${promiseId}`);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof ContractRevertError ? err.message : "Filing the promise failed.";
      push("error", msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel register-panel" onSubmit={handleSubmit}>
      <div className="panel-head">
        <h2>File a new promise</h2>
        <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p className="panel-hint">
        Point it at the page where progress should show up. Validators take a baseline snapshot of that
        page right now, then re-check it against every future snapshot.
      </p>

      <label className="field">
        <span className="field-label">
          What was promised <span className="field-count">{title.length}/{RULES.MAX_TITLE_CHARS}</span>
        </span>
        <input
          className="input"
          value={title}
          maxLength={RULES.MAX_TITLE_CHARS}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ship SSO login by Q1"
        />
        {touched && errors.title && <span className="field-error">{errors.title}</span>}
      </label>

      <label className="field">
        <span className="field-label">
          What "fulfilled" looks like <span className="field-count">{description.length}/{RULES.MAX_DESCRIPTION_CHARS}</span>
        </span>
        <textarea
          className="input textarea"
          rows={4}
          value={description}
          maxLength={RULES.MAX_DESCRIPTION_CHARS}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="This counts as kept once SSO is available to every customer on the changelog, not just in beta."
        />
        {touched && errors.description && <span className="field-error">{errors.description}</span>}
      </label>

      <label className="field">
        <span className="field-label">Evidence page (https://)</span>
        <input
          className="input mono-input"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          placeholder="https://example.com/changelog"
          inputMode="url"
        />
        {touched && errors.evidenceUrl && <span className="field-error">{errors.evidenceUrl}</span>}
      </label>

      <label className="field">
        <span className="field-label">Deadline</span>
        <input
          className="input"
          type="datetime-local"
          value={deadlineLocal}
          onChange={(e) => setDeadlineLocal(e.target.value)}
        />
        {touched && errors.deadline && <span className="field-error">{errors.deadline}</span>}
      </label>

      <div className="panel-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting
            ? "Recording baseline evidence…"
            : address
              ? "File this promise"
              : "Connect wallet to file"}
        </button>
      </div>
      {status === "connecting" && <p className="panel-hint">Waiting on your wallet…</p>}
    </form>
  );
}
