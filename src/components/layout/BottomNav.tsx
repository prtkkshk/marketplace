import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
// removed useReducedMotion
import { Home, Plus, User, Bookmark, Megaphone } from 'lucide-react';
import { PostChooserSheet } from './PostChooserSheet';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  // removed shouldReduceMotion
  const [isChooserOpen, setIsChooserOpen] = useState<boolean>(false);

  const navItems = [
    { path: '/', label: 'Browse', icon: Home },
    { path: '/wanted', label: 'Wanted', icon: Megaphone },
    { path: '#chooser', label: 'Post', icon: Plus, isFab: true },
    { path: '/profile/saved', label: 'Saved', icon: Bookmark },
    { path: '/profile', label: 'You', icon: User },
  ];

  return (
    <>
      <nav
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4"
        aria-label="Mobile navigation"
      >
        <div className="glass border border-line shadow-lg rounded-2xl p-2 flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/profile' && location.pathname.startsWith('/profile') && location.pathname !== '/profile/saved');
            const Icon = item.icon;

            if (item.isFab) {
              return (
                <div key={item.path} className="relative -top-6">
                  <button
                    type="button"
                    onClick={() => setIsChooserOpen(true)}
                    className="brand-gradient-btn text-white w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition-all border-4 border-paper focus:outline-none"
                    aria-label={item.label}
                  >
                    <Icon className="w-7 h-7" />
                  </button>
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
                  isActive ? 'bg-brand-wash text-brand' : 'text-ink-3 hover:text-ink'
                }`}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <PostChooserSheet isOpen={isChooserOpen} onClose={() => setIsChooserOpen(false)} />
    </>
  );
};
