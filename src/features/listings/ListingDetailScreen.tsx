import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
 fetchListingById,
 type ListingItem} from '../../lib/data/listings';
import { useToggleSoldMutation } from '../../lib/hooks/useToggleSoldMutation';
import { useDeleteListingMutation } from '../../lib/hooks/useDeleteListingMutation';
import { useToggleSaveMutation } from '../../lib/hooks/useToggleSaveMutation';
import { useQuery } from '@tanstack/react-query';
import { fetchSavedListings } from '../../lib/data/saved_items';
import { fetchContactNumber } from '../../lib/data/contact';
// formatINR removed
import { timeAgo } from '../../lib/utils/timeAgo';
import { getPhotoPublicUrls, getCategoryFallback } from '../../lib/utils/image';
import { categoryLabel } from '../../lib/utils/categoryLabel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { ErrorState } from '../../components/ui/ErrorState';
import { Sheet } from '../../components/ui/Sheet';
import { ReportSheet } from '../../components/ui/ReportSheet';
import { useAuth } from '../auth/AuthProvider';
import { analytics } from '../../lib/analytics';
import { supabase } from '../../lib/supabase';
import {
 ArrowLeft,
 Flag,
 ChevronLeft,
 ChevronRight,
 Trash2} from 'lucide-react';

 export const ListingDetailScreen: React.FC = () => {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const location = useLocation();
 const { profile, isAdmin, session } = useAuth();
 const { showToast } = useToast();

 const toggleSoldMutation = useToggleSoldMutation();
 const deleteListingMutation = useDeleteListingMutation();
 const toggleSaveMutation = useToggleSaveMutation();

 const [listing, setListing] = useState<ListingItem | null>(null);
 const [isLoading, setLoading] = useState<boolean>(true);
 const [error, setError] = useState<string | null>(null);
 const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
 const [showDeleteSheet, setShowDeleteSheet] = useState<boolean>(false);
 const [isContacting, setIsContacting] = useState<boolean>(false);
 const [isReportSheetOpen, setIsReportSheetOpen] = useState<boolean>(false);

 const { data: savedItems = [] } = useQuery({
 queryKey: ['savedItems'],
 queryFn: () => session?.user?.id ? fetchSavedListings(session.user.id) : Promise.resolve([]),
 enabled: !!session?.user?.id});
 const isSaved = listing ? savedItems.some(item => item.id === listing.id) : false;

 useEffect(() => {
 if (!id) return;
 setLoading(true);
 setError(null);

 fetchListingById(id)
 .then((res) => {
 setListing(res);
 if (res) {
 analytics.track('listing_viewed', {
 category: res.category,
 price: res.price});
 supabase.rpc('increment_listing_view', { p_listing_id: id }).then();
 } else {
 setError('Listing not found');
 }
 })
 .catch((err) => setError(err instanceof Error ? err.message : 'Listing not found'))
 .finally(() => setLoading(false));
 }, [id]);

 if (isLoading) {
 return (
 <div className="min-h-[60vh] flex items-center justify-center">
 <Spinner size={32} />
 </div>
 );
 }

 if (error || !listing) {
 return (
 <div className="p-4 max-w-md mx-auto">
 <ErrorState message={error || 'Listing not found'} onRetry={() => navigate('/')} />
 </div>
 );
 }

 const isOwner = profile?.id === listing.userId || isAdmin;
 const isSold = listing.status === 'sold';
 const isExpired = listing.status === 'expired';
 const isDisabled = isSold || isExpired;

 const photoUrls = getPhotoPublicUrls(listing.photoPaths, listing.category);

 const conditionLabels: Record<string, string> = {
 brand_new: 'Brand New',
 like_new: 'Like New',
 good: 'Good',
 fair: 'Fair'};

 const handleToggleSold = () => {
 if (!id || !listing) return;
 const previousStatus = listing.status;
 setListing({ ...listing, status: isSold ? 'active' : 'sold' });

 toggleSoldMutation.mutate(
 { listingId: id, isSold },
 {
 onSuccess: () => showToast(isSold ? 'Listing marked as active' : 'Listing marked as sold', 'success'),
 onError: (err) => {
 setListing({ ...listing, status: previousStatus });
 const msg = err instanceof Error ? err.message : 'Action failed';
 showToast(msg, 'error');
 }}
 );
 };

 const handleDelete = () => {
 if (!id) return;
 deleteListingMutation.mutate(id, {
 onSuccess: () => {
 showToast('Listing deleted successfully', 'info');
 navigate('/', { replace: true });
 },
 onError: (err) => {
 const msg = err instanceof Error ? err.message : 'Delete failed';
 showToast(msg, 'error');
 },
 onSettled: () => setShowDeleteSheet(false)});
 };

 const handleToggleSave = () => {
 if (!session?.user?.id || !listing) {
 navigate('/auth/signin', { state: { from: location } });
 return;
 }
 const previousState = isSaved;

 toggleSaveMutation.mutate(
 { userId: session.user.id, listingId: listing.id, previousState, listing },
 {
 onSuccess: () => showToast(!previousState ? 'Saved to bookmarks' : 'Removed from bookmarks', 'info'),
 onError: (err) => {
 const msg = err instanceof Error ? err.message : 'Save toggle failed';
 showToast(msg, 'error');
 }}
 );
 };

 const handleContactTap = async () => {
 if (isDisabled || isContacting) return;
 setIsContacting(true);
 analytics.track('contact_click', {
 category: listing.category,
 price: listing.price});
 try {
 const result = await fetchContactNumber(listing.id, listing.title, listing.price);
 window.open(result.whatsappDeepLink, '_blank', 'noopener,noreferrer');
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Contact failed';
 showToast(msg, 'error');
 } finally {
 setIsContacting(false);
 }
 };

 const handleShare = async () => {
 if (navigator.share) {
 try {
 await navigator.share({
 title: listing.title,
 text: `Check out this ${listing.title} on KGP Bazaar`,
 url: window.location.href});
 } catch (err) {
 // user aborted or failed
 }
 } else {
 navigator.clipboard.writeText(window.location.href);
 showToast('Link copied to clipboard', 'info');
 }
 };

 return (
 <PageContainer className="pb-32 md:pb-12 text-left pt-2 md:pt-4">
 {/* Breadcrumb (Desktop & Mobile) */}
 <div className="flex items-center gap-2 text-xs font-medium text-subtle mb-4">
 <Link to="/" className="hover:text-ink transition-colors">Browse</Link>
 <span className="text-line-strong">/</span>
 <Link to={`/?cat=${listing.category}`} className="hover:text-ink transition-colors">
 {categoryLabel(listing.category)}
 </Link>
 <span className="text-line-strong hidden sm:inline">/</span>
 <span className="text-ink hidden sm:inline line-clamp-1">{listing.title}</span>
 </div>

 <div className="md:grid md:grid-cols-[1.25fr_1fr] md:gap-10 items-start relative">
 {/* Mobile-only Header Info */}
 <div className="md:hidden mb-4 mt-2">
 <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1">
 {categoryLabel(listing.category)}
 </div>
 <div className="flex items-center gap-3 flex-wrap mb-2">
 <span className="text-display text-ink tabular-nums">
 ₹{listing.price.toLocaleString('en-IN')}
 </span>
 <Badge variant={listing.isNegotiable ? 'success' : 'default'} className={listing.isNegotiable ? '-rotate-2' : ''}>
 {listing.isNegotiable ? 'Negotiable' : 'Fixed Price'}
 </Badge>
 </div>
 <h1 className="text-display font-bold text-ink leading-[1.15] mb-2 tabular-nums">
 {listing.title}
 </h1>
 </div>

 {/* Left Column (Gallery & Details) */}
 <div className="flex flex-col min-w-0">
 
 {/* Mobile Back Button Overlay inside Gallery Container conceptually, but let's place it outside or absolute */}
 <div className="relative w-full rounded-2xl overflow-hidden mb-6 border border-line bg-surface flex flex-col">
 <button
 onClick={() => navigate(-1)}
 className="md:hidden absolute top-3 left-3 z-20 p-2 rounded bg-surface/70  text-subtle shadow-hard hover:text-ink"
 aria-label="Go back"
 >
 <ArrowLeft className="w-5 h-5" />
 </button>
 
 <div className="relative w-full aspect-[4/3] bg-surface-2 overflow-hidden">
 <img
 src={photoUrls[activePhotoIdx]}
 alt={photoUrls.length > 1 ? `${listing.title} - Photo ${activePhotoIdx + 1} of ${photoUrls.length}` : listing.title}
 fetchPriority={activePhotoIdx === 0 ? "high" : "auto"}
 loading={activePhotoIdx === 0 ? "eager" : "lazy"}
 className={`w-full h-full object-contain ${isSold ? 'grayscale' : ''}`}
 onError={(e) => {
 const target = e.target as HTMLImageElement;
 const fallback = getCategoryFallback(listing.category);
 if (target.src !== fallback) {
 target.src = fallback;
 }
 }}
 />
 
 {isSold && (
 <div className="absolute inset-0 bg-bg/60  flex items-center justify-center z-10">
 <span className="font-display text-accent text-5xl -rotate-12 border-[5px] border-accent px-6 py-2 rounded-xl opacity-80">
 Sold
 </span>
 </div>
 )}

 {/* Carousel Prev/Next Controls */}
 {photoUrls.length > 1 && (
 <>
 <button
 onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photoUrls.length - 1))}
 className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded bg-black/40 text-white  hover:bg-black/60 z-20"
 >
 <ChevronLeft className="w-5 h-5" />
 </button>
 <button
 onClick={() => setActivePhotoIdx((prev) => (prev < photoUrls.length - 1 ? prev + 1 : 0))}
 className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded bg-black/40 text-white  hover:bg-black/60 z-20"
 >
 <ChevronRight className="w-5 h-5" />
 </button>
 
 {/* Indicator Dots (Mobile mainly) */}
 <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20 md:hidden">
 {photoUrls.map((_, idx) => (
 <span
 key={idx}
 className={`w-2 h-2 rounded transition-colors ${
 idx === activePhotoIdx ? 'bg-surface shadow-1' : 'bg-surface/50'
 }`}
 />
 ))}
 </div>
 </>
 )}
 </div>
 
 {/* Thumbnails (Desktop) */}
 {photoUrls.length > 1 && (
 <div className="hidden md:flex p-3 gap-2 overflow-x-auto bg-surface border-t border-line">
 {photoUrls.map((url, idx) => (
 <button
 key={idx}
 onClick={() => setActivePhotoIdx(idx)}
 className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
 idx === activePhotoIdx ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'
 }`}
 >
 <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Description (Desktop: Left Col, Mobile: stacked below specs) */}
 <div className="hidden md:block">
 <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-2">
 {categoryLabel(listing.category)}
 </div>
 
 <div className="flex items-end gap-3 flex-wrap mb-2">
 <span className="text-display text-ink tabular-nums">
 ₹{listing.price.toLocaleString('en-IN')}
 </span>
 <Badge variant={listing.isNegotiable ? 'success' : 'default'} className={`mb-2 ${listing.isNegotiable ? '-rotate-2' : ''}`}>
 {listing.isNegotiable ? 'Negotiable' : 'Fixed Price'}
 </Badge>
 </div>

 <h1 className="text-display font-bold text-ink leading-[1.1] mb-3 tabular-nums">
 {listing.title}
 </h1>
 </div>

 {/* Specs Grid 2x2 */}
 <div className="grid grid-cols-2 gap-4 py-5 border-y border-line">
 <div>
 <span className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">Condition</span>
 <span className="text-[14px] font-medium text-ink">{conditionLabels[listing.condition] || listing.condition}</span>
 </div>
 <div>
 <span className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">Location</span>
 <span className="text-[14px] font-medium text-ink">{listing.hallOfResidence} Hall</span>
 </div>
 <div>
 <span className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">Posted</span>
 <span className="text-[14px] font-medium text-ink">{timeAgo(listing.createdAt)}</span>
 </div>
 <div>
 <span className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-1">Expires</span>
 <span className="text-[14px] font-medium text-ink">{timeAgo(listing.expiresAt)}</span>
 </div>
 </div>

 {/* Description (Mobile only) */}
 <div className="md:hidden pt-2 pb-4">
 <h2 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2">Description</h2>
 <p className="text-[15px] text-ink whitespace-pre-line leading-[1.6]">
 {listing.description || 'No detailed description provided.'}
 </p>
 </div>

 {/* Seller Row */}
 <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-line">
 <div className="w-10 h-10 rounded bg-accent-wash text-accent font-display text-xl flex items-center justify-center shrink-0">
 {(listing.sellerName || 'A').charAt(0).toUpperCase()}
 </div>
 <div className="flex-1 min-w-0">
 <span className="text-[10px] uppercase font-bold text-subtle block leading-none mb-1">Seller</span>
 <span className="text-sm font-bold text-ink truncate block">{listing.sellerName || 'Anonymous'}</span>
 </div>
 </div>

 {/* Desktop Buy Box Buttons */}
 <div className="hidden md:flex flex-col gap-3">
 <Button
 variant="primary"
 size="lg"
 disabled={isDisabled}
 loading={isContacting}
 onClick={handleContactTap}
 
 className="w-full justify-center"
 >
 {isSold ? 'Item Sold' : 'Contact Seller on WhatsApp'}
 </Button>
 
 <div className="flex gap-2">
 <Button
 variant="secondary"
 className="flex-1"
 onClick={handleToggleSave}
 >
 {isSaved ? 'Saved' : 'Save Item'}
 </Button>
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
 <Button variant="secondary" size="sm" className="flex-1" onClick={handleToggleSold} loading={toggleSoldMutation.isPending}>
 {isSold ? 'Unmark Sold' : 'Mark Sold'}
 </Button>
 <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate(`/listing/${listing.id}/edit`)}>
 Edit
 </Button>
 </div>
 <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowDeleteSheet(true)}>
 Delete Listing
 </Button>
 </div>
 )}

 {/* Quiet Report Link */}
 {!isOwner && (
 <div className="text-center md:text-left mt-2">
 <button 
 onClick={() => setIsReportSheetOpen(true)}
 className="text-xs font-medium text-subtle hover:text-danger hover:underline inline-flex items-center gap-1"
 >
 <Flag className="w-3 h-3" /> Report this listing
 </button>
 </div>
 )}
 </div>
 </div>

 {/* Mobile Fixed Bottom Bar */}
 <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-surface border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-bottom))] ">
 <div className="flex items-center gap-4 max-w-md mx-auto">
 <div className="flex flex-col shrink-0">
 <span className="text-[10px] font-bold text-subtle uppercase tracking-wider leading-none mb-1">Price</span>
 <span className="text-display text-ink tabular-nums">
 ₹{listing.price.toLocaleString('en-IN')}
 </span>
 </div>
 <Button
 variant="primary"
 className="flex-1 h-12 shadow-hard font-semibold text-sm"
 disabled={isDisabled}
 loading={isContacting}
 onClick={handleContactTap}
 
 >
 {isSold ? 'Sold' : 'Contact Seller'}
 </Button>
 </div>
 </div>

 {/* Delete Confirmation Sheet */}
 <Sheet isOpen={showDeleteSheet} onClose={() => setShowDeleteSheet(false)} title="Delete Listing">
 <div className="text-center py-4">
 <Trash2 className="w-10 h-10 text-danger mx-auto mb-3" />
 <h3 className="text-base font-bold text-ink mb-2">Are you sure?</h3>
 <p className="text-xs text-subtle mb-6">
 This will remove your listing "{listing.title}" from campus search and clear uploaded photos.
 </p>

 <div className="flex gap-3">
 <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteSheet(false)}>
 Cancel
 </Button>
 <Button variant="secondary" className="flex-1" loading={deleteListingMutation.isPending} onClick={handleDelete}>
 Permanently Delete
 </Button>
 </div>
 </div>
 </Sheet>

 <ReportSheet
 isOpen={isReportSheetOpen}
 onClose={() => setIsReportSheetOpen(false)}
 listingId={listing.id}
 title={listing.title}
 />
 </PageContainer>
 );
};
