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

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const optimisticUpdateFn = (oldData: any) => {
 if (!oldData) return oldData;
 if (Array.isArray(oldData)) {
 return oldData.map((item: WantedRequestItem) =>
 item.id === variables.requestId
 ? { ...item, status: variables.isFulfilled ? 'open' : 'fulfilled' }
 : item
 );
 }
 if (oldData.data && Array.isArray(oldData.data)) {
 return {
 ...oldData,
 data: oldData.data.map((item: WantedRequestItem) =>
 item.id === variables.requestId
 ? { ...item, status: variables.isFulfilled ? 'open' : 'fulfilled' }
 : item
 ),
 };
 }
 return oldData;
 };

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 queryClient.setQueriesData<any>({ queryKey: ['wantedRequests'] }, optimisticUpdateFn);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 queryClient.setQueriesData<any>({ queryKey: ['myWantedRequests'] }, optimisticUpdateFn);

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
