import React from 'react';
import { Skeleton } from '../../components/ui/Skeleton';

export const ListingSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
 return (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 lg:gap-5">
 {Array.from({ length: count }).map((_, idx) => (
 <div key={idx} className="rounded-2xl border-2 border-line bg-surface overflow-hidden flex flex-col">
 <Skeleton className="aspect-square w-full rounded-none border-b-2 border-line" />
 <div className="p-3 flex-1 flex flex-col gap-3">
 <Skeleton className="h-[11px] w-3/4 rounded-sm" />
 <Skeleton className="h-[21px] w-1/3 rounded-sm" />
 <div className="flex gap-2">
 <Skeleton className="h-5 w-16 rounded" />
 <Skeleton className="h-5 w-16 rounded" />
 </div>
 <div className="mt-auto pt-2 border-t border-line flex justify-between items-center">
 <Skeleton className="h-3 w-16 rounded-sm" />
 <Skeleton className="h-3 w-10 rounded-sm" />
 </div>
 </div>
 </div>
 ))}
 </div>
 );
};
