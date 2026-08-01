import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchWantedRequestById,
  markWantedRequestFulfilled,
  unmarkWantedRequestFulfilled,
  deleteWantedRequest,
  fetchRequesterContactNumber,
  type WantedRequestItem,
} from '../../lib/data/wantedRequests';
import { formatINR } from '../../lib/utils/formatINR';
import { timeAgo } from '../../lib/utils/timeAgo';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { Sheet } from '../../components/ui/Sheet';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MessageCircle,
  Megaphone,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const RequestDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [request, setRequest] = useState<WantedRequestItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteSheet, setShowDeleteSheet] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetchWantedRequestById(id)
      .then((res) => setRequest(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <ErrorState message={error || 'Request not found'} onRetry={() => navigate('/wanted')} />
      </div>
    );
  }

  const isOwner = profile?.id === request.userId || isAdmin;
  const isFulfilled = request.status === 'fulfilled';

  const handleRespondTap = async () => {
    if (isFulfilled || actionLoading) return;
    setActionLoading(true);
    try {
      const result = await fetchRequesterContactNumber(request.id, request.title);
      window.open(result.whatsappDeepLink, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Contact failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFulfilled = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      if (isFulfilled) {
        const updated = await unmarkWantedRequestFulfilled(id);
        setRequest(updated);
        showToast('Request restored to open status', 'success');
      } else {
        const updated = await markWantedRequestFulfilled(id);
        setRequest(updated);
        showToast('Request marked as fulfilled', 'info');
      }
      await queryClient.invalidateQueries({ queryKey: ['wantedRequests'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await deleteWantedRequest(id);
      await queryClient.invalidateQueries({ queryKey: ['wantedRequests'] });
      showToast('Request deleted', 'info');
      navigate('/wanted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto text-left pb-24">
      {/* Top Back Navigation Bar */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold text-content-muted hover:text-content-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Header Banner */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-wash flex items-center justify-center text-brand-primary shrink-0">
          <Megaphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-content-primary">{request.title}</h1>
          <span className="text-xs text-content-muted">Posted {timeAgo(request.createdAt)}</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <Badge variant="secondary">{request.category}</Badge>
        {request.maxBudget ? (
          <Badge variant="success">Budget: Under {formatINR(request.maxBudget)}</Badge>
        ) : (
          <Badge variant="muted">Open Budget</Badge>
        )}
        {isFulfilled && <Badge variant="muted">FULFILLED</Badge>}
      </div>

      {/* Description Card */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-6">
        <h2 className="text-xs font-bold text-content-muted uppercase tracking-wider mb-2">Details</h2>
        <p className="text-sm text-content-primary whitespace-pre-line leading-relaxed">
          {request.description || 'No additional details specified.'}
        </p>
      </div>

      {/* Requester Info */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-content-muted block">Requested By</span>
          <span className="text-sm font-bold text-content-primary block">{request.requesterName}</span>
          <span className="text-xs text-content-muted">📍 {request.requesterHall} Hall</span>
        </div>
      </div>

      {/* Owner Management Controls */}
      {isOwner && (
        <div className="bg-slate-50 border border-surface-border rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFulfilled}
            isLoading={actionLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          >
            {isFulfilled ? 'Unmark as Fulfilled' : 'Mark as Found / Fulfilled'}
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteSheet(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Request
          </Button>
        </div>
      )}

      {/* Fixed Bottom Responder Bar */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-surface-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Button
              variant="primary"
              className="flex-1 bg-brand-primary font-bold"
              disabled={isFulfilled}
              isLoading={actionLoading}
              onClick={handleRespondTap}
              leftIcon={<MessageCircle className="w-5 h-5" />}
            >
              {isFulfilled ? 'Request Fulfilled' : 'I Have This! (WhatsApp)'}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Sheet */}
      <Sheet isOpen={showDeleteSheet} onClose={() => setShowDeleteSheet(false)} title="Delete Request">
        <div className="text-center py-4">
          <Trash2 className="w-10 h-10 text-status-danger mx-auto mb-3" />
          <h3 className="text-base font-bold text-content-primary mb-2">Delete this request?</h3>
          <p className="text-xs text-content-muted mb-6">
            This will remove "{request.title}" from the campus Wanted Board.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteSheet(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" isLoading={actionLoading} onClick={handleDelete}>
              Delete Request
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
