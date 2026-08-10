import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { GoogleButton } from './GoogleButton';
import { signUpSchema, type SignUpInput } from '../../lib/validation/auth';
import { supabase } from '../../lib/supabase';
import { AlertCircle, MailCheck} from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const SignUpScreen: React.FC = () => {
 const [formError, setFormError] = useState<string | null>(null);
 const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
 const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

 const {
 register,
 handleSubmit,
 formState: { errors }} = useForm<SignUpInput>({
 resolver: zodResolver(signUpSchema),
 defaultValues: {
 email: '',
 password: '',
 confirmPassword: ''}});

 const onSubmit = async (data: SignUpInput) => {
 setIsSubmitting(true);
 setFormError(null);

 try {
 const { error } = await supabase.auth.signUp({
 email: data.email,
 password: data.password,
 options: {
 emailRedirectTo: `${window.location.origin}/complete-profile`}});

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
 <AuthLayout 
 title="Check Your Email"
 subtitle={`We sent a verification link to ${registeredEmail}. Please click the link in your email to confirm your account and get started.`}
 >
 <div className="flex flex-col items-center text-center">
 <div className="w-14 h-14 bg-accent/20 rounded flex items-center justify-center mb-6 text-accent">
 <MailCheck className="w-8 h-8" />
 </div>

 <div className="p-3 bg-bg border border-line rounded-xl text-xs text-subtle text-left mb-6">
 <strong className="text-ink">Tip:</strong> If you don't see it in a few minutes, check your spam or junk folder.
 </div>

 <Link to="/auth/signin" className="w-full">
 <Button variant="secondary" className="w-full" >
 Return to Sign In
 </Button>
 </Link>
 </div>
 </AuthLayout>
 );
 }

 return (
 <AuthLayout 
 title="Create Your Account"
 subtitle="Join KGP Marketplace with your institute email"
 >

 {formError && (
 <div className="mb-4 p-3 rounded-xl bg-danger-wash border border-danger/20 text-danger text-xs flex items-start gap-2">
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
 hint="Must end with @kgpian.iitkgp.ac.in"
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

 <Button type="submit" variant="primary" className="w-full mt-2" loading={isSubmitting}>
 Create Account
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
 Already have an account?{' '}
 <Link to="/auth/signin" className="text-accent font-semibold hover:underline">
 Sign In
 </Link>
 </p>
 </AuthLayout>
 );
};
