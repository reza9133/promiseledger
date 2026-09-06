import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { updateEvidenceUrl } from "../lib/genlayer";
import { looksLikePublicHttpsUrl } from "../lib/rules";
import { explorerTxUrl } from "../lib/chain";
import { ContractRevertError } from "../lib/types";

export function UpdateEvidenceForm({
  promiseId,
  currentUrl,
  onUpdated,
}: {
  promiseId: number;
  currentUrl: string;
  onUpdated: () => void;
}) {
  const { client, address, connect } = useWallet();
  const { push } = useToast();
  const [url, setUrl] = useState(currentUrl);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const error = looksLikePublicHttpsUrl(url);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    if (!client || !address) {
      await connect();
      return;
    }
    setSubmitting(true);
    try {
      const { hash } = await updateEvidenceUrl(client, promiseId, url.trim());
      push("success", "Evidence link updated and re-baselined.", {
        href: explorerTxUrl(hash),
        hrefLabel: "View transaction",
      });
      onUpdated();
    } catch (err) {
      const msg = err instanceof ContractRevertError ? err.message : "Could not update the evidence link.";
      push("error", msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stale-form" onSubmit={handleSubmit}>
      <p>
        Three checks in a row couldn't read this page, so this entry is paused. As the submitter, point it
        at a working evidence page to resume checks.
      </p>
      <div className="stale-form-row">
        <input
          className="input mono-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/changelog"
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
          {submitting ? "Re-baselining…" : "Update evidence link"}
        </button>
      </div>
      {touched && error && <span className="field-error">{error}</span>}
    </form>
  );
}
