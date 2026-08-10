import { Button } from '../../components/ui/Button';
import React, { useState, useEffect } from 'react';
import { fetchMyListings, type ListingItem } from '../../lib/data/listings';
import { ListingCard } from '../listings/ListingCard';
import { ListingSkeleton } from '../listings/ListingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { markListingSold } from '../../lib/data/listings';
import { useToast } from '../../components/ui/Toast';

export const MyListingsTab: React.FC<{ userId: string }> = ({ userId }) => {
 const [segment, setSegment] = useState<'active' | 'sold' | 'expired'>('active');
 const [allListings, setAllListings] = useState<ListingItem[]>([]);
 const [loading, setLoading] = useState<boolean>(true);
 const [error, setError] = useState<string | null>(null);
 const navigate = useNavigate();
 const { showToast } = useToast();

 const fetchAll = React.useCallback(() => {
 setLoading(true);
 setError(null);

 fetchMyListings(userId)
 .then((data) => setAllListings(data))
 .catch((err) => setError(err.message))
 .finally(() => setLoading(false));
 }, [userId]);

 useEffect(() => {
 fetchAll();
 }, [fetchAll]);

 const activeCount = allListings.filter((l) => l.status === 'active').length;
 const soldCount = allListings.filter((l) => l.status === 'sold').length;
 const expiredCount = allListings.filter((l) => l.status === 'expired').length;

 const listings = allListings.filter((l) => l.status === segment);

 return (
 <div className="flex flex-col gap-4 text-left">
 {/* Sub-filter chips */}
 <div className="flex gap-2 items-center overflow-x-auto pb-1 no-scrollbar">
 <button
 onClick={() => setSegment('active')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
 segment === 'active'
 ? 'bg-ink text-bg'
 : 'bg-surface border border-line text-subtle hover:text-ink hover:border-line-strong'
 }`}
 >
 Active <span className="font-normal">&middot; {activeCount}</span>
 </button>
 <button
 onClick={() => setSegment('sold')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
 segment === 'sold'
 ? 'bg-ink text-bg'
 : 'bg-surface border border-line text-subtle hover:text-ink hover:border-line-strong'
 }`}
 >
 Sold <span className="font-normal">&middot; {soldCount}</span>
 </button>
 <button
 onClick={() => setSegment('expired')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
 segment === 'expired'
 ? 'bg-ink text-bg'
 : 'bg-surface border border-line text-subtle hover:text-ink hover:border-line-strong'
 }`}
 >
 Expired <span className="font-normal">&middot; {expiredCount}</span>
 </button>
 </div>

 {loading ? (
 <ListingSkeleton count={2} />
 ) : error ? (
 <ErrorState message={error} onRetry={fetchAll} />
 ) : listings.length === 0 ? (
 <EmptyState
 icon={<ShoppingBag className="w-10 h-10 text-subtle" />}
 title={`No ${segment} listings`}
 description={
 segment === 'active'
 ? 'You have no active items listed for sale.'
 : segment === 'sold'
 ? 'Items you mark as sold will appear here.'
 : 'Listings expire automatically after 30 days.'
 }
 action={segment === 'active' ? <Button variant="secondary" onClick={() => (window.location.href = '/new')}>Post a Listing</Button> : undefined}
 />
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {listings.map((item) => (
 <ListingCard 
 key={item.id} 
 listing={item}
 isOwner={true}
 onEdit={() => navigate(`/listing/${item.id}/edit`)}
 onMarkSold={async () => {
 try {
 await markListingSold(item.id);
 setAllListings((prev) => prev.map(l => l.id === item.id ? { ...l, status: 'sold' } : l));
 showToast('Marked as sold', 'success');
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Failed to mark sold';
 showToast(msg, 'error');
 }
 }}
 />
 ))}
 </div>
 )}
 </div>
 );
};
