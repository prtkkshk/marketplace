import { forwardRef } from 'react';
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
 'w-full rounded border-[1.5px] h-[44px] px-3 text-ink bg-surface placeholder:text-subtle text-base transition-shadow focus:border-ink focus:shadow-hard',
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
