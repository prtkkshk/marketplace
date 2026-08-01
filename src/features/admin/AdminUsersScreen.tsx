import React, { useState, useEffect } from 'react';
import { fetchUsersList, updateUserAdminStatus, type AdminUserItem } from '../../lib/data/admin';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { KGP_HALLS } from '../../lib/constants';
import { Search, Shield, UserX, UserCheck, ShieldAlert } from 'lucide-react';

export const AdminUsersScreen: React.FC = () => {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [hallFilter, setHallFilter] = useState<string>('all');

  // User action state
  const [activeUser, setActiveUser] = useState<AdminUserItem | null>(null);
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'promote'>('ban');
  const [reasonNote, setReasonNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadUsers = async () => {
    setLoading(true);
    fetchUsersList(search, hallFilter)
      .then((data) => setUsers(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, hallFilter]);

  const openUserActionModal = (user: AdminUserItem, type: 'ban' | 'unban' | 'promote') => {
    if (user.isAdmin && (type === 'ban')) {
      showToast('Admins cannot be banned or demoted from the UI.', 'error');
      return;
    }
    setActiveUser(user);
    setActionType(type);
    setReasonNote('');
  };

  const handleConfirmUserAction = async () => {
    if (!activeUser || !session?.user?.id) return;
    if (actionType === 'ban' && !reasonNote.trim()) {
      showToast('Please provide a ban reason note', 'error');
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === 'ban') {
        await updateUserAdminStatus(activeUser, { isBanned: true }, reasonNote.trim(), session.user.id);
        showToast(`User ${activeUser.fullName} banned`, 'info');
      } else if (actionType === 'unban') {
        await updateUserAdminStatus(activeUser, { isBanned: false }, 'Unbanned by admin', session.user.id);
        showToast(`User ${activeUser.fullName} unbanned`, 'success');
      } else if (actionType === 'promote') {
        await updateUserAdminStatus(activeUser, { isAdmin: true }, 'Promoted to admin role', session.user.id);
        showToast(`User ${activeUser.fullName} promoted to Admin`, 'success');
      }
      setActiveUser(null);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="text-xs text-content-muted">Search, ban, unban, or promote student profiles</p>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, roll number, or email..."
            className="pl-9"
          />
        </div>

        <select
          value={hallFilter}
          onChange={(e) => setHallFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-surface-border rounded-xl text-sm font-medium text-content-primary shrink-0"
        >
          <option value="all">All Halls</option>
          {KGP_HALLS.map((h) => (
            <option key={h} value={h}>
              {h} Hall
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Spinner size={32} />
        </div>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-content-primary">No student profiles match your search.</p>
        </Card>
      ) : (
        <div className="bg-white border border-surface-border rounded-2xl overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-surface-border text-content-muted font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Roll Number</th>
                <th className="p-3">Hall</th>
                <th className="p-3">Status / Role</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-semibold text-content-primary">
                    {u.fullName}
                    <span className="block text-[10px] text-content-muted font-normal">{u.email}</span>
                  </td>
                  <td className="p-3 font-mono font-medium">{u.rollNumber}</td>
                  <td className="p-3">{u.hallOfResidence} Hall</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {u.isAdmin && <Badge variant="secondary">ADMIN</Badge>}
                      {u.isBanned ? <Badge variant="danger">BANNED</Badge> : <Badge variant="success">ACTIVE</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!u.isAdmin && !u.isBanned && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUserActionModal(u, 'ban')}
                          leftIcon={<UserX className="w-3.5 h-3.5 text-status-danger" />}
                        >
                          Ban
                        </Button>
                      )}

                      {!u.isAdmin && u.isBanned && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUserActionModal(u, 'unban')}
                          leftIcon={<UserCheck className="w-3.5 h-3.5 text-status-success" />}
                        >
                          Unban
                        </Button>
                      )}

                      {!u.isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openUserActionModal(u, 'promote')}
                          leftIcon={<Shield className="w-3.5 h-3.5" />}
                        >
                          Make Admin
                        </Button>
                      )}

                      {u.isAdmin && (
                        <span className="text-[10px] text-content-muted font-medium px-2 py-1 bg-slate-100 rounded-md">
                          Protected Admin
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Action Confirmation Sheet */}
      <Sheet isOpen={!!activeUser} onClose={() => setActiveUser(null)} title={`User Action: ${actionType.toUpperCase()}`}>
        <div className="flex flex-col gap-4 text-left py-2">
          <div className="p-3 bg-slate-100 rounded-xl text-xs font-semibold text-content-primary flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-primary" />
            <span>Target Student: {activeUser?.fullName} ({activeUser?.rollNumber})</span>
          </div>

          {actionType === 'ban' && (
            <Textarea
              label="Ban Reason (Required)"
              placeholder="Specify violation or incident reason..."
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              rows={3}
            />
          )}

          {actionType === 'promote' && (
            <p className="text-xs text-content-muted">
              Are you sure you want to grant full admin moderation rights to {activeUser?.fullName}?
            </p>
          )}

          <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-surface-border">
            <Button variant="outline" onClick={() => setActiveUser(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={actionLoading} onClick={handleConfirmUserAction}>
              Confirm {actionType}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
