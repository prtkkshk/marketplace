import { Button } from '../../components/ui/Button';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { fetchSavedListings } from '../../lib/data/saved_items';
import { ListingCard } from '../listings/ListingCard';
import { ListingSkeleton } from '../listings/ListingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Bookmark } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../components/layout/PageContainer';

export const SavedItemsScreen: React.FC = () => {
 const { session } = useAuth();
 const navigate = useNavigate();

 const {
 data: savedItems = [],
 isLoading,
 error: queryError,
 } = useQuery({
 queryKey: ['savedItems'],
 queryFn: () => fetchSavedListings(session!.user!.id),
 enabled: !!session?.user?.id,
 });

 const error = queryError instanceof Error ? queryError.message : null;

 return (
 <PageContainer className="py-6 pb-24 text-left">


 <div className="flex items-center gap-2 mb-6">
 <Bookmark className="w-6 h-6 text-accent" />
 <h1 className="text-xl font-bold text-ink">Saved Items</h1>
 </div>

 {isLoading ? (
 <ListingSkeleton count={4} />
 ) : error ? (
 <ErrorState message={error} onRetry={() => navigate('/')} />
 ) : savedItems.length === 0 ? (
 <EmptyState
 icon={<Bookmark className="w-12 h-12 text-subtle" />}
 title="No saved items yet"
 description="Heart items while browsing the feed to save them here for quick access."
 action={<Button variant="secondary" onClick={() => navigate('/')}>Browse For Sale Feed</Button>}
 />
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {savedItems.map((item) => (
 <ListingCard key={item.id} listing={item} />
 ))}
 </div>
 )}
 </PageContainer>
 );
};
