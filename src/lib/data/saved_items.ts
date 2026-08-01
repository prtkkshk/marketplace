import { supabase } from '../supabase';
import { mapListingRow, type ListingItem } from './listings';

export async function fetchSavedListingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_items')
    .select('listing_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching saved items IDs:', error.message);
    return [];
  }

  return (data || []).map((row) => row.listing_id);
}

export async function fetchSavedListings(userId: string): Promise<ListingItem[]> {
  const { data, error } = await supabase
    .from('saved_items')
    .select(
      'listing_id, listings!inner(id, user_id, title, description, category, price, is_negotiable, condition, photo_paths, hall_of_residence, status, is_pinned, sold_at, deleted_at, expires_at, created_at, updated_at, profiles!inner(full_name, hall_of_residence))'
    )
    .eq('user_id', userId)
    .is('listings.deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch saved listings: ${error.message}`);
  }

  return (data || []).map((row: any) => mapListingRow(row.listings));
}

export async function toggleSavedItem(
  userId: string,
  listingId: string,
  currentlySaved: boolean
): Promise<boolean> {
  if (currentlySaved) {
    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    if (error) throw new Error(`Failed to unsave item: ${error.message}`);
    return false;
  } else {
    const { error } = await supabase.from('saved_items').insert({
      user_id: userId,
      listing_id: listingId,
    });

    if (error) throw new Error(`Failed to save item: ${error.message}`);
    return true;
  }
}
