import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { AlertCircle, CheckCircle2, MailCheck, ArrowLeft } from 'lucide-react';

export const OtpScreen: React.FC = () => {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<boolean>(false);

  const handleResendLink = async () => {
    if (!email) {
      setFormError('Email address is missing. Please return to sign up.');
      return;
    }

    setIsResending(true);
    setFormError(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/complete-profile`,
        },
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      setSuccessMsg('A new confirmation link has been sent to your email.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resend failed';
      setFormError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[390px] bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
          <MailCheck className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-content-primary mb-2">Check Your Email</h1>
        <p className="text-xs text-content-muted mt-1 leading-relaxed mb-6">
          We sent a magic confirmation link to{' '}
          <span className="font-semibold text-content-primary">{email || 'your institute email'}</span>. Please click the link to confirm your account and log in.
        </p>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-xs flex items-start gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {email && (
          <Button
            type="button"
            variant="outline"
            className="w-full mb-3"
            isLoading={isResending}
            onClick={handleResendLink}
          >
            Resend Confirmation Link
          </Button>
        )}

        <Link to="/auth/signin">
          <Button variant="ghost" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
};
