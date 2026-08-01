import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-content-primary">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-content-primary text-base md:text-sm transition-colors placeholder:text-content-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light resize-y ${
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

Textarea.displayName = 'Textarea';
