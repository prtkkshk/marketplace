import React from 'react';
import { CATEGORIES } from '../../lib/constants';

export interface CategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({ selectedCategory, onSelectCategory }) => {
  const allCategories = [{ id: 'all', label: 'All', icon: '✨' }, ...CATEGORIES];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 -mx-1">
      {allCategories.map((cat) => {
        const isSelected = selectedCategory === cat.id || (!selectedCategory && cat.id === 'all');
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id === 'all' ? '' : cat.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light ${
              isSelected
                ? 'bg-brand-primary text-white shadow-xs'
                : 'bg-white border border-surface-border text-content-muted hover:text-content-primary hover:bg-slate-50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
