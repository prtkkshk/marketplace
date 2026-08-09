import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// removed PageContainer
import { SearchBar } from './SearchBar';
import { CategoryPills } from './CategoryPills';
import { SortDropdown } from './SortDropdown';
import { FilterSheet } from './FilterSheet';
import { FilterRail } from './FilterRail';
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
import { analytics } from '../../lib/analytics';
import { DesktopFeedShell } from '../../components/layout/DesktopFeedShell';

export const FeedScreen: React.FC = () => {
 const [searchParams, setSearchParams] = useSearchParams();
 const navigate = useNavigate();

 const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

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

 if (newParams.q !== undefined && newParams.q !== searchParams.get('q')) {
 analytics.track('search_performed', { query: newParams.q });
 }
 if (newParams.cat !== undefined && newParams.cat !== searchParams.get('cat')) {
 analytics.track('filter_applied', { filter: 'category', value: newParams.cat });
 }
 if (newParams.sort !== undefined && newParams.sort !== searchParams.get('sort')) {
 analytics.track('filter_applied', { filter: 'sort', value: newParams.sort });
 }

 setSearchParams(next, { replace: true });
 }, [searchParams, setSearchParams]);

 const { data: announcement } = useActiveAnnouncement();
 const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useListings({
 category: selectedCategory,
 search: searchQuery,
 sort,
 condition,
 isNegotiable,
 hall,
 maxPrice,
 limit: 20,
 });

 const allListings = data?.pages.flatMap((page) => page.listings) || [];
 const hasMore = hasNextPage;

 const observerTarget = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const observer = new IntersectionObserver(
 (entries) => {
 const entry = entries[0];
 if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
 fetchNextPage();
 }
 },
 { rootMargin: '400px' }
 );

 if (observerTarget.current) {
 observer.observe(observerTarget.current);
 }
 return () => observer.disconnect();
 }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

 const activeFilterCount = [condition, isNegotiable, hall, maxPrice].filter(Boolean).length;

 const removeFilter = (key: string) => {
 updateUrlParams({ [key]: undefined });
 };

 const clearAllFilters = () => {
 updateUrlParams({ cond: undefined, neg: undefined, hall: undefined, maxPrice: undefined });
 };

 return (
 <DesktopFeedShell
 sidebarContent={
 <FilterRail
 selectedCategory={selectedCategory}
 onSelectCategory={(cat) => updateUrlParams({ cat: cat || undefined })}
 condition={condition}
 onSelectCondition={(cond) => updateUrlParams({ cond: cond || undefined })}
 isNegotiable={isNegotiable}
 onToggleNegotiable={() => updateUrlParams({ neg: isNegotiable ? undefined : 'true' })}
 hall={hall}
 onSelectHall={(h) => updateUrlParams({ hall: h || undefined })}
 maxPrice={maxPrice}
 onChangeMaxPrice={(price) => updateUrlParams({ maxPrice: price ? String(price) : undefined })}
 />
 }
 >
 <AnnouncementBanner announcement={announcement || null} />
 
 <FeedMasthead />

 {/* Toolbar */}
 <div className="flex flex-col gap-3 mb-6 pt-3 md:pt-0">
 <div className="flex gap-2 w-full">
 <SearchBar
 value={searchQuery}
 onChange={(q) => updateUrlParams({ q: q || undefined })}
 className="flex-1 min-w-0"
 />
 <SortDropdown
 value={sort}
 onChange={(s) => updateUrlParams({ sort: s })}
 className="shrink-0"
 />
 <Button
 variant="secondary"
 size="md"
 onClick={() => setIsFilterOpen(true)}
 className="lg:hidden shrink-0 px-3"
 aria-label="Filters"
 >
 <SlidersHorizontal className="w-4 h-4" />
 {activeFilterCount > 0 && (
 <span className="absolute top-1 right-1 w-2 h-2 rounded bg-accent" />
 )}
 </Button>
 </div>

 <CategoryPills
 selectedCategory={selectedCategory}
 onSelectCategory={(cat) => updateUrlParams({ cat: cat || undefined })}
 />

 {/* Active Filter Chips */}
 {activeFilterCount > 0 && (
 <div className="flex items-center flex-wrap gap-2 mt-1 lg:hidden">
 {condition && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-surface-2 text-ink text-xs font-bold border-[1.5px] border-ink">
 Cond: {condition}
 <button onClick={() => removeFilter('cond')} className="hover:text-danger"><X className="w-3 h-3" /></button>
 </span>
 )}
 {hall && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-surface-2 text-ink text-xs font-bold border-[1.5px] border-ink">
 Hall: {hall}
 <button onClick={() => removeFilter('hall')} className="hover:text-danger"><X className="w-3 h-3" /></button>
 </span>
 )}
 {isNegotiable && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-surface-2 text-ink text-xs font-bold border-[1.5px] border-ink">
 Negotiable
 <button onClick={() => removeFilter('neg')} className="hover:text-danger"><X className="w-3 h-3" /></button>
 </span>
 )}
 {maxPrice && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-surface-2 text-ink text-xs font-bold border-[1.5px] border-ink">
 Up to ₹{maxPrice}
 <button onClick={() => removeFilter('maxPrice')} className="hover:text-danger"><X className="w-3 h-3" /></button>
 </span>
 )}
 <button onClick={clearAllFilters} className="text-xs font-bold text-subtle hover:text-ink ml-1">
 Clear all
 </button>
 </div>
 )}
 
 <div className="text-xs font-bold text-subtle pt-1">
 {data?.pages[0]?.totalCount && data.pages[0].totalCount > 0 ? `${data.pages[0].totalCount} results found` : ''}
 </div>
 </div>

 <FilterSheet
 isOpen={isFilterOpen}
 onClose={() => setIsFilterOpen(false)}
 filters={{ condition, isNegotiable, hall, maxPrice }}
 onApply={(newFilters) => {
 analytics.track('filter_applied', {
 filter: 'complex',
 condition: newFilters.condition,
 isNegotiable: newFilters.isNegotiable,
 hall: newFilters.hall,
 maxPrice: newFilters.maxPrice
 });
 updateUrlParams({
 cond: newFilters.condition,
 neg: newFilters.isNegotiable ? 'true' : undefined,
 hall: newFilters.hall,
 maxPrice: newFilters.maxPrice ? String(newFilters.maxPrice) : undefined,
 });
 }}
 onReset={clearAllFilters}
 />

 {isLoading ? (
 <ListingSkeleton count={8} />
 ) : isError ? (
 <ErrorState
 message={error instanceof Error ? error.message : 'Failed to load campus feed'}
 onRetry={() => refetch()}
 />
 ) : allListings.length === 0 ? (
 <EmptyState
 icon={<PackageSearch className="w-12 h-12 text-subtle" />}
 title="No listings found"
 description="Try broadening your search or clearing active filters to see more campus items."
 action={
 <div className="flex gap-2">
 <Button variant="secondary" onClick={clearAllFilters}>Clear All Filters</Button>
 <Button variant="secondary" onClick={() => navigate('/wanted')}>Post to Wanted Board</Button>
 </div>
 }
 />
 ) : (
 <>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 lg:gap-5">
 {allListings.map((listing, index) => (
 <ListingCard key={listing.id} listing={listing} priority={index < 4} />
 ))}
 </div>

 <div ref={observerTarget} className="mt-8 mb-4 h-10 w-full flex items-center justify-center">
 {hasMore && (
 <Button variant="secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 {isFetchingNextPage ? 'Loading...' : 'Load More Items'}
 </Button>
 )}
 </div>
 </>
 )}
 </DesktopFeedShell>
 );
};
