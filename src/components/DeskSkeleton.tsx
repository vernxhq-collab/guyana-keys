export function DeskSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading">
      <span className="skeleton-line" />
      <div className="stats">
        {Array.from({ length: count }, (_, index) => <span key={index} className="stat skeleton" />)}
      </div>
    </div>
  );
}
