import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// removed PageContainer
import { SearchBar } from '../listings/SearchBar';
import { CategoryPills } from '../listings/CategoryPills';
import { RequestCard } from './RequestCard';
import { ListingSkeleton } from '../listings/ListingSkeleton';
import { useWantedRequests } from './useWantedRequests';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Megaphone, ArrowDownUp, Bike, BookOpen, Laptop, BedDouble, TestTube, Package } from 'lucide-react';
import type { WantedRequestItem } from '../../lib/data/wantedRequests';
import { CATEGORIES } from '../../lib/constants';
import { DesktopFeedShell } from '../../components/layout/DesktopFeedShell';
import { useAuth } from '../auth/AuthProvider';

// Map category icon names to components — eliminates the `import * as` wildcard
const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Bike,
  BookOpen,
  Laptop,
  BedDouble,
  TestTube,
  Package,
};

export const WantedBoardScreen: React.FC = () => {
 const [searchParams, setSearchParams] = useSearchParams();
 const navigate = useNavigate();
 const { showToast } = useToast();
 const { session } = useAuth();

 const [page, setPage] = useState<number>(1);

 const searchQuery = searchParams.get('q') || '';
 const selectedCategory = searchParams.get('cat') || '';
 const sort = (searchParams.get('sort') as 'newest' | 'budget_desc' | 'budget_asc') || 'newest';

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
 setPage(1);
 };

 const { data, isLoading, isError, error, refetch, isFetching } = useWantedRequests({
 category: selectedCategory,
 search: searchQuery,
 sort,
 page,
 limit: 20,
 });

 const handleReportClick = (request: WantedRequestItem) => {
 showToast(`Report submitted for request "${request.title}".`, 'info');
 };

 return (
 <DesktopFeedShell
 sidebarContent={
 <div className="flex flex-col">
 <h3 className="font-bold text-ink text-sm mb-3">Categories</h3>
 <ul className="space-y-1 text-sm mb-8">
 <li>
 <button
 type="button"
 onClick={() => updateUrlParams({ cat: undefined })}
 className={`w-full text-left rounded-lg px-3 py-2 -mx-3 cursor-pointer transition-colors ${
 !selectedCategory ? 'font-semibold text-accent bg-accent-wash' : 'text-muted hover:text-ink hover:bg-surface-2'
 }`}
 >
 All Categories
 </button>
 </li>
      {CATEGORIES.map(cat => {
        const IconComp = CATEGORY_ICON_MAP[cat.icon];
        return (
        <li key={cat.id}>
          <button
            type="button"
            onClick={() => updateUrlParams({ cat: cat.id })}
            className={`w-full flex items-center gap-2 text-left rounded-lg px-3 py-2 -mx-3 cursor-pointer transition-colors ${
              selectedCategory === cat.id ? 'font-semibold text-accent bg-accent-wash' : 'text-muted hover:text-ink hover:bg-surface-2'
            }`}
          >
            {IconComp && <IconComp className="w-4 h-4" />} {cat.label}
          </button>
        </li>
      )})}
 </ul>
 </div>
 }
 >
 
 {/* Masthead */}
 <div className="flex flex-col gap-6 mb-8 mt-2 pb-8 border-b border-line">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
 <div>
 <h1 className="font-display text-3xl font-extrabold text-ink tracking-tight mb-2">Wanted Board</h1>
 <p className="text-sm text-subtle mt-1">Can't find it in the feed? Ask the campus.</p>
 </div>
 <Button variant="primary" className="w-full md:w-auto font-bold bg-accent hover:bg-accent" onClick={() => {
 if (!session) {
 navigate('/auth/signin', { state: { from: { pathname: '/new-request' } } });
 } else {
 navigate('/new-request');
 }
 }}>
 Post a Request
 </Button>
 </div>
 </div>

 {/* Header controls */}
 <div className="flex flex-col gap-3 mb-6">
 <SearchBar
 value={searchQuery}
 onChange={(q) => updateUrlParams({ q: q || undefined })}
 placeholder="Search wanted books, cycles, lab gear..."
 />

 <div className="flex flex-col lg:hidden lg:items-center gap-3">
 <CategoryPills
 selectedCategory={selectedCategory}
 onSelectCategory={(cat) => updateUrlParams({ cat: cat || undefined })}
 className="flex-1"
 />

 <div className="flex items-center justify-between lg:justify-end gap-2 pt-2 md:pt-0 border-t border-line md:border-none">
 <div className="relative inline-flex items-center">
 <ArrowDownUp className="absolute left-3 w-3 h-3 text-subtle pointer-events-none" />
 <select
 value={sort}
 onChange={(e) => updateUrlParams({ sort: e.target.value })}
 className="pl-7 pr-8 py-1.5 bg-surface border border-line rounded text-[12.5px] font-medium text-ink focus-visible:ring-2 focus-visible:ring-accent/40 appearance-none cursor-pointer hover:border-line-strong hover:bg-surface-2 transition-colors"
 aria-label="Sort wanted requests"
 >
 <option value="newest">Newest First</option>
 <option value="budget_desc">Budget: High → Low</option>
 <option value="budget_asc">Budget: Low → High</option>
 </select>
 </div>
 </div>
 </div>
 </div>

 {/* Main Feed */}
 {isLoading && page === 1 ? (
 <ListingSkeleton count={4} />
 ) : isError ? (
 <ErrorState
 message={error instanceof Error ? error.message : 'Failed to load wanted requests'}
 onRetry={() => refetch()}
 />
 ) : !data?.requests || data.requests.length === 0 ? (
 <EmptyState
 icon={<Megaphone className="w-12 h-12 text-subtle" />}
 title="No wanted requests found"
 description="Be the first to post what item or textbook you are looking for on campus."
 action={<Button variant="secondary" onClick={() => {
 if (!session) {
 navigate('/auth/signin', { state: { from: { pathname: '/new-request' } } });
 } else {
 navigate('/new-request');
 }
 }}>Post a Request</Button>}
 />
 ) : (
 <>
 <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
 {data.requests.map((request) => (
 <RequestCard key={request.id} request={request} onReportClick={handleReportClick} />
 ))}
 </div>

 {data.hasMore && (
 <div className="mt-8 mb-4 h-10 w-full flex items-center justify-center">
 <Button variant="secondary" onClick={() => setPage((prev) => prev + 1)} disabled={isFetching}>
 {isFetching ? 'Loading...' : 'Load More Requests'}
 </Button>
 </div>
 )}
 </>
 )}
 </DesktopFeedShell>
 );
};
