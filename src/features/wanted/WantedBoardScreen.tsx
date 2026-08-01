import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SegmentedControl } from '../listings/SegmentedControl';
import { SearchBar } from '../listings/SearchBar';
import { CategoryPills } from '../listings/CategoryPills';
import { RequestCard } from './RequestCard';
import { ListingSkeleton } from '../listings/ListingSkeleton';
import { useWantedRequests } from './useWantedRequests';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Megaphone } from 'lucide-react';
import type { WantedRequestItem } from '../../lib/data/wantedRequests';

export const WantedBoardScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [page, setPage] = useState<number>(1);

  const activeTab = (searchParams.get('tab') as 'sale' | 'wanted') || 'wanted';
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

  const { data, isLoading, isError, error, refetch } = useWantedRequests({
    category: selectedCategory,
    search: searchQuery,
    sort,
    page,
    limit: 20,
  });

  const handleTabChange = (tab: 'sale' | 'wanted') => {
    if (tab === 'sale') {
      navigate('/?tab=sale');
    } else {
      updateUrlParams({ tab: 'wanted' });
    }
  };

  const handleReportClick = (request: WantedRequestItem) => {
    showToast(`Report submitted for request "${request.title}".`, 'info');
  };

  return (
    <div className="p-4 max-w-5xl mx-auto text-left py-4">
      {/* Top Segmented Control */}
      <SegmentedControl activeSegment={activeTab} onChange={handleTabChange} />

      {/* Header controls */}
      <div className="flex flex-col gap-3 mb-6">
        <SearchBar
          value={searchQuery}
          onChange={(q) => updateUrlParams({ q: q || undefined })}
          placeholder="Search wanted books, cycles, lab gear..."
        />

        <CategoryPills
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => updateUrlParams({ cat: cat || undefined })}
        />

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-border">
          <div className="relative inline-flex items-center">
            <select
              value={sort}
              onChange={(e) => updateUrlParams({ sort: e.target.value })}
              className="px-3 py-1.5 min-h-[36px] bg-white border border-surface-border rounded-xl text-xs font-medium text-content-primary appearance-none cursor-pointer"
              aria-label="Sort wanted requests"
            >
              <option value="newest">Newest First</option>
              <option value="budget_desc">Budget: High → Low</option>
              <option value="budget_asc">Budget: Low → High</option>
            </select>
          </div>

          <Button variant="primary" size="sm" onClick={() => navigate('/new-request')}>
            + Post Wanted Request
          </Button>
        </div>
      </div>

      {/* Main Feed */}
      {isLoading ? (
        <ListingSkeleton count={4} />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load wanted requests'}
          onRetry={() => refetch()}
        />
      ) : !data?.requests || data.requests.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-12 h-12 text-content-muted" />}
          title="No wanted requests found"
          description="Be the first to post what item or textbook you are looking for on campus."
          actionLabel="Post a Wanted Request"
          onAction={() => navigate('/new-request')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.requests.map((request) => (
              <RequestCard key={request.id} request={request} onReportClick={handleReportClick} />
            ))}
          </div>

          {data.hasMore && (
            <div className="mt-8 text-center">
              <Button variant="outline" onClick={() => setPage((prev) => prev + 1)}>
                Load More Requests
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
