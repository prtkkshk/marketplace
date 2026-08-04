import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export interface SortDropdownProps {
  value: 'newest' | 'price_asc' | 'price_desc';
  onChange: (sort: 'newest' | 'price_asc' | 'price_desc') => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
  return (
    <div className="relative inline-flex items-center">
      <ArrowUpDown className="absolute left-3 w-3 h-3 text-ink-3 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'newest' | 'price_asc' | 'price_desc')}
        className="pl-7 pr-8 py-1.5 bg-surface border border-line rounded-full text-[12.5px] font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 appearance-none cursor-pointer hover:border-line-strong hover:bg-surface-alt transition-colors"
        aria-label="Sort listings"
      >
        <option value="newest">Newest First</option>
        <option value="price_asc">Price: Low → High</option>
        <option value="price_desc">Price: High → Low</option>
      </select>
    </div>
  );
};
