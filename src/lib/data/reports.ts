import { supabase } from '../supabase';
import type { Database, ReportReason } from '../database.types';

export interface CreateReportInput {
  listingId?: string;
  requestId?: string;
  reason: ReportReason;
  details?: string;
}

export async function createReport(reporterId: string, input: CreateReportInput): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    listing_id: input.listingId || null,
    request_id: input.requestId || null,
    reason: input.reason,
    details: input.details || null,
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already submitted a report for this item.');
    }
    throw new Error(`Failed to submit report: ${error.message}`);
  }
}

export async function fetchPendingReportsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching pending reports count:', error.message);
    return 0;
  }

  return count || 0;
}
