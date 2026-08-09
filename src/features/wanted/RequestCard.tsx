import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WantedRequestItem } from '../../lib/data/wantedRequests';
import { fetchRequesterContactNumber } from '../../lib/data/wantedRequests';
// formatINR removed
import { timeAgo } from '../../lib/utils/timeAgo';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { categoryLabel } from '../../lib/utils/categoryLabel';
import { MoreVertical, Flag, MapPin } from 'lucide-react';
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
 className={`relative rounded-2xl border border-line bg-surface p-5 shadow-hard flex flex-col text-left transition-all overflow-hidden ${
 isFulfilled ? 'opacity-60 bg-bg' : 'hover:border-line-strong hover:shadow-hard'
 }`}
 >
 {/* 3px Amber Left Rule */}
 <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-accent" />

 {/* Header Row */}
 <div className="flex items-start justify-between gap-4 mb-3">
 <div className="flex flex-col items-start gap-1">
 <Badge variant="default" className="mb-1">{categoryLabel(request.category)}</Badge>
 <Link
 to={`/request/${request.id}`}
 className="text-lg font-bold text-ink hover:text-accent transition-colors line-clamp-1"
 >
 {request.title}
 </Link>
 </div>
 
 <div className="shrink-0 text-right">
 <span className="text-[10px] font-bold text-subtle uppercase tracking-wider block mb-0.5">Budget</span>
 {request.maxBudget ? (
 <span className="text-price text-ink tabular-nums block">
 ₹{request.maxBudget.toLocaleString('en-IN')}
 </span>
 ) : (
 <span className="font-bold text-lg text-accent leading-none block opacity-80">
 Open
 </span>
 )}
 </div>
 </div>

 {/* Description */}
 {request.description && (
 <p className="text-[14px] text-muted line-clamp-2 leading-[1.6] mb-4">
 {request.description}
 </p>
 )}

 {/* Footer Meta Row */}
 <div className="mt-auto pt-4 border-t border-line flex items-center justify-between text-[12px] text-subtle mb-4">
 <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{request.requesterHall} Hall</span>
 <span>{timeAgo(request.createdAt)}</span>
 </div>

 {/* Full-width Button */}
 {isFulfilled ? (
 <Button variant="secondary" disabled className="w-full font-bold">
 Found & Fulfilled
 </Button>
 ) : (
 <Button
 variant="secondary"
 className="w-full font-bold h-11"
 disabled={isDisabled || isResponding}
 loading={isResponding}
 onClick={handleRespondTap}
 
 >
 I Have This!
 </Button>
 )}
 
 {/* Top Right Options Menu (absolute) */}
 <div className="absolute top-3 right-2">
 <button
 onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
 className="w-11 h-11 flex items-center justify-center rounded-md text-subtle hover:text-ink hover:bg-surface-2 transition-colors"
 aria-label="Options"
 >
 <MoreVertical className="w-4 h-4" />
 </button>
 {showMenu && (
 <div className="absolute right-0 top-8 bg-surface border border-line rounded-xl shadow-hard p-1 z-20 w-32">
 <button
 onClick={() => {
 setShowMenu(false);
 onReportClick?.(request);
 }}
 className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-danger hover:bg-danger-wash rounded-lg transition-colors"
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
