import React from 'react';

export interface StatProps {
 value: string | number;
 label: string;
 className?: string;
}

export const Stat: React.FC<StatProps> = ({ value, label, className = '' }) => {
 return (
 <div className={`flex flex-col ${className}`}>
 <span className="font-display text-[26px] md:text-[32px] text-ink leading-none">{value}</span>
 <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.12em] text-subtle mt-1">
 {label}
 </span>
 </div>
 );
};
