import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../../lib/validation/auth';
import { supabase } from '../../lib/supabase';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';

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
 <AuthLayout
 title="Reset Password"
 subtitle="Enter your @kgpian.iitkgp.ac.in email address"
 >

 {formError && (
 <div className="mb-4 p-3 rounded-xl bg-danger-wash border border-danger/20 text-danger text-xs flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <span>{formError}</span>
 </div>
 )}

 {successMsg && (
 <div className="mb-4 p-3 rounded-xl bg-success-wash border border-success-wash text-success text-xs flex items-start gap-2">
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

 <Button type="submit" variant="primary" className="w-full mt-2" loading={isSubmitting}>
 Send Reset Instructions
 </Button>
 </form>

 <p className="text-center text-sm text-subtle mt-6">
 Remember your password?{' '}
 <Link to="/auth/signin" className="text-accent font-semibold hover:underline">
 Sign In
 </Link>
 </p>
 </AuthLayout>
 );
};
