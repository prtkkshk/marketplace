import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { wantedRequestSchema, type WantedRequestFormInput } from '../../lib/validation/wanted';
import { createWantedRequest } from '../../lib/data/wantedRequests';
import { useAuth } from '../auth/AuthProvider';
import { CATEGORIES } from '../../lib/constants';
import { useToast } from '../../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { analytics } from '../../lib/analytics';

export const CreateWantedRequestScreen: React.FC = () => {
 const { session, profile } = useAuth();
 const navigate = useNavigate();
 const { showToast } = useToast();
 const queryClient = useQueryClient();

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
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 hallOfResidence: (profile?.hallOfResidence as any) || 'Patel',
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
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 category: data.category as any,
 maxBudget: data.maxBudget || undefined,
 hallOfResidence: profile?.hallOfResidence || 'Patel',
 });

 confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
 await queryClient.invalidateQueries({ queryKey: ['wantedRequests'] });
 
 analytics.track('wanted_request_created', {
 category: data.category,
 hasBudget: !!data.maxBudget,
 });

 showToast('Wanted request posted successfully!', 'success');
 navigate('/wanted');
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 } catch (err: any) {
 const msg = err instanceof Error ? err.message : 'Failed to post request';
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
 onClick={() => navigate('/new')}
 className="flex-1 py-1.5 text-xs font-semibold rounded-lg text-subtle hover:text-ink transition-colors text-center"
 >
 Sell an Item
 </button>
 <button
 type="button"
 className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-surface text-accent shadow-1 text-center border border-line"
 >
 Wanted Request
 </button>
 </div>

 <h1 className="text-xl font-bold text-ink mb-1">Post a Wanted Request</h1>
 <p className="text-xs text-subtle mb-6">Let fellow KGPians know what you are looking for</p>

 {formError && (
 <div className="mb-4 p-3 rounded-xl bg-danger-wash border border-danger/20 text-danger text-xs flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <span>{formError}</span>
 </div>
 )}

 <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
 <div>
 <SectionLabel className="mb-3">Request Details</SectionLabel>
 <div className="flex flex-col gap-4">
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
 </div>
 </div>

 <div>
 <SectionLabel className="mb-3">Budget & Details</SectionLabel>
 <div className="flex flex-col gap-4">
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
 </div>
 </div>

 <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-surface/95  border-t border-line md:static md:mx-0 md:mb-0 md:p-0 md:bg-transparent md:border-0 md: z-20 mt-4 rounded-b-2xl md:rounded-none">
 <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
 Post Request
 </Button>
 </div>
 </form>
 </div>
 </div>
 );
};
