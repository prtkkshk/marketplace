import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export interface SortDropdownProps {
 value: 'newest' | 'price_asc' | 'price_desc';
 onChange: (sort: 'newest' | 'price_asc' | 'price_desc') => void;
 className?: string;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
 return (
 <div className="relative inline-flex items-center">
 <ArrowUpDown className="absolute left-3 w-3 h-3 text-subtle pointer-events-none" />
 <select
 value={value}
 onChange={(e) => onChange(e.target.value as 'newest' | 'price_asc' | 'price_desc')}
 className="pl-7 pr-8 py-2 md:py-1.5 min-h-[44px] md:min-h-0 max-w-[7rem] md:max-w-none truncate bg-surface border border-line rounded text-[12.5px] font-medium text-ink focus-visible:ring-2 focus-visible:ring-accent/40 appearance-none cursor-pointer hover:border-line-strong hover:bg-surface-2 transition-colors"
 aria-label="Sort listings"
 >
 <option value="newest">Newest First</option>
 <option value="price_asc">Price: Low → High</option>
 <option value="price_desc">Price: High → Low</option>
 </select>
 </div>
 );
};
