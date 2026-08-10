import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { Spinner } from '../../components/ui/Spinner';
import { fetchListingById, updateListing, type ListingItem } from '../../lib/data/listings';
import { listingSchema, type ListingFormInput } from '../../lib/validation/listing';
import { CATEGORIES, CONDITIONS } from '../../lib/constants';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../auth/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { PhotoUploader, type PhotoItem } from './PhotoUploader';
import { getPhotoPublicUrl } from '../../lib/utils/image';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const EditListingScreen: React.FC = () => {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const { showToast } = useToast();
 const { session } = useAuth();
 const queryClient = useQueryClient();

 const [listing, setListing] = useState<ListingItem | null>(null);
 const [photos, setPhotos] = useState<PhotoItem[]>([]);
 const [isLoading, setLoading] = useState<boolean>(true);
 const [formError, setFormError] = useState<string | null>(null);
 const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

 const {
 register,
 handleSubmit,
 reset,
 setValue,
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
 const initialPhotos: PhotoItem[] = (item.photoPaths || []).map((p, idx) => ({
 id: `existing_${idx}_${Date.now()}`,
 previewUrl: getPhotoPublicUrl(p, item.category),
 storagePath: p,
 progress: 100,
 }));
 setPhotos(initialPhotos);
 reset({
 title: item.title,
 description: item.description || '',
 category: item.category as import('../../lib/database.types').ListingCategory,
 price: item.price,
 isNegotiable: item.isNegotiable,
 condition: item.condition as import('../../lib/database.types').ItemCondition,
 hallOfResidence: (item.hallOfResidence as ListingFormInput['hallOfResidence']) || 'Patel',
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

 const uploadedPaths = photos
 .map((p) => p.storagePath)
 .filter((path): path is string => !!path);

 try {
 await updateListing(id, {
 title: data.title,
 description: data.description || undefined,
 category: data.category as import('../../lib/database.types').ListingCategory,
 price: data.price,
 isNegotiable: data.isNegotiable,
 condition: data.condition as import('../../lib/database.types').ItemCondition,
 photoPaths: uploadedPaths,
 });

 await queryClient.invalidateQueries({ queryKey: ['listings'] });
 await queryClient.invalidateQueries({ queryKey: ['myListings'] });

 showToast('Listing updated successfully', 'success');
 navigate(`/listing/${id}`);
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Update failed';
 setFormError(msg);
 } finally {
 setIsSubmitting(false);
 }
 };

 if (isLoading) {
 return (
 <div className="min-h-[60vh] flex items-center justify-center">
 <Spinner size={32} />
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-bg flex flex-col items-center px-4 py-8 pb-32">
 <div className="w-full max-w-[390px] bg-surface border border-line rounded-2xl p-6 shadow-hard text-left relative">
 <button
 onClick={() => navigate(-1)}
 className="flex items-center gap-1 text-xs font-semibold text-subtle hover:text-ink mb-4"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Back</span>
 </button>

 <h1 className="text-xl font-bold text-ink mb-1">Edit Listing</h1>
 <p className="text-xs text-subtle mb-6">Update details for "{listing?.title}"</p>

 {formError && (
 <div className="mb-4 p-3 rounded-xl bg-danger-wash border border-danger/20 text-danger text-xs flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <span>{formError}</span>
 </div>
 )}

 <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
 <div>
 <SectionLabel className="mb-3">Item Details</SectionLabel>
 <div className="flex flex-col gap-4">
 <Input label="Title" disabled={isSubmitting} error={errors.title?.message} {...register('title')} />

 <Select
 label="Category"
 disabled={isSubmitting}
 options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
 error={errors.category?.message}
 {...register('category')}
 />

 <Textarea
 label="Description"
 disabled={isSubmitting}
 error={errors.description?.message}
 {...register('description')}
 />
 </div>
 </div>

 <div>
 <SectionLabel className="mb-3">Price & Condition</SectionLabel>
 <div className="flex flex-col gap-4">
 <Input
 label="Price (₹)"
 type="number"
 disabled={isSubmitting}
 error={errors.price?.message}
 {...register('price', { valueAsNumber: true })}
 />

 <div className="flex items-center gap-2 px-1">
 <input
 type="checkbox"
 id="editIsNegotiable"
 disabled={isSubmitting}
 className="w-4 h-4 rounded border-line text-accent focus:ring-accent/20"
 {...register('isNegotiable')}
 />
 <label htmlFor="editIsNegotiable" className="text-sm font-medium text-ink cursor-pointer">
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
 </div>
 </div>

 <div>
 <SectionLabel className="mb-3">Photos</SectionLabel>
 <PhotoUploader
 userId={session?.user?.id || listing?.userId || 'temp'}
 listingId={id || 'edit'}
 photos={photos}
 onChange={(updated) => {
 setPhotos(updated);
 setValue(
 'photoPaths',
 updated.map((p) => p.storagePath).filter((p): p is string => !!p)
 );
 }}
 />
 </div>

 <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-surface/95  border-t border-line md:static md:mx-0 md:mb-0 md:p-0 md:bg-transparent md:border-0 md: z-20 mt-4 rounded-b-2xl md:rounded-none">
 <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
 Save Changes
 </Button>
 </div>
 </form>
 </div>
 </div>
 );
};
