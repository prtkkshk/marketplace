import { Button } from '../../components/ui/Button';
import React, { useState, useEffect } from 'react';
import { fetchMyWantedRequests, type WantedRequestItem } from '../../lib/data/wantedRequests';
import { RequestCard } from './RequestCard';
import { ListingSkeleton } from '../listings/ListingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Megaphone } from 'lucide-react';

export const MyRequestsTab: React.FC<{ userId: string }> = ({ userId }) => {
 const [segment, setSegment] = useState<'open' | 'fulfilled'>('open');
 const [requests, setRequests] = useState<WantedRequestItem[]>([]);
 const [loading, setLoading] = useState<boolean>(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 setLoading(true);
 setError(null);

 fetchMyWantedRequests(userId, segment)
 .then((data) => setRequests(data))
 .catch((err) => setError(err.message))
 .finally(() => setLoading(false));
 }, [userId, segment]);

 return (
 <div className="flex flex-col gap-4 text-left">
 {/* Open / Fulfilled Segmented Control */}
 <div className="flex bg-surface-2 p-1 rounded-xl w-48 mx-auto border border-line">
 <button
 onClick={() => setSegment('open')}
 className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
 segment === 'open' ? 'bg-surface text-accent shadow-1 border border-line' : 'text-subtle'
 }`}
 >
 Open
 </button>
 <button
 onClick={() => setSegment('fulfilled')}
 className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
 segment === 'fulfilled' ? 'bg-surface text-accent shadow-1 border border-line' : 'text-subtle'
 }`}
 >
 Fulfilled
 </button>
 </div>

 {loading ? (
 <ListingSkeleton count={2} />
 ) : error ? (
 <ErrorState message={error} onRetry={() => setSegment(segment)} />
 ) : requests.length === 0 ? (
 <EmptyState
 icon={<Megaphone className="w-10 h-10 text-subtle" />}
 title={`No ${segment} wanted requests`}
 description={
 segment === 'open'
 ? 'You have no open requests on the Wanted Board.'
 : 'Requests you mark as fulfilled will appear here.'
 }
 action={<Button variant="secondary" onClick={() => (window.location.href = '/new-request')}>segment === 'open' ? 'Post a Request' : undefined</Button>}
 />
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {requests.map((item) => (
 <RequestCard key={item.id} request={item} />
 ))}
 </div>
 )}
 </div>
 );
};
