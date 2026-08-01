import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SegmentedControl } from './SegmentedControl';
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
import { useToast } from '../../components/ui/Toast';
import { SlidersHorizontal, PackageSearch } from 'lucide-react';
import type { ListingItem } from '../../lib/data/listings';

export const FeedScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  // Read URL query parameters
  const activeTab = (searchParams.get('tab') as 'sale' | 'wanted') || 'sale';
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('cat') || '';
  const sort = (searchParams.get('sort') as 'newest' | 'price_asc' | 'price_desc') || 'newest';
  const condition = searchParams.get('cond') || undefined;
  const isNegotiable = searchParams.get('neg') === 'true';
  const hall = searchParams.get('hall') || undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;

  // Helper to update URL search parameters cleanly
  const updateUrlParams = (newParams: Record<string, string | undefined | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    setSearchParams(next, { replace: true });
    setPage(1); // Reset pagination on filter change
  };

  // Queries
  const { data: announcement } = useActiveAnnouncement();
  const { data, isLoading, isError, error, refetch } = useListings({
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

  const handleTabChange = (tab: 'sale' | 'wanted') => {
    if (tab === 'wanted') {
      navigate('/wanted');
    } else {
      updateUrlParams({ tab: 'sale' });
    }
  };


  const handleReportClick = (listing: ListingItem) => {
    showToast(`Report submitted for "${listing.title}". Admin will review.`, 'info');
  };

  const activeFilterCount = [condition, isNegotiable, hall, maxPrice].filter(Boolean).length;

  return (
    <div className="p-4 max-w-5xl mx-auto text-left py-4">
      {/* Top Segmented Control (For Sale ↔ Wanted Board) */}
      <SegmentedControl activeSegment={activeTab} onChange={handleTabChange} />

      {/* Active Announcement Banner */}
      <AnnouncementBanner announcement={announcement || null} />

      {/* Search & Category Header */}
      <div className="flex flex-col gap-3 mb-4">
        <SearchBar
          value={searchQuery}
          onChange={(q) => updateUrlParams({ q: q || undefined })}
        />

        <CategoryPills
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => updateUrlParams({ cat: cat || undefined })}
        />

        {/* Filter Controls Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-border">
          <SortDropdown
            value={sort}
            onChange={(s) => updateUrlParams({ sort: s })}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(true)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-brand-primary text-white text-[10px]">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Sheet Modal */}
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
        onReset={() =>
          updateUrlParams({
            cond: undefined,
            neg: undefined,
            hall: undefined,
            maxPrice: undefined,
          })
        }
      />

      {/* Main Feed Content - 3 Async States */}
      {isLoading ? (
        <ListingSkeleton count={6} />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load campus feed'}
          onRetry={() => refetch()}
        />
      ) : !data?.listings || data.listings.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="w-12 h-12 text-content-muted" />}
          title="No listings found"
          description="Try broadening your search or clearing active filters to see more campus items."
          actionLabel="Clear All Filters"
          onAction={() => updateUrlParams({ q: undefined, cat: undefined, cond: undefined, neg: undefined, hall: undefined, maxPrice: undefined })}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onReportClick={handleReportClick}
              />
            ))}
          </div>

          {/* Pagination Load More */}
          {data.hasMore && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => setPage((prev) => prev + 1)}
              >
                Load More Items
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
