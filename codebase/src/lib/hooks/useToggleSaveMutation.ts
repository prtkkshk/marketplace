import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleSavedItem } from '../data/saved_items';
import type { ListingItem } from '../data/listings';

interface ToggleSaveVariables {
  userId: string;
  listingId: string;
  previousState: boolean;
  listing?: ListingItem; // Pass the full listing so we can optimistically add it to savedItems
}

export function useToggleSaveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, listingId, previousState }: ToggleSaveVariables) => {
      return await toggleSavedItem(userId, listingId, previousState);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['savedItems'] });
      
      const previousSavedItems = queryClient.getQueryData<ListingItem[]>(['savedItems']);

      if (previousSavedItems) {
        if (variables.previousState) {
          // It was saved, now unsave it: remove from cache
          queryClient.setQueryData<ListingItem[]>(
            ['savedItems'],
            previousSavedItems.filter((item) => item.id !== variables.listingId)
          );
        } else if (variables.listing) {
          // It was not saved, now save it: add to cache
          queryClient.setQueryData<ListingItem[]>(
            ['savedItems'],
            [variables.listing, ...previousSavedItems]
          );
        }
      }

      return { previousSavedItems };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSavedItems) {
        queryClient.setQueryData(['savedItems'], context.previousSavedItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['savedItems'] });
    },
  });
}
