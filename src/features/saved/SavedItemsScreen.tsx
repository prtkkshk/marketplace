import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { fetchSavedListings } from '../../lib/data/saved_items';
import { ListingCard } from '../listings/ListingCard';
import { ListingSkeleton } from '../listings/ListingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const SavedItemsScreen: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const {
    data: savedItems = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['savedItems'],
    queryFn: () => fetchSavedListings(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  return (
    <div className="p-4 max-w-4xl mx-auto text-left py-6 pb-24">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold text-content-muted hover:text-content-primary mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="flex items-center gap-2 mb-6">
        <Bookmark className="w-6 h-6 text-brand-primary" />
        <h1 className="text-xl font-bold text-content-primary">Saved Items</h1>
      </div>

      {loading ? (
        <ListingSkeleton count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => navigate('/')} />
      ) : savedItems.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-12 h-12 text-content-muted" />}
          title="No saved items yet"
          description="Heart items while browsing the feed to save them here for quick access."
          actionLabel="Browse For Sale Feed"
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedItems.map((item) => (
            <ListingCard key={item.id} listing={item} initialIsSaved={true} />
          ))}
        </div>
      )}
    </div>
  );
};
