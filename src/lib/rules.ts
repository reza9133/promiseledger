/** Mirrors the constants at the top of contracts/promise_ledger.py. Keep in
 * sync with the deployed contract — these only drive client-side UX
 * (disabling buttons, inline hints); the contract enforces the real rules. */
export const RULES = {
  MIN_TITLE_CHARS: 5,
  MAX_TITLE_CHARS: 140,
  MIN_DESCRIPTION_CHARS: 20,
  MAX_DESCRIPTION_CHARS: 1200,
  MAX_URL_CHARS: 500,
  MIN_VERIFY_INTERVAL_SECONDS: 300,
  MAX_CONSECUTIVE_FAILURES: 3,
} as const;

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "metadata"]);
const BLOCKED_PREFIXES = ["127.", "10.", "192.168.", "169.254.", "0."];
const BLOCKED_SUFFIXES = [".local", ".localhost", ".internal", ".home.arpa"];

/** Same checks as `_looks_like_public_https_url` in the contract, run
 * client-side so a bad URL never has to round-trip through a wallet
 * signature and a rejected transaction to be caught. */
export function looksLikePublicHttpsUrl(url: string): string | null {
  if (!url || url.length > RULES.MAX_URL_CHARS) return "Must be a URL, 500 characters or fewer.";
  if (/\s/.test(url) || [...url].some((ch) => ch.charCodeAt(0) < 32)) {
    return "URL can't contain whitespace or control characters.";
  }
  if (!url.toLowerCase().startsWith("https://")) return "Must start with https://.";
  const rest = url.slice("https://".length);
  const authority = rest.split("/")[0].split("?")[0].split("#")[0];
  if (!authority || authority.includes("@")) return "URL is missing a valid host.";
  const host = authority.split(":")[0].toLowerCase().replace(/\.$/, "");
  if (!host || !host.includes(".")) return "URL is missing a valid host.";
  if (BLOCKED_HOSTS.has(host)) return "That host isn't publicly reachable.";
  if (BLOCKED_PREFIXES.some((p) => host.startsWith(p))) return "That host isn't publicly reachable.";
  if (BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) return "That host isn't publicly reachable.";
  return null;
}

export function validateTitle(title: string): string | null {
  const t = title.trim();
  if (t.length < RULES.MIN_TITLE_CHARS) return `At least ${RULES.MIN_TITLE_CHARS} characters.`;
  if (t.length > RULES.MAX_TITLE_CHARS) return `${RULES.MAX_TITLE_CHARS} characters or fewer.`;
  return null;
}

export function validateDescription(description: string): string | null {
  const d = description.trim();
  if (d.length < RULES.MIN_DESCRIPTION_CHARS)
    return `At least ${RULES.MIN_DESCRIPTION_CHARS} characters — say what "fulfilled" should look like.`;
  if (d.length > RULES.MAX_DESCRIPTION_CHARS) return `${RULES.MAX_DESCRIPTION_CHARS} characters or fewer.`;
  return null;
}

export function validateDeadline(deadlineUnix: number, nowUnix = Date.now() / 1000): string | null {
  if (!Number.isFinite(deadlineUnix) || deadlineUnix <= nowUnix) return "Must be in the future.";
  return null;
}
