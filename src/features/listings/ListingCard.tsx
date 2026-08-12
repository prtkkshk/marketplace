import { SoldStamp } from '../../components/ui/SoldStamp';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListingItem } from '../../lib/data/listings';
import { fetchContactNumber } from '../../lib/data/contact';
import { useToggleSaveMutation } from '../../lib/hooks/useToggleSaveMutation';
import { useQuery } from '@tanstack/react-query';
import { fetchSavedListings } from '../../lib/data/saved_items';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
// removed formatINR
import { timeAgo } from '../../lib/utils/timeAgo';
import { getPhotoPublicUrlTransformed, getCategoryFallback } from '../../lib/utils/image';
import { Badge } from '../../components/ui/Badge';
import { Heart, Pin, MessageCircle } from 'lucide-react';
import { analytics } from '../../lib/analytics';

export interface ListingCardProps {
 listing: ListingItem;
 onReportClick?: (listing: ListingItem) => void;
 isOwner?: boolean;
 onEdit?: (e: React.MouseEvent) => void;
 onMarkSold?: (e: React.MouseEvent) => void;
 /** Pass true for the first ~4 cards above the fold to hint fetchpriority=high */
 priority?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
 listing,
 isOwner = false,
 onEdit,
 onMarkSold,
 priority = false,
}) => {
 const { session } = useAuth();
 const { showToast } = useToast();
 const toggleSaveMutation = useToggleSaveMutation();

 const { data: savedItems = [] } = useQuery({
 queryKey: ['savedItems'],
 queryFn: () => session?.user?.id ? fetchSavedListings(session.user.id) : Promise.resolve([]),
 enabled: !!session?.user?.id,
 });

 const isSaved = savedItems.some(item => item.id === listing.id);
 const [isContacting, setIsContacting] = useState<boolean>(false);

 const isSold = listing.status === 'sold';
 const isExpired = listing.status === 'expired';
 const isDisabled = isSold || isExpired;

 const photoUrl = getPhotoPublicUrlTransformed(listing.photoPaths?.[0], listing.category);

 const conditionLabels: Record<string, string> = {
 brand_new: 'Brand New',
 like_new: 'Like New',
 good: 'Good',
 fair: 'Fair',
 };

 const handleContactTap = async (e: React.MouseEvent) => {
 e.preventDefault();
 e.stopPropagation();
 if (isDisabled || isContacting) return;
 setIsContacting(true);
 
 analytics.track('contact_click', {
 category: listing.category,
 price: listing.price,
 });

 try {
 const result = await fetchContactNumber(listing.id, listing.title, listing.price);
 window.open(result.whatsappDeepLink, '_blank', 'noopener,noreferrer');
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Failed to contact seller';
 showToast(msg, 'error');
 } finally {
 setIsContacting(false);
 }
 };

 const handleToggleSave = (e: React.MouseEvent) => {
 e.preventDefault();
 e.stopPropagation();

 if (!session?.user?.id) {
 showToast('Please sign in to save items', 'info');
 return;
 }

 const previousState = isSaved;

 analytics.track('save_toggled', {
 category: listing.category,
 isSaved: !previousState,
 });

 toggleSaveMutation.mutate(
 {
 userId: session.user.id,
 listingId: listing.id,
 previousState,
 listing, 
 },
 {
 onSuccess: () => {
 showToast(!previousState ? 'Saved to bookmarks' : 'Removed from bookmarks', 'info');
 },
 onError: (err) => {
 const msg = err instanceof Error ? err.message : 'Save toggle failed';
 showToast(msg, 'error');
 },
 }
 );
 };

 const isNewToday = new Date(listing.createdAt).toDateString() === new Date().toDateString();

 return (
 <article
 className={`group relative rounded-2xl border border-line bg-surface shadow-hard overflow-hidden flex flex-col transition-all ${
 isSold ? 'opacity-75 bg-bg' : 'motion-safe:hover:-translate-y-[3px] hover:border-line-strong hover:shadow-hard'
 }`}
 >
 <Link to={`/listing/${listing.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${listing.title}`} />

 {/* Flags */}
 <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5 items-start">
 {listing.isPinned && (
 <Badge variant="danger" className="shadow-1">
 <Pin className="w-3 h-3 fill-current mr-1" />
 PINNED
 </Badge>
 )}
 {isNewToday && !isSold && (
 <Badge variant="success" className="shadow-1">NEW TODAY</Badge>
 )}
 </div>

 {/* Owner Action Cluster */}
 {isOwner && !isSold && (
 <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
 <button
 onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(e); }}
 className="px-3 h-[44px] md:h-[31px] rounded-lg bg-surface flex items-center justify-center text-[12px] font-bold text-ink transition-colors shadow-hard border border-line-strong hover:bg-surface-2"
 >
 Edit
 </button>
 <button
 onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkSold?.(e); }}
 className="px-3 h-[44px] md:h-[31px] rounded-lg bg-surface flex items-center justify-center text-[12px] font-bold text-ink transition-colors shadow-hard border border-line-strong hover:bg-surface-2"
 >
 Mark Sold
 </button>
 </div>
 )}

 {/* Image Container with Fixed Aspect Ratio square */}
 <div className="relative aspect-square w-full bg-surface-2 overflow-hidden block border-b-2 border-line">
 <img
 src={photoUrl}
 alt={listing.title}
 loading={priority ? 'eager' : 'lazy'}
 fetchPriority={priority ? 'high' : 'auto'}
 width={400}
 height={400}
 className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
 isSold ? 'grayscale' : 'group-hover:scale-[1.045]'
 }`}
 onError={(e) => {
 const target = e.target as HTMLImageElement;
 const fallback = getCategoryFallback(listing.category);
 if (target.src !== fallback) {
 target.src = fallback;
 }
 }}
 />

 {isSold && (
 <SoldStamp className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
 )}
 </div>

 {/* Card Body */}
 <div className="p-3 flex-1 flex flex-col justify-between text-left">
 <div>
 {/* Title */}
 <h3 className="text-[13.5px] font-semibold text-ink line-clamp-2 leading-snug group-hover:text-accent transition-colors">
 {listing.title}
 </h3>

 {/* Price & Actions Row */}
 <div className="mt-1 mb-2 flex items-center justify-between">
 <div className="font-extrabold text-ink text-price tabular-nums">
 ₹{listing.price.toLocaleString('en-IN')}
 </div>
 {!isSold && !isOwner && (
 <div className="relative z-20 flex items-center gap-2">
 {/* <button
 onClick={handleContactTap}
 disabled={isContacting}
 className="press inline-flex min-h-tap min-w-tap items-center justify-center rounded-sm border-[1.5px] border-line-strong bg-surface text-muted transition-colors hover:border-ink hover:text-ink active:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"
 aria-label={`Contact seller on WhatsApp`}
 >
 <MessageCircle className="w-4 h-4" />
 </button> */}
 <button
 onClick={handleToggleSave}
 className="press inline-flex min-h-tap min-w-tap items-center justify-center rounded-sm border-[1.5px] border-line-strong bg-surface text-muted transition-colors hover:border-ink hover:text-ink active:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"
 aria-label={isSaved ? 'Unsave item' : 'Save item'}
 >
 <Heart className={`w-4 h-4 ${isSaved ? 'fill-accent text-accent' : ''}`} />
 </button>
 </div>
 )}
 </div>

 {/* Badges Row */}
 <div className="flex items-center gap-1.5 flex-wrap mb-3">
 <Badge variant="default">{conditionLabels[listing.condition] || listing.condition}</Badge>
 <Badge variant={listing.isNegotiable ? 'success' : 'default'}>
 {listing.isNegotiable ? 'Negotiable' : 'Fixed'}
 </Badge>
 </div>
 </div>

 {/* Location & Time */}
 <div className="pt-2 border-t border-line flex items-center justify-between text-[11.5px] text-subtle">
 <span>{listing.hallOfResidence} Hall</span>
 <span>{timeAgo(listing.createdAt)}</span>
 </div>
 </div>
 </article>
 );
};
