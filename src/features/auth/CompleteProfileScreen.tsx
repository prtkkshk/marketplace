import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { profileSchema, type ProfileInput } from '../../lib/validation/profile';
import { completeProfile } from '../../lib/data/profiles';
import { KGP_HALLS } from '../../lib/constants';
import { useAuth } from './AuthProvider';
import { AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const CompleteProfileScreen: React.FC = () => {
  const { session, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const defaultName = session?.user?.user_metadata?.full_name || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: defaultName,
      rollNumber: '',
      hallOfResidence: KGP_HALLS[0],
      whatsappNumber: '',
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    if (!session?.user?.id) {
      setFormError('No active session found. Please sign in again.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await completeProfile(session.user.id, {
        fullName: data.fullName,
        rollNumber: data.rollNumber,
        hallOfResidence: data.hallOfResidence,
        whatsappNumber: data.whatsappNumber,
      });

      await refreshProfile();
      navigate('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Profile completion failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Complete Your Profile"
      subtitle="Required before buying or selling on campus"
    >

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-danger text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            placeholder="e.g. Prateek Sharma"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Roll Number"
            placeholder="e.g. 22CS10045"
            helperText="Format: 2 digits + 2 letters + 5 digits"
            error={errors.rollNumber?.message}
            {...register('rollNumber')}
          />

          <Select
            label="Hall of Residence"
            placeholder="Select your hall"
            options={KGP_HALLS}
            error={errors.hallOfResidence?.message}
            {...register('hallOfResidence')}
          />

          <Input
            label="WhatsApp Number"
            placeholder="10-digit phone number"
            helperText="Used ONLY when contacting or being contacted on WhatsApp"
            error={errors.whatsappNumber?.message}
            {...register('whatsappNumber')}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
            Save Profile & Continue
          </Button>
        </form>
    </AuthLayout>
  );
};
