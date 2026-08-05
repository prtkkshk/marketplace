import React from 'react';
import { CATEGORIES, CONDITIONS, KGP_HALLS } from '../../lib/constants';

interface FilterRailProps {
  selectedCategory: string;
  onSelectCategory: (cat: string | undefined) => void;
  condition?: string;
  onSelectCondition: (cond: string | undefined) => void;
  isNegotiable: boolean;
  onToggleNegotiable: () => void;
  hall?: string;
  onSelectHall: (hall: string | undefined) => void;
  maxPrice?: number;
  onChangeMaxPrice: (price: number | undefined) => void;
}

export const FilterRail: React.FC<FilterRailProps> = ({
  selectedCategory,
  onSelectCategory,
  condition,
  onSelectCondition,
  isNegotiable,
  onToggleNegotiable,
  hall,
  onSelectHall,
  maxPrice,
  onChangeMaxPrice,
}) => {
  return (
    <div className="flex flex-col">
      <h3 className="font-bold text-ink text-sm mb-3">Categories</h3>
      <ul className="space-y-1 text-sm mb-8">
        <li 
          onClick={() => onSelectCategory(undefined)}
          className={`rounded-lg px-3 py-2 -mx-3 cursor-pointer transition-colors ${
            !selectedCategory ? 'font-semibold text-brand bg-brand-wash' : 'text-ink-2 hover:text-ink hover:bg-surface-alt'
          }`}
        >
          All Categories
        </li>
        {CATEGORIES.map(cat => (
          <li 
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`rounded-lg px-3 py-2 -mx-3 cursor-pointer transition-colors ${
              selectedCategory === cat.id ? 'font-semibold text-brand bg-brand-wash' : 'text-ink-2 hover:text-ink hover:bg-surface-alt'
            }`}
          >
            {cat.icon} {cat.label}
          </li>
        ))}
      </ul>

      <h3 className="font-bold text-ink text-sm mb-3">Condition</h3>
      <ul className="space-y-2.5 text-sm text-ink-2 mb-8">
        {CONDITIONS.map(cond => (
          <li key={cond.id} className="flex items-center gap-2.5">
            <input 
              type="checkbox" 
              checked={condition === cond.id}
              onChange={() => onSelectCondition(condition === cond.id ? undefined : cond.id)}
              className="rounded border-line text-brand focus:ring-brand w-4 h-4 cursor-pointer" 
            /> 
            <span className="cursor-pointer" onClick={() => onSelectCondition(condition === cond.id ? undefined : cond.id)}>{cond.label}</span>
          </li>
        ))}
      </ul>
      
      <h3 className="font-bold text-ink text-sm mb-3">Hall of Residence</h3>
      <div className="mb-8 relative">
        <select 
          value={hall || ''} 
          onChange={(e) => onSelectHall(e.target.value || undefined)}
          className="w-full bg-surface-alt border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 appearance-none"
        >
          <option value="">All Halls</option>
          {KGP_HALLS.map(h => (
            <option key={h} value={h}>{h} Hall</option>
          ))}
        </select>
      </div>

      <h3 className="font-bold text-ink text-sm mb-3">Price Options</h3>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="Max Price (₹)" 
            value={maxPrice || ''}
            onChange={(e) => onChangeMaxPrice(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="w-full bg-surface-alt border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <label className="flex items-center gap-2.5 text-sm text-ink-2 mt-1">
          <input 
            type="checkbox" 
            checked={isNegotiable}
            onChange={onToggleNegotiable}
            className="rounded border-line text-brand focus:ring-brand w-4 h-4 cursor-pointer" 
          />
          <span className="cursor-pointer">Negotiable Only</span>
        </label>
      </div>
    </div>
  );
};
