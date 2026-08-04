import React from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '../../components/ui/Button';
import { ShieldAlert } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const BannedScreen: React.FC = () => {
  const { profile, signOut } = useAuth();

  return (
    <AuthLayout
      title="Account Suspended"
      subtitle="Your KGP Marketplace account has been suspended by an administrator for violating campus trading policies."
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-danger">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {profile?.bannedReason && (
          <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-line text-left text-xs">
            <span className="font-semibold text-ink block mb-1">Reason for suspension:</span>
            <span className="text-ink-3">{profile.bannedReason}</span>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={() => signOut()}>
          Sign Out
        </Button>
      </div>
    </AuthLayout>
  );
};
