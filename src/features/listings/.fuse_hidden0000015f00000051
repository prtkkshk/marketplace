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
 <li>
 <button
 type="button"
 onClick={() => onSelectCategory(undefined)}
 className={`w-full text-left rounded-lg px-3 py-2 -mx-3 cursor-pointer transition-colors ${
 !selectedCategory ? 'font-semibold text-accent bg-accent-wash' : 'text-muted hover:text-ink hover:bg-surface-2'
 }`}
 >
 All Categories
 </button>
 </li>
 {CATEGORIES.map(cat => (
 <li key={cat.id}>
 <button
 type="button"
 onClick={() => onSelectCategory(cat.id)}
 className={`w-full text-left rounded-lg px-3 py-2 -mx-3 cursor-pointer transition-colors ${
 selectedCategory === cat.id ? 'font-semibold text-accent bg-accent-wash' : 'text-muted hover:text-ink hover:bg-surface-2'
 }`}
 >
 {cat.icon} {cat.label}
 </button>
 </li>
 ))}
 </ul>

 <h3 className="font-bold text-ink text-sm mb-3">Condition</h3>
 <ul className="space-y-2.5 text-sm text-muted mb-8">
 {CONDITIONS.map(cond => (
 <li key={cond.id}>
 <label className="flex items-center gap-2.5 cursor-pointer">
 <input 
 type="checkbox" 
 checked={condition === cond.id}
 onChange={() => onSelectCondition(condition === cond.id ? undefined : cond.id)}
 className="rounded border-line text-accent focus:ring-accent w-4 h-4 cursor-pointer" 
 /> 
 <span>{cond.label}</span>
 </label>
 </li>
 ))}
 </ul>
 
 <h3 className="font-bold text-ink text-sm mb-3">Hall of Residence</h3>
 <div className="mb-8 relative">
 <select 
 value={hall || ''} 
 onChange={(e) => onSelectHall(e.target.value || undefined)}
 className="w-full bg-surface-2 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink focus:ring-accent/30 appearance-none"
 aria-label="Filter by Hall of Residence"
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
 className="w-full bg-surface-2 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink focus:ring-accent/30"
 />
 </div>
 <label className="flex items-center gap-2.5 text-sm text-muted mt-1">
 <input 
 type="checkbox" 
 checked={isNegotiable}
 onChange={onToggleNegotiable}
 className="rounded border-line text-accent focus:ring-accent w-4 h-4 cursor-pointer" 
 />
 <span className="cursor-pointer">Negotiable Only</span>
 </label>
 </div>
 </div>
 );
};
