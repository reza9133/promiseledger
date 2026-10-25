import { Link } from "react-router-dom";
import { RequireContract } from "../components/ContractGate";
import { LedgerEntry } from "../components/LedgerEntry";
import { EmptyState, ErrorState, LoadingRows } from "../components/Skeleton";
import { useTitle } from "../hooks/useData";
import { useQuery } from "../hooks/useQuery";
import { useNow } from "../hooks/useNow";
import { useWallet } from "../hooks/useWallet";
import { api } from "../lib/api";
import { DEMO_SUBMITTERS } from "../lib/demo";
import { useDemo } from "../lib/mode";
import { shortAddr } from "../lib/format";

function MeBody() {
  const { address, connect, status } = useWallet();
  const demo = useDemo();
  const now = useNow(60_000);
  const who = address ?? (demo ? DEMO_SUBMITTERS.ada : null);
  const ids = useQuery(who ? `mine:${who}` : null, () => api.listSubmitterPromises(who as string), { ttl: 10_000 });
  const items = useQuery(ids.data ? `mine-items:${who}:${ids.data.join(",")}` : null, async () => {
    const newest = [...(ids.data as number[])].reverse();
    return Promise.all(newest.map((id) => api.getPromise(id)));
  });

  if (!who)
    return (
      <EmptyState
        title="Connect a wallet to see your filings."
        hint="Entries are listed by the address that filed them."
        action={
          <button className="btn btn-primary" onClick={connect} disabled={status === "connecting"}>
            Connect wallet
          </button>
        }
      />
    );
  return (
    <>
      <p className="muted">
        {address ? "Filed by" : "Demo account"} <code>{shortAddr(who)}</code>
      </p>
      {ids.loading || items.loading ? (
        <LoadingRows count={3} />
      ) : ids.error ? (
        <ErrorState error={ids.error} onRetry={ids.reload} />
      ) : (items.data ?? []).length === 0 ? (
        <EmptyState title="Nothing filed from this address yet." action={<Link to="/file" className="btn btn-primary">File a promise</Link>} />
      ) : (
        <div className="ledger-list">
          {items.data!.map((p) => (
            <LedgerEntry key={p.id} promise={p} nowUnix={now} />
          ))}
        </div>
      )}
    </>
  );
}

export function Me() {
  useTitle("My filings");
  return (
    <main id="main" className="page">
      <div className="page-head">
        <h1 className="page-title">My filings</h1>
        <Link to="/file" className="btn btn-primary">
          File a promise
        </Link>
      </div>
      <RequireContract>
        <MeBody />
      </RequireContract>
    </main>
  );
}
