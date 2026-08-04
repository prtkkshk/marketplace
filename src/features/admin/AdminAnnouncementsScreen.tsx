import React, { useState, useEffect } from 'react';
import {
  fetchAnnouncementsList,
  createAnnouncement,
  toggleAnnouncementActive,
  type AdminAnnouncementItem,
} from '../../lib/data/admin';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { timeAgo } from '../../lib/utils/timeAgo';
import { Megaphone, Plus, Power } from 'lucide-react';
import type { AnnouncementType } from '../../lib/database.types';

export const AdminAnnouncementsScreen: React.FC = () => {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<AdminAnnouncementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New announcement form state
  const [message, setMessage] = useState<string>('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    fetchAnnouncementsList()
      .then((data) => setAnnouncements(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    if (!message.trim()) {
      showToast('Announcement message cannot be empty', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAnnouncement(session.user.id, {
        message: message.trim(),
        type,
        isActive: true,
      });

      showToast('Announcement published to campus banner', 'success');
      setMessage('');
      loadAnnouncements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publish failed';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (item: AdminAnnouncementItem) => {
    if (!session?.user?.id) return;
    try {
      await toggleAnnouncementActive(item.id, !item.isActive, session.user.id);
      showToast(`Announcement ${!item.isActive ? 'activated' : 'deactivated'}`, 'info');
      loadAnnouncements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Toggle failed';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-xl font-bold text-ink">Campus Announcements</h1>
        <p className="text-xs text-ink-3">Publish broadcast banners displayed above student feeds</p>
      </div>

      {/* Creation Card */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-brand" />
          <span>Publish New Announcement</span>
        </h3>

        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <Textarea
            placeholder="Enter banner message for campus (max 200 characters)..."
            maxLength={200}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting}
            rows={2}
          />

          <div className="flex items-center gap-3">
            <div className="w-48">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as AnnouncementType)}
                options={[
                  { value: 'info', label: '🔵 Info Banner' },
                  { value: 'warning', label: '🟡 Warning Banner' },
                  { value: 'success', label: '🟢 Success Banner' },
                ]}
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Publish Announcement
            </Button>
          </div>
        </form>
      </Card>

      {/* Existing Announcements */}
      <h3 className="text-sm font-bold text-ink">Announcement History</h3>

      {loading ? (
        <div className="p-8 flex justify-center">
          <Spinner size={32} />
        </div>
      ) : announcements.length === 0 ? (
        <Card className="p-8 text-center">
          <Megaphone className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-ink">No announcements published yet.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((item) => (
            <Card key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant={item.type === 'warning' ? 'warning' : item.type === 'success' ? 'success' : 'primary'}>
                    {item.type.toUpperCase()}
                  </Badge>
                  {item.isActive ? <Badge variant="success">ACTIVE</Badge> : <Badge variant="muted">INACTIVE</Badge>}
                  <span className="text-[11px] text-ink-3">{timeAgo(item.createdAt)}</span>
                </div>
                <p className="text-xs font-semibold text-ink mt-1">{item.message}</p>
              </div>

              <Button
                variant={item.isActive ? 'outline' : 'primary'}
                size="sm"
                onClick={() => handleToggle(item)}
                leftIcon={<Power className="w-3.5 h-3.5" />}
              >
                {item.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
