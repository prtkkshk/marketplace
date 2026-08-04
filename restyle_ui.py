import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + "\n")

# 1. Button.tsx
write_file('src/components/ui/Button.tsx', """
import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'whats' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.975] rounded-full min-h-[44px] px-4';

  const variantStyles = {
    primary: 'bg-brand text-white hover:bg-brand-hover shadow-1',
    whats: 'bg-whats text-white hover:bg-whats-hover shadow-1',
    ghost: 'bg-surface border border-line text-ink hover:bg-surface-alt',
    danger: 'bg-danger text-white hover:bg-danger/90 shadow-1',
  };

  const sizeStyles = {
    sm: 'text-xs min-h-[36px] px-3 py-1.5',
    md: 'text-sm min-h-[44px] px-4 py-2.5',
    lg: 'text-base min-h-[48px] px-6 py-3',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : leftIcon ? (
        <span className="mr-2 inline-flex items-center">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="ml-2 inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
};
""")

# 2. Badge.tsx
write_file('src/components/ui/Badge.tsx', """
import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cond' | 'neg' | 'fixed' | 'flag' | 'pin' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cond',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center uppercase font-bold tracking-[0.07em] rounded-full';

  const variantStyles = {
    cond: 'bg-surface-alt text-ink-2 border border-line',
    neg: 'bg-accent-wash text-accent border border-accent-line',
    fixed: 'border border-line text-ink-3',
    flag: 'bg-ink text-paper',
    pin: 'bg-accent text-paper',
    // Fallbacks to keep old code compiling if any
    primary: 'bg-brand-wash text-brand',
    secondary: 'bg-surface-alt text-ink-2 border border-line',
    success: 'bg-surface-alt text-ink-2 border border-line',
    warning: 'bg-accent-wash text-accent border border-accent-line',
    danger: 'bg-danger-wash text-danger border border-brand-line',
    muted: 'border border-line text-ink-3',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-[10px] px-2 py-0.5', // spec says uppercase 10px tracking-[0.07em]
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
      {children}
    </span>
  );
};
""")

# 3. Card.tsx
write_file('src/components/ui/Card.tsx', """
import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, interactive = false, className = '', ...props }) => {
  const interactiveStyles = interactive
    ? 'cursor-pointer hover:-translate-y-[3px] hover:border-line-strong hover:shadow-2 transition-all active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-lg border border-line bg-surface overflow-hidden text-left ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
""")

# 4. Input.tsx
write_file('src/components/ui/Input.tsx', """
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
        {error ? (
          <span className="text-xs font-medium text-danger">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-ink-3">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
""")

# 5. Select.tsx
write_file('src/components/ui/Select.tsx', """
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
          <label htmlFor={selectId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border bg-surface text-ink text-base md:text-[16px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/15 focus-visible:border-brand ${
            error ? 'border-danger text-danger' : 'border-line hover:border-line-strong'
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
        {error && <span className="text-xs font-medium text-danger">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
""")

# 6. Textarea.tsx
write_file('src/components/ui/Textarea.tsx', """
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
""")

# 7. Sheet.tsx
write_file('src/components/ui/Sheet.tsx', """
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end justify-center p-0 md:p-4 bg-ink/40 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div
        className="relative w-full max-w-lg bg-surface border border-line rounded-t-[26px] md:rounded-xl p-6 shadow-3 z-10 max-h-[90vh] md:max-h-full md:h-full overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Sheet dialog'}
      >
        <div className="flex flex-col mb-4 pb-2 border-b border-line">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
          <div className="flex items-center justify-between">
            {title ? (
              <h2 className="text-lg font-bold text-ink">{title}</h2>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-alt transition-colors ml-auto"
              aria-label="Close sheet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
""")

# 8. Dialog.tsx
write_file('src/components/ui/Dialog.tsx', """
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { SheetProps } from './Sheet';

export type DialogProps = SheetProps;

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div
        className="relative w-full max-w-lg bg-surface border border-line rounded-xl p-6 shadow-3 z-10 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
          {title ? (
            <h2 className="text-lg font-bold text-ink">{title}</h2>
          ) : <div />}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-alt transition-colors ml-auto"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
""")

# 9. Toast.tsx
write_file('src/components/ui/Toast.tsx', """
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-sm z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-full border shadow-2 flex items-center justify-between gap-3 text-xs font-medium transition-all transform animate-in slide-in-from-bottom-2 bg-ink text-paper border-ink`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-danger shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-paper shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md text-ink-3 hover:text-paper transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
""")

# 10. EmptyState.tsx
write_file('src/components/ui/EmptyState.tsx', """
import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <PackageOpen className="w-10 h-10 text-ink-3 stroke-[1.5]" />,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center bg-surface border border-dashed border-line-strong rounded-xl flex flex-col items-center justify-center ${className}`}>
      <div className="mb-3">{icon}</div>
      <h3 className="font-display text-xl text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-3 max-w-xs mb-6">{description}</p>}
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
        {actionLabel && onAction && (
          <Button variant="ghost" size="md" onClick={onAction} className="w-full sm:w-auto">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="primary" size="md" onClick={onSecondaryAction} className="w-full sm:w-auto">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
""")

# 11. ErrorState.tsx
write_file('src/components/ui/ErrorState.tsx', """
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "⚡ Couldn't load the feed",
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center bg-danger-wash border border-brand-line rounded-xl flex flex-col items-center justify-center ${className}`}>
      <AlertCircle className="w-8 h-8 text-danger mb-3" />
      <h3 className="font-display text-xl text-ink mb-1">Error</h3>
      <p className="text-sm text-danger font-medium max-w-xs mb-6">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="md" onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry
        </Button>
      )}
    </div>
  );
};
""")

# 12. Skeleton.tsx
write_file('src/components/ui/Skeleton.tsx', """
import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return <div className={`animate-pulse rounded-xl bg-paper-sunk ${className}`} {...props} />;
};
""")

# 13. Spinner.tsx
write_file('src/components/ui/Spinner.tsx', """
import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => {
  return <Loader2 className={`animate-spin text-brand ${className}`} size={size} />;
};
""")

# 14. Stat.tsx
write_file('src/components/ui/Stat.tsx', """
import React from 'react';

export interface StatProps {
  value: string | number;
  label: string;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({ value, label, className = '' }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="font-display text-[26px] md:text-[32px] text-ink leading-none">{value}</span>
      <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3 mt-1">
        {label}
      </span>
    </div>
  );
};
""")

# 15. SectionLabel.tsx
write_file('src/components/ui/SectionLabel.tsx', """
import React from 'react';

export interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ children, className = '' }) => {
  return (
    <h2 className={`text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3 ${className}`}>
      {children}
    </h2>
  );
};
""")

print("Successfully replaced components")
