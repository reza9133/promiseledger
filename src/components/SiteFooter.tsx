const GITHUB_URL = "https://github.com/reza9133/promiseledger";
const X_URL = "https://x.com/amirhp771";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.73.5.98 5.24.98 11.52c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55v-1.94c-3.16.69-3.83-1.36-3.83-1.36-.52-1.32-1.26-1.67-1.26-1.67-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.73.4-1.24.72-1.53-2.52-.29-5.17-1.26-5.17-5.62 0-1.24.44-2.26 1.17-3.05-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.16a10.9 10.9 0 0 1 5.74 0c2.19-1.47 3.15-1.16 3.15-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.81 1.17 3.05 0 4.37-2.66 5.33-5.19 5.61.41.35.77 1.04.77 2.11v3.13c0 .3.2.66.79.55A11.02 11.02 0 0 0 23.02 11.52C23.02 5.24 18.27.5 12 .5Z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.24 2H21l-6.55 7.49L22.2 22h-6.03l-4.72-6.17L5.98 22H3.2l7.02-8.03L2.4 2h6.18l4.27 5.64L18.24 2Zm-1.06 18.17h1.68L7.9 3.75H6.1l11.08 16.42Z"
      />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <h2 className="footer-heading">How it works</h2>
          <ul className="footer-steps">
            <li>File a promise pointing at the evidence page that will prove it.</li>
            <li>Anyone can verify it — validators re-check that page and record a verdict.</li>
            <li>Anyone can dispute a report by asking the same page again.</li>
          </ul>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">About</h2>
          <p className="footer-about-text">
            PromiseLedger is an Intelligent Contract on GenLayer — it re-checks public promises
            against live evidence so no one has to take anyone's word for it.
          </p>
          <div className="footer-links">
            <a className="footer-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GitHubIcon /> GitHub
            </a>
            <a className="footer-link" href={X_URL} target="_blank" rel="noreferrer">
              <XIcon /> @amirhp771
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        PromiseLedger runs on GenLayer Studio Network — every verdict is re-checkable by anyone.
      </div>
    </footer>
  );
}
