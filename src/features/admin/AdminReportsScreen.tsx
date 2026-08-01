import React, { useState, useEffect } from 'react';
import {
  fetchReportsQueue,
  resolveReportAction,
  type AdminReportItem,
} from '../../lib/data/admin';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { timeAgo } from '../../lib/utils/timeAgo';
import { Flag, Eye, Trash2, CheckCircle2, UserX, AlertCircle } from 'lucide-react';

export const AdminReportsScreen: React.FC = () => {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  // Action Sheet state
  const [activeReport, setActiveReport] = useState<AdminReportItem | null>(null);
  const [actionType, setActionType] = useState<'hide' | 'delete' | 'dismiss' | 'ban'>('dismiss');
  const [reasonNote, setReasonNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadReports = async () => {
    setLoading(true);
    fetchReportsQueue(statusFilter, reasonFilter)
      .then((data) => setReports(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter, reasonFilter]);

  const openActionModal = (report: AdminReportItem, type: 'hide' | 'delete' | 'dismiss' | 'ban') => {
    setActiveReport(report);
    setActionType(type);
    setReasonNote('');
  };

  const handleConfirmAction = async () => {
    if (!activeReport || !session?.user?.id) return;
    if (!reasonNote.trim()) {
      showToast('Please provide a short reason note for the audit log', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await resolveReportAction(activeReport, actionType, reasonNote.trim(), session.user.id);
      showToast(`Action "${actionType}" completed successfully`, 'success');
      setActiveReport(null);
      loadReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Moderation Queue</h1>
          <p className="text-xs text-content-muted">Review reported listings and campus requests</p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-surface-border rounded-xl text-xs font-semibold text-content-primary"
          >
            <option value="pending">Pending Reports</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All Statuses</option>
          </select>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-surface-border rounded-xl text-xs font-semibold text-content-primary"
          >
            <option value="all">All Reasons</option>
            <option value="prohibited_item">Prohibited Item</option>
            <option value="misleading">Misleading</option>
            <option value="overpriced">Overpriced</option>
            <option value="spam">Spam</option>
            <option value="wrong_category">Wrong Category</option>
            <option value="inappropriate">Inappropriate</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Spinner size={32} />
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center">
          <Flag className="w-10 h-10 text-content-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-bold text-content-primary">No reports found</h3>
          <p className="text-xs text-content-muted mt-1">The moderation queue is clean for this filter.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <Card key={report.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedReports.includes(report.id)}
                  onChange={() => toggleSelect(report.id)}
                  className="mt-1 rounded text-brand-primary focus:ring-brand-light"
                />

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-content-primary">{report.targetTitle}</span>
                    <Badge variant={report.status === 'pending' ? 'danger' : 'muted'}>
                      {report.status.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary">{report.reason.replace('_', ' ')}</Badge>
                  </div>

                  <p className="text-xs text-content-muted">
                    Reported by <strong>{report.reporterName}</strong> • {timeAgo(report.createdAt)}
                  </p>

                  {report.details && (
                    <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-content-primary italic">
                      "{report.details}"
                    </div>
                  )}

                  {report.resolutionNote && (
                    <div className="mt-1 text-[11px] text-content-muted font-medium">
                      Note: {report.resolutionNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {report.status === 'pending' && (
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openActionModal(report, 'dismiss')}
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openActionModal(report, 'hide')}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Hide
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => openActionModal(report, 'delete')}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="bg-slate-900 hover:bg-black"
                    onClick={() => openActionModal(report, 'ban')}
                    leftIcon={<UserX className="w-3.5 h-3.5" />}
                  >
                    Ban Poster
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Moderation Action Sheet */}
      <Sheet isOpen={!!activeReport} onClose={() => setActiveReport(null)} title={`Action: ${actionType.toUpperCase()}`}>
        <div className="flex flex-col gap-4 text-left py-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Target: "{activeReport?.targetTitle}"</span>
          </div>

          <Textarea
            label="Resolution Note (Required for Audit Log)"
            placeholder="Explain why this action was taken..."
            maxLength={200}
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            rows={3}
          />

          <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-surface-border">
            <Button variant="outline" onClick={() => setActiveReport(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={actionLoading} onClick={handleConfirmAction}>
              Confirm {actionType}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
