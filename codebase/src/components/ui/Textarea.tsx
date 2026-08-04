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
          <label htmlFor={textareaId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={`w-full px-3.5 py-2.5 rounded-md border bg-surface text-ink text-base md:text-[16px] transition-colors placeholder:text-ink-3/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/15 focus-visible:border-brand resize-y ${
            error ? 'border-danger text-danger' : 'border-line hover:border-line-strong'
          } ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs font-medium text-danger">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-ink-3">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
