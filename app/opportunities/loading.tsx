export default function Loading() {
  return (
    <main
      className="market-listing-page"
      role="status"
      aria-label="Loading jobs"
    >
      <div className="workspace-skeleton">
        <span className="skeleton-line skeleton-kicker" />
        <span className="skeleton-line skeleton-title" />
        <span className="skeleton-line skeleton-description" />
      </div>
    </main>
  );
}
