import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface FeedStats {
  liveListings: number;
  openWanted: number;
  activeHalls: number;
  tradedThisMonth: number;
}

export function useFeedStats() {
  return useQuery<FeedStats | null>({
    queryKey: ['feedStats'],
    queryFn: async () => {
      try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        
        const [listingsRes, wantedRes, tradedRes] = await Promise.all([
          supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('wanted_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'sold').gte('updated_at', startOfMonth)
        ]);
        
        // Return 22 as static active halls for now since we can't easily count distinct without RPC
        return {
          liveListings: listingsRes.count || 0,
          openWanted: wantedRes.count || 0,
          activeHalls: 22,
          tradedThisMonth: tradedRes.count || 0,
        };
      } catch (e) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
