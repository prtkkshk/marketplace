import { forwardRef } from 'react';
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
