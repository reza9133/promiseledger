import { useId } from "react";

/**
 * PromiseLedger mark: a ruled ledger page with a wax seal stamped over its
 * corner, the seal carrying a tick. Original artwork. The page and seal take
 * their colours from CSS variables (--logo-page, --logo-rows, --logo-seal,
 * --logo-tick) so it follows the light/dark theme.
 */
const SEAL_PATH = "M60.0 43.0L59.6 44.0L58.5 44.9L57.3 45.6L56.4 46.3L56.2 47.1L56.5 48.1L57.1 49.4L57.4 50.8L57.1 51.8L56.2 52.4L54.8 52.5L53.4 52.4L52.3 52.4L51.7 52.9L51.3 53.9L51.0 55.3L50.5 56.6L49.6 57.3L48.5 57.2L47.4 56.5L46.3 55.5L45.4 54.9L44.6 54.9L43.7 55.5L42.6 56.5L41.5 57.2L40.4 57.3L39.5 56.6L39.0 55.3L38.7 53.9L38.3 52.9L37.7 52.4L36.6 52.4L35.2 52.5L33.8 52.4L32.9 51.8L32.6 50.8L32.9 49.4L33.5 48.1L33.8 47.1L33.6 46.3L32.7 45.6L31.5 44.9L30.4 44.0L30.0 43.0L30.4 42.0L31.5 41.1L32.7 40.4L33.6 39.7L33.8 38.9L33.5 37.9L32.9 36.6L32.6 35.2L32.9 34.2L33.8 33.6L35.2 33.5L36.6 33.6L37.7 33.6L38.3 33.1L38.7 32.1L39.0 30.7L39.5 29.4L40.4 28.7L41.5 28.8L42.6 29.5L43.7 30.5L44.6 31.1L45.4 31.1L46.3 30.5L47.4 29.5L48.5 28.8L49.6 28.7L50.5 29.4L51.0 30.7L51.3 32.1L51.7 33.1L52.3 33.6L53.4 33.6L54.8 33.5L56.2 33.6L57.1 34.2L57.4 35.2L57.1 36.6L56.5 37.9L56.2 38.9L56.4 39.7L57.3 40.4L58.5 41.1L59.6 42.0L60.0 43.0Z";

export function LogoMark({
  size = 32,
  stamp = false,
  title,
  className = "",
}: {
  size?: number;
  /** Plays the one-shot "stamp" animation: page settles, seal drops, tick draws. */
  stamp?: boolean;
  title?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`logo-mark ${stamp ? "logo-stamp" : ""} ${className}`.trim()}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <path id={`${id}s`} d={SEAL_PATH} />
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <use href={`#${id}s`} fill="#000" stroke="#000" strokeWidth="3.6" strokeLinejoin="round" />
        </mask>
      </defs>
      <g mask={`url(#${id}m)`} className="logo-page">
        <rect x="8" y="6" width="40" height="50" rx="6.5" fill="var(--logo-page, #1B2A4A)" />
        <path d="M15.5 12v38" stroke="var(--logo-rows, #F4F0E4)" strokeOpacity=".35" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M21.5 18h19M21.5 27h15M21.5 36h17"
          stroke="var(--logo-rows, #F4F0E4)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </g>
      <g className="logo-seal">
        <use href={`#${id}s`} fill="var(--logo-seal, #C23B2B)" />
        <path
          className="logo-tick"
          d="M38.4 43.6l4.6 4.5 9-9.6"
          fill="none"
          stroke="var(--logo-tick, #FFF8EC)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
        />
      </g>
    </svg>
  );
}

/** Mark + live wordmark (uses the page's Fraunces) + optional tagline. */
export function LogoLockup({ size = 34, tagline = false, stamp = false }: { size?: number; tagline?: boolean; stamp?: boolean }) {
  return (
    <span className="logo-lockup">
      <LogoMark size={size} stamp={stamp} />
      <span className="logo-word">
        <span className="logo-word-main">
          Promise<strong>Ledger</strong>
        </span>
        {tagline && <span className="logo-tagline">a register of kept &amp; broken promises</span>}
      </span>
    </span>
  );
}
