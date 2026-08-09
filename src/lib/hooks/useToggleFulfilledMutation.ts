import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markWantedRequestFulfilled, unmarkWantedRequestFulfilled } from '../data/wantedRequests';
import type { WantedRequestItem } from '../data/wantedRequests';

interface ToggleFulfilledVariables {
 requestId: string;
 isFulfilled: boolean; // Current state before the toggle
}

export function useToggleFulfilledMutation() {
 const queryClient = useQueryClient();

 return useMutation({
 mutationFn: async ({ requestId, isFulfilled }: ToggleFulfilledVariables) => {
 if (isFulfilled) {
 return await unmarkWantedRequestFulfilled(requestId);
 } else {
 return await markWantedRequestFulfilled(requestId);
 }
 },
 onMutate: async (variables) => {
 await queryClient.cancelQueries({ queryKey: ['wantedRequests'] });
 await queryClient.cancelQueries({ queryKey: ['myWantedRequests'] });

 const optimisticUpdateFn = (oldData: unknown) => {
 if (!oldData) return oldData;
 if (Array.isArray(oldData)) {
 return oldData.map((item: WantedRequestItem) =>
 item.id === variables.requestId
 ? { ...item, status: variables.isFulfilled ? 'open' : 'fulfilled' }
 : item
 );
 }
 if (oldData && typeof oldData === 'object' && 'data' in oldData && Array.isArray((oldData as { data: unknown }).data)) {
 return {
 ...oldData,
 data: (oldData as { data: WantedRequestItem[] }).data.map((item: WantedRequestItem) =>
 item.id === variables.requestId
 ? { ...item, status: variables.isFulfilled ? 'open' : 'fulfilled' }
 : item
 ),
 };
 }
 return oldData;
 };

 queryClient.setQueriesData({ queryKey: ['wantedRequests'] }, optimisticUpdateFn);
 queryClient.setQueriesData({ queryKey: ['myWantedRequests'] }, optimisticUpdateFn);

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
