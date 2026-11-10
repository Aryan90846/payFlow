export function Skeleton({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-200 ${className}`} />;
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}
