import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export interface SortDropdownProps {
  value: 'newest' | 'price_asc' | 'price_desc';
  onChange: (sort: 'newest' | 'price_asc' | 'price_desc') => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
  return (
    <div className="relative inline-flex items-center">
      <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-content-muted pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'newest' | 'price_asc' | 'price_desc')}
        className="pl-8 pr-8 py-2 min-h-[36px] bg-white border border-surface-border rounded-xl text-xs font-medium text-content-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light appearance-none cursor-pointer"
        aria-label="Sort listings"
      >
        <option value="newest">Newest First</option>
        <option value="price_asc">Price: Low → High</option>
        <option value="price_desc">Price: High → Low</option>
      </select>
    </div>
  );
};
