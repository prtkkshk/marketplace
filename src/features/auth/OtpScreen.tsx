import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { otpSchema, type OtpInput } from '../../lib/validation/auth';
import { supabase } from '../../lib/supabase';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const OtpScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email || '';

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Resend cooldown & rate limit state
  const [cooldown, setCooldown] = useState<number>(60);
  const [resendCount, setResendCount] = useState<number>(0);
  const maxResends = 3;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (data: OtpInput) => {
    if (!email) {
      setFormError('Email address is missing. Please return to signup.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: data.otp,
        type: 'signup',
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      setSuccessMsg('Email verified successfully!');
      setTimeout(() => {
        navigate('/complete-profile');
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    if (resendCount >= maxResends) {
      setFormError('Maximum 3 resend attempts reached per 15 minutes. Please try again later.');
      return;
    }

    setFormError(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      setResendCount((prev) => prev + 1);
      setCooldown(60);
      setSuccessMsg('A new OTP has been sent to your email.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resend failed';
      setFormError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[390px] bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-content-primary">Verify Your Email</h1>
          <p className="text-xs text-content-muted mt-1">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-content-primary">{email || 'your email'}</span>
          </p>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="6-Digit OTP Code"
            placeholder="123456"
            maxLength={6}
            autoFocus
            error={errors.otp?.message}
            {...register('otp')}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
            Verify Code
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={cooldown > 0 || resendCount >= maxResends}
            onClick={handleResendOtp}
            className="text-xs font-semibold text-brand-primary hover:underline disabled:text-content-muted disabled:no-underline"
          >
            {cooldown > 0
              ? `Resend OTP in ${cooldown}s`
              : resendCount >= maxResends
              ? 'Max resends reached'
              : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};
