import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteListing } from '../data/listings';
import type { ListingItem } from '../data/listings';

export function useDeleteListingMutation() {
 const queryClient = useQueryClient();

 return useMutation({
 mutationFn: async (listingId: string) => {
 await deleteListing(listingId);
 },
 onMutate: async (listingId) => {
 await queryClient.cancelQueries({ queryKey: ['listings'] });
 await queryClient.cancelQueries({ queryKey: ['myListings'] });
 await queryClient.cancelQueries({ queryKey: ['savedItems'] });

 queryClient.setQueriesData({ queryKey: ['listings'] }, (oldData: unknown) => {
 if (!oldData) return oldData;
 if (Array.isArray(oldData)) {
 return oldData.filter((item: ListingItem) => item.id !== listingId);
 }
  if (typeof oldData === 'object' && oldData !== null && 'data' in oldData && Array.isArray((oldData as { data: unknown }).data)) {
    const typedData = oldData as { data: ListingItem[] };
    return {
      ...typedData,
      data: typedData.data.filter((item: ListingItem) => item.id !== listingId),
    };
 }
 return oldData;
 });

 queryClient.setQueriesData({ queryKey: ['myListings'] }, (oldData: unknown) => {
 if (!oldData) return oldData;
 if (Array.isArray(oldData)) {
 return oldData.filter((item: ListingItem) => item.id !== listingId);
 }
 return oldData;
 });

 queryClient.setQueriesData<ListingItem[]>({ queryKey: ['savedItems'] }, (oldData) => {
 if (!oldData) return oldData;
 return oldData.filter((item) => item.id !== listingId);
 });

 return { optimisticUpdated: true };
 },
 onError: () => {
 queryClient.invalidateQueries({ queryKey: ['listings'] });
 queryClient.invalidateQueries({ queryKey: ['myListings'] });
 queryClient.invalidateQueries({ queryKey: ['savedItems'] });
 },
 onSettled: () => {
 queryClient.invalidateQueries({ queryKey: ['listings'] });
 queryClient.invalidateQueries({ queryKey: ['myListings'] });
 queryClient.invalidateQueries({ queryKey: ['savedItems'] });
 },
 });
}
