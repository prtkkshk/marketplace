import { supabase } from '../supabase';
import type { Database, ListingCategory, ItemCondition, ListingStatus } from '../database.types';

type ListingRow = Database['public']['Tables']['listings']['Row'];
type SelectedListingRow = Pick<ListingRow, 'id' | 'user_id' | 'title' | 'description' | 'category' | 'price' | 'is_negotiable' | 'condition' | 'photo_paths' | 'hall_of_residence' | 'status' | 'is_pinned' | 'sold_at' | 'deleted_at' | 'expires_at' | 'created_at' | 'updated_at'>;

export interface ListingItem {
 id: string;
 userId: string;
 title: string;
 description: string | null;
 category: ListingCategory;
 price: number;
 isNegotiable: boolean;
 condition: ItemCondition;
 photoPaths: string[];
 hallOfResidence: string;
 status: ListingStatus;
 isPinned: boolean;
 soldAt: string | null;
 deletedAt: string | null;
 expiresAt: string;
 createdAt: string;
 updatedAt: string;
 sellerName?: string;
 sellerHall?: string;
}

export interface AnnouncementItem {
 id: string;
 message: string;
 type: 'info' | 'warning' | 'success';
 startsAt: string;
 endsAt: string | null;
 isActive: boolean;
}

export interface FetchListingsParams {
 category?: string;
 search?: string;
 sort?: 'newest' | 'price_asc' | 'price_desc';
 condition?: string;
 isNegotiable?: boolean;
 hall?: string;
 maxPrice?: number;
 page?: number;
 limit?: number;
}

export interface CreateListingData {
 title: string;
 description?: string;
 category: ListingCategory;
 price: number;
 isNegotiable: boolean;
 condition: ItemCondition;
 photoPaths: string[];
 hallOfResidence: string;
}

export function mapListingRow(row: SelectedListingRow & { profiles?: { full_name: string | null; hall_of_residence: string | null } | null }): ListingItem {
 return {
 id: row.id,
 userId: row.user_id,
 title: row.title,
 description: row.description,
 category: row.category,
 price: row.price,
 isNegotiable: row.is_negotiable,
 condition: row.condition,
 photoPaths: row.photo_paths,
 hallOfResidence: row.hall_of_residence,
 status: row.status,
 isPinned: row.is_pinned,
 soldAt: row.sold_at,
 deletedAt: row.deleted_at,
 expiresAt: row.expires_at,
 createdAt: row.created_at,
 updatedAt: row.updated_at,
 sellerName: row.profiles?.full_name || 'KGP Student',
 sellerHall: row.profiles?.hall_of_residence || row.hall_of_residence,
 };
}

/**
 * Fetches paginated listings from Supabase matching active filters.
 * Excludes deleted listings and NEVER selects whatsapp_number or private profile details.
 */
export async function fetchListings(params: FetchListingsParams = {}): Promise<{ listings: ListingItem[]; hasMore: boolean; totalCount: number }> {
 const page = params.page && params.page > 0 ? params.page : 1;
 const limit = params.limit && params.limit > 0 ? params.limit : 20;
 const from = (page - 1) * limit;
 const to = page * limit - 1;

 let query = supabase
 .from('listings')
 .select(
 'id, user_id, title, description, category, price, is_negotiable, condition, photo_paths, hall_of_residence, status, is_pinned, sold_at, deleted_at, expires_at, created_at, updated_at, profiles!listings_user_id_fkey(full_name, hall_of_residence)',
 { count: 'exact' }
 )
 .is('deleted_at', null);

 if (params.search && params.search.trim() !== '') {
    const term = params.search.trim();
    const termLower = term.toLowerCase();
    const allCats = ['cycles', 'books', 'electronics', 'room_essentials', 'lab_gear', 'other'];
    const matchingCats = allCats.filter(c => c.includes(termLower));
    
    const titleFilter = `title.ilike.%${term}%`;
    const catFilter = matchingCats.length > 0 ? `category.in.(${matchingCats.join(',')})` : '';
    const orFilter = catFilter ? `${titleFilter},${catFilter}` : titleFilter;
    
    query = query.or(orFilter);
 }

 if (params.category && params.category !== 'all') {
 query = query.eq('category', params.category as ListingCategory);
 }

 if (params.condition && params.condition !== 'all') {
 query = query.eq('condition', params.condition as ItemCondition);
 }

 if (params.isNegotiable) {
 query = query.eq('is_negotiable', true);
 }

 if (params.hall && params.hall !== 'all') {
 query = query.eq('hall_of_residence', params.hall);
 }

 if (params.maxPrice !== undefined && params.maxPrice > 0) {
 query = query.lte('price', params.maxPrice);
 }

 // Primary order by pinned status
 query = query.order('is_pinned', { ascending: false });

 // Secondary order by status (active before sold, alphabetically a < s)
 query = query.order('status', { ascending: true });

 // Tertiary order by selected sort
 if (params.sort === 'price_asc') {
 query = query.order('price', { ascending: true });
 query = query.order('created_at', { ascending: false });
 } else if (params.sort === 'price_desc') {
 query = query.order('price', { ascending: false });
 query = query.order('created_at', { ascending: false });
 } else {
 query = query.order('created_at', { ascending: false });
 }

 query = query.range(from, to);

 const { data, error, count } = await query;

 if (error) {
 throw new Error(`Failed to fetch listings: ${error.message}`);
 }

 const listings = (data || []).map((row) => mapListingRow(row as unknown as Parameters<typeof mapListingRow>[0]));
 const hasMore = listings.length === limit;

 return { listings, hasMore, totalCount: count || 0 };
}

/**
 * Fetches listings owned by a specific student
 */
export async function fetchMyListings(userId: string, status?: 'active' | 'sold'): Promise<ListingItem[]> {
 let query = supabase
 .from('listings')
 .select('id, user_id, title, description, category, price, is_negotiable, condition, photo_paths, hall_of_residence, status, is_pinned, sold_at, deleted_at, expires_at, created_at, updated_at')
 .eq('user_id', userId)
 .is('deleted_at', null)
 .order('created_at', { ascending: false });

 if (status) {
 query = query.eq('status', status);
 }

 const { data, error } = await query;

 if (error) {
 throw new Error(`Failed to fetch my listings: ${error.message}`);
 }

 return (data || []).map((row) => mapListingRow(row as unknown as Parameters<typeof mapListingRow>[0]));
}

/**
 * Fetches a single listing by ID (never selecting phone number).
 */
export async function fetchListingById(id: string): Promise<ListingItem | null> {
 const { data, error } = await supabase
 .from('listings')
 .select(
 'id, user_id, title, description, category, price, is_negotiable, condition, photo_paths, hall_of_residence, status, is_pinned, sold_at, deleted_at, expires_at, created_at, updated_at, profiles!listings_user_id_fkey(full_name, hall_of_residence)'
 )
 .eq('id', id)
 .is('deleted_at', null)
 .single();

 if (error) {
 if (error.code === 'PGRST116') return null;
 throw new Error(`Failed to fetch listing: ${error.message}`);
 }

 return mapListingRow(data as unknown as SelectedListingRow & { profiles: { full_name: string | null; hall_of_residence: string | null } | null });
}

/**
 * Creates a new listing row in Supabase Postgres
 */
export async function createListing(userId: string, input: CreateListingData): Promise<ListingItem> {
 const { data, error } = await supabase
 .from('listings')
 .insert({
 user_id: userId,
 title: input.title,
 description: input.description || null,
 category: input.category,
 price: input.price,
 is_negotiable: input.isNegotiable,
 condition: input.condition,
 photo_paths: input.photoPaths,
 hall_of_residence: input.hallOfResidence,
 status: 'active',
 })
 .select('id, user_id, title, description, category, price, is_negotiable, condition, photo_paths, hall_of_residence, status, is_pinned, sold_at, deleted_at, expires_at, created_at, updated_at')
 .single();

 if (error) {
 throw new Error(`Failed to create listing: ${error.message}`);
 }

 return mapListingRow(data as unknown as SelectedListingRow & { profiles: { full_name: string | null; hall_of_residence: string | null } | null });
}

/**
 * Updates an existing listing (owner or admin only, enforced by RLS)
 */
export async function updateListing(id: string, updates: Partial<CreateListingData>): Promise<ListingItem> {
 const payload: Partial<ListingRow> = {};
 if (updates.title !== undefined) payload.title = updates.title;
 if (updates.description !== undefined) payload.description = updates.description || null;
 if (updates.category !== undefined) payload.category = updates.category;
 if (updates.price !== undefined) payload.price = updates.price;
 if (updates.isNegotiable !== undefined) payload.is_negotiable = updates.isNegotiable;
 if (updates.condition !== undefined) payload.condition = updates.condition;
 if (updates.photoPaths !== undefined) payload.photo_paths = updates.photoPaths;

 const { data, error } = await supabase
 .from('listings')
 .update(payload)
 .eq('id', id)
 .select('id, user_id, title, description, category, price, is_negotiable, condition, photo_paths, hall_of_residence, status, is_pinned, sold_at, deleted_at, expires_at, created_at, updated_at')
 .single();

 if (error) {
 throw new Error(`Failed to update listing: ${error.message}`);
 }

 return mapListingRow(data as unknown as SelectedListingRow & { profiles: { full_name: string | null; hall_of_residence: string | null } | null });
}

/**
 * Marks a listing as sold
 */
export async function markListingSold(id: string): Promise<ListingItem> {
 const { data, error } = await supabase
 .from('listings')
 .update({ status: 'sold', sold_at: new Date().toISOString() })
 .eq('id', id)
 .select('id, user_id, title, description, category, price, is_negotiable, condition, photo_paths, hall_of_residence, status, is_pinned, sold_at, deleted_at, expires_at, created_at, updated_at')
 .single();

 if (error) {
 throw new Error(`Failed to mark listing as sold: ${error.message}`);
 }

 return mapListingRow(data as unknown as SelectedListingRow & { profiles: { full_name: string | null; hall_of_residence: string | null } | null });
}

/**
 * Unmarks a listing as sold (restores to active status)
 */
export async function unmarkListingSold(id: string): Promise<ListingItem> {
 const { data, error } = await supabase
 .from('listings')
 .update({ status: 'active', sold_at: null })
 .eq('id', id)
 .select('id, user_id, title, description, category, price, is_negotiable, condition, photo_paths, hall_of_residence, status, is_pinned, sold_at, deleted_at, expires_at, created_at, updated_at')
 .single();

 if (error) {
 throw new Error(`Failed to unmark listing: ${error.message}`);
 }

 return mapListingRow(data as unknown as SelectedListingRow & { profiles: { full_name: string | null; hall_of_residence: string | null } | null });
}

/**
 * Deletes a listing (soft delete in DB + storage objects cleanup)
 */
export async function deleteListing(id: string): Promise<void> {
 const { error } = await supabase
 .from('listings')
 .update({ status: 'hidden', deleted_at: new Date().toISOString() })
 .eq('id', id);

 if (error) {
 throw new Error(`Failed to delete listing: ${error.message}`);
 }
}

/**
 * Fetches the currently active campus announcement, if any.
 */
export async function fetchActiveAnnouncement(): Promise<AnnouncementItem | null> {
 const now = new Date().toISOString();
 const { data, error } = await supabase
 .from('announcements')
 .select('id, message, type, starts_at, ends_at, is_active')
 .eq('is_active', true)
 .lte('starts_at', now)
 .order('created_at', { ascending: false })
 .limit(1)
 .maybeSingle();

 if (error) {
 console.error('Error fetching announcement:', error.message);
 return null;
 }

 if (!data) return null;

 return {
 id: data.id,
 message: data.message,
 type: data.type,
 startsAt: data.starts_at,
 endsAt: data.ends_at,
 isActive: data.is_active,
 };
}
