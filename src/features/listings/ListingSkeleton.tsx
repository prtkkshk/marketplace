import React from 'react';
import { Skeleton } from '../../components/ui/Skeleton';

export const ListingSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="rounded-2xl border border-surface-border bg-surface-card p-3.5 flex flex-col gap-3">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-3 w-12 rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl mt-1" />
        </div>
      ))}
    </div>
  );
};
