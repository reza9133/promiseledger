import type { Limits } from "./types";

/**
 * Client-side mirror of the contract's validation (contracts/promise_ledger.py).
 * These only drive UX (inline errors, disabled buttons) so a bad input never
 * costs a wallet signature; the contract enforces the real rules. A test
 * parses the contract source and fails if DEFAULT_LIMITS drifts from it, and
 * another checks `isPublicHttpsUrl` against tests/fixtures/url_vectors.json,
 * the same vectors the Python tests use.
 */
export const DEFAULT_LIMITS: Limits = {
  version: "2.0.0",
  max_title_chars: 140,
  max_description_chars: 1200,
  max_promisor_chars: 80,
  min_promisor_chars: 2,
  max_url_chars: 500,
  max_evidence_chars: 8000,
  min_citation_chars: 6,
  min_verify_interval_seconds: 300,
  max_consecutive_failures: 3,
  min_deadline_lead_seconds: 60,
  max_deadline_horizon_seconds: 5 * 365 * 24 * 3600,
  max_promises_per_submitter: 30,
  max_evidence_revisions: 8,
  max_page_size: 50,
};

export const MIN_TITLE_CHARS = 5;
export const MIN_DESCRIPTION_CHARS = 20;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "nip.io",
  "sslip.io",
  "xip.io",
  "localtest.me",
  "lvh.me",
]);
const BLOCKED_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".home.arpa",
  ".lan",
  ".intranet",
  ".corp",
  ".private",
  ".onion",
  ".test",
  ".invalid",
  ".example",
  ".nip.io",
  ".sslip.io",
  ".xip.io",
  ".localtest.me",
  ".lvh.me",
];

/** Contract `_clip`: drop control characters (keep tab/newline), trim, cut. */
export function clip(value: string, limit: number): string {
  let out = "";
  for (const ch of String(value)) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === "\t" || ch === "\n" || (code >= 32 && code !== 127)) out += ch;
  }
  return out.trim().slice(0, limit);
}

/** Contract `_collapse_whitespace`. */
export function collapseWhitespace(raw: string): string {
  return String(raw).split(/\s+/).filter(Boolean).join(" ");
}

export function hasPromptDelimiters(text: string): boolean {
  return text.includes("<<<") || text.includes(">>>");
}

function ipv4Octets(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^[0-9]+$/.test(part)) return null;
    if (part.length > 1 && part[0] === "0") return null;
    const v = Number(part);
    if (v > 255) return null;
    octets.push(v);
  }
  return octets;
}

function isPublicIpv4([a, b, c]: number[]): boolean {
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 192 && b === 168) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false;
  return true;
}

function validDnsLabel(label: string): boolean {
  if (label.length < 1 || label.length > 63) return false;
  if (label[0] === "-" || label[label.length - 1] === "-") return false;
  return /^[A-Za-z0-9-]+$/.test(label);
}

/** Why a URL would be refused, or null when the contract would accept it. Faithful port of `_looks_like_public_https_url`. */
export function urlProblem(url: string, maxChars: number = DEFAULT_LIMITS.max_url_chars): string | null {
  if (!url) return "Enter the evidence page address.";
  if (url.length > maxChars) return `Must be ${maxChars} characters or fewer.`;
  for (const ch of url) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 33 || code > 126) return "No spaces, control characters or non-ASCII characters (use the punycode / percent-encoded form).";
  }
  if (url.includes("\\")) return "Backslashes are not allowed.";
  if (!url.toLowerCase().startsWith("https://")) return "Must start with https://.";
  const rest = url.slice("https://".length);
  const authority = rest.split("/")[0].split("?")[0].split("#")[0];
  if (!authority) return "The URL is missing a host.";
  if (authority.includes("@") || authority.includes("[") || authority.includes("]"))
    return "No userinfo (user@) and no IPv6 literals.";
  if (authority.includes("%")) return "No percent-encoding in the host.";
  const colon = authority.indexOf(":");
  const hostRaw = colon === -1 ? authority : authority.slice(0, colon);
  if (colon !== -1) {
    const port = authority.slice(colon + 1);
    if (port !== "" && port !== "443") return "Only the default https port (443) is allowed.";
  }
  const host = hostRaw.toLowerCase().replace(/\.+$/, "");
  if (!host || host.includes("..") || !host.includes(".")) return "The URL is missing a valid host.";
  if (BLOCKED_HOSTS.has(host)) return "That host isn't publicly reachable.";
  const labels = host.split(".");
  const last = labels[labels.length - 1];
  if (/^[0-9]+$/.test(last) || last.startsWith("0x")) {
    const octets = ipv4Octets(host);
    if (octets === null) return "Write IP addresses in plain dotted form (e.g. 93.184.216.34).";
    return isPublicIpv4(octets) ? null : "That IP address isn't publicly routable.";
  }
  if (!labels.every(validDnsLabel)) return "That isn't a valid host name.";
  if (last.length < 2 || /^[0-9]+$/.test(last)) return "That isn't a valid host name.";
  if (BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) return "That host isn't publicly reachable.";
  return null;
}

export function isPublicHttpsUrl(url: string, maxChars: number = DEFAULT_LIMITS.max_url_chars): boolean {
  return urlProblem(url, maxChars) === null;
}

/** Back-compat name used by forms: error text or null. */
export const looksLikePublicHttpsUrl = urlProblem;

export function normalizeTitle(title: string, limits: Limits = DEFAULT_LIMITS): string {
  return collapseWhitespace(clip(title, limits.max_title_chars * 2)).slice(0, limits.max_title_chars);
}

export function validateTitle(title: string, limits: Limits = DEFAULT_LIMITS): string | null {
  const t = normalizeTitle(title, limits);
  if (collapseWhitespace(clip(title, limits.max_title_chars * 2)).length > limits.max_title_chars)
    return `${limits.max_title_chars} characters or fewer.`;
  if (t.length < MIN_TITLE_CHARS) return `At least ${MIN_TITLE_CHARS} characters.`;
  if (hasPromptDelimiters(t)) return "The sequences <<< and >>> are not allowed.";
  return null;
}

export function validateDescription(description: string, limits: Limits = DEFAULT_LIMITS): string | null {
  const raw = clip(description, limits.max_description_chars + 1);
  if (raw.length > limits.max_description_chars) return `${limits.max_description_chars} characters or fewer.`;
  if (raw.length < MIN_DESCRIPTION_CHARS)
    return `At least ${MIN_DESCRIPTION_CHARS} characters. Say what "fulfilled" looks like.`;
  if (hasPromptDelimiters(raw)) return "The sequences <<< and >>> are not allowed.";
  return null;
}

export function validatePromisor(promisor: string, limits: Limits = DEFAULT_LIMITS): string | null {
  const full = collapseWhitespace(clip(promisor, limits.max_promisor_chars * 2));
  if (full.length > limits.max_promisor_chars) return `${limits.max_promisor_chars} characters or fewer.`;
  if (full.length < limits.min_promisor_chars || !/[\p{L}\p{N}]/u.test(full))
    return `Name who made the promise (at least ${limits.min_promisor_chars} characters).`;
  if (hasPromptDelimiters(full)) return "The sequences <<< and >>> are not allowed.";
  return null;
}

export function validateDeadline(
  deadlineUnix: number,
  nowUnix: number = Date.now() / 1000,
  limits: Limits = DEFAULT_LIMITS,
): string | null {
  if (!Number.isFinite(deadlineUnix)) return "Pick a deadline.";
  if (deadlineUnix < nowUnix + limits.min_deadline_lead_seconds) return "Must be at least one minute in the future.";
  if (deadlineUnix > nowUnix + limits.max_deadline_horizon_seconds) return "At most five years away.";
  return null;
}

export const promisorKey = (name: string): string => collapseWhitespace(name).toLowerCase();
