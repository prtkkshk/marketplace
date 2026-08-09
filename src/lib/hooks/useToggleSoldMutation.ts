import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markListingSold, unmarkListingSold } from '../data/listings';
import type { ListingItem } from '../data/listings';

interface ToggleSoldVariables {
 listingId: string;
 isSold: boolean; // Current state before the toggle
}

export function useToggleSoldMutation() {
 const queryClient = useQueryClient();

 return useMutation({
 mutationFn: async ({ listingId, isSold }: ToggleSoldVariables) => {
 if (isSold) {
 return await unmarkListingSold(listingId);
 } else {
 return await markListingSold(listingId);
 }
 },
 onMutate: async (variables) => {
 // We will invalidate 'listings' and 'myListings', but let's do optimistic updates for those that we can easily find.
 // We cancel any outgoing refetches.
 await queryClient.cancelQueries({ queryKey: ['listings'] });
 await queryClient.cancelQueries({ queryKey: ['myListings'] });

 // We can't easily snapshot all variations of ['listings', { ... }] because it's a paginated/filtered query.
 // Instead, we can use setQueriesData to update any cache entry that contains this listing.
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 queryClient.setQueriesData<any>({ queryKey: ['listings'] }, (oldData: any) => {
 if (!oldData) return oldData;
 
 // If data is an array of listings (e.g. from useQuery)
 if (Array.isArray(oldData)) {
 return oldData.map((item: ListingItem) =>
 item.id === variables.listingId
 ? { ...item, status: variables.isSold ? 'active' : 'sold' }
 : item
 );
 }
 
 // If data is paginated { data: ListingItem[], count: number }
 if (oldData.data && Array.isArray(oldData.data)) {
 return {
 ...oldData,
 data: oldData.data.map((item: ListingItem) =>
 item.id === variables.listingId
 ? { ...item, status: variables.isSold ? 'active' : 'sold' }
 : item
 ),
 };
 }

 return oldData;
 });

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 queryClient.setQueriesData<any>({ queryKey: ['myListings'] }, (oldData: any) => {
 if (!oldData) return oldData;
 if (Array.isArray(oldData)) {
 return oldData.map((item: ListingItem) =>
 item.id === variables.listingId
 ? { ...item, status: variables.isSold ? 'active' : 'sold' }
 : item
 );
 }
 return oldData;
 });

 // No context needed to rollback if we are just going to invalidate anyway on error,
 // but returning a simple boolean to signify optimistic update happened.
 return { optimisticUpdated: true };
 },
 onError: () => {
 // In a real app we might revert the specific item, but invalidating is safer if we updated multiple caches loosely.
 queryClient.invalidateQueries({ queryKey: ['listings'] });
 queryClient.invalidateQueries({ queryKey: ['myListings'] });
 },
 onSettled: () => {
 queryClient.invalidateQueries({ queryKey: ['listings'] });
 queryClient.invalidateQueries({ queryKey: ['myListings'] });
 },
 });
}
