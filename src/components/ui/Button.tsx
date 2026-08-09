import { forwardRef } from 'react';
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
