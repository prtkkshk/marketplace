import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
 label: string;
 error?: string;
 hint?: string;
 options?: { value: string | number; label: string }[] | readonly string[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
 ({ className, label, error, hint, id, children, options, ...props }, ref) => {
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
 'w-full rounded border-[1.5px] h-[44px] px-3 pr-10 text-ink bg-surface text-base transition-shadow focus:border-ink focus:shadow-hard appearance-none',
 error ? 'border-danger bg-danger-wash' : 'border-line-strong',
 'disabled:bg-surface-2 disabled:border-line disabled:text-subtle disabled:cursor-not-allowed',
 className
 )}
 {...props}
 >
 {options ? options.map((opt) => {
 if (typeof opt === 'string') return <option key={opt} value={opt}>{opt}</option>;
 return <option key={opt.value} value={opt.value}>{opt.label}</option>;
 }) : children}
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
