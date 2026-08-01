import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { Home, PlusCircle, User, Shield } from 'lucide-react';
import { PostChooserSheet } from './PostChooserSheet';

export const DesktopHeader: React.FC = () => {
  const { isAdmin, profile } = useAuth();
  const location = useLocation();
  const [isChooserOpen, setIsChooserOpen] = useState<boolean>(false);

  const isHomeActive = location.pathname === '/' || location.pathname === '/wanted';
  const isPostActive = location.pathname === '/new' || location.pathname === '/new-request';
  const isProfileActive = location.pathname.startsWith('/profile');

  return (
    <>
      <header className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-surface-border shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 text-brand-primary font-bold text-lg hover:opacity-90 transition-opacity">
            <span className="text-2xl">🚲</span>
            <span>KGP Marketplace</span>
          </Link>

          {/* Navigation destinations */}
          <nav className="flex items-center gap-1" aria-label="Desktop main navigation">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                isHomeActive
                  ? 'bg-brand-wash text-brand-primary font-semibold'
                  : 'text-content-muted hover:text-content-primary hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsChooserOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                isPostActive
                  ? 'bg-brand-wash text-brand-primary font-semibold'
                  : 'text-content-muted hover:text-content-primary hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Item / Request</span>
            </button>

            <Link
              to="/profile"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                isProfileActive
                  ? 'bg-brand-wash text-brand-primary font-semibold'
                  : 'text-content-muted hover:text-content-primary hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>

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

      <PostChooserSheet isOpen={isChooserOpen} onClose={() => setIsChooserOpen(false)} />
    </>
  );
};
