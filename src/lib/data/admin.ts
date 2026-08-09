import { supabase } from '../supabase';
import type {
  AnnouncementType,
  ReportReason,
  ReportStatus,
} from '../database.types';

export interface AdminStats {
  totalStudents: number;
  activeListingsCount: number;
  soldListingsCount: number;
  openRequestsCount: number;
  pendingReportsCount: number;
  signupsToday: number;
  signupsThisWeek: number;
  categoryBreakdown: Record<string, number>;
  hallBreakdown: Record<string, number>;
  recentListings: Array<{
    id: string;
    title: string;
    category: string;
    hallOfResidence: string;
    createdAt: string;
  }>;
}

export interface DashboardStats extends AdminStats {
  categoryDistribution: Array<{ category: string; count: number }>;
  hallDistribution: Array<{ hall: string; count: number }>;
  recentActivity: Array<{ action: string; time: string }>;
  kpis: {
    dau: number;
    wau: number;
    viewToContactRate: number;
    listingsPerDay: Array<{ date: string; count: number }>;
    wantedFulfillmentRate: number;
  };
}

export interface AdminReportItem {
  id: string;
  reporterId: string;
  reporterName?: string;
  listingId: string | null;
  requestId: string | null;
  targetTitle?: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  itemTitle?: string;
  itemCategory?: string;
  itemHall?: string;
  posterId?: string;
  posterName?: string;
  resolutionNote?: string | null;
}

export interface AdminUserItem {
  id: string;
  fullName: string | null;
  email: string;
  rollNumber: string | null;
  hallOfResidence: string | null;
  isBanned: boolean;
  isAdmin: boolean;
  bannedReason: string | null;
  createdAt: string;
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
  actorId: string | null;
  actorName?: string;
  adminName?: string;
  action: string;
  targetId: string | null;
  targetTable: string | null;
  targetType?: string | null;
  reason: string | null;
  createdAt: string;
}

export async function fetchAdminStats(): Promise<AdminStats> {
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
    supabase.from('listings').select('id, category, hall_of_residence, created_at, title').is('deleted_at', null).order('created_at', { ascending: false }).limit(50),
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

  return {
    totalStudents: studentsRes.count || 0,
    activeListingsCount: activeListingsRes.count || 0,
    soldListingsCount: soldListingsRes.count || 0,
    openRequestsCount: openRequestsRes.count || 0,
    pendingReportsCount: pendingReportsRes.count || 0,
    signupsToday,
    signupsThisWeek,
    categoryBreakdown: catMap,
    hallBreakdown: hallMap,
    recentListings: listings.slice(0, 10).map((l) => ({
      id: l.id,
      title: l.title,
      category: l.category,
      hallOfResidence: l.hall_of_residence,
      createdAt: l.created_at,
    })),
  };
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [stats, kpiRes] = await Promise.all([
    fetchAdminStats(),
    supabase.rpc('get_admin_kpis'),
  ]);
  
  const categoryDistribution = Object.entries(stats.categoryBreakdown).map(([category, count]) => ({
    category,
    count,
  }));
  const hallDistribution = Object.entries(stats.hallBreakdown).map(([hall, count]) => ({
    hall,
    count,
  }));
  const recentActivity = stats.recentListings.map((l) => ({
    action: `New listing: "${l.title}"`,
    time: l.createdAt,
  }));

  // Map raw data or fallback
  const rawKpis = kpiRes.data as { dau: number, wau: number, view_to_contact_rate: number, listings_per_day: { date: string; count: number }[], wanted_fulfillment_rate: number } | null | boolean;
  const kpis = (rawKpis && typeof rawKpis !== 'boolean') ? {
    dau: rawKpis.dau || 0,
    wau: rawKpis.wau || 0,
    viewToContactRate: rawKpis.view_to_contact_rate || 0,
    listingsPerDay: rawKpis.listings_per_day || [],
    wantedFulfillmentRate: rawKpis.wanted_fulfillment_rate || 0,
  } : {
    dau: 0,
    wau: 0,
    viewToContactRate: 0,
    listingsPerDay: [],
    wantedFulfillmentRate: 0,
  };

  return {
    ...stats,
    categoryDistribution,
    hallDistribution,
    recentActivity,
    kpis,
  };
}

export async function fetchAdminReports(statusFilter: ReportStatus = 'pending'): Promise<AdminReportItem[]> {
  return fetchReportsQueue(statusFilter);
}

export async function fetchReportsQueue(
  statusFilter: string = 'pending',
  reasonFilter: string = 'all'
): Promise<AdminReportItem[]> {
  let query = supabase
    .from('reports')
    .select(`
      id,
      reporter_id,
      listing_id,
      request_id,
      reason,
      details,
      status,
      resolution_note,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter as ReportStatus);
  }
  if (reasonFilter !== 'all') {
    query = query.eq('reason', reasonFilter as ReportReason);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: 'Student',
    listingId: row.listing_id,
    requestId: row.request_id,
    targetTitle: row.listing_id ? 'Listing' : row.request_id ? 'Wanted Request' : 'Item',
    reason: row.reason,
    details: row.details,
    status: row.status,
    resolutionNote: row.resolution_note,
    createdAt: row.created_at,
  }));
}

export async function resolveReportAction(
  report: AdminReportItem,
  action: 'hide' | 'delete' | 'dismiss' | 'ban',
  note: string,
  adminId: string
): Promise<void> {
  const newStatus: ReportStatus = action === 'dismiss' ? 'dismissed' : 'actioned';

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
      await supabase.from('wanted_requests').update({ status: 'hidden' }).eq('id', report.requestId);
    }
  } else if (action === 'delete') {
    if (report.listingId) {
      await supabase.from('listings').update({ status: 'hidden', deleted_at: new Date().toISOString() }).eq('id', report.listingId);
    } else if (report.requestId) {
      await supabase.from('wanted_requests').update({ status: 'hidden', deleted_at: new Date().toISOString() }).eq('id', report.requestId);
    }
  } else if (action === 'ban' && report.posterId) {
    await supabase.from('profiles').update({ is_banned: true, banned_reason: note }).eq('id', report.posterId);
  }

  await supabase.from('admin_audit_log').insert({
    actor_id: adminId,
    action: `report_${action}`,
    target_id: report.listingId || report.requestId || report.posterId || report.id,
    target_table: report.listingId ? 'listings' : report.requestId ? 'wanted_requests' : 'profiles',
    reason: note,
  });
}

export async function fetchUsersList(searchQuery?: string, hallFilter?: string): Promise<AdminUserItem[]> {
  const { data, error } = await supabase.rpc('get_admin_user_list', {
    p_search: searchQuery ?? null,
    p_limit: 1000,
    p_offset: 0
  });

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  let users = (data || []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    rollNumber: row.roll_number,
    hallOfResidence: row.hall_of_residence,
    isBanned: row.is_banned,
    isAdmin: row.is_admin,
    bannedReason: row.banned_reason,
    createdAt: row.created_at,
  }));

  if (hallFilter && hallFilter !== 'all') {
    users = users.filter((u) => u.hallOfResidence === hallFilter);
  }

  return users;
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

  const payload: Record<string, unknown> = {};
  if (updates.isBanned !== undefined) {
    payload.is_banned = updates.isBanned;
    payload.banned_reason = updates.isBanned ? reasonNote : null;
  }
  if (updates.isAdmin !== undefined) {
    payload.is_admin = updates.isAdmin;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('profiles').update(payload as any).eq('id', targetUser.id);

  if (error) throw new Error(error.message);

  await supabase.from('admin_audit_log').insert({
    actor_id: adminId,
    action: updates.isBanned !== undefined ? (updates.isBanned ? 'user_ban' : 'user_unban') : 'user_promote',
    target_id: targetUser.id,
    target_table: 'profiles',
    reason: reasonNote,
  });
}

export async function updateListingAdminAction(
  listingId: string,
  action: 'pin' | 'unpin' | 'hide' | 'restore' | 'delete' | 'force_sold',
  reason: string,
  adminId: string
): Promise<void> {
  if (action === 'delete') {
    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (error) throw new Error(error.message);
  } else {
    const payload: Record<string, unknown> = {};

    if (action === 'pin') payload.is_pinned = true;
    if (action === 'unpin') payload.is_pinned = false;
    if (action === 'hide') payload.status = 'hidden';
    if (action === 'restore') {
      payload.status = 'active';
      payload.deleted_at = null;
    }
    if (action === 'force_sold') {
      payload.status = 'sold';
      payload.sold_at = new Date().toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('listings').update(payload as any).eq('id', listingId);
    if (error) throw new Error(error.message);
  }

  await supabase.from('admin_audit_log').insert({
    actor_id: adminId,
    action: `listing_${action}`,
    target_id: listingId,
    target_table: 'listings',
    reason,
  });
}

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
    actor_id: adminId,
    action: 'announcement_create',
    target_id: res.id,
    target_table: 'announcements',
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
    actor_id: adminId,
    action: isActive ? 'announcement_activate' : 'announcement_deactivate',
    target_id: announcementId,
    target_table: 'announcements',
    reason: `Toggled active status to ${isActive}`,
  });
}

export async function fetchAuditLogs(): Promise<AdminAuditRow[]> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, actor_id, action, target_id, target_table, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return (data || []).map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorName: 'Admin',
    adminName: 'Admin',
    action: row.action,
    targetId: row.target_id,
    targetTable: row.target_table,
    targetType: row.target_table,
    reason: row.reason,
    createdAt: row.created_at,
  }));
}

export async function fetchAdminListings(statusFilter: string = 'all'): Promise<Array<{
  id: string;
  title: string;
  category: string;
  price: number;
  status: string;
  is_pinned: boolean;
  hall_of_residence: string;
  created_at: string;
  deleted_at: string | null;
}>> {
  let query = supabase
    .from('listings')
    .select('id, title, category, price, status, is_pinned, hall_of_residence, created_at, deleted_at')
    .order('created_at', { ascending: false });

  if (statusFilter === 'active') query = query.eq('status', 'active').is('deleted_at', null);
  if (statusFilter === 'sold') query = query.eq('status', 'sold');
  if (statusFilter === 'hidden') query = query.eq('status', 'hidden').is('deleted_at', null);
  if (statusFilter === 'deleted') query = query.not('deleted_at', 'is', null);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}
