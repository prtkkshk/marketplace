import os
import re

def rewrite_bottom_nav():
    path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src\components\layout\BottomNav.tsx'
    content = """import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, User, Megaphone, Plus } from 'lucide-react';
import { PostChooserSheet } from './PostChooserSheet';
import { Button } from '../ui/Button';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const [isChooserOpen, setIsChooserOpen] = useState<boolean>(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/wanted', label: 'Wanted', icon: Megaphone },
  ];

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-surface border-t-[1.5px] border-ink pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile navigation"
      >
        <div className="flex justify-between items-center px-4 py-2">
          <div className="flex gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 ${isActive ? 'text-accent' : 'text-ink opacity-55 hover:opacity-100'} transition-opacity focus-visible:outline-ink`}
                >
                  <Icon className="w-[22px] h-[22px]" />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
          
          <Button variant="primary" size="md" onClick={() => setIsChooserOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Sell
          </Button>

          <div className="flex gap-6">
            <NavLink
              to="/profile"
              className={`flex flex-col items-center gap-1 ${location.pathname.startsWith('/profile') ? 'text-accent' : 'text-ink opacity-55 hover:opacity-100'} transition-opacity focus-visible:outline-ink`}
            >
              <User className="w-[22px] h-[22px]" />
              <span className="text-[10px] font-bold">Profile</span>
            </NavLink>
          </div>
        </div>
      </nav>

      <PostChooserSheet isOpen={isChooserOpen} onClose={() => setIsChooserOpen(false)} />
    </>
  );
};
"""
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def rewrite_constants():
    path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src\lib\constants.ts'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace("icon: '🚲'", "icon: 'Bike'")
    content = content.replace("icon: '📚'", "icon: 'BookOpen'")
    content = content.replace("icon: '💻'", "icon: 'Laptop'")
    content = content.replace("icon: '🛏️'", "icon: 'BedDouble'")
    content = content.replace("icon: '🥼'", "icon: 'TestTube'")
    content = content.replace("icon: '📦'", "icon: 'Package'")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def rewrite_category_pills():
    path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src\features\listings\CategoryPills.tsx'
    content = """import React, { useRef, useEffect } from 'react';
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
          const IconComp = (LucideIcons as any)[cat.icon];
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
              <IconComp className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          );
        })}
      </div>
      <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
    </div>
  );
};
"""
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

rewrite_bottom_nav()
rewrite_constants()
rewrite_category_pills()
print("Scripts executed.")
