import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { useLimits } from "../hooks/useData";
import { invalidateAll } from "../hooks/useQuery";
import { registerPromise } from "../lib/genlayer";
import { explorerTxUrl } from "../lib/config";
import { isDemo } from "../lib/mode";
import { urlProblem, validateDeadline, validateDescription, validatePromisor, validateTitle } from "../lib/rules";
import { ContractRevertError } from "../lib/types";

const DAY = 86400;
const PRESETS = [
  { label: "1 week", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
];

function toLocalInput(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FileForm() {
  const { client, address, connect } = useWallet();
  const { push } = useToast();
  const navigate = useNavigate();
  const limits = useLimits();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [promisor, setPromisor] = useState("");
  const [url, setUrl] = useState("");
  const [deadline, setDeadline] = useState(() => toLocalInput(Date.now() / 1000 + 30 * DAY));
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const deadlineUnix = useMemo(() => {
    const t = new Date(deadline).getTime();
    return Number.isFinite(t) ? Math.floor(t / 1000) : NaN;
  }, [deadline]);

  const errors = {
    title: validateTitle(title, limits),
    description: validateDescription(description, limits),
    promisor: validatePromisor(promisor, limits),
    url: urlProblem(url.trim(), limits.max_url_chars),
    deadline: validateDeadline(deadlineUnix, Date.now() / 1000, limits),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    if (isDemo()) return push("info", "Demo mode is read-only. Exit demo mode and connect a wallet to file on-chain.");
    if (!client || !address) return void connect();
    setSubmitting(true);
    try {
      const { hash, promiseId } = await registerPromise(client, address, {
        title: title.trim(),
        description: description.trim(),
        promisor: promisor.trim(),
        evidenceUrl: url.trim(),
        deadlineAtUnix: deadlineUnix,
      });
      push("success", "Promise filed and its baseline evidence recorded.", { href: explorerTxUrl(hash), hrefLabel: "View transaction" });
      invalidateAll();
      navigate(promiseId ? `/promise/${promiseId}` : "/me");
    } catch (err) {
      push("error", err instanceof ContractRevertError ? err.message : "Filing the promise failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const err = (msg: string | null) => (touched && msg ? <span className="field-error" role="alert">{msg}</span> : null);

  return (
    <form className="panel file-form" onSubmit={handleSubmit} noValidate aria-label="File a promise">
      <label className="field">
        <span className="field-label">
          Who made the promise
          <span className="field-count">{promisor.length}/{limits.max_promisor_chars}</span>
        </span>
        <input className="input" value={promisor} maxLength={limits.max_promisor_chars * 2} onChange={(e) => setPromisor(e.target.value)} placeholder="Acme Corp" aria-invalid={touched && !!errors.promisor} />
        <span className="field-hint">Promises with the same name (ignoring case and spacing) build one public track record.</span>
        {err(errors.promisor)}
      </label>

      <label className="field">
        <span className="field-label">
          What was promised
          <span className="field-count">{title.length}/{limits.max_title_chars}</span>
        </span>
        <input className="input" value={title} maxLength={limits.max_title_chars * 2} onChange={(e) => setTitle(e.target.value)} placeholder="Ship SSO login to every plan" aria-invalid={touched && !!errors.title} />
        {err(errors.title)}
      </label>

      <label className="field">
        <span className="field-label">
          What “fulfilled” looks like
          <span className="field-count">{description.length}/{limits.max_description_chars}</span>
        </span>
        <textarea className="input textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Counts as kept once SSO is listed as generally available on every paid plan in the public changelog, not just in beta." aria-invalid={touched && !!errors.description} />
        {err(errors.description)}
      </label>

      <label className="field">
        <span className="field-label">Evidence page (https://)</span>
        <input className="input mono-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/changelog" inputMode="url" aria-invalid={touched && !!errors.url} />
        <span className="field-hint">A public page on port 443. Private IPs, odd ports, user-info and local names are refused by the contract.</span>
        {err(errors.url)}
      </label>

      <fieldset className="field">
        <legend className="field-label">Deadline</legend>
        <div className="preset-row">
          {PRESETS.map((pr) => (
            <button key={pr.days} type="button" className="chip" onClick={() => setDeadline(toLocalInput(Date.now() / 1000 + pr.days * DAY))}>
              {pr.label}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="file-deadline">
          Deadline date and time
        </label>
        <input id="file-deadline" className="input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-invalid={touched && !!errors.deadline} />
        <span className="field-hint">After the deadline, any verdict other than fulfilled becomes broken.</span>
        {err(errors.deadline)}
      </fieldset>

      <div className="panel-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Recording baseline evidence…" : address || isDemo() ? "File this promise" : "Connect wallet to file"}
        </button>
        <span className="muted small">At most {limits.max_promises_per_submitter} promises per address.</span>
      </div>
    </form>
  );
}
