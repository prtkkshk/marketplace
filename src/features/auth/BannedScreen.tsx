import React from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '../../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export const BannedScreen: React.FC = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[390px] bg-surface-card border border-rose-200 rounded-2xl p-6 shadow-sm text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-status-danger">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-content-primary mb-2">Account Suspended</h1>
        <p className="text-sm text-content-muted mb-4">
          Your KGP Marketplace account has been suspended by an administrator for violating campus trading policies.
        </p>

        {profile?.bannedReason && (
          <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-surface-border text-left text-xs">
            <span className="font-semibold text-content-primary block mb-1">Reason for suspension:</span>
            <span className="text-content-muted">{profile.bannedReason}</span>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={() => signOut()}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};
