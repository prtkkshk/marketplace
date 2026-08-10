import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GoogleButton } from './GoogleButton';
import { useAuth } from './AuthProvider';
import { AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const SignInScreen: React.FC = () => {
  const { domainError } = useAuth();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === '1';

  return (
    <AuthLayout 
      title="Sign In" 
      subtitle="Sign in with your IIT Kharagpur Google Workspace account"
    >
      {isExpired && !domainError && (
        <div className="mb-6 p-3 rounded-xl bg-danger-wash border border-danger/20 text-danger text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>Your session has expired. Please sign in again.</p>
        </div>
      )}

      {domainError && (
        <div className="mb-6 p-3 rounded-xl bg-danger-wash border border-danger/20 text-danger text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{domainError}</span>
        </div>
      )}

      <GoogleButton />

      <p className="text-center text-sm text-subtle mt-8">
        Don't have an account?{' '}
        <Link to="/auth/signup" className="text-accent font-semibold hover:underline">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
};
