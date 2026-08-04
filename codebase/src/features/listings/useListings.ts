import { useQuery } from '@tanstack/react-query';
import { fetchListings, fetchActiveAnnouncement, type FetchListingsParams } from '../../lib/data/listings';

export function useListings(params: FetchListingsParams) {
  return useQuery({
    queryKey: [
      'listings',
      {
        category: params.category || 'all',
        search: params.search || '',
        sort: params.sort || 'newest',
        condition: params.condition || 'all',
        isNegotiable: !!params.isNegotiable,
        hall: params.hall || 'all',
        maxPrice: params.maxPrice || 0,
        page: params.page || 1,
      },
    ],
    queryFn: () => fetchListings(params),
  });
}

export function useActiveAnnouncement() {
  return useQuery({
    queryKey: ['activeAnnouncement'],
    queryFn: () => fetchActiveAnnouncement(),
  });
}
