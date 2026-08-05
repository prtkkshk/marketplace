import React, { useRef, useEffect } from 'react';
import { CATEGORIES } from '../../lib/constants';

export interface CategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  className?: string;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({ selectedCategory, onSelectCategory, className = '' }) => {
  const allCategories = [{ id: 'all', label: 'All', icon: '✨' }, ...CATEGORIES];
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      isDown.current = true;
      startX.current = e.pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
    };
    const onMouseLeave = () => { isDown.current = false; };
    const onMouseUp = () => { isDown.current = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown.current) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX.current) * 2;
      el.scrollLeft = scrollLeft.current - walk;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    if (e.key === 'ArrowRight') newIndex = (index + 1) % allCategories.length;
    if (e.key === 'ArrowLeft') newIndex = (index - 1 + allCategories.length) % allCategories.length;
    if (newIndex !== index) {
      e.preventDefault();
      const target = scrollRef.current?.children[newIndex] as HTMLButtonElement;
      target?.focus();
    }
  };

  return (
    <div className={`relative min-w-0 ${className}`}>
      <div 
        ref={scrollRef}
        role="tablist"
        aria-label="Categories"
        className={`flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 select-none cursor-grab active:cursor-grabbing`}
        style={{ scrollSnapType: 'x proximity' }}
      >
        {allCategories.map((cat, idx) => {
          const isSelected = selectedCategory === cat.id || (!selectedCategory && cat.id === 'all');
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onClick={() => onSelectCategory(cat.id === 'all' ? '' : cat.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper snap-start ${
                isSelected
                  ? 'bg-ink text-white font-semibold'
                  : 'bg-transparent border-2 border-line text-ink-2 font-medium hover:border-ink'
              }`}
            >
              <span className="text-[13px]">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
      <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
    </div>
  );
};
