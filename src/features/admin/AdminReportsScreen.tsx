import React, { useState, useEffect, useCallback } from 'react';
import {
 fetchReportsQueue,
 resolveReportAction,
 type AdminReportItem} from '../../lib/data/admin';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { timeAgo } from '../../lib/utils/timeAgo';
import { Flag, AlertCircle } from 'lucide-react';

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

 const loadReports = useCallback(async () => {
 setLoading(true);
 fetchReportsQueue(statusFilter, reasonFilter)
 .then((data) => setReports(data))
 .catch((err) => showToast(err.message, 'error'))
 .finally(() => setLoading(false));
 }, [statusFilter, reasonFilter, showToast]);

 useEffect(() => {
 loadReports();
 }, [loadReports]);

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
 <h1 className="text-xl font-bold text-ink">Moderation Queue</h1>
 <p className="text-xs text-subtle">Review reported listings and campus requests</p>
 </div>

 {/* Filter controls */}
 <div className="flex items-center gap-2">
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="px-3 py-1.5 bg-surface border border-line rounded-xl text-xs font-semibold text-ink"
 >
 <option value="pending">Pending Reports</option>
 <option value="resolved">Resolved</option>
 <option value="dismissed">Dismissed</option>
 <option value="all">All Statuses</option>
 </select>

 <select
 value={reasonFilter}
 onChange={(e) => setReasonFilter(e.target.value)}
 className="px-3 py-1.5 bg-surface border border-line rounded-xl text-xs font-semibold text-ink"
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
 <Flag className="w-10 h-10 text-subtle mx-auto mb-2 opacity-50" />
 <h3 className="text-base font-bold text-ink">No reports found</h3>
 <p className="text-xs text-subtle mt-1">The moderation queue is clean for this filter.</p>
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
 className="mt-1 rounded text-accent press"
 />

 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm font-bold text-ink">{report.targetTitle}</span>
 <Badge variant={report.status === 'pending' ? 'danger' : 'default'}>
 {report.status.toUpperCase()}
 </Badge>
 <Badge variant="default">{report.reason.replace('_', ' ')}</Badge>
 </div>

 <p className="text-xs text-subtle">
 Reported by <strong>{report.reporterName}</strong> • {timeAgo(report.createdAt)}
 </p>

 {report.details && (
 <div className="mt-1 p-2 bg-surface-2 border border-line rounded-lg text-xs text-ink">
 "{report.details}"
 </div>
 )}

 {report.resolutionNote && (
 <div className="mt-1 text-[11px] text-subtle font-medium">
 Note: {report.resolutionNote}
 </div>
 )}
 </div>
 </div>

 {/* Action Buttons */}
 {report.status === 'pending' && (
 <div className="flex items-center gap-1.5 flex-wrap shrink-0">
 <Button
 variant="secondary"
 size="sm"
 onClick={() => openActionModal(report, 'dismiss')}
 >
 Dismiss
 </Button>
 <Button
 variant="secondary"
 size="sm"
 onClick={() => openActionModal(report, 'hide')}
 
 >
 Hide
 </Button>
 <Button
 variant="secondary"
 size="sm"
 onClick={() => openActionModal(report, 'delete')}
 
 >
 Delete
 </Button>
 <Button
 variant="secondary"
 size="sm"
 className="bg-ink hover:bg-ink/80 text-white"
 onClick={() => openActionModal(report, 'ban')}
 
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
 <div className="p-3 bg-accent-wash border border-accent-wash rounded-xl text-xs text-accent font-medium flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 text-accent" />
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

 <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-line">
 <Button variant="secondary" onClick={() => setActiveReport(null)} disabled={actionLoading}>
 Cancel
 </Button>
 <Button variant="secondary" loading={actionLoading} onClick={handleConfirmAction}>
 Confirm {actionType}
 </Button>
 </div>
 </div>
 </Sheet>
 </div>
 );
};
