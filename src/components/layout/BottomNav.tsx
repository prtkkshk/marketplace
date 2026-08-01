import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, Megaphone, Plus, User } from 'lucide-react';
import { PostChooserSheet } from './PostChooserSheet';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [isChooserOpen, setIsChooserOpen] = useState<boolean>(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '#chooser', label: 'Post', icon: Plus, isFab: true },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-surface-border pb-[env(safe-area-inset-bottom)] shadow-lg"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isFab) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => setIsChooserOpen(true)}
                  className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary text-white shadow-md active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light"
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
                className="relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light rounded-xl transition-colors"
                aria-label={item.label}
              >
                <div
                  className={`flex flex-col items-center gap-0.5 transition-colors ${
                    isActive ? 'text-brand-primary' : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>

                {isActive && !shouldReduceMotion && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute bottom-1 w-8 h-1 bg-brand-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
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
