import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
 fetchWantedRequestById,
 fetchRequesterContactNumber,
 type WantedRequestItem} from '../../lib/data/wantedRequests';
import { useToggleFulfilledMutation } from '../../lib/hooks/useToggleFulfilledMutation';
import { useDeleteWantedRequestMutation } from '../../lib/hooks/useDeleteWantedRequestMutation';
import { timeAgo } from '../../lib/utils/timeAgo';
import { categoryLabel } from '../../lib/utils/categoryLabel';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { ErrorState } from '../../components/ui/ErrorState';
import { Sheet } from '../../components/ui/Sheet';
import { useAuth } from '../auth/AuthProvider';
import {
 ArrowLeft,
 Flag,
 Trash2} from 'lucide-react';

export const RequestDetailScreen: React.FC = () => {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const { profile, isAdmin } = useAuth();
 const { showToast } = useToast();

 const toggleFulfilledMutation = useToggleFulfilledMutation();
 const deleteRequestMutation = useDeleteWantedRequestMutation();

 const [request, setRequest] = useState<WantedRequestItem | null>(null);
 const [isLoading, setLoading] = useState<boolean>(true);
 const [error, setError] = useState<string | null>(null);
 const [showDeleteSheet, setShowDeleteSheet] = useState<boolean>(false);
 const [isContacting, setIsContacting] = useState<boolean>(false);

 useEffect(() => {
 if (!id) return;
 setLoading(true);
 setError(null);

 fetchWantedRequestById(id)
 .then((res) => setRequest(res))
 .catch((err) => setError(err.message))
 .finally(() => setLoading(false));
 }, [id]);

 if (isLoading) {
 return (
 <div className="min-h-[60vh] flex items-center justify-center">
 <Spinner size={32} />
 </div>
 );
 }

 if (error || !request) {
 return (
 <div className="p-4 max-w-md mx-auto">
 <ErrorState message={error || 'Request not found'} onRetry={() => navigate('/wanted')} />
 </div>
 );
 }

 const isOwner = profile?.id === request.userId || isAdmin;
 const isFulfilled = request.status === 'fulfilled';
 const isExpired = request.status === 'expired';
 const isDisabled = isFulfilled || isExpired;

 const handleRespondTap = async () => {
 if (isDisabled || isContacting) return;
 setIsContacting(true);
 try {
 const result = await fetchRequesterContactNumber(request.id, request.title);
 window.open(result.whatsappDeepLink, '_blank', 'noopener,noreferrer');
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Contact failed';
 showToast(msg, 'error');
 } finally {
 setIsContacting(false);
 }
 };

 const handleToggleFulfilled = () => {
 if (!id || !request) return;
 const previousStatus = request.status;
 setRequest({ ...request, status: isFulfilled ? 'open' : 'fulfilled' });

 toggleFulfilledMutation.mutate(
 { requestId: id, isFulfilled },
 {
 onSuccess: () => showToast(isFulfilled ? 'Request restored to open status' : 'Request marked as fulfilled', 'success'),
 onError: (err) => {
 setRequest({ ...request, status: previousStatus });
 const msg = err instanceof Error ? err.message : 'Action failed';
 showToast(msg, 'error');
 }}
 );
 };

 const handleDelete = () => {
 if (!id) return;
 deleteRequestMutation.mutate(id, {
 onSuccess: () => {
 showToast('Request deleted', 'info');
 navigate('/wanted');
 },
 onError: (err) => {
 const msg = err instanceof Error ? err.message : 'Delete failed';
 showToast(msg, 'error');
 },
 onSettled: () => setShowDeleteSheet(false)});
 };

 const handleShare = async () => {
 if (navigator.share) {
 try {
 await navigator.share({
 title: request.title,
 text: `Can you help? Someone needs ${request.title} on KGP Bazaar`,
 url: window.location.href});
 } catch (err) {
 // User aborted share or share failed silently
 }
 } else {
 navigator.clipboard.writeText(window.location.href);
 showToast('Link copied to clipboard', 'info');
 }
 };

 return (
 <PageContainer className="pb-32 md:pb-12 text-left pt-2 md:pt-4">
 {/* Breadcrumb */}
 <div className="flex items-center gap-2 text-xs font-medium text-subtle mb-6">
 <Link to="/wanted" className="hover:text-ink transition-colors">Wanted Board</Link>
 <span className="text-line-strong">/</span>
 <Link to={`/wanted?cat=${request.category}`} className="hover:text-ink transition-colors">
 {categoryLabel(request.category)}
 </Link>
 </div>

 <div className="md:grid md:grid-cols-[1.25fr_1fr] md:gap-10 items-start relative">
 {/* Left Column (Details) */}
 <div className="flex flex-col min-w-0">
 
 {/* Mobile Back Button Overlay inside conceptually, but for text page, standard button is fine */}
 <button
 onClick={() => navigate(-1)}
 className="md:hidden flex items-center gap-1.5 text-xs font-semibold text-subtle hover:text-ink mb-6"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Back</span>
 </button>

 {/* Description (Desktop: Left Col, Mobile: stacked below specs) */}
 <div className="hidden md:block bg-surface border-l-4 border-accent rounded-r-2xl p-6 shadow-hard">
 <h2 className="text-xs font-bold text-subtle uppercase tracking-wider mb-4">Request Details</h2>
 <p className="text-[16px] text-ink whitespace-pre-line leading-[1.7]">
 {request.description || 'No additional details specified.'}
 </p>
 </div>
 </div>

 {/* Right Column / Mobile Stack */}
 <div className="md:sticky md:top-[88px] flex flex-col gap-6">
 
 {/* Header info */}
 <div>
 <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-2">
 Wanted • {categoryLabel(request.category)}
 </div>
 <h1 className="font-display text-[31px] text-ink leading-[1.1] mb-3">
 {request.title}
 </h1>
 
 <div className="flex items-end gap-3 flex-wrap">
 {request.maxBudget ? (
 <span className="text-display text-ink tabular-nums">
 <span className="text-2xl mr-1">₹</span>
 {request.maxBudget.toLocaleString('en-IN')}
 </span>
 ) : (
 <span className="font-display text-[32px] text-accent leading-none opacity-80">
 Open Budget
 </span>
 )}
 </div>
 </div>

 {/* Specs Grid 2x2 */}
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-5 border-y border-line">
 <div>
 <span className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">Status</span>
 <span className={`text-[14px] font-bold ${isFulfilled ? 'text-subtle' : 'text-accent'}`}>
 {isFulfilled ? 'Fulfilled' : 'Seeking'}
 </span>
 </div>
 <div>
 <span className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">Location</span>
 <span className="text-[14px] font-medium text-ink">{request.requesterHall} Hall</span>
 </div>
 <div>
 <span className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">Posted</span>
 <span className="text-[14px] font-medium text-ink">{timeAgo(request.createdAt)}</span>
 </div>
 </div>

 {/* Description (Mobile only) */}
 <div className="md:hidden pt-2 pb-4">
 <h2 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2">Request Details</h2>
 <p className="text-[15px] text-ink whitespace-pre-line leading-[1.6]">
 {request.description || 'No additional details specified.'}
 </p>
 </div>

 {/* Requester Row */}
 <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-line">
 <div className="w-10 h-10 rounded bg-accent-wash text-accent font-display text-xl flex items-center justify-center shrink-0">
 {(request.requesterName || 'A').charAt(0).toUpperCase()}
 </div>
 <div className="flex-1 min-w-0">
 <span className="text-[10px] uppercase font-bold text-subtle block leading-none mb-1">Requested By</span>
 <span className="text-sm font-bold text-ink truncate block">{request.requesterName || 'Anonymous'}</span>
 </div>
 </div>

 {/* Desktop Buy Box Buttons */}
 <div className="hidden md:flex flex-col gap-3">
 <Button
 variant="primary"
 size="lg"
 disabled={isDisabled}
 loading={isContacting}
 onClick={handleRespondTap}
 
 className="w-full justify-center"
 >
 {isFulfilled ? 'Request Fulfilled' : 'I Have This! (WhatsApp)'}
 </Button>
 
 <div className="flex gap-2">
 <Button
 variant="secondary"
 className="flex-1"
 onClick={handleShare}
 
 >
 Share
 </Button>
 </div>
 </div>

 {/* Admin / Owner Controls */}
 {isOwner && (
 <div className="flex flex-col gap-2 p-4 bg-bg border border-line rounded-xl mt-2">
 <h3 className="text-xs font-bold text-subtle uppercase mb-2">Owner Controls</h3>
 <div className="flex gap-2">
 <Button variant="secondary" size="sm" className="flex-1" onClick={handleToggleFulfilled} loading={toggleFulfilledMutation.isPending}>
 {isFulfilled ? 'Unmark Fulfilled' : 'Mark Fulfilled'}
 </Button>
 </div>
 <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowDeleteSheet(true)}>
 Delete Request
 </Button>
 </div>
 )}

 {/* Quiet Report Link */}
 {!isOwner && (
 <div className="text-center md:text-left mt-2">
 <button 
 onClick={() => showToast('Report submitted for moderator review', 'info')}
 className="text-xs font-medium text-subtle hover:text-danger hover:underline inline-flex items-center gap-1"
 >
 <Flag className="w-3 h-3" /> Report this request
 </button>
 </div>
 )}
 </div>
 </div>

 {/* Mobile Fixed Bottom Bar */}
 {!isOwner && (
 <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95  border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] ">
 <Button
 variant="primary"
 className="w-full h-12 shadow-hard font-bold text-sm"
 disabled={isDisabled}
 loading={isContacting}
 onClick={handleRespondTap}
 
 >
 {isFulfilled ? 'Fulfilled' : 'I Have This! (WhatsApp)'}
 </Button>
 </div>
 )}

 {/* Delete Confirmation Sheet */}
 <Sheet isOpen={showDeleteSheet} onClose={() => setShowDeleteSheet(false)} title="Delete Request">
 <div className="text-center py-4">
 <Trash2 className="w-10 h-10 text-danger mx-auto mb-3" />
 <h3 className="text-base font-bold text-ink mb-2">Are you sure?</h3>
 <p className="text-xs text-subtle mb-6">
 This will remove your request "{request.title}" from the Wanted Board.
 </p>

 <div className="flex gap-3">
 <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteSheet(false)}>
 Cancel
 </Button>
 <Button variant="secondary" className="flex-1" loading={deleteRequestMutation.isPending} onClick={handleDelete}>
 Permanently Delete
 </Button>
 </div>
 </div>
 </Sheet>
 </PageContainer>
 );
};
