import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchListings, fetchActiveAnnouncement, type FetchListingsParams } from '../../lib/data/listings';

export function useListings(params: Omit<FetchListingsParams, 'page'>) {
  return useInfiniteQuery({
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
      },
    ],
    queryFn: ({ pageParam }) => fetchListings({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => lastPage.hasMore ? allPages.length + 1 : undefined,
  });
}

export function useActiveAnnouncement() {
  return useQuery({
    queryKey: ['activeAnnouncement'],
    queryFn: () => fetchActiveAnnouncement(),
  });
}
