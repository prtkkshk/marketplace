import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + "\n")

# 1. categoryLabel.ts
write_file('src/lib/utils/categoryLabel.ts', """
import { CATEGORIES } from '../constants';

export function categoryLabel(id: string): string {
  const category = CATEGORIES.find(c => c.id === id);
  if (category) {
    return category.label;
  }
  return id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
""")

# 2. ListingDetailScreen.tsx
write_file('src/features/listings/ListingDetailScreen.tsx', """
import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchListingById,
  type ListingItem,
} from '../../lib/data/listings';
import { useToggleSoldMutation } from '../../lib/hooks/useToggleSoldMutation';
import { useDeleteListingMutation } from '../../lib/hooks/useDeleteListingMutation';
import { useToggleSaveMutation } from '../../lib/hooks/useToggleSaveMutation';
import { fetchContactNumber } from '../../lib/data/contact';
import { formatINR } from '../../lib/utils/formatINR';
import { timeAgo } from '../../lib/utils/timeAgo';
import { getPhotoPublicUrls, getCategoryFallback } from '../../lib/utils/image';
import { categoryLabel } from '../../lib/utils/categoryLabel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { ErrorState } from '../../components/ui/ErrorState';
import { Sheet } from '../../components/ui/Sheet';
import { useAuth } from '../auth/AuthProvider';
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
  Share2,
} from 'lucide-react';

export const ListingDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin, session } = useAuth();
  const { showToast } = useToast();

  const toggleSoldMutation = useToggleSoldMutation();
  const deleteListingMutation = useDeleteListingMutation();
  const toggleSaveMutation = useToggleSaveMutation();

  const [listing, setListing] = useState<ListingItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState<boolean>(false);
  const [isContacting, setIsContacting] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetchListingById(id)
      .then((res) => setListing(res))
      .catch((err) => setError(err instanceof Error ? err.message : 'Listing not found'))
      .finally(() => setLoading(false));
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
        },
      }
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
      onSettled: () => setShowDeleteSheet(false),
    });
  };

  const handleToggleSave = () => {
    if (!session?.user?.id || !listing) {
      showToast('Please sign in to save items', 'info');
      return;
    }
    const previousState = isSaved;
    setIsSaved(!previousState);

    toggleSaveMutation.mutate(
      { userId: session.user.id, listingId: listing.id, previousState, listing },
      {
        onSuccess: () => showToast(!previousState ? 'Saved to bookmarks' : 'Removed from bookmarks', 'info'),
        onError: (err) => {
          setIsSaved(previousState);
          const msg = err instanceof Error ? err.message : 'Save toggle failed';
          showToast(msg, 'error');
        },
      }
    );
  };

  const handleContactTap = async () => {
    if (isDisabled || isContacting) return;
    setIsContacting(true);
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
          url: window.location.href,
        });
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
      <div className="flex items-center gap-2 text-xs font-medium text-ink-3 mb-4">
        <Link to="/" className="hover:text-ink transition-colors">Browse</Link>
        <span className="text-line-strong">/</span>
        <Link to={`/?cat=${listing.category}`} className="hover:text-ink transition-colors">
          {categoryLabel(listing.category)}
        </Link>
        <span className="text-line-strong hidden sm:inline">/</span>
        <span className="text-ink hidden sm:inline line-clamp-1">{listing.title}</span>
      </div>

      <div className="md:grid md:grid-cols-[1.25fr_1fr] md:gap-10 items-start relative">
        {/* Left Column (Gallery & Details) */}
        <div className="flex flex-col min-w-0">
          
          {/* Mobile Back Button Overlay inside Gallery Container conceptually, but let's place it outside or absolute */}
          <div className="relative w-full rounded-2xl overflow-hidden mb-6 border border-line bg-surface flex flex-col">
            <button
              onClick={() => navigate(-1)}
              className="md:hidden absolute top-3 left-3 z-20 p-2 rounded-full bg-white/70 backdrop-blur-md text-ink-3 shadow-sm hover:text-ink"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="relative w-full aspect-[4/3] bg-paper-sunk overflow-hidden">
              <img
                src={photoUrls[activePhotoIdx]}
                alt={listing.title}
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
                <div className="absolute inset-0 bg-paper/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <span className="font-display italic text-brand text-5xl -rotate-12 border-[5px] border-brand px-6 py-2 rounded-xl opacity-80">
                    Sold
                  </span>
                </div>
              )}

              {/* Carousel Prev/Next Controls */}
              {photoUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photoUrls.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 z-20"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIdx((prev) => (prev < photoUrls.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 z-20"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* Indicator Dots (Mobile mainly) */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20 md:hidden">
                    {photoUrls.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === activePhotoIdx ? 'bg-white shadow-1' : 'bg-white/50'
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
                      idx === activePhotoIdx ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'
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
            <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-3">Description</h2>
            <p className="text-[15px] text-ink whitespace-pre-line leading-[1.6]">
              {listing.description || 'No detailed description provided.'}
            </p>
          </div>
        </div>

        {/* Right Column / Mobile Stack */}
        <div className="md:sticky md:top-[88px] flex flex-col gap-6">
          
          {/* Header info */}
          <div>
            <div className="text-[11px] font-bold text-brand uppercase tracking-wider mb-2">
              {categoryLabel(listing.category)}
            </div>
            <h1 className="font-display text-[31px] text-ink leading-[1.1] mb-3">
              {listing.title}
            </h1>
            
            <div className="flex items-end gap-3 flex-wrap">
              <span className="font-display text-[42px] text-ink leading-none">
                <span className="text-2xl text-ink-3 mr-1">₹</span>
                {listing.price.toLocaleString('en-IN')}
              </span>
              <Badge variant={listing.isNegotiable ? 'neg' : 'fixed'} className="mb-2">
                {listing.isNegotiable ? 'Negotiable' : 'Fixed Price'}
              </Badge>
            </div>
          </div>

          {/* Specs Grid 2x2 */}
          <div className="grid grid-cols-2 gap-4 py-5 border-y border-line">
            <div>
              <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block mb-1">Condition</span>
              <span className="text-[14px] font-medium text-ink">{conditionLabels[listing.condition] || listing.condition}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block mb-1">Location</span>
              <span className="text-[14px] font-medium text-ink">{listing.hallOfResidence} Hall</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block mb-1">Posted</span>
              <span className="text-[14px] font-medium text-ink">{timeAgo(listing.createdAt)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block mb-1">Expires</span>
              <span className="text-[14px] font-medium text-ink">{timeAgo(listing.expiresAt)}</span>
            </div>
          </div>

          {/* Description (Mobile only) */}
          <div className="md:hidden pt-2 pb-4">
            <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-2">Description</h2>
            <p className="text-[15px] text-ink whitespace-pre-line leading-[1.6]">
              {listing.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Seller Row */}
          <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-line">
            <div className="w-10 h-10 rounded-full bg-brand-wash text-brand font-display text-xl flex items-center justify-center shrink-0">
              {listing.sellerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-ink-3 block leading-none mb-1">Seller</span>
              <span className="text-sm font-bold text-ink truncate block">{listing.sellerName}</span>
            </div>
          </div>

          {/* Desktop Buy Box Buttons */}
          <div className="hidden md:flex flex-col gap-3">
            <Button
              variant="whats"
              size="lg"
              disabled={isDisabled}
              isLoading={isContacting}
              onClick={handleContactTap}
              leftIcon={<MessageCircle className="w-5 h-5" />}
              className="w-full justify-center"
            >
              {isSold ? 'Item Sold' : 'Contact Seller on WhatsApp'}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={handleToggleSave}
                leftIcon={<Heart className={`w-4 h-4 ${isSaved ? 'fill-brand text-brand' : ''}`} />}
              >
                {isSaved ? 'Saved' : 'Save Item'}
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={handleShare}
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                Share
              </Button>
            </div>
          </div>

          {/* Admin / Owner Controls */}
          {isOwner && (
            <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-line rounded-xl mt-2">
              <h3 className="text-xs font-bold text-ink-3 uppercase mb-2">Owner Controls</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleToggleSold} isLoading={toggleSoldMutation.isPending}>
                  {isSold ? 'Unmark Sold' : 'Mark Sold'}
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/listing/${listing.id}/edit`)}>
                  Edit
                </Button>
              </div>
              <Button variant="danger" size="sm" className="w-full" onClick={() => setShowDeleteSheet(true)}>
                Delete Listing
              </Button>
            </div>
          )}

          {/* Quiet Report Link */}
          {!isOwner && (
            <div className="text-center md:text-left mt-2">
              <button 
                onClick={() => showToast('Report submitted for moderator review', 'info')}
                className="text-xs font-medium text-ink-3 hover:text-danger hover:underline inline-flex items-center gap-1"
              >
                <Flag className="w-3 h-3" /> Report this listing
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider leading-none mb-1">Price</span>
            <span className="font-display text-2xl text-ink leading-none">
              ₹{listing.price.toLocaleString('en-IN')}
            </span>
          </div>
          <Button
            variant="whats"
            className="flex-1 h-12 shadow-md font-semibold text-sm"
            disabled={isDisabled}
            isLoading={isContacting}
            onClick={handleContactTap}
            leftIcon={<MessageCircle className="w-5 h-5" />}
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
          <p className="text-xs text-ink-3 mb-6">
            This will remove your listing "{listing.title}" from campus search and clear uploaded photos.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteSheet(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" isLoading={deleteListingMutation.isPending} onClick={handleDelete}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Sheet>
    </PageContainer>
  );
};
""")

# 3. WantedBoardScreen.tsx
write_file('src/features/wanted/WantedBoardScreen.tsx', """
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { SearchBar } from '../listings/SearchBar';
import { CategoryPills } from '../listings/CategoryPills';
import { RequestCard } from './RequestCard';
import { ListingSkeleton } from '../listings/ListingSkeleton';
import { useWantedRequests } from './useWantedRequests';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Megaphone, ArrowDownUp } from 'lucide-react';
import type { WantedRequestItem } from '../../lib/data/wantedRequests';

export const WantedBoardScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [page, setPage] = useState<number>(1);

  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('cat') || '';
  const sort = (searchParams.get('sort') as 'newest' | 'budget_desc' | 'budget_asc') || 'newest';

  const updateUrlParams = (newParams: Record<string, string | undefined | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useWantedRequests({
    category: selectedCategory,
    search: searchQuery,
    sort,
    page,
    limit: 20,
  });

  const handleReportClick = (request: WantedRequestItem) => {
    showToast(`Report submitted for request "${request.title}".`, 'info');
  };

  return (
    <PageContainer className="py-0 md:py-4 text-left flex flex-col h-full">
      
      {/* Amber Masthead */}
      <div className="flex flex-col gap-6 mb-8 mt-2 pb-8 border-b border-line">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-accent">Wanted Board</h1>
            <p className="text-sm text-ink-3 mt-1">Can't find it in the feed? Ask the campus.</p>
          </div>
          <Button variant="primary" className="w-full md:w-auto font-bold bg-accent hover:bg-amber-600" onClick={() => navigate('/new-request')}>
            Post a Request
          </Button>
        </div>
      </div>

      {/* Header controls */}
      <div className="flex flex-col gap-3 mb-6">
        <SearchBar
          value={searchQuery}
          onChange={(q) => updateUrlParams({ q: q || undefined })}
          placeholder="Search wanted books, cycles, lab gear..."
        />

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <CategoryPills
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => updateUrlParams({ cat: cat || undefined })}
            className="flex-1"
          />

          <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t border-line md:border-none">
            <div className="relative inline-flex items-center">
              <ArrowDownUp className="absolute left-3 w-3 h-3 text-ink-3 pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => updateUrlParams({ sort: e.target.value })}
                className="pl-7 pr-8 py-1.5 bg-surface border border-line rounded-full text-[12.5px] font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 appearance-none cursor-pointer hover:border-line-strong hover:bg-surface-alt transition-colors"
                aria-label="Sort wanted requests"
              >
                <option value="newest">Newest First</option>
                <option value="budget_desc">Budget: High → Low</option>
                <option value="budget_asc">Budget: Low → High</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed */}
      {isLoading && page === 1 ? (
        <ListingSkeleton count={4} />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load wanted requests'}
          onRetry={() => refetch()}
        />
      ) : !data?.requests || data.requests.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-12 h-12 text-ink-3" />}
          title="No wanted requests found"
          description="Be the first to post what item or textbook you are looking for on campus."
          actionLabel="Post a Request"
          onAction={() => navigate('/new-request')}
        />
      ) : (
        <>
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
            {data.requests.map((request) => (
              <RequestCard key={request.id} request={request} onReportClick={handleReportClick} />
            ))}
          </div>

          {data.hasMore && (
            <div className="mt-8 mb-4 h-10 w-full flex items-center justify-center">
              <Button variant="ghost" onClick={() => setPage((prev) => prev + 1)} disabled={isFetching}>
                {isFetching ? 'Loading...' : 'Load More Requests'}
              </Button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};
""")

# 4. RequestCard.tsx
write_file('src/features/wanted/RequestCard.tsx', """
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WantedRequestItem } from '../../lib/data/wantedRequests';
import { fetchRequesterContactNumber } from '../../lib/data/wantedRequests';
import { formatINR } from '../../lib/utils/formatINR';
import { timeAgo } from '../../lib/utils/timeAgo';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { categoryLabel } from '../../lib/utils/categoryLabel';
import { MessageCircle, MoreVertical, Flag, Loader2 } from 'lucide-react';

export interface RequestCardProps {
  request: WantedRequestItem;
  onReportClick?: (request: WantedRequestItem) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, onReportClick }) => {
  const { showToast } = useToast();
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isResponding, setIsResponding] = useState<boolean>(false);

  const isFulfilled = request.status === 'fulfilled';
  const isCancelled = request.status === 'hidden' || request.status === 'expired';
  const isDisabled = isFulfilled || isCancelled;

  const handleRespondTap = async () => {
    if (isDisabled || isResponding) return;
    setIsResponding(true);

    try {
      const result = await fetchRequesterContactNumber(request.id, request.title);
      window.open(result.whatsappDeepLink, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to contact requester';
      showToast(msg, 'error');
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div
      className={`relative rounded-2xl border border-line bg-surface p-5 shadow-1 flex flex-col text-left transition-all overflow-hidden ${
        isFulfilled ? 'opacity-60 bg-slate-50' : 'hover:border-line-strong hover:shadow-2'
      }`}
    >
      {/* 3px Amber Left Rule */}
      <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-accent" />

      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex flex-col items-start gap-1">
          <Badge variant="secondary" className="mb-1">{categoryLabel(request.category)}</Badge>
          <Link
            to={`/request/${request.id}`}
            className="text-lg font-bold text-ink hover:text-accent transition-colors line-clamp-1"
          >
            {request.title}
          </Link>
        </div>
        
        <div className="shrink-0 text-right">
          <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block mb-0.5">Budget</span>
          {request.maxBudget ? (
             <span className="font-display text-[27px] text-accent leading-none block">
               <span className="text-lg mr-0.5">₹</span>{request.maxBudget.toLocaleString('en-IN')}
             </span>
          ) : (
             <span className="font-display text-[22px] text-accent leading-none block italic opacity-80">
               Open
             </span>
          )}
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <p className="text-[14px] text-ink-2 line-clamp-2 leading-[1.6] mb-4">
          {request.description}
        </p>
      )}

      {/* Footer Meta Row */}
      <div className="mt-auto pt-4 border-t border-line flex items-center justify-between text-[12px] text-ink-3 mb-4">
        <span>📍 {request.requesterHall} Hall</span>
        <span>{timeAgo(request.createdAt)}</span>
      </div>

      {/* Full-width Button */}
      {isFulfilled ? (
        <Button variant="ghost" disabled className="w-full font-bold">
          ✓ Found & Fulfilled
        </Button>
      ) : (
        <Button
          variant="whats"
          className="w-full font-bold h-11 bg-whats hover:bg-emerald-700"
          disabled={isDisabled || isResponding}
          isLoading={isResponding}
          onClick={handleRespondTap}
          leftIcon={<MessageCircle className="w-5 h-5" />}
        >
          I Have This!
        </Button>
      )}
      
      {/* Top Right Options Menu (absolute) */}
      <div className="absolute top-3 right-2">
        <button
          onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
          className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-alt transition-colors"
          aria-label="Options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-8 bg-surface border border-line rounded-xl shadow-md p-1 z-20 w-32">
            <button
              onClick={() => {
                setShowMenu(false);
                onReportClick?.(request);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-danger hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
""")

# 5. RequestDetailScreen.tsx
write_file('src/features/wanted/RequestDetailScreen.tsx', """
import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchWantedRequestById,
  fetchRequesterContactNumber,
  type WantedRequestItem,
} from '../../lib/data/wantedRequests';
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
  MessageCircle,
  Flag,
  CheckCircle2,
  Trash2,
  Share2,
} from 'lucide-react';

export const RequestDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { showToast } = useToast();

  const toggleFulfilledMutation = useToggleFulfilledMutation();
  const deleteRequestMutation = useDeleteWantedRequestMutation();

  const [request, setRequest] = useState<WantedRequestItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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

  if (loading) {
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
        },
      }
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
      onSettled: () => setShowDeleteSheet(false),
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: request.title,
          text: `Can you help? Someone needs ${request.title} on KGP Bazaar`,
          url: window.location.href,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard', 'info');
    }
  };

  return (
    <PageContainer className="pb-32 md:pb-12 text-left pt-2 md:pt-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-ink-3 mb-6">
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
            className="md:hidden flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Description (Desktop: Left Col, Mobile: stacked below specs) */}
          <div className="hidden md:block bg-surface border-l-4 border-accent rounded-r-2xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-4">Request Details</h2>
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
                <span className="font-display text-[42px] text-accent leading-none">
                  <span className="text-2xl mr-1">₹</span>
                  {request.maxBudget.toLocaleString('en-IN')}
                </span>
              ) : (
                <span className="font-display text-[32px] text-accent leading-none italic opacity-80">
                  Open Budget
                </span>
              )}
            </div>
          </div>

          {/* Specs Grid 2x2 */}
          <div className="grid grid-cols-2 gap-4 py-5 border-y border-line">
            <div>
              <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block mb-1">Status</span>
              <span className={`text-[14px] font-bold ${isFulfilled ? 'text-ink-3' : 'text-accent'}`}>
                {isFulfilled ? 'Fulfilled' : 'Seeking'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block mb-1">Location</span>
              <span className="text-[14px] font-medium text-ink">{request.requesterHall} Hall</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block mb-1">Posted</span>
              <span className="text-[14px] font-medium text-ink">{timeAgo(request.createdAt)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block mb-1">Expires</span>
              <span className="text-[14px] font-medium text-ink">{timeAgo(request.expiresAt)}</span>
            </div>
          </div>

          {/* Description (Mobile only) */}
          <div className="md:hidden pt-2 pb-4">
            <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-2">Request Details</h2>
            <p className="text-[15px] text-ink whitespace-pre-line leading-[1.6]">
              {request.description || 'No additional details specified.'}
            </p>
          </div>

          {/* Requester Row */}
          <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-line">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-accent font-display text-xl flex items-center justify-center shrink-0">
              {request.requesterName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-ink-3 block leading-none mb-1">Requested By</span>
              <span className="text-sm font-bold text-ink truncate block">{request.requesterName}</span>
            </div>
          </div>

          {/* Desktop Buy Box Buttons */}
          <div className="hidden md:flex flex-col gap-3">
            <Button
              variant="whats"
              size="lg"
              disabled={isDisabled}
              isLoading={isContacting}
              onClick={handleRespondTap}
              leftIcon={<MessageCircle className="w-5 h-5" />}
              className="w-full justify-center"
            >
              {isFulfilled ? 'Request Fulfilled' : 'I Have This! (WhatsApp)'}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={handleShare}
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                Share
              </Button>
            </div>
          </div>

          {/* Admin / Owner Controls */}
          {isOwner && (
            <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-line rounded-xl mt-2">
              <h3 className="text-xs font-bold text-ink-3 uppercase mb-2">Owner Controls</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleToggleFulfilled} isLoading={toggleFulfilledMutation.isPending}>
                  {isFulfilled ? 'Unmark Fulfilled' : 'Mark Fulfilled'}
                </Button>
              </div>
              <Button variant="danger" size="sm" className="w-full" onClick={() => setShowDeleteSheet(true)}>
                Delete Request
              </Button>
            </div>
          )}

          {/* Quiet Report Link */}
          {!isOwner && (
            <div className="text-center md:text-left mt-2">
              <button 
                onClick={() => showToast('Report submitted for moderator review', 'info')}
                className="text-xs font-medium text-ink-3 hover:text-danger hover:underline inline-flex items-center gap-1"
              >
                <Flag className="w-3 h-3" /> Report this request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      {!isOwner && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
          <Button
            variant="whats"
            className="w-full h-12 shadow-md font-bold text-sm"
            disabled={isDisabled}
            isLoading={isContacting}
            onClick={handleRespondTap}
            leftIcon={<MessageCircle className="w-5 h-5" />}
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
          <p className="text-xs text-ink-3 mb-6">
            This will remove your request "{request.title}" from the Wanted Board.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteSheet(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" isLoading={deleteRequestMutation.isPending} onClick={handleDelete}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Sheet>
    </PageContainer>
  );
};
""")

print("Phase 5 files generated.")
