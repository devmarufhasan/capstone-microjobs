export default function Loading() {
  return (
    <div
      className="workspace-skeleton"
      role="status"
      aria-label="Loading your workspace"
    >
      <span className="skeleton-line skeleton-kicker" />
      <span className="skeleton-line skeleton-title" />
      <span className="skeleton-line skeleton-description" />
      <div className="skeleton-grid">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
