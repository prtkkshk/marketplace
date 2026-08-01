import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../../lib/validation/auth';
import { supabase } from '../../lib/supabase';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordScreen: React.FC = () => {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsSubmitting(true);
    setFormError(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      setSuccessMsg('Password reset instructions sent to your email.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[390px] bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-content-primary">Reset Password</h1>
          <p className="text-xs text-content-muted mt-1">
            Enter your @kgpian.iitkgp.ac.in email address
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
            label="Institute Email"
            placeholder="roll@kgpian.iitkgp.ac.in"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
            Send Reset Instructions
          </Button>
        </form>

        <p className="text-center text-xs text-content-muted mt-6">
          Remember your password?{' '}
          <Link to="/auth/signin" className="text-brand-primary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
