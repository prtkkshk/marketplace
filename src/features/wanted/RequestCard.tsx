import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WantedRequestItem } from '../../lib/data/wantedRequests';
import { fetchRequesterContactNumber } from '../../lib/data/wantedRequests';
import { formatINR } from '../../lib/utils/formatINR';
import { timeAgo } from '../../lib/utils/timeAgo';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { MessageCircle, MoreVertical, Flag, Loader2, Megaphone } from 'lucide-react';

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
      // Immediately open WhatsApp deep link without storing or logging phone number
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
      className={`rounded-2xl border border-surface-border bg-surface-card p-4 shadow-xs flex flex-col justify-between text-left transition-all ${
        isFulfilled ? 'opacity-75 bg-slate-50' : 'hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-primary shrink-0" />
            <Link
              to={`/request/${request.id}`}
              className="text-base font-bold text-content-primary hover:text-brand-primary transition-colors line-clamp-1"
            >
              {request.title}
            </Link>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md text-content-muted hover:text-content-primary"
              aria-label="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white border border-surface-border rounded-xl shadow-md p-1 z-20 w-28">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onReportClick?.(request);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-status-danger hover:bg-rose-50 rounded-lg"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <Badge variant="secondary">{request.category}</Badge>
          {request.maxBudget ? (
            <Badge variant="success">Budget: Under {formatINR(request.maxBudget)}</Badge>
          ) : (
            <Badge variant="muted">Open Budget</Badge>
          )}
          {isFulfilled && <Badge variant="muted">FULFILLED</Badge>}
        </div>

        {/* Description */}
        {request.description && (
          <p className="text-xs text-content-primary line-clamp-2 leading-relaxed mb-3">
            {request.description}
          </p>
        )}

        {/* Requester & Time */}
        <div className="flex items-center justify-between text-[11px] text-content-muted mb-4">
          <span>📍 {request.requesterHall} Hall</span>
          <span>{timeAgo(request.createdAt)}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleRespondTap}
        disabled={isDisabled || isResponding}
        className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
          isDisabled
            ? 'bg-slate-100 text-content-muted cursor-not-allowed'
            : 'bg-brand-primary text-white hover:bg-brand-dark active:scale-[0.98]'
        }`}
      >
        {isResponding ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
        <span>{isFulfilled ? 'Request Fulfilled' : 'I Have This! (WhatsApp)'}</span>
      </button>
    </div>
  );
};
