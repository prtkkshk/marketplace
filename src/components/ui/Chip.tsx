import { forwardRef } from 'react';
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
