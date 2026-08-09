import { clsx } from 'clsx';

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
