import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchListingById,
  markListingSold,
  unmarkListingSold,
  deleteListing,
  type ListingItem,
} from '../../lib/data/listings';
import { fetchContactNumber } from '../../lib/data/contact';
import { formatINR } from '../../lib/utils/formatINR';
import { timeAgo } from '../../lib/utils/timeAgo';
import { getPhotoPublicUrls, getCategoryFallback } from '../../lib/utils/image';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { Sheet } from '../../components/ui/Sheet';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Edit3,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const ListingDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [listing, setListing] = useState<ListingItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetchListingById(id)
      .then((res) => {
        setListing(res);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Listing not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
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
    fair: 'Fair',
  };

  const handleToggleSold = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      if (isSold) {
        const updated = await unmarkListingSold(id);
        setListing(updated);
        showToast('Listing marked as active', 'success');
      } else {
        const updated = await markListingSold(id);
        setListing(updated);
        showToast('Listing marked as sold', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await deleteListing(id);
      showToast('Listing deleted', 'info');
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleContactTap = async () => {
    if (isDisabled || actionLoading) return;
    setActionLoading(true);
    try {
      const result = await fetchContactNumber(listing.id, listing.title, listing.price);
      window.open(result.whatsappDeepLink, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Contact failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto text-left pb-24">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-content-muted hover:text-content-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwner && (
            <Link
              to={`/listing/${listing.id}/edit`}
              className="p-2 rounded-full border border-surface-border bg-white text-content-muted hover:text-brand-primary"
              title="Edit Listing"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={() => setIsSaved(!isSaved)}
            className="p-2 rounded-full border border-surface-border bg-white text-content-muted hover:text-rose-500"
            aria-label="Save listing"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {!isOwner && (
            <button
              onClick={() => showToast('Report submitted for moderator review', 'info')}
              className="p-2 rounded-full border border-surface-border bg-white text-content-muted hover:text-status-danger"
              aria-label="Report listing"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Photo Carousel Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 rounded-2xl overflow-hidden mb-6 border border-surface-border">
        <img
          src={photoUrls[activePhotoIdx]}
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const fallback = getCategoryFallback(listing.category);
            if (target.src !== fallback) {
              target.src = fallback;
            }
          }}
        />

        {/* Carousel Prev/Next Controls */}
        {photoUrls.length > 1 && (
          <>
            <button
              onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photoUrls.length - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-xs hover:bg-black/60"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActivePhotoIdx((prev) => (prev < photoUrls.length - 1 ? prev + 1 : 0))}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-xs hover:bg-black/60"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {photoUrls.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === activePhotoIdx ? 'bg-white shadow-xs' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Title & Badges */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-content-primary">{listing.title}</h1>
          <span className="text-2xl font-black text-brand-primary">{formatINR(listing.price)}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{conditionLabels[listing.condition] || listing.condition}</Badge>
          <Badge variant="muted">{listing.isNegotiable ? 'Negotiable' : 'Fixed Price'}</Badge>
          {isSold && <Badge variant="danger">SOLD</Badge>}
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-6">
        <h2 className="text-xs font-bold text-content-muted uppercase tracking-wider mb-2">Description</h2>
        <p className="text-sm text-content-primary whitespace-pre-line leading-relaxed">
          {listing.description || 'No detailed description provided.'}
        </p>
      </div>

      {/* Seller Info Card */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-content-muted block">Seller</span>
          <span className="text-sm font-bold text-content-primary block">{listing.sellerName}</span>
          <span className="text-xs text-content-muted">📍 {listing.sellerHall} Hall • Listed {timeAgo(listing.createdAt)}</span>
        </div>
      </div>

      {/* Owner Management Bar */}
      {isOwner && (
        <div className="bg-slate-50 border border-surface-border rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSold}
            isLoading={actionLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          >
            {isSold ? 'Unmark as Sold' : 'Mark as Sold'}
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteSheet(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Listing
          </Button>
        </div>
      )}

      {/* Fixed Bottom Contact Button Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-surface-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            variant="primary"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold"
            disabled={isDisabled}
            isLoading={actionLoading}
            onClick={handleContactTap}
            leftIcon={<MessageCircle className="w-5 h-5" />}
          >
            {isSold ? 'Item Sold' : 'Contact Seller on WhatsApp'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Sheet */}
      <Sheet isOpen={showDeleteSheet} onClose={() => setShowDeleteSheet(false)} title="Delete Listing">
        <div className="text-center py-4">
          <Trash2 className="w-10 h-10 text-status-danger mx-auto mb-3" />
          <h3 className="text-base font-bold text-content-primary mb-2">Are you sure?</h3>
          <p className="text-xs text-content-muted mb-6">
            This will remove your listing "{listing.title}" from campus search and clear uploaded photos.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteSheet(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" isLoading={actionLoading} onClick={handleDelete}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
