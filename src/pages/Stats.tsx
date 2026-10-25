import { Bars, Donut, statusSlices } from "../components/Charts";
import { RequireContract } from "../components/ContractGate";
import { ErrorState, LoadingRows } from "../components/Skeleton";
import { useStats, useTitle } from "../hooks/useData";
import { statusCounts } from "../lib/seals";

function StatsBody() {
  const q = useStats();
  const s = q.data;
  if (q.loading) return <LoadingRows count={4} />;
  if (q.error || !s) return <ErrorState error={q.error ?? new Error("No data")} onRetry={q.reload} />;
  const disputes = s.disputes_upheld + s.disputes_overturned;
  return (
    <>
      <div className="stats-grid">
        <section className="panel">
          <h2 className="panel-title">Where every promise stands</h2>
          <Donut slices={statusSlices(statusCounts(s))} centerLabel="promises" />
        </section>
        <section className="panel">
          <h2 className="panel-title">Disputes</h2>
          <p className="muted small">A dispute re-hashes the live page. “Upheld” means it still matches the report; “overturned” means the page has changed.</p>
          <Bars
            rows={[
              { label: "Upheld", value: s.disputes_upheld, color: "var(--good)" },
              { label: "Overturned", value: s.disputes_overturned, color: "var(--bad)" },
            ]}
          />
          <p className="muted small">{disputes} disputed in total.</p>
        </section>
        <section className="panel">
          <h2 className="panel-title">Activity</h2>
          <Bars
            rows={[
              { label: "Verification reports", value: s.report_count, color: "var(--accent)" },
              { label: "Evidence revisions", value: s.revision_count, color: "var(--warn)" },
              { label: "Promisors tracked", value: s.promisor_count, color: "var(--ink-soft)" },
              { label: "Kept late", value: s.kept_late, color: "var(--warn)" },
            ]}
          />
        </section>
      </div>
      <details className="data-table">
        <summary>View the numbers as a table</summary>
        <table>
          <caption className="sr-only">Ledger statistics</caption>
          <tbody>
            {Object.entries(s).map(([k, v]) => (
              <tr key={k}>
                <th scope="row">{k.replace(/_/g, " ")}</th>
                <td>{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

export function Stats() {
  useTitle("Stats");
  return (
    <main id="main" className="page">
      <div className="page-head">
        <h1 className="page-title">The ledger in numbers</h1>
      </div>
      <RequireContract>
        <StatsBody />
      </RequireContract>
    </main>
  );
}
