export default function ProgressBar({ value = 0, className = '' }) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-text-secondary">Collection Progress</span>
        <span className="text-xs font-medium text-text-primary">{clamped}%</span>
      </div>
      <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
