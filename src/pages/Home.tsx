import { Link } from "react-router-dom";
import { Hero3D } from "../components/Hero3D";
import { LedgerEntry } from "../components/LedgerEntry";
import { RequireContract } from "../components/ContractGate";
import { Reveal } from "../components/Reveal";
import { LoadingRows } from "../components/Skeleton";
import { useStats, useTitle } from "../hooks/useData";
import { useQuery } from "../hooks/useQuery";
import { useCountUp } from "../hooks/useMotion";
import { useNow } from "../hooks/useNow";
import { useTheme } from "../hooks/useTheme";
import { useContract } from "../hooks/useContract";
import { setDemo } from "../lib/mode";
import { api } from "../lib/api";

function Count({ value, label, tone }: { value: number; label: string; tone: string }) {
  const v = useCountUp(value);
  return (
    <div className={`stat stat-${tone}`}>
      <span className="stat-num">{v}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

const STEPS = [
  { n: "01", t: "File", d: "Name who promised what, what “kept” means, and the public page where proof will appear. Validators baseline that page on the spot." },
  { n: "02", t: "Verify", d: "Anyone can ask for a check. Validators re-read the page and judge it, and must agree on the exact bytes they read." },
  { n: "03", t: "Quote", d: "A verdict only counts with a verbatim quote from the page. No quote, no verdict." },
  { n: "04", t: "Dispute", d: "If the page changes, anyone can re-hash it and show the report no longer matches live evidence." },
];

export function Home() {
  useTitle("A register of kept & broken promises");
  const { theme } = useTheme();
  const { gate } = useContract();
  const stats = useStats();
  const now = useNow(60_000);
  const total = stats.data?.total_promises;
  const latest = useQuery(total !== undefined ? `home:latest:${total}` : null, async () => {
    const limit = Math.min(6, total as number);
    const items = await api.listPromises(Math.max(0, (total as number) - limit), limit);
    return [...items].reverse();
  });
  const s = stats.data;

  return (
    <main id="main" className="page page-wide">
      <section className="hero">
        <div className="hero-mesh" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">GenLayer Studionet · Intelligent Contract v2</p>
          <h1 className="hero-title">
            Promises, kept <em>or</em> broken, <span className="nowrap">on the record.</span>
          </h1>
          <p className="hero-lede">
            File a public promise, point it at the page that will prove it, and let GenLayer validators keep re-checking it.
            Every verdict carries a verbatim quote and the hash of the page it came from.
          </p>
          <div className="hero-cta">
            <Link to="/file" className="btn btn-primary">
              File a promise
            </Link>
            <Link to="/ledger" className="btn btn-outline">
              Browse the ledger
            </Link>
            {gate.kind === "not-configured" && (
              <button className="btn btn-ghost" onClick={() => setDemo(true)}>
                Try the demo
              </button>
            )}
          </div>
        </div>
        <Hero3D stats={s} dark={theme === "dark"} />
      </section>

      <RequireContract>
        <section className="stat-strip" aria-label="Ledger statistics">
          <Count value={s?.total_promises ?? 0} label="promises filed" tone="ink" />
          <Count value={s?.fulfilled ?? 0} label="fulfilled" tone="good" />
          <Count value={s?.in_progress ?? 0} label="in progress" tone="warn" />
          <Count value={s?.broken ?? 0} label="broken" tone="bad" />
          <Count value={s?.promisor_count ?? 0} label="promisors tracked" tone="ink" />
        </section>

        <Reveal as="section" className="home-section">
          <div className="section-head">
            <h2>Latest entries</h2>
            <Link to="/ledger" className="text-link">
              See the whole ledger →
            </Link>
          </div>
          {latest.loading || stats.loading ? (
            <LoadingRows count={4} />
          ) : latest.data && latest.data.length > 0 ? (
            <div className="ledger-list">
              {latest.data.map((p) => (
                <LedgerEntry key={p.id} promise={p} nowUnix={now} />
              ))}
            </div>
          ) : (
            <p className="muted">Nothing has been filed yet. Be the first.</p>
          )}
        </Reveal>
      </RequireContract>

      <Reveal as="section" className="home-section">
        <div className="section-head">
          <h2>How a promise is judged</h2>
          <Link to="/docs" className="text-link">
            Read the docs →
          </Link>
        </div>
        <ol className="steps">
          {STEPS.map((st, i) => (
            <Reveal as="li" key={st.n} delay={i * 70} className="step">
              <span className="step-n">{st.n}</span>
              <h3>{st.t}</h3>
              <p>{st.d}</p>
            </Reveal>
          ))}
        </ol>
      </Reveal>
    </main>
  );
}
