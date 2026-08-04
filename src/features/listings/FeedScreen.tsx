import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { SearchBar } from './SearchBar';
import { CategoryPills } from './CategoryPills';
import { SortDropdown } from './SortDropdown';
import { FilterSheet } from './FilterSheet';
import { AnnouncementBanner } from './AnnouncementBanner';
import { ListingCard } from './ListingCard';
import { ListingSkeleton } from './ListingSkeleton';
import { useListings, useActiveAnnouncement } from './useListings';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';
// removed useToast
import { SlidersHorizontal, PackageSearch, X } from 'lucide-react';
// Removed unused ListingItem import
import { FeedMasthead } from './FeedMasthead';

export const FeedScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // removed showToast

  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('cat') || '';
  const sort = (searchParams.get('sort') as 'newest' | 'price_asc' | 'price_desc') || 'newest';
  const condition = searchParams.get('cond') || undefined;
  const isNegotiable = searchParams.get('neg') === 'true';
  const hall = searchParams.get('hall') || undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;

  const updateUrlParams = useCallback((newParams: Record<string, string | undefined | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    setSearchParams(next, { replace: true });
    setPage(1);
  }, [searchParams, setSearchParams]);

  const { data: announcement } = useActiveAnnouncement();
  const { data, isLoading, isError, error, refetch, isFetching } = useListings({
    category: selectedCategory,
    search: searchQuery,
    sort,
    condition,
    isNegotiable,
    hall,
    maxPrice,
    page,
    limit: 20,
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && data?.hasMore && !isLoading && !isFetching) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '400px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [data?.hasMore, isLoading, isFetching]);

  const activeFilterCount = [condition, isNegotiable, hall, maxPrice].filter(Boolean).length;

  const removeFilter = (key: string) => {
    updateUrlParams({ [key]: undefined });
  };

  const clearAllFilters = () => {
    updateUrlParams({ cond: undefined, neg: undefined, hall: undefined, maxPrice: undefined });
  };

  return (
    <PageContainer className="py-0 md:py-4 text-left flex flex-col h-full">
      <AnnouncementBanner announcement={announcement || null} />
      
      <FeedMasthead />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6 pt-3 md:pt-0">
        <SearchBar
          value={searchQuery}
          onChange={(q) => updateUrlParams({ q: q || undefined })}
          className="md:hidden"
        />

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <CategoryPills
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => updateUrlParams({ cat: cat || undefined })}
            className="flex-1"
          />

          <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t border-line md:border-none">
            {/* Mobile Result Count (removed totalCount) */}
            <div className="md:hidden text-xs font-semibold text-ink-3">
              {data?.listings && data.listings.length > 0 ? 'Results found' : ''}
            </div>

            <div className="flex items-center gap-2">
              <SortDropdown
                value={sort}
                onChange={(s) => updateUrlParams({ sort: s })}
              />
              <button
                onClick={() => setIsFilterOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-surface text-[12.5px] font-medium text-ink hover:bg-surface-alt hover:border-line-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-brand" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center flex-wrap gap-2 mt-1">
            {condition && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-wash text-brand text-xs font-medium border border-brand-line">
                Condition: {condition}
                <button onClick={() => removeFilter('cond')} className="hover:text-brand-hover"><X className="w-3 h-3" /></button>
              </span>
            )}
            {hall && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-wash text-brand text-xs font-medium border border-brand-line">
                Hall: {hall}
                <button onClick={() => removeFilter('hall')} className="hover:text-brand-hover"><X className="w-3 h-3" /></button>
              </span>
            )}
            {isNegotiable && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-wash text-brand text-xs font-medium border border-brand-line">
                Negotiable
                <button onClick={() => removeFilter('neg')} className="hover:text-brand-hover"><X className="w-3 h-3" /></button>
              </span>
            )}
            {maxPrice && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-wash text-brand text-xs font-medium border border-brand-line">
                Up to ₹{maxPrice}
                <button onClick={() => removeFilter('maxPrice')} className="hover:text-brand-hover"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearAllFilters} className="text-xs font-medium text-brand hover:underline ml-1">
              Clear all
            </button>
          </div>
        )}
      </div>

      <FilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={{ condition, isNegotiable, hall, maxPrice }}
        onApply={(newFilters) =>
          updateUrlParams({
            cond: newFilters.condition,
            neg: newFilters.isNegotiable ? 'true' : undefined,
            hall: newFilters.hall,
            maxPrice: newFilters.maxPrice ? String(newFilters.maxPrice) : undefined,
          })
        }
        onReset={clearAllFilters}
      />

      {isLoading && page === 1 ? (
        <ListingSkeleton count={8} />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load campus feed'}
          onRetry={() => refetch()}
        />
      ) : !data?.listings || data.listings.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="w-12 h-12 text-ink-3" />}
          title="No listings found"
          description="Try broadening your search or clearing active filters to see more campus items."
          actionLabel="Clear All Filters"
          onAction={clearAllFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 lg:gap-5">
            {data.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          <div ref={observerTarget} className="mt-8 mb-4 h-10 w-full flex items-center justify-center">
            {data.hasMore && (
              <Button variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={isFetching}>
                {isFetching ? 'Loading...' : 'Load More Items'}
              </Button>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
};
