import React from 'react';
import { useAuth } from '../features/auth/AuthProvider';
import { Link } from 'react-router-dom';

export const FeedPlaceholder: React.FC = () => {
  const { profile, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-brand-wash flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🛍️</span>
        </div>
        <h1 className="text-xl font-bold text-content-primary mb-1">Campus Feed</h1>
        <p className="text-xs text-content-muted mb-4">
          Welcome back, <span className="font-semibold text-content-primary">{profile?.fullName}</span> ({profile?.hallOfResidence} Hall)
        </p>

        <div className="flex flex-col gap-2">
          <Link
            to="/profile"
            className="w-full py-2.5 px-4 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-sky-700 transition-colors inline-block"
          >
            My Profile & Settings
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="w-full py-2.5 px-4 rounded-xl border border-brand-primary text-brand-primary text-sm font-medium hover:bg-brand-wash transition-colors inline-block"
            >
              Admin Moderation Panel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
