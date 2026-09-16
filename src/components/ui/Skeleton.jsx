import './Skeleton.css';

export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonGameGrid({ count = 8 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <Skeleton className="skeleton-card__thumb" />
          <Skeleton className="skeleton-card__line" style={{ width: '70%' }} />
          <Skeleton className="skeleton-card__line" style={{ width: '40%' }} />
        </div>
      ))}
    </div>
  );
}
