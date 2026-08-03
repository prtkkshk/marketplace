import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteWantedRequest } from '../data/wantedRequests';
import type { WantedRequestItem } from '../data/wantedRequests';

export function useDeleteWantedRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      await deleteWantedRequest(requestId);
    },
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: ['wantedRequests'] });
      await queryClient.cancelQueries({ queryKey: ['myWantedRequests'] });

      const optimisticFilterFn = (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.filter((item: WantedRequestItem) => item.id !== requestId);
        }
        if (oldData.data && Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.filter((item: WantedRequestItem) => item.id !== requestId),
          };
        }
        return oldData;
      };

      queryClient.setQueriesData<any>({ queryKey: ['wantedRequests'] }, optimisticFilterFn);
      queryClient.setQueriesData<any>({ queryKey: ['myWantedRequests'] }, optimisticFilterFn);

      return { optimisticUpdated: true };
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['wantedRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myWantedRequests'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wantedRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myWantedRequests'] });
    },
  });
}
