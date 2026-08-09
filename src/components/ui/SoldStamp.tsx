import { clsx } from 'clsx';

export function SoldStamp({ className }: { className?: string }) {
 return (
 <div
 aria-hidden="true"
 className={clsx(
 'absolute z-10 text-danger border-[2.5px] border-danger font-black text-xl px-2 py-0.5 uppercase tracking-widest bg-surface/85  -rotate-12 select-none',
 className
 )}
 >
 Sold
 </div>
 );
}
