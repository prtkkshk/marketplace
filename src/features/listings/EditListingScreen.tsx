import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { fetchListingById, updateListing, type ListingItem } from '../../lib/data/listings';
import { listingSchema, type ListingFormInput } from '../../lib/validation/listing';
import { CATEGORIES, CONDITIONS } from '../../lib/constants';
import { useToast } from '../../components/ui/Toast';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const EditListingScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [listing, setListing] = useState<ListingItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ListingFormInput>({
    mode: 'onBlur',
    resolver: zodResolver(listingSchema),
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchListingById(id)
      .then((item) => {
        if (item) {
          setListing(item);
          reset({
            title: item.title,
            description: item.description || '',
            category: item.category as any,
            price: item.price,
            isNegotiable: item.isNegotiable,
            condition: item.condition as any,
            hallOfResidence: item.hallOfResidence as any,
            photoPaths: item.photoPaths,
          });
        }
      })
      .catch((err) => setFormError(err.message))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data: ListingFormInput) => {
    if (!id) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      await updateListing(id, {
        title: data.title,
        description: data.description || undefined,
        category: data.category as any,
        price: data.price,
        isNegotiable: data.isNegotiable,
        condition: data.condition as any,
      });

      showToast('Listing updated successfully', 'success');
      navigate(`/listing/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

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

        <h1 className="text-xl font-bold text-content-primary mb-1">Edit Listing</h1>
        <p className="text-xs text-content-muted mb-6">Update details for "{listing?.title}"</p>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Title" disabled={isSubmitting} error={errors.title?.message} {...register('title')} />

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
            disabled={isSubmitting}
            error={errors.price?.message}
            {...register('price', { valueAsNumber: true })}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsNegotiable"
              disabled={isSubmitting}
              className="w-4 h-4 rounded text-brand-primary focus:ring-brand-light"
              {...register('isNegotiable')}
            />
            <label htmlFor="editIsNegotiable" className="text-sm font-medium text-content-primary cursor-pointer">
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
            label="Description"
            disabled={isSubmitting}
            error={errors.description?.message}
            {...register('description')}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
};
