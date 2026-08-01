import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, onFocus, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
      onFocus?.(e);
    };

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-content-primary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          onFocus={handleFocus}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-white text-content-primary text-base md:text-sm transition-colors placeholder:text-content-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light ${
            error ? 'border-status-danger text-status-danger' : 'border-surface-border hover:border-slate-300'
          } ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs font-medium text-status-danger">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-content-muted">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
