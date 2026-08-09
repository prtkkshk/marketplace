import { useQuery } from '@tanstack/react-query';
import { fetchWantedRequests, type FetchWantedRequestsParams } from '../../lib/data/wantedRequests';

export function useWantedRequests(params: FetchWantedRequestsParams) {
 return useQuery({
 queryKey: [
 'wantedRequests',
 {
 category: params.category || 'all',
 search: params.search || '',
 sort: params.sort || 'newest',
 page: params.page || 1,
 },
 ],
 queryFn: () => fetchWantedRequests(params),
 });
}
