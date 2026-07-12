const statusConfig = {
  PENDING: {
    label: 'Pending',
    classes: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
    dot: 'bg-yellow-400',
  },
  SUBMITTED: {
    label: 'Submitted',
    classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    dot: 'bg-blue-400',
  },
  VERIFIED: {
    label: 'Verified',
    classes: 'bg-green-500/15 text-green-400 border border-green-500/20',
    dot: 'bg-green-400',
  },
  MISSED: {
    label: 'Missed',
    classes: 'bg-red-500/15 text-red-400 border border-red-500/20',
    dot: 'bg-red-400',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        size === 'sm'
          ? 'px-2.5 py-0.5 text-xs'
          : 'px-3 py-1 text-sm'
      } ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
