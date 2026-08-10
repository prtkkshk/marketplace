import { supabase } from '../supabase';
import type { Database, ListingCategory, RequestStatus } from '../database.types';
import { whatsappLink } from '../utils/whatsappLink';

type WantedRequestRow = Database['public']['Tables']['wanted_requests']['Row'];
type SelectedWantedRequestRow = Pick<WantedRequestRow, 'id' | 'user_id' | 'title' | 'description' | 'category' | 'max_budget' | 'hall_of_residence' | 'status' | 'deleted_at' | 'created_at' | 'updated_at'>;

export interface WantedRequestItem {
 id: string;
 userId: string;
 title: string;
 description: string | null;
 category: ListingCategory;
 maxBudget: number | null;
 hallOfResidence: string;
 status: RequestStatus;
 deletedAt: string | null;
 createdAt: string;
 updatedAt: string;
 requesterName?: string;
 requesterHall?: string;
}

export interface FetchWantedRequestsParams {
 category?: string;
 search?: string;
 sort?: 'newest' | 'budget_desc' | 'budget_asc';
 page?: number;
 limit?: number;
}

export interface CreateWantedRequestData {
 title: string;
 description?: string;
 category: ListingCategory;
 maxBudget?: number | null;
 hallOfResidence: string;
}

export function mapWantedRequestRow(
  row: SelectedWantedRequestRow & { profiles?: { full_name: string | null; hall_of_residence: string | null } | null }
): WantedRequestItem {
 return {
 id: row.id,
 userId: row.user_id,
 title: row.title,
 description: row.description,
 category: row.category,
 maxBudget: row.max_budget,
 hallOfResidence: row.hall_of_residence,
 status: row.status,
 deletedAt: row.deleted_at,
 createdAt: row.created_at,
 updatedAt: row.updated_at,
 requesterName: row.profiles?.full_name || 'KGP Student',
 requesterHall: row.profiles?.hall_of_residence || row.hall_of_residence,
 };
}

/**
 * Fetches paginated wanted requests from Supabase.
 * NEVER selects whatsapp_number or private profile columns.
 */
export async function fetchWantedRequests(
 params: FetchWantedRequestsParams = {}
): Promise<{ requests: WantedRequestItem[]; hasMore: boolean }> {
 const page = params.page && params.page > 0 ? params.page : 1;
 const limit = params.limit && params.limit > 0 ? params.limit : 20;
 const from = (page - 1) * limit;
 const to = page * limit - 1;

 let query = supabase
 .from('wanted_requests')
 .select(
 'id, user_id, title, description, category, max_budget, hall_of_residence, status, deleted_at, created_at, updated_at, profiles!wanted_requests_user_id_fkey(full_name, hall_of_residence)'
 )
 .is('deleted_at', null);

 if (params.category && params.category !== 'all') {
 query = query.eq('category', params.category as ListingCategory);
 }

  if (params.search && params.search.trim() !== '') {
    const term = `%${params.search.trim()}%`;
    query = query.or(`title.ilike.${term},category.ilike.${term}`);
  }

 // Primary order by status to put 'open' before 'fulfilled'
 query = query.order('status', { ascending: false });

 if (params.sort === 'budget_desc') {
 query = query.order('max_budget', { ascending: false, nullsFirst: false });
 } else if (params.sort === 'budget_asc') {
 query = query.order('max_budget', { ascending: true, nullsFirst: false });
 } else {
 query = query.order('created_at', { ascending: false });
 }

 query = query.range(from, to);

 const { data, error } = await query;

 if (error) {
 throw new Error(`Failed to fetch wanted requests: ${error.message}`);
 }

 const requests = (data || []).map((row) => mapWantedRequestRow(row as unknown as Parameters<typeof mapWantedRequestRow>[0]));
 const hasMore = requests.length === limit;

 return { requests, hasMore };
}

/**
 * Fetches single wanted request by ID
 */
export async function fetchWantedRequestById(id: string): Promise<WantedRequestItem | null> {
 const { data, error } = await supabase
 .from('wanted_requests')
 .select(
 'id, user_id, title, description, category, max_budget, hall_of_residence, status, deleted_at, created_at, updated_at, profiles!wanted_requests_user_id_fkey(full_name, hall_of_residence)'
 )
 .eq('id', id)
 .is('deleted_at', null)
 .single();

 if (error) {
 if (error.code === 'PGRST116') return null;
 throw new Error(`Failed to fetch request: ${error.message}`);
 }

 return mapWantedRequestRow(data as unknown as SelectedWantedRequestRow & { profiles: { full_name: string | null; hall_of_residence: string | null } | null });
}

/**
 * Reveals requester's contact number via RPC and constructs WhatsApp link
 */
export async function fetchRequesterContactNumber(
 requestId: string,
 title: string
): Promise<{ phoneNumber: string; whatsappDeepLink: string }> {
 const { data, error } = await supabase.rpc('get_requester_number', {
 p_request_id: requestId,
 });

 if (error) {
 const msg = error.message.toLowerCase();
 if (msg.includes('banned')) {
 throw new Error('Your account is currently suspended from revealing contact numbers.');
 }
 if (msg.includes('rate limit')) {
 throw new Error('You have reached the contact limit (30 reveals per hour). Please try again later.');
 }
 if (msg.includes('open request')) {
 throw new Error('This request is no longer open for responses.');
 }
 throw new Error(`Failed to reveal requester contact: ${error.message}`);
 }

 if (!data) {
 throw new Error('No contact number returned for this requester.');
 }

 const phoneNumber = data as string;
 const message = `Hi! I saw your request "${title}" on KGP Bazaar Wanted Board. I have this item available!`;
 const deepLink = whatsappLink(phoneNumber, message);

 return {
 phoneNumber,
 whatsappDeepLink: deepLink,
 };
}

/**
 * Creates a new wanted request
 */
export async function createWantedRequest(
 userId: string,
 input: CreateWantedRequestData
): Promise<WantedRequestItem> {
 const { data, error } = await supabase
 .from('wanted_requests')
 .insert({
 user_id: userId,
 title: input.title,
 description: input.description || null,
 category: input.category,
 max_budget: input.maxBudget || null,
 hall_of_residence: input.hallOfResidence,
 status: 'open',
 })
 .select(
 'id, user_id, title, description, category, max_budget, hall_of_residence, status, deleted_at, created_at, updated_at'
 )
 .single();

 if (error) {
 throw new Error(`Failed to post wanted request: ${error.message}`);
 }

 return mapWantedRequestRow(data as unknown as SelectedWantedRequestRow & { profiles: { full_name: string | null; hall_of_residence: string | null } | null });
}

/**
 * Marks a wanted request as fulfilled
 */
export async function markWantedRequestFulfilled(id: string): Promise<WantedRequestItem> {
 const { data, error } = await supabase
 .from('wanted_requests')
 .update({ status: 'fulfilled' })
 .eq('id', id)
 .select(
 'id, user_id, title, description, category, max_budget, hall_of_residence, status, deleted_at, created_at, updated_at'
 )
 .single();

 if (error) {
 throw new Error(`Failed to mark request fulfilled: ${error.message}`);
 }

 return mapWantedRequestRow(data as unknown as SelectedWantedRequestRow & { profiles: { full_name: string | null; hall_of_residence: string | null } | null });
}

/**
 * Restores a fulfilled request back to open status
 */
export async function unmarkWantedRequestFulfilled(id: string): Promise<WantedRequestItem> {
 const { data, error } = await supabase
 .from('wanted_requests')
 .update({ status: 'open' })
 .eq('id', id)
 .select(
 'id, user_id, title, description, category, max_budget, hall_of_residence, status, deleted_at, created_at, updated_at'
 )
 .single();

 if (error) {
 throw new Error(`Failed to unmark request: ${error.message}`);
 }

 return mapWantedRequestRow(data as unknown as SelectedWantedRequestRow & { profiles: { full_name: string | null; hall_of_residence: string | null } | null });
}

/**
 * Deletes a wanted request
 */
export async function deleteWantedRequest(id: string): Promise<void> {
 const { error } = await supabase
 .from('wanted_requests')
 .update({ status: 'hidden', deleted_at: new Date().toISOString() })
 .eq('id', id);

 if (error) {
 throw new Error(`Failed to delete request: ${error.message}`);
 }
}

/**
 * Fetches wanted requests created by a student
 */
export async function fetchMyWantedRequests(
 userId: string,
 status?: 'open' | 'fulfilled'
): Promise<WantedRequestItem[]> {
 let query = supabase
 .from('wanted_requests')
 .select(
 'id, user_id, title, description, category, max_budget, hall_of_residence, status, deleted_at, created_at, updated_at'
 )
 .eq('user_id', userId)
 .is('deleted_at', null)
 .order('created_at', { ascending: false });

 if (status) {
 query = query.eq('status', status);
 }

 const { data, error } = await query;

 if (error) {
 throw new Error(`Failed to fetch my requests: ${error.message}`);
 }

 return (data || []).map((row) => mapWantedRequestRow(row as unknown as Parameters<typeof mapWantedRequestRow>[0]));
}
