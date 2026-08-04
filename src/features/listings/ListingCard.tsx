import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListingItem } from '../../lib/data/listings';
import { fetchContactNumber } from '../../lib/data/contact';
import { useToggleSaveMutation } from '../../lib/hooks/useToggleSaveMutation';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
// removed formatINR
import { timeAgo } from '../../lib/utils/timeAgo';
import { getPhotoPublicUrl, getCategoryFallback } from '../../lib/utils/image';
import { Badge } from '../../components/ui/Badge';
import { Heart, Pin } from 'lucide-react';
// import { SiWhatsapp } from '@icons-pack/react-simple-icons'; // Assuming no new deps, using a simple SVG or standard icon if possible, but lucide doesn't have WhatsApp.
// Wait, the prompt said "circular bg-whats WhatsApp icon button". I will just use a generic message icon or if there's a WhatsApp one.
import { MessageCircle } from 'lucide-react'; 

export interface ListingCardProps {
  listing: ListingItem;
  initialIsSaved?: boolean;
  onReportClick?: (listing: ListingItem) => void;
  isOwner?: boolean;
  onEdit?: (e: React.MouseEvent) => void;
  onMarkSold?: (e: React.MouseEvent) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  initialIsSaved = false,
  isOwner = false,
  onEdit,
  onMarkSold,
}) => {
  const { session } = useAuth();
  const { showToast } = useToast();
  const toggleSaveMutation = useToggleSaveMutation();

  const [isSaved, setIsSaved] = useState<boolean>(initialIsSaved);
  const [isContacting, setIsContacting] = useState<boolean>(false);

  const isSold = listing.status === 'sold';
  const isExpired = listing.status === 'expired';
  const isDisabled = isSold || isExpired;

  const photoUrl = getPhotoPublicUrl(listing.photoPaths?.[0], listing.category);

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
    setIsSaved(!previousState); 

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
          setIsSaved(previousState); 
          const msg = err instanceof Error ? err.message : 'Save toggle failed';
          showToast(msg, 'error');
        },
      }
    );
  };

  const isNewToday = new Date(listing.createdAt).toDateString() === new Date().toDateString();

  return (
    <Link
      to={`/listing/${listing.id}`}
      className={`group relative rounded-lg border border-line bg-surface overflow-hidden flex flex-col transition-all ${
        isSold ? 'opacity-75 bg-slate-50' : 'hover:-translate-y-[3px] hover:border-line-strong hover:shadow-2'
      }`}
    >
      {/* Flags */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5 items-start">
        {listing.isPinned && (
          <Badge variant="pin" className="shadow-1">
            <Pin className="w-3 h-3 fill-current mr-1" />
            PINNED
          </Badge>
        )}
        {isNewToday && !isSold && (
          <Badge variant="flag" className="shadow-1">NEW TODAY</Badge>
        )}
      </div>

      {/* Action Cluster (Top Right) */}
      {!isSold && !isOwner && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <button
            onClick={handleContactTap}
            disabled={isContacting}
            className="group/wa card-wa h-[31px] w-[31px] md:hover:w-auto rounded-full bg-whats text-white flex items-center justify-center shadow transition-all overflow-hidden"
            aria-label={`Contact seller on WhatsApp about ${listing.title}`}
          >
            <MessageCircle className="w-[15px] h-[15px] shrink-0 md:group-hover/wa:ml-2.5" />
            <span className="text-[11px] font-bold max-w-0 md:group-hover/wa:max-w-[100px] md:group-hover/wa:px-2 md:group-hover/wa:opacity-100 opacity-0 whitespace-nowrap overflow-hidden transition-all duration-250">
              WhatsApp
            </span>
          </button>
          
          <button
            onClick={handleToggleSave}
            className="card-save w-[31px] h-[31px] rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-ink-3 hover:text-brand transition-colors shadow"
            aria-label={isSaved ? 'Unsave item' : 'Save item'}
          >
            <Heart className={`w-[15px] h-[15px] ${isSaved ? 'fill-brand text-brand' : ''}`} />
          </button>
        </div>
      )}

      {/* Owner Action Cluster */}
      {isOwner && !isSold && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(e); }}
            className="px-3 h-[31px] rounded-full bg-surface-alt/95 backdrop-blur-sm flex items-center justify-center text-[12px] font-bold text-ink hover:text-brand transition-colors shadow-1 border border-line"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkSold?.(e); }}
            className="px-3 h-[31px] rounded-full bg-surface-alt/95 backdrop-blur-sm flex items-center justify-center text-[12px] font-bold text-ink hover:text-brand transition-colors shadow-1 border border-line"
          >
            Mark Sold
          </button>
        </div>
      )}

      {/* Image Container with Fixed Aspect Ratio 4/5 */}
      <div className="relative aspect-[4/5] w-full bg-paper-sunk overflow-hidden block border-b border-line">
        <img
          src={photoUrl}
          alt={listing.title}
          loading="lazy"
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

        {/* SOLD Overlay Badge */}
        {isSold && (
          <div className="absolute inset-0 bg-paper/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="font-display italic text-brand text-4xl -rotate-12 border-4 border-brand px-4 py-1 rounded-lg opacity-80">
              Sold
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3 flex-1 flex flex-col justify-between text-left">
        <div>
          {/* Title */}
          <h3 className="text-[13.5px] font-semibold text-ink line-clamp-1 group-hover:text-brand transition-colors">
            {listing.title}
          </h3>

          {/* Price */}
          <div className="mt-0.5 mb-2 font-display text-[25px] text-ink leading-none">
            <span className="text-lg text-ink-3 mr-0.5">₹</span>
            {listing.price.toLocaleString('en-IN')}
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <Badge variant="cond">{conditionLabels[listing.condition] || listing.condition}</Badge>
            <Badge variant={listing.isNegotiable ? 'neg' : 'fixed'}>
              {listing.isNegotiable ? 'Negotiable' : 'Fixed'}
            </Badge>
          </div>
        </div>

        {/* Location & Time */}
        <div className="pt-2 border-t border-line flex items-center justify-between text-[11.5px] text-ink-3">
          <span>{listing.hallOfResidence} Hall</span>
          <span>{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
};
