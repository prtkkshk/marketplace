import React, { useState, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { PhotoUploader, type PhotoItem } from './PhotoUploader';
import { listingSchema, type ListingFormInput } from '../../lib/validation/listing';
import { createListing } from '../../lib/data/listings';
import { useAuth } from '../auth/AuthProvider';
import { CATEGORIES, CONDITIONS } from '../../lib/constants';
import { useToast } from '../../components/ui/Toast';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const CreateListingScreen: React.FC = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const generatedListingId = useId().replace(/:/g, '') + Date.now().toString(36);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ListingFormInput>({
    mode: 'onBlur',
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'cycles',
      price: 0,
      isNegotiable: false,
      condition: 'good',
      hallOfResidence: profile?.hallOfResidence || 'Patel',
      photoPaths: [],
    },
  });

  const onSubmit = async (data: ListingFormInput) => {
    if (!session?.user?.id) {
      setFormError('You must be signed in to post a listing.');
      return;
    }

    const uploadedPaths = photos
      .map((p) => p.storagePath)
      .filter((path): path is string => !!path);

    if (uploadedPaths.length === 0) {
      setFormError('Please upload at least 1 photo of your item.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const newListing = await createListing(session.user.id, {
        title: data.title,
        description: data.description || undefined,
        category: data.category as any,
        price: data.price,
        isNegotiable: data.isNegotiable,
        condition: data.condition as any,
        photoPaths: uploadedPaths,
        hallOfResidence: profile?.hallOfResidence || 'Patel',
      });

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      showToast('Listing posted successfully!', 'success');
      navigate(`/listing/${newListing.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post listing';
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

        <h1 className="text-xl font-bold text-content-primary mb-1">Sell an Item</h1>
        <p className="text-xs text-content-muted mb-6">Post a second-hand item for IIT Kharagpur campus</p>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Title"
            placeholder="e.g. Hero Hawk 21-Speed Cycle"
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
            label="Price (₹)"
            type="number"
            placeholder="0"
            disabled={isSubmitting}
            error={errors.price?.message}
            {...register('price', { valueAsNumber: true })}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isNegotiable"
              disabled={isSubmitting}
              className="w-4 h-4 rounded text-brand-primary focus:ring-brand-light"
              {...register('isNegotiable')}
            />
            <label htmlFor="isNegotiable" className="text-sm font-medium text-content-primary cursor-pointer">
              Price is Negotiable
            </label>
          </div>

          <Select
            label="Condition"
            disabled={isSubmitting}
            options={CONDITIONS.map((c) => ({ value: c.id, label: c.label }))}
            error={errors.condition?.message}
            {...register('condition')}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Mention specs, age, defects, or reason for selling..."
            disabled={isSubmitting}
            error={errors.description?.message}
            {...register('description')}
          />

          <Input
            label="Hall of Residence"
            value={`${profile?.hallOfResidence || 'Patel'} Hall`}
            readOnly
            disabled
            helperText="Auto-filled from your verified profile"
          />

          <PhotoUploader
            userId={session?.user?.id || 'temp'}
            listingId={generatedListingId}
            photos={photos}
            onChange={(updated) => {
              setPhotos(updated);
              setValue(
                'photoPaths',
                updated.map((p) => p.storagePath).filter((p): p is string => !!p)
              );
            }}
          />

          <div className="text-[11px] text-content-muted text-center my-1">
            By posting, you agree to the{' '}
            <a href="/rules" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-semibold hover:underline">
              Campus Trading Rules (§11)
            </a>.
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
            Post Listing
          </Button>
        </form>
      </div>
    </div>
  );
};
