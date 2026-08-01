import { supabase } from '../supabase';

export const DEFAULT_FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80';

/**
 * Resolves a storage photo path or array of paths to a full public URL from Supabase Storage.
 * Handles full HTTP URLs, relative paths, and empty/missing paths.
 */
export function getPhotoPublicUrl(photoPath?: string | null): string {
  if (!photoPath) return DEFAULT_FALLBACK_PHOTO;
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  const { data } = supabase.storage.from('listing-photos').getPublicUrl(photoPath);
  return data.publicUrl || DEFAULT_FALLBACK_PHOTO;
}

export function getPhotoPublicUrls(photoPaths?: string[] | null): string[] {
  if (!photoPaths || photoPaths.length === 0) {
    return [DEFAULT_FALLBACK_PHOTO];
  }
  return photoPaths.map((p) => getPhotoPublicUrl(p));
}
