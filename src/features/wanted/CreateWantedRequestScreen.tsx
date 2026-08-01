import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { wantedRequestSchema, type WantedRequestFormInput } from '../../lib/validation/wanted';
import { createWantedRequest } from '../../lib/data/wantedRequests';
import { useAuth } from '../auth/AuthProvider';
import { CATEGORIES } from '../../lib/constants';
import { useToast } from '../../components/ui/Toast';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const CreateWantedRequestScreen: React.FC = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WantedRequestFormInput>({
    mode: 'onBlur',
    resolver: zodResolver(wantedRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'cycles',
      maxBudget: null,
      hallOfResidence: profile?.hallOfResidence || 'Patel',
    },
  });

  const onSubmit = async (data: WantedRequestFormInput) => {
    if (!session?.user?.id) {
      setFormError('You must be signed in to post a wanted request.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await createWantedRequest(session.user.id, {
        title: data.title,
        description: data.description || undefined,
        category: data.category as any,
        maxBudget: data.maxBudget || undefined,
        hallOfResidence: profile?.hallOfResidence || 'Patel',
      });

      confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      showToast('Wanted request posted successfully!', 'success');
      navigate('/wanted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post request';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center items-center px-4 py-8 pb-24">
      <div className="w-full max-w-[390px] bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm text-left">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs font-semibold text-content-muted hover:text-content-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h1 className="text-xl font-bold text-content-primary mb-1">Post a Wanted Request</h1>
        <p className="text-xs text-content-muted mb-6">Let fellow KGPians know what you are looking for</p>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="What are you looking for?"
            placeholder="e.g. Electric Kettle or Engineering Drawing Kit"
            disabled={isSubmitting}
            error={errors.title?.message}
            {...register('title')}
          />

          <Select
            label="Category"
            disabled={isSubmitting}
            options={CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.label}` }))}
            error={errors.category?.message}
            {...register('category')}
          />

          <Input
            label="Max Budget (₹) (Optional)"
            type="number"
            placeholder="Leave blank for open budget"
            disabled={isSubmitting}
            error={errors.maxBudget?.message}
            {...register('maxBudget', { valueAsNumber: true })}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Specify edition, condition preference, urgency, or details..."
            disabled={isSubmitting}
            error={errors.description?.message}
            {...register('description')}
          />

          <Input
            label="Your Hall of Residence"
            value={`${profile?.hallOfResidence || 'Patel'} Hall`}
            readOnly
            disabled
            helperText="Auto-filled from your verified profile"
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
            Post Request
          </Button>
        </form>
      </div>
    </div>
  );
};
