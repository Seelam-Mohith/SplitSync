import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-4 py-2.5 bg-surface-light border rounded-lg
          text-text-primary placeholder-text-muted
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
          ${error ? 'border-red-500' : 'border-white/10 hover:border-white/20'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
