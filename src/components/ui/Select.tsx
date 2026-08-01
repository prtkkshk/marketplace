import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: readonly (string | SelectOption)[];
  error?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-content-primary">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-white text-content-primary text-base md:text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light ${
            error ? 'border-status-danger' : 'border-surface-border hover:border-slate-300'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
        {error && <span className="text-xs font-medium text-status-danger">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
