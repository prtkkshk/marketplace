import { forwardRef } from 'react';
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
