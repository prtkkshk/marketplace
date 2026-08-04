import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, Plus, User, Bookmark, Megaphone } from 'lucide-react';
import { PostChooserSheet } from './PostChooserSheet';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/92 backdrop-blur-xl border-t border-line pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-[68px] px-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/profile' && location.pathname.startsWith('/profile') && location.pathname !== '/profile/saved');
            const Icon = item.icon;

            if (item.isFab) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => setIsChooserOpen(true)}
                  className="flex items-center justify-center w-[52px] h-[52px] rounded-[19px] bg-brand text-white shadow-md shadow-brand/20 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand mx-1"
                  aria-label={item.label}
                >
                  <Icon className="w-7 h-7" />
                </button>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] text-[10px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl transition-colors pt-1.5"
                aria-label={item.label}
              >
                <div
                  className={`flex flex-col items-center gap-1 transition-colors ${
                    isActive ? 'text-brand font-semibold' : 'text-ink-3 hover:text-ink-2'
                  }`}
                >
                  <Icon className="w-[21px] h-[21px]" />
                  <span>{item.label}</span>
                </div>

                {isActive && !shouldReduceMotion && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 w-[22px] h-[2.5px] bg-brand rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                {isActive && shouldReduceMotion && (
                  <div className="absolute top-0 w-[22px] h-[2.5px] bg-brand rounded-full" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <PostChooserSheet isOpen={isChooserOpen} onClose={() => setIsChooserOpen(false)} />
    </>
  );
};
