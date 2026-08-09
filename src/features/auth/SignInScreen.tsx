import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { GoogleButton } from './GoogleButton';
import { signInSchema, type SignInInput } from '../../lib/validation/auth';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthProvider';
import { AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const SignInScreen: React.FC = () => {
 const navigate = useNavigate();
 const { domainError, clearDomainError } = useAuth();
 const [searchParams] = useSearchParams();
 const isExpired = searchParams.get('expired') === '1';
 const [formError, setFormError] = useState<string | null>(null);
 const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

 const {
 register,
 handleSubmit,
 formState: { errors },
 } = useForm<SignInInput>({
 resolver: zodResolver(signInSchema),
 defaultValues: {
 email: '',
 password: '',
 },
 });

 const onSubmit = async (data: SignInInput) => {
 setIsSubmitting(true);
 setFormError(null);
 clearDomainError();

 try {
 const { error } = await supabase.auth.signInWithPassword({
 email: data.email,
 password: data.password,
 });

 if (error) {
 setFormError(error.message);
 return;
 }

 navigate('/');
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Sign in failed';
 setFormError(msg);
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <AuthLayout 
 title="Sign In" 
 subtitle="Exclusively for IIT Kharagpur students (@kgpian.iitkgp.ac.in)"
 >

 {isExpired && !domainError && !formError && (
          <div className="mb-4 p-3 rounded-xl bg-danger-wash border border-danger/20 text-danger text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Your session has expired. Please sign in again.</p>
          </div>
        )}

 {(domainError || formError) && (
 <div className="mb-4 p-3 rounded-xl bg-danger-wash border border-danger/20 text-danger text-xs flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <span>{domainError || formError}</span>
 </div>
 )}

 <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
 <Input
 label="Institute Email"
 placeholder="roll@kgpian.iitkgp.ac.in"
 type="email"
 autoComplete="email"
 error={errors.email?.message}
 {...register('email')}
 />

 <div className="flex flex-col gap-1 text-left">
 <Input
 label="Password"
 placeholder="••••••••"
 type="password"
 autoComplete="current-password"
 error={errors.password?.message}
 {...register('password')}
 />
 <div className="text-right mt-1">
 <Link
 to="/auth/forgot-password"
 className="text-xs text-accent font-medium hover:underline"
 >
 Forgot Password?
 </Link>
 </div>
 </div>

 <Button type="submit" variant="primary" className="w-full mt-2" loading={isSubmitting}>
 Sign In
 </Button>
 </form>

 <div className="relative my-6 text-center">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-line" />
 </div>
 <span className="relative bg-surface px-3 text-xs text-subtle">OR</span>
 </div>

 <GoogleButton />

 <p className="text-center text-sm text-subtle mt-6">
 Don't have an account?{' '}
 <Link to="/auth/signup" className="text-accent font-semibold hover:underline">
 Sign Up
 </Link>
 </p>
 </AuthLayout>
 );
};
