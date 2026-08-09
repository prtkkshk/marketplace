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

 const optimisticFilterFn = (oldData: unknown) => {
 if (!oldData) return oldData;
 if (Array.isArray(oldData)) {
 return oldData.filter((item: WantedRequestItem) => item.id !== requestId);
 }
 if (typeof oldData === 'object' && oldData !== null && 'data' in oldData && Array.isArray((oldData as { data: unknown }).data)) {
 return {
 ...oldData,
 data: (oldData as { data: WantedRequestItem[] }).data.filter((item: WantedRequestItem) => item.id !== requestId),
 };
 }
 return oldData;
 };

 queryClient.setQueriesData({ queryKey: ['wantedRequests'] }, optimisticFilterFn);
 queryClient.setQueriesData({ queryKey: ['myWantedRequests'] }, optimisticFilterFn);

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
