import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { GoogleButton } from './GoogleButton';
import { signUpSchema, type SignUpInput } from '../../lib/validation/auth';
import { supabase } from '../../lib/supabase';
import { AlertCircle, MailCheck, ArrowLeft } from 'lucide-react';

export const SignUpScreen: React.FC = () => {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpInput) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/complete-profile`,
        },
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      setRegisteredEmail(data.email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-[390px] bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <MailCheck className="w-8 h-8" />
          </div>

          <h1 className="text-xl font-bold text-content-primary mb-2">Check Your Email</h1>
          <p className="text-xs text-content-muted leading-relaxed mb-6">
            We sent a verification link to{' '}
            <span className="font-semibold text-content-primary">{registeredEmail}</span>. Please click the link in your email to confirm your account and get started.
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-content-muted text-left mb-6">
            💡 <strong className="text-content-primary">Tip:</strong> If you don't see it in a few minutes, check your spam or junk folder.
          </div>

          <Link to="/auth/signin">
            <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[390px] bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-content-primary">Create Your Account</h1>
          <p className="text-xs text-content-muted mt-1">
            Join KGP Marketplace with your institute email
          </p>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Institute Email"
            placeholder="roll@kgpian.iitkgp.ac.in"
            type="email"
            autoComplete="email"
            helperText="Must end with @kgpian.iitkgp.ac.in"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            placeholder="Min 8 chars (letters & numbers)"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            placeholder="Repeat password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border" />
          </div>
          <span className="relative bg-surface-card px-3 text-xs text-content-muted">OR</span>
        </div>

        <GoogleButton />

        <p className="text-center text-xs text-content-muted mt-6">
          Already have an account?{' '}
          <Link to="/auth/signin" className="text-brand-primary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
