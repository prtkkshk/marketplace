import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { Home, Megaphone, PlusCircle, User, Shield } from 'lucide-react';

export const DesktopHeader: React.FC = () => {
  const { isAdmin, profile } = useAuth();

  const navItems = [
    { path: '/', label: 'For Sale Feed', icon: Home },
    { path: '/wanted', label: 'Wanted Board', icon: Megaphone },
    { path: '/new', label: 'Post Item / Request', icon: PlusCircle },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-surface-border shadow-xs">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-brand-primary font-bold text-lg hover:opacity-90 transition-opacity">
          <span className="text-2xl">🚲</span>
          <span>KGP Marketplace</span>
        </Link>

        {/* Navigation destinations */}
        <nav className="flex items-center gap-1" aria-label="Desktop main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-wash text-brand-primary font-semibold'
                      : 'text-content-muted hover:text-content-primary hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-100 text-brand-primary font-semibold'
                    : 'text-brand-primary hover:bg-brand-wash'
                }`
              }
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        {/* User Badge */}
        {profile && (
          <div className="flex items-center gap-2 border-l border-surface-border pl-4">
            <div className="w-8 h-8 rounded-full bg-brand-wash text-brand-primary font-bold text-xs flex items-center justify-center">
              {profile.fullName ? profile.fullName[0]?.toUpperCase() : 'U'}
            </div>
            <div className="text-left text-xs">
              <span className="font-semibold text-content-primary block leading-tight">{profile.fullName}</span>
              <span className="text-content-muted text-[10px]">{profile.hallOfResidence} Hall</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
