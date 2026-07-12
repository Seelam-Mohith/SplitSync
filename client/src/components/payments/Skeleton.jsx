export default function Skeleton({ className = '', rows = 1 }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-surface-lighter rounded w-full"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}

export function PaymentCardSkeleton() {
  return (
    <div className="animate-pulse bg-surface-card border border-white/10 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-surface-lighter rounded w-24" />
        <div className="h-6 bg-surface-lighter rounded-full w-20" />
      </div>
      <div className="h-8 bg-surface-lighter rounded w-32" />
      <div className="h-3 bg-surface-lighter rounded w-40" />
      <div className="h-10 bg-surface-lighter rounded-lg w-full" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <div className="animate-pulse flex items-center gap-4 p-4 border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-surface-lighter rounded"
          style={{ width: `${60 + Math.random() * 40}%`, flex: 1 }}
        />
      ))}
    </div>
  );
}
