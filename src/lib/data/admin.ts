import { supabase } from '../supabase';
import type { ReportReason, ReportStatus, AnnouncementType } from '../database.types';

export interface DashboardStats {
  totalStudents: number;
  activeListings: number;
  soldListings: number;
  openRequests: number;
  pendingReports: number;
  signupsToday: number;
  signupsThisWeek: number;
  categoryDistribution: { category: string; count: number }[];
  hallDistribution: { hall: string; count: number }[];
  recentActivity: { id: string; type: string; title: string; time: string }[];
}

export interface AdminReportItem {
  id: string;
  reporterId: string;
  reporterName: string;
  listingId?: string | null;
  requestId?: string | null;
  targetTitle: string;
  posterId: string;
  posterName: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  resolutionNote: string | null;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  fullName: string;
  email: string;
  rollNumber: string;
  hallOfResidence: string;
  isBanned: boolean;
  isAdmin: boolean;
  bannedAt: string | null;
  banReason: string | null;
  createdAt: string;
  listingCount?: number;
}

export interface AdminAnnouncementItem {
  id: string;
  message: string;
  type: AnnouncementType;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminAuditRow {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  reason: string | null;
  createdAt: string;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [
    studentsRes,
    activeListingsRes,
    soldListingsRes,
    openRequestsRes,
    pendingReportsRes,
    allListingsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, created_at', { count: 'exact' }),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('wanted_requests').select('id', { count: 'exact', head: true }).eq('status', 'open').is('deleted_at', null),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('listings').select('category, hall_of_residence, created_at, title').is('deleted_at', null).order('created_at', { ascending: false }).limit(50),
  ]);

  const profiles = studentsRes.data || [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const signupsToday = profiles.filter((p) => new Date(p.created_at).getTime() >= todayStart).length;
  const signupsThisWeek = profiles.filter((p) => new Date(p.created_at).getTime() >= weekStart).length;

  const catMap: Record<string, number> = {};
  const hallMap: Record<string, number> = {};
  const listings = allListingsRes.data || [];

  listings.forEach((item) => {
    catMap[item.category] = (catMap[item.category] || 0) + 1;
    hallMap[item.hall_of_residence] = (hallMap[item.hall_of_residence] || 0) + 1;
  });

  const categoryDistribution = Object.entries(catMap).map(([category, count]) => ({ category, count }));
  const hallDistribution = Object.entries(hallMap).map(([hall, count]) => ({ hall, count }));

  const recentActivity = listings.slice(0, 5).map((item, idx) => ({
    id: `act_${idx}`,
    type: 'listing_created',
    title: `New item posted: "${item.title}" (${item.hall_of_residence} Hall)`,
    time: item.created_at,
  }));

  return {
    totalStudents: studentsRes.count || 0,
    activeListings: activeListingsRes.count || 0,
    soldListings: soldListingsRes.count || 0,
    openRequests: openRequestsRes.count || 0,
    pendingReports: pendingReportsRes.count || 0,
    signupsToday,
    signupsThisWeek,
    categoryDistribution,
    hallDistribution,
    recentActivity,
  };
}

export async function fetchReportsQueue(
  statusFilter: string = 'pending',
  reasonFilter?: string
): Promise<AdminReportItem[]> {
  let query = supabase
    .from('reports')
    .select(
      'id, reporter_id, listing_id, request_id, reason, details, status, resolution_note, created_at, profiles!reports_reporter_id_fkey(full_name), listings(user_id, title, profiles(full_name)), wanted_requests(user_id, title, profiles(full_name))'
    )
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter as ReportStatus);
  }

  if (reasonFilter && reasonFilter !== 'all') {
    query = query.eq('reason', reasonFilter as ReportReason);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch moderation queue: ${error.message}`);
  }

  return (data || []).map((row: any) => {
    const listing = row.listings;
    const request = row.wanted_requests;
    const targetTitle = listing?.title || request?.title || 'Unknown Item';
    const posterId = listing?.user_id || request?.user_id || '';
    const posterName = listing?.profiles?.full_name || request?.profiles?.full_name || 'KGP Student';

    return {
      id: row.id,
      reporterId: row.reporter_id,
      reporterName: row.profiles?.full_name || 'KGP Student',
      listingId: row.listing_id,
      requestId: row.request_id,
      targetTitle,
      posterId,
      posterName,
      reason: row.reason,
      details: row.details,
      status: row.status,
      resolutionNote: row.resolution_note,
      createdAt: row.created_at,
    };
  });
}

export async function resolveReportAction(
  report: AdminReportItem,
  action: 'hide' | 'delete' | 'dismiss' | 'ban',
  note: string,
  adminId: string
): Promise<void> {
  const newStatus: ReportStatus = action === 'dismiss' ? 'dismissed' : 'resolved';

  const { error: reportErr } = await supabase
    .from('reports')
    .update({
      status: newStatus,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
      resolution_note: note,
    })
    .eq('id', report.id);

  if (reportErr) throw new Error(reportErr.message);

  if (action === 'hide') {
    if (report.listingId) {
      await supabase.from('listings').update({ status: 'hidden' }).eq('id', report.listingId);
    } else if (report.requestId) {
      await supabase.from('wanted_requests').update({ status: 'cancelled' }).eq('id', report.requestId);
    }
  } else if (action === 'delete') {
    if (report.listingId) {
      await supabase.from('listings').update({ status: 'hidden', deleted_at: new Date().toISOString() }).eq('id', report.listingId);
    } else if (report.requestId) {
      await supabase.from('wanted_requests').update({ status: 'cancelled', deleted_at: new Date().toISOString() }).eq('id', report.requestId);
    }
  } else if (action === 'ban' && report.posterId) {
    await supabase.from('profiles').update({ is_banned: true, banned_at: new Date().toISOString(), ban_reason: note }).eq('id', report.posterId);
  }

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action: `report_${action}`,
    target_id: report.listingId || report.requestId || report.posterId || report.id,
    target_type: report.listingId ? 'listing' : report.requestId ? 'wanted_request' : 'user',
    reason: note,
  });
}

export async function fetchUsersList(searchQuery?: string, hallFilter?: string): Promise<AdminUserItem[]> {
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, roll_number, hall_of_residence, is_banned, is_admin, banned_at, ban_reason, created_at')
    .order('created_at', { ascending: false });

  if (hallFilter && hallFilter !== 'all') {
    query = query.eq('hall_of_residence', hallFilter);
  }

  if (searchQuery && searchQuery.trim() !== '') {
    const term = `%${searchQuery.trim()}%`;
    query = query.or(`full_name.ilike.${term},roll_number.ilike.${term},email.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    rollNumber: row.roll_number,
    hallOfResidence: row.hall_of_residence,
    isBanned: row.is_banned,
    isAdmin: row.is_admin,
    bannedAt: row.banned_at,
    banReason: row.ban_reason,
    createdAt: row.created_at,
  }));
}

export async function updateUserAdminStatus(
  targetUser: AdminUserItem,
  updates: { isBanned?: boolean; isAdmin?: boolean },
  reasonNote: string,
  adminId: string
): Promise<void> {
  if (targetUser.isAdmin && (updates.isBanned === true || updates.isAdmin === false)) {
    throw new Error('Admins cannot be banned or demoted through the moderation panel.');
  }

  const payload: any = {};
  if (updates.isBanned !== undefined) {
    payload.is_banned = updates.isBanned;
    payload.banned_at = updates.isBanned ? new Date().toISOString() : null;
    payload.ban_reason = updates.isBanned ? reasonNote : null;
  }
  if (updates.isAdmin !== undefined) {
    payload.is_admin = updates.isAdmin;
  }

  const { error } = await supabase.from('profiles').update(payload).eq('id', targetUser.id);

  if (error) throw new Error(error.message);

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action: updates.isBanned !== undefined ? (updates.isBanned ? 'user_ban' : 'user_unban') : 'user_promote',
    target_id: targetUser.id,
    target_type: 'user',
    reason: reasonNote,
  });
}

/**
 * Admin action on content (pin, hide, delete, restore, force mark sold)
 */
export async function updateListingAdminAction(
  listingId: string,
  action: 'pin' | 'unpin' | 'hide' | 'restore' | 'delete' | 'force_sold',
  reason: string,
  adminId: string
): Promise<void> {
  const payload: any = {};

  if (action === 'pin') payload.is_pinned = true;
  if (action === 'unpin') payload.is_pinned = false;
  if (action === 'hide') payload.status = 'hidden';
  if (action === 'restore') {
    payload.status = 'active';
    payload.deleted_at = null;
  }
  if (action === 'delete') {
    payload.status = 'hidden';
    payload.deleted_at = new Date().toISOString();
  }
  if (action === 'force_sold') {
    payload.status = 'sold';
    payload.sold_at = new Date().toISOString();
  }

  const { error } = await supabase.from('listings').update(payload).eq('id', listingId);
  if (error) throw new Error(error.message);

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action: `listing_${action}`,
    target_id: listingId,
    target_type: 'listing',
    reason,
  });
}

/**
 * Announcement creation and toggle
 */
export async function createAnnouncement(
  adminId: string,
  data: { message: string; type: AnnouncementType; startsAt?: string; endsAt?: string | null; isActive?: boolean }
): Promise<AdminAnnouncementItem> {
  const { data: res, error } = await supabase
    .from('announcements')
    .insert({
      message: data.message,
      type: data.type,
      starts_at: data.startsAt || new Date().toISOString(),
      ends_at: data.endsAt || null,
      is_active: data.isActive ?? true,
      created_by: adminId,
    })
    .select('id, message, type, starts_at, ends_at, is_active, created_at')
    .single();

  if (error) throw new Error(error.message);

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'announcement_create',
    target_id: res.id,
    target_type: 'announcement',
    reason: `Created ${data.type} announcement: "${data.message.substring(0, 30)}..."`,
  });

  return {
    id: res.id,
    message: res.message,
    type: res.type,
    startsAt: res.starts_at,
    endsAt: res.ends_at,
    isActive: res.is_active,
    createdAt: res.created_at,
  };
}

export async function fetchAnnouncementsList(): Promise<AdminAnnouncementItem[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('id, message, type, starts_at, ends_at, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row) => ({
    id: row.id,
    message: row.message,
    type: row.type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}

export async function toggleAnnouncementActive(
  announcementId: string,
  isActive: boolean,
  adminId: string
): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .update({ is_active: isActive })
    .eq('id', announcementId);

  if (error) throw new Error(error.message);

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action: isActive ? 'announcement_activate' : 'announcement_deactivate',
    target_id: announcementId,
    target_type: 'announcement',
    reason: `Toggled active status to ${isActive}`,
  });
}

/**
 * Audit log fetcher (Read-only)
 */
export async function fetchAuditLogs(): Promise<AdminAuditRow[]> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, admin_id, action, target_id, target_type, reason, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.id,
    adminId: row.admin_id,
    adminName: row.profiles?.full_name || 'Admin',
    action: row.action,
    targetId: row.target_id,
    targetType: row.target_type,
    reason: row.reason,
    createdAt: row.created_at,
  }));
}

export async function fetchAdminListings(statusFilter: string = 'all'): Promise<any[]> {
  let query = supabase
    .from('listings')
    .select('id, title, category, price, status, is_pinned, hall_of_residence, created_at, deleted_at, profiles(full_name)')
    .order('created_at', { ascending: false });

  if (statusFilter === 'active') query = query.eq('status', 'active').is('deleted_at', null);
  if (statusFilter === 'sold') query = query.eq('status', 'sold');
  if (statusFilter === 'hidden') query = query.eq('status', 'hidden').is('deleted_at', null);
  if (statusFilter === 'deleted') query = query.not('deleted_at', 'is', null);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}
