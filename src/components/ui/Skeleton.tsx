import { clsx } from 'clsx';

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
