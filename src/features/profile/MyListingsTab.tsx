import React, { useState, useEffect } from 'react';
import { fetchMyListings, type ListingItem } from '../../lib/data/listings';
import { ListingCard } from '../listings/ListingCard';
import { ListingSkeleton } from '../listings/ListingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyListingsTab: React.FC<{ userId: string }> = ({ userId }) => {
  const [segment, setSegment] = useState<'active' | 'sold'>('active');
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchMyListings(userId, segment)
      .then((data) => setListings(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, segment]);

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Active / Sold Segmented Control */}
      <div className="flex bg-slate-200/60 p-1 rounded-xl w-48 mx-auto">
        <button
          onClick={() => setSegment('active')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            segment === 'active' ? 'bg-white text-brand-primary shadow-xs' : 'text-content-muted'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setSegment('sold')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            segment === 'sold' ? 'bg-white text-brand-primary shadow-xs' : 'text-content-muted'
          }`}
        >
          Sold
        </button>
      </div>

      {loading ? (
        <ListingSkeleton count={2} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setSegment(segment)} />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10 text-content-muted" />}
          title={`No ${segment} listings`}
          description={
            segment === 'active'
              ? 'You have no active items listed for sale.'
              : 'Items you mark as sold will appear here.'
          }
          actionLabel={segment === 'active' ? 'Post a Listing' : undefined}
          onAction={() => (window.location.href = '/new')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listings.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
};
