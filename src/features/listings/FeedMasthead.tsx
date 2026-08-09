import React from 'react';
import { useFeedStats } from './useFeedStats';
import { Stat } from '../../components/ui/Stat';

export const FeedMasthead: React.FC = () => {
 const { data: stats } = useFeedStats();

 return (
 <div className="hidden md:flex flex-col gap-6 mb-8 mt-2 pb-8 border-b border-line">
 <div>
 <h1 className="font-display text-4xl text-ink">The Campus Feed</h1>
 <p className="text-sm text-subtle mt-1">Buy, sell, and trade within IIT Kharagpur.</p>
 </div>
 
 {stats && (
 <div className="flex items-center gap-12">
 <Stat value={stats.liveListings} label="Live Listings" />
 <Stat value={stats.openWanted} label="Open Wanted" />
 <Stat value={stats.activeHalls} label="Active Halls" />
 <Stat value={stats.tradedThisMonth} label="Traded This Month" />
 </div>
 )}
 </div>
 );
};
