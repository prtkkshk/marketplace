import React, { useRef, useEffect } from 'react';
import { CATEGORIES } from '../../lib/constants';
import * as LucideIcons from 'lucide-react';
import { Sparkles } from 'lucide-react';

export interface CategoryPillsProps {
 selectedCategory: string;
 onSelectCategory: (category: string) => void;
 className?: string;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({ selectedCategory, onSelectCategory, className = '' }) => {
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

 return (
 <div className={`relative min-w-0 ${className}`}>
 <div 
 ref={scrollRef}
 role="tablist"
 aria-label="Categories"
 className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 select-none cursor-grab active:cursor-grabbing px-1"
 style={{ scrollSnapType: 'x proximity' }}
 >
 <button
 role="tab"
 aria-selected={!selectedCategory}
 onClick={() => onSelectCategory('')}
 className={`press inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm border-[1.5px] whitespace-nowrap focus-visible:outline-ink snap-start ${
 !selectedCategory
 ? 'bg-accent border-ink text-white shadow-hard'
 : 'bg-surface border-line-strong text-ink hover:bg-surface-2 shadow-none'
 }`}
 >
 <Sparkles className="w-3.5 h-3.5" />
 <span className="text-sm font-medium">All</span>
 </button>
 {CATEGORIES.map((cat) => {
 const isSelected = selectedCategory === cat.id;
        const IconComp = (LucideIcons as unknown as Record<string, React.ElementType>)[cat.icon];
 return (
 <button
 key={cat.id}
 role="tab"
 aria-selected={isSelected}
 onClick={() => onSelectCategory(cat.id)}
 className={`press inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm border-[1.5px] whitespace-nowrap focus-visible:outline-ink snap-start ${
 isSelected
 ? 'bg-accent border-ink text-white shadow-hard'
 : 'bg-surface border-line-strong text-ink hover:bg-surface-2 shadow-none'
 }`}
 >
 {IconComp && <IconComp className="w-3.5 h-3.5" />}
 <span className="text-sm font-medium">{cat.label}</span>
 </button>
 );
 })}
 </div>
 <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
 </div>
 );
};
