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
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          onFocus={handleFocus}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border bg-surface text-ink text-base md:text-[16px] transition-colors placeholder:text-ink-3/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/15 focus-visible:border-brand ${
            error ? 'border-danger text-danger' : 'border-line hover:border-line-strong'
          } ${className}`}
          {...props}
        />
        <div className="min-h-[1.25rem] mt-0.5">
          {error ? (
            <span className="text-xs font-medium text-danger">{error}</span>
          ) : helperText ? (
            <span className="text-xs text-ink-3">{helperText}</span>
          ) : null}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
