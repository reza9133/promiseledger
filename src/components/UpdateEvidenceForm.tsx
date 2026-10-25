import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { updateEvidenceUrl } from "../lib/genlayer";
import { urlProblem } from "../lib/rules";
import { explorerTxUrl } from "../lib/config";
import { isDemo } from "../lib/mode";
import { ContractRevertError } from "../lib/types";

export function UpdateEvidenceForm({ promiseId, currentUrl, onUpdated }: { promiseId: number; currentUrl: string; onUpdated: () => void }) {
  const { client, address, connect } = useWallet();
  const { push } = useToast();
  const [url, setUrl] = useState(currentUrl);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const error = urlProblem(url);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    if (isDemo()) return push("info", "Demo mode is read-only.");
    if (!client || !address) return void connect();
    setSubmitting(true);
    try {
      const { hash } = await updateEvidenceUrl(client, promiseId, url.trim());
      push("success", "Evidence link updated, re-baselined and added to the revision log.", { href: explorerTxUrl(hash), hrefLabel: "View transaction" });
      onUpdated();
    } catch (err) {
      push("error", err instanceof ContractRevertError ? err.message : "Could not update the evidence link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stale-form" onSubmit={handleSubmit} noValidate>
      <p>
        Three checks in a row couldn't read this page, so the entry is paused. As the submitter you may point it at a working
        page. The change is permanent in the revision log and does not alter the current verdict.
      </p>
      <div className="stale-form-row">
        <label className="sr-only" htmlFor="new-evidence">
          New evidence URL
        </label>
        <input id="new-evidence" className="input mono-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/changelog" inputMode="url" />
        <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
          {submitting ? "Re-baselining…" : "Update evidence link"}
        </button>
      </div>
      {touched && error && <span className="field-error">{error}</span>}
    </form>
  );
}
