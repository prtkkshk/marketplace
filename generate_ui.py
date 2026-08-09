import os

dir_path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src\components\ui'
os.makedirs(dir_path, exist_ok=True)

files = {}

files['Button.tsx'] = """import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const isLink = variant === 'link';
    const base = isLink 
      ? 'inline-flex items-center justify-center font-bold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 underline-offset-4 disabled:text-subtle disabled:no-underline min-h-[44px] min-w-[44px]'
      : 'press inline-flex items-center justify-center font-extrabold text-[13.5px] rounded border-[1.5px] min-h-[44px] min-w-[44px] px-4 transition-colors focus-visible:outline-none disabled:bg-surface-2 disabled:border-line disabled:text-subtle disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-accent border-ink text-white',
      secondary: 'bg-surface border-ink text-ink',
      link: ''
    };
    
    const sizes = {
      sm: isLink ? '' : 'h-[36px] min-h-[36px] text-xs px-3',
      md: isLink ? '' : 'h-[44px]',
      lg: isLink ? '' : 'h-[52px] text-sm px-6'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        className={clsx(base, !isLink && variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
"""

files['IconButton.tsx'] = """import { forwardRef } from 'react';
import { clsx } from 'clsx';

export const IconButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      aria-disabled={disabled}
      className={clsx(
        'press inline-flex items-center justify-center min-w-[44px] min-h-[44px] w-[44px] h-[44px] rounded border-[1.5px] border-ink bg-surface text-ink transition-colors focus-visible:outline-none disabled:bg-surface-2 disabled:border-line disabled:text-subtle disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
IconButton.displayName = 'IconButton';
"""

files['Input.tsx'] = """import { forwardRef } from 'react';
import { clsx } from 'clsx';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const uniqueId = id || label.replace(/\s+/g, '-').toLowerCase();
    const errorId = `${uniqueId}-error`;
    const hintId = `${uniqueId}-hint`;
    
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={uniqueId} className="text-label text-ink uppercase tracking-wider font-extrabold">{label}</label>
        <input
          ref={ref}
          id={uniqueId}
          aria-invalid={!!error}
          aria-describedby={clsx(error && errorId, hint && !error && hintId) || undefined}
          className={clsx(
            'w-full rounded border-[1.5px] h-[44px] px-3 text-ink bg-surface placeholder:text-subtle text-base transition-shadow focus:outline-none focus:border-ink focus:shadow-hard',
            error ? 'border-danger bg-danger-wash' : 'border-line-strong',
            'disabled:bg-surface-2 disabled:border-line disabled:text-subtle disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && <span id={errorId} className="text-xs text-danger font-medium">{error}</span>}
        {hint && !error && <span id={hintId} className="text-xs text-subtle">{hint}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
"""

files['Textarea.tsx'] = """import { forwardRef } from 'react';
import { clsx } from 'clsx';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const uniqueId = id || label.replace(/\s+/g, '-').toLowerCase();
    const errorId = `${uniqueId}-error`;
    const hintId = `${uniqueId}-hint`;
    
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={uniqueId} className="text-label text-ink uppercase tracking-wider font-extrabold">{label}</label>
        <textarea
          ref={ref}
          id={uniqueId}
          aria-invalid={!!error}
          aria-describedby={clsx(error && errorId, hint && !error && hintId) || undefined}
          className={clsx(
            'w-full rounded border-[1.5px] p-3 min-h-[100px] text-ink bg-surface placeholder:text-subtle text-base transition-shadow focus:outline-none focus:border-ink focus:shadow-hard resize-y',
            error ? 'border-danger bg-danger-wash' : 'border-line-strong',
            'disabled:bg-surface-2 disabled:border-line disabled:text-subtle disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && <span id={errorId} className="text-xs text-danger font-medium">{error}</span>}
        {hint && !error && <span id={hintId} className="text-xs text-subtle">{hint}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
"""

files['Select.tsx'] = """import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, children, ...props }, ref) => {
    const uniqueId = id || label.replace(/\s+/g, '-').toLowerCase();
    const errorId = `${uniqueId}-error`;
    const hintId = `${uniqueId}-hint`;
    
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={uniqueId} className="text-label text-ink uppercase tracking-wider font-extrabold">{label}</label>
        <div className="relative">
          <select
            ref={ref}
            id={uniqueId}
            aria-invalid={!!error}
            aria-describedby={clsx(error && errorId, hint && !error && hintId) || undefined}
            className={clsx(
              'w-full rounded border-[1.5px] h-[44px] px-3 pr-10 text-ink bg-surface text-base transition-shadow focus:outline-none focus:border-ink focus:shadow-hard appearance-none',
              error ? 'border-danger bg-danger-wash' : 'border-line-strong',
              'disabled:bg-surface-2 disabled:border-line disabled:text-subtle disabled:cursor-not-allowed',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink pointer-events-none" />
        </div>
        {error && <span id={errorId} className="text-xs text-danger font-medium">{error}</span>}
        {hint && !error && <span id={hintId} className="text-xs text-subtle">{hint}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';
"""

files['Badge.tsx'] = """import { clsx } from 'clsx';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger';
  className?: string;
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'border-line-strong bg-surface text-ink',
    success: 'border-success bg-success-wash text-success',
    danger: 'border-danger bg-danger-wash text-danger',
  };

  return (
    <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded-sm border hairline text-badge tracking-[0.05em] uppercase font-bold', variants[variant], className)}>
      {children}
    </span>
  );
}
"""

files['Chip.tsx'] = """import { forwardRef } from 'react';
import { clsx } from 'clsx';

export type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-pressed={active}
        className={clsx(
          'press inline-flex items-center justify-center px-4 h-[32px] rounded-sm border-[1.5px] text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none',
          active ? 'bg-accent border-ink text-white shadow-hard' : 'bg-surface border-line-strong text-ink shadow-none hover:bg-surface-2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Chip.displayName = 'Chip';
"""

files['SegmentedControl.tsx'] = """import { clsx } from 'clsx';

export type SegmentedControlProps = {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
};

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={clsx('flex p-1 bg-surface-2 rounded-sm gap-1', className)}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            className={clsx(
              'flex-1 press min-h-[44px] h-[36px] rounded-[4px] text-sm font-bold transition-all focus-visible:outline-none',
              isActive ? 'bg-surface border-[1.5px] border-ink text-ink shadow-hard' : 'text-subtle hover:text-ink hover:bg-black/5 shadow-none border-[1.5px] border-transparent'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
"""

files['Card.tsx'] = """import { forwardRef } from 'react';
import { clsx } from 'clsx';

export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('bg-surface border-[1.5px] border-line-strong rounded-lg shadow-card overflow-hidden', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';
"""

files['SoldStamp.tsx'] = """import { clsx } from 'clsx';

export function SoldStamp({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'absolute z-10 text-danger border-[2.5px] border-danger font-black text-xl px-2 py-0.5 uppercase tracking-widest bg-surface/85 backdrop-blur-[2px] -rotate-12 select-none',
        className
      )}
    >
      Sold
    </div>
  );
}
"""

files['EmptyState.tsx'] = """import { ReactNode } from 'react';
import { clsx } from 'clsx';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center text-center p-8 bg-surface border-[1.5px] border-line-strong rounded-lg shadow-card', className)}>
      <div className="w-[34px] h-[34px] rounded bg-accent-wash border-[1.5px] border-ink flex items-center justify-center text-accent mb-4">
        {icon}
      </div>
      <h3 className="text-title font-bold text-ink mb-1.5">{title}</h3>
      <p className="text-xs text-subtle max-w-[280px] mb-6">{description}</p>
      {action}
    </div>
  );
}
"""

files['Skeleton.tsx'] = """import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'bg-surface-2 rounded animate-pulse motion-reduce:animate-none',
        className
      )}
    />
  );
}
"""

for filename, content in files.items():
    with open(os.path.join(dir_path, filename), 'w', encoding='utf-8') as f:
        f.write(content)

print("Primitives generated successfully.")
