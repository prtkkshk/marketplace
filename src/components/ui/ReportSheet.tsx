import React, { useState } from 'react';
import { Sheet } from './Sheet';
import { Select } from './Select';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { createReport } from '../../lib/data/reports';
import { useAuth } from '../../features/auth/AuthProvider';
import { useToast } from './Toast';
import type { ReportReason } from '../../lib/database.types';
import { Flag, AlertCircle } from 'lucide-react';

export interface ReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  listingId?: string;
  requestId?: string;
  title: string;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'prohibited_item', label: 'Prohibited item (alcohol/drugs/weapons/academic paper/sublet)' },
  { value: 'misleading', label: 'Misleading or false description' },
  { value: 'overpriced', label: 'Extremely overpriced or suspicious price' },
  { value: 'spam', label: 'Spam or duplicate posting' },
  { value: 'wrong_category', label: 'Wrong category selection' },
  { value: 'inappropriate', label: 'Inappropriate image or text content' },
  { value: 'other', label: 'Other policy violation' },
];

export const ReportSheet: React.FC<ReportSheetProps> = ({
  isOpen,
  onClose,
  listingId,
  requestId,
  title,
}) => {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [reason, setReason] = useState<ReportReason>('prohibited_item');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      setError('You must be signed in to submit a report.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createReport(session.user.id, {
        listingId,
        requestId,
        reason,
        details: details.trim() || undefined,
      });

      showToast('Report submitted. Our student moderators will review it promptly.', 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit report';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Report Item">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left py-2">
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-status-danger">
          <Flag className="w-4 h-4 shrink-0" />
          <span>Reporting: "{title}"</span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-status-danger text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Select
          label="Reason for Report"
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
          options={REPORT_REASONS}
          disabled={isSubmitting}
        />

        <Textarea
          label="Additional Details (Optional, ≤200 chars)"
          placeholder="Provide any context for the admin team..."
          maxLength={200}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          disabled={isSubmitting}
          rows={3}
        />

        <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-surface-border">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" isLoading={isSubmitting}>
            Submit Report
          </Button>
        </div>
      </form>
    </Sheet>
  );
};
