export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-card-in bg-shimmer ${className}`} />;
}
