import React, { useState, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { PhotoUploader, type PhotoItem } from './PhotoUploader';
import { listingSchema, type ListingFormInput } from '../../lib/validation/listing';
import { createListing } from '../../lib/data/listings';
import { useAuth } from '../auth/AuthProvider';
import { CATEGORIES, CONDITIONS } from '../../lib/constants';
import { useToast } from '../../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { analytics } from '../../lib/analytics';

export const CreateListingScreen: React.FC = () => {
 const { session, profile } = useAuth();
 const navigate = useNavigate();
 const { showToast } = useToast();
 const queryClient = useQueryClient();
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
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 hallOfResidence: (profile?.hallOfResidence as any) || 'Patel',
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
 const isUploading = photos.some((p) => p.progress < 100 && !p.error);
 const hasErrors = photos.some((p) => !!p.error);

 if (isUploading) {
 setFormError('Please wait for your photos to finish uploading before submitting.');
 } else if (hasErrors) {
 setFormError('Photo upload failed. Please tap "Retry" on the failed photo thumbnail.');
 } else {
 setFormError('Please upload at least 1 photo of your item.');
 }
 return;
 }

 setIsSubmitting(true);
 setFormError(null);

 try {
 const newListing = await createListing(session.user.id, {
 title: data.title,
 description: data.description || undefined,
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 category: data.category as any,
 price: data.price,
 isNegotiable: data.isNegotiable,
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

 await queryClient.invalidateQueries({ queryKey: ['listings'] });
 await queryClient.invalidateQueries({ queryKey: ['myListings'] });

 analytics.track('listing_created', {
 category: data.category,
 price: data.price,
 isNegotiable: data.isNegotiable,
 condition: data.condition,
 photoCount: uploadedPaths.length,
 });

 showToast('Listing posted successfully!', 'success');
 navigate(`/listing/${newListing.id}`);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 } catch (err: any) {
 const msg = err instanceof Error ? err.message : 'Failed to post listing';
 setFormError(msg);
 } finally {
 setIsSubmitting(false);
 }
 };

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

 {/* Post Type Toggle */}
 <div className="flex bg-surface-2 p-1 rounded-xl mb-6 border border-line">
 <button
 type="button"
 className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-surface text-accent shadow-1 text-center border border-line"
 >
 Sell an Item
 </button>
 <button
 type="button"
 onClick={() => navigate('/new-request')}
 className="flex-1 py-1.5 text-xs font-semibold rounded-lg text-subtle hover:text-ink transition-colors text-center"
 >
 Wanted Request
 </button>
 </div>

 <h1 className="text-xl font-bold text-ink mb-1">Sell an Item</h1>
 <p className="text-xs text-subtle mb-6">Post a second-hand item for IIT Kharagpur campus</p>

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

 <Textarea
 label="Description (Optional)"
 placeholder="Mention specs, age, defects, or reason for selling..."
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
 placeholder="0"
 disabled={isSubmitting}
 error={errors.price?.message}
 {...register('price', { valueAsNumber: true })}
 />

 <div className="flex items-center gap-2 px-1">
 <input
 type="checkbox"
 id="isNegotiable"
 disabled={isSubmitting}
 className="w-4 h-4 rounded border-line text-accent focus:ring-accent/20"
 {...register('isNegotiable')}
 />
 <label htmlFor="isNegotiable" className="text-sm font-medium text-ink cursor-pointer">
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
 </div>

 <div className="text-[11px] text-subtle text-center -mb-2 mt-2">
 By posting, you agree to the{' '}
 <a href="/rules" target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline">
 Campus Trading Rules (§11)
 </a>.
 </div>

 <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-surface/95  border-t border-line md:static md:mx-0 md:mb-0 md:p-0 md:bg-transparent md:border-0 md: z-20 mt-4 rounded-b-2xl md:rounded-none">
 <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
 Post Listing
 </Button>
 </div>
 </form>
 </div>
 </div>
 );
};
