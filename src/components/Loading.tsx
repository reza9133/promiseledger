export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
    </div>
  );
}

export function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="loading-rows" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="loading-row" />
      ))}
    </div>
  );
}
