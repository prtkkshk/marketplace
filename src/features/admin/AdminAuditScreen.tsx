import React, { useState, useEffect } from 'react';
import { fetchAuditLogs, type AdminAuditRow } from '../../lib/data/admin';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { timeAgo } from '../../lib/utils/timeAgo';
import { FileText, ShieldAlert } from 'lucide-react';

export const AdminAuditScreen: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AdminAuditRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAuditLogs()
      .then((data) => setLogs(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Admin Audit Log</h1>
          <p className="text-xs text-ink-3">Immutable system audit log of all moderator and admin actions</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt border border-line rounded-xl text-[11px] font-bold text-ink">
          <ShieldAlert className="w-3.5 h-3.5 text-brand" />
          <span>Read-Only Audit Trail (No Delete Path)</span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Spinner size={32} />
        </div>
      ) : logs.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-10 h-10 text-ink-3 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-ink">No audit log entries recorded yet.</p>
        </Card>
      ) : (
        <div className="bg-surface border border-line rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-surface-alt border-b border-line text-ink-3 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Admin / Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target</th>
                <th className="p-3">Reason Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-alt transition-colors">
                  <td className="p-3 font-mono text-[11px] whitespace-nowrap">{timeAgo(log.createdAt)}</td>
                  <td className="p-3 font-bold text-ink">{log.adminName}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{log.action}</Badge>
                  </td>
                  <td className="p-3 font-mono text-[11px]">{log.targetType || 'system'}</td>
                  <td className="p-3 text-ink-3 max-w-xs truncate">{log.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
