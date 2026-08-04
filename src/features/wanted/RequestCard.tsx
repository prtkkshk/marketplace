import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WantedRequestItem } from '../../lib/data/wantedRequests';
import { fetchRequesterContactNumber } from '../../lib/data/wantedRequests';
// formatINR removed
import { timeAgo } from '../../lib/utils/timeAgo';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { categoryLabel } from '../../lib/utils/categoryLabel';
import { MessageCircle, MoreVertical, Flag } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export interface RequestCardProps {
  request: WantedRequestItem;
  onReportClick?: (request: WantedRequestItem) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, onReportClick }) => {
  const { showToast } = useToast();
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isResponding, setIsResponding] = useState<boolean>(false);

  const isFulfilled = request.status === 'fulfilled';
  const isCancelled = request.status === 'hidden' || request.status === 'expired';
  const isDisabled = isFulfilled || isCancelled;

  const handleRespondTap = async () => {
    if (isDisabled || isResponding) return;
    setIsResponding(true);

    try {
      const result = await fetchRequesterContactNumber(request.id, request.title);
      window.open(result.whatsappDeepLink, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to contact requester';
      showToast(msg, 'error');
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div
      className={`relative rounded-2xl border border-line bg-surface p-5 shadow-1 flex flex-col text-left transition-all overflow-hidden ${
        isFulfilled ? 'opacity-60 bg-slate-50' : 'hover:border-line-strong hover:shadow-2'
      }`}
    >
      {/* 3px Amber Left Rule */}
      <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-accent" />

      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex flex-col items-start gap-1">
          <Badge variant="secondary" className="mb-1">{categoryLabel(request.category)}</Badge>
          <Link
            to={`/request/${request.id}`}
            className="text-lg font-bold text-ink hover:text-accent transition-colors line-clamp-1"
          >
            {request.title}
          </Link>
        </div>
        
        <div className="shrink-0 text-right">
          <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block mb-0.5">Budget</span>
          {request.maxBudget ? (
             <span className="font-display text-[27px] text-accent leading-none block">
               <span className="text-lg mr-0.5">₹</span>{request.maxBudget.toLocaleString('en-IN')}
             </span>
          ) : (
             <span className="font-display text-[22px] text-accent leading-none block italic opacity-80">
               Open
             </span>
          )}
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <p className="text-[14px] text-ink-2 line-clamp-2 leading-[1.6] mb-4">
          {request.description}
        </p>
      )}

      {/* Footer Meta Row */}
      <div className="mt-auto pt-4 border-t border-line flex items-center justify-between text-[12px] text-ink-3 mb-4">
        <span>📍 {request.requesterHall} Hall</span>
        <span>{timeAgo(request.createdAt)}</span>
      </div>

      {/* Full-width Button */}
      {isFulfilled ? (
        <Button variant="ghost" disabled className="w-full font-bold">
          ✓ Found & Fulfilled
        </Button>
      ) : (
        <Button
          variant="whats"
          className="w-full font-bold h-11 bg-whats hover:bg-emerald-700"
          disabled={isDisabled || isResponding}
          isLoading={isResponding}
          onClick={handleRespondTap}
          leftIcon={<MessageCircle className="w-5 h-5" />}
        >
          I Have This!
        </Button>
      )}
      
      {/* Top Right Options Menu (absolute) */}
      <div className="absolute top-3 right-2">
        <button
          onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
          className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-alt transition-colors"
          aria-label="Options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-8 bg-surface border border-line rounded-xl shadow-md p-1 z-20 w-32">
            <button
              onClick={() => {
                setShowMenu(false);
                onReportClick?.(request);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-danger hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
