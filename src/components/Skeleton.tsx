export function Skeleton({ h = 16, w = "100%", className = "" }: { h?: number; w?: number | string; className?: string }) {
  return <span className={`skeleton ${className}`.trim()} style={{ height: h, width: w }} aria-hidden="true" />;
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div className="loading-rows" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-row" key={i}>
          <Skeleton h={14} w="30%" />
          <Skeleton h={22} w="78%" />
          <Skeleton h={12} w="52%" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <main className="page" id="main">
      <LoadingRows count={3} />
    </main>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <p className="empty-title">Couldn't load this.</p>
      <p className="empty-hint">{error.message.slice(0, 220)}</p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
