import React from 'react';
import { CATEGORIES } from '../../lib/constants';

export interface CategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({ selectedCategory, onSelectCategory }) => {
  const allCategories = [{ id: 'all', label: 'All', icon: '✨' }, ...CATEGORIES];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 -mx-1 select-none">
      {allCategories.map((cat) => {
        const isSelected = selectedCategory === cat.id || (!selectedCategory && cat.id === 'all');
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id === 'all' ? '' : cat.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light active:scale-95 ${
              isSelected
                ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/20 scale-[1.02]'
                : 'bg-white border border-surface-border/80 text-content-muted hover:text-content-primary hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <span className="text-sm">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
