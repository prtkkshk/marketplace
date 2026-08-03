import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListingItem } from '../../lib/data/listings';
import { fetchContactNumber } from '../../lib/data/contact';
import { useToggleSaveMutation } from '../../lib/hooks/useToggleSaveMutation';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
import { formatINR } from '../../lib/utils/formatINR';
import { timeAgo } from '../../lib/utils/timeAgo';
import { getPhotoPublicUrl, getCategoryFallback } from '../../lib/utils/image';
import { Badge } from '../../components/ui/Badge';
import { ReportSheet } from '../../components/ui/ReportSheet';
import { Heart, MessageCircle, MoreVertical, Flag, Pin, Loader2 } from 'lucide-react';

export interface ListingCardProps {
  listing: ListingItem;
  initialIsSaved?: boolean;
  onReportClick?: (listing: ListingItem) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  initialIsSaved = false,
  onReportClick,
}) => {
  const { session } = useAuth();
  const { showToast } = useToast();
  const toggleSaveMutation = useToggleSaveMutation();

  const [isSaved, setIsSaved] = useState<boolean>(initialIsSaved);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showReportSheet, setShowReportSheet] = useState<boolean>(false);
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

  const handleContactTap = async () => {
    if (isDisabled || isContacting) return;
    setIsContacting(true);

    try {
      const result = await fetchContactNumber(listing.id, listing.title, listing.price);
      // Immediately open WhatsApp deep link without storing or logging phone number
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
    setIsSaved(!previousState); // Optimistic UI local state

    toggleSaveMutation.mutate(
      {
        userId: session.user.id,
        listingId: listing.id,
        previousState,
        listing: { ...listing, isSaved: !previousState }, // Optional for cache
      },
      {
        onSuccess: () => {
          showToast(!previousState ? 'Saved to bookmarks' : 'Removed from bookmarks', 'info');
        },
        onError: (err) => {
          setIsSaved(previousState); // Rollback local state
          const msg = err instanceof Error ? err.message : 'Save toggle failed';
          showToast(msg, 'error');
        },
      }
    );
  };

  return (
    <div
      className={`relative rounded-2xl border border-surface-border bg-surface-card shadow-xs overflow-hidden flex flex-col transition-all ${
        isSold ? 'opacity-75 bg-slate-50' : 'hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Pinned Badge */}
      {listing.isPinned && (
        <div className="absolute top-2 left-2 z-10 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
          <Pin className="w-3 h-3 fill-current" />
          <span>PINNED</span>
        </div>
      )}

      {/* Image Container with Fixed Aspect Ratio */}
      <Link to={`/listing/${listing.id}`} className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden block">
        <img
          src={photoUrl}
          alt={listing.title}
          loading="lazy"
          width={400}
          height={300}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isSold ? 'grayscale' : 'hover:scale-105'
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
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-slate-900/90 text-white font-black text-xs uppercase px-3 py-1 rounded-lg tracking-wider">
              SOLD
            </span>
          </div>
        )}

        {/* Save Heart Button */}
        <button
          onClick={handleToggleSave}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-content-muted hover:text-rose-500 transition-colors shadow-xs z-10"
          aria-label={isSaved ? 'Unsave item' : 'Save item'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </Link>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between text-left">
        <div>
          {/* Header Row: Title & Overflow Menu */}
          <div className="flex items-start justify-between gap-1 mb-1">
            <Link
              to={`/listing/${listing.id}`}
              className="text-sm font-semibold text-content-primary line-clamp-1 hover:text-brand-primary transition-colors"
            >
              {listing.title}
            </Link>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowMenu(!showMenu);
                }}
                className="p-1 rounded-md text-content-muted hover:text-content-primary"
                aria-label="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-6 bg-white border border-surface-border rounded-xl shadow-md p-1 z-20 w-28">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportSheet(true);
                      onReportClick?.(listing);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-status-danger hover:bg-rose-50 rounded-lg"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className="text-base font-bold text-brand-primary">{formatINR(listing.price)}</span>
            <Badge variant="secondary">{conditionLabels[listing.condition] || listing.condition}</Badge>
            <Badge variant="muted">{listing.isNegotiable ? 'Negotiable' : 'Fixed Price'}</Badge>
          </div>

          {/* Location & Time */}
          <div className="flex items-center justify-between text-[11px] text-content-muted mb-3">
            <span>📍 {listing.hallOfResidence} Hall</span>
            <span>{timeAgo(listing.createdAt)}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleContactTap}
          disabled={isDisabled || isContacting}
          className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            isDisabled
              ? 'bg-slate-100 text-content-muted cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
          }`}
        >
          {isContacting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          <span>{isSold ? 'Item Sold' : 'Contact Seller on WhatsApp'}</span>
        </button>
      </div>

      <ReportSheet
        isOpen={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        listingId={listing.id}
        title={listing.title}
      />
    </div>
  );
};
