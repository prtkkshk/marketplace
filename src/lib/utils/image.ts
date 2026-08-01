import { supabase } from '../supabase';

export const CATEGORY_FALLBACK_PHOTOS: Record<string, string> = {
  cycles: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  books: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  electronics: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
  room_essentials: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  lab_gear: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
  other: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
};

export const DEFAULT_FALLBACK_PHOTO = CATEGORY_FALLBACK_PHOTOS.cycles;

export function getCategoryFallback(category?: string | null): string {
  if (!category) return DEFAULT_FALLBACK_PHOTO;
  return CATEGORY_FALLBACK_PHOTOS[category] || DEFAULT_FALLBACK_PHOTO;
}

/**
 * Resolves a storage photo path or array of paths to a full public URL from Supabase Storage.
 * Handles full HTTP URLs, relative paths, category fallbacks, and empty/missing paths.
 */
export function getPhotoPublicUrl(photoPath?: string | null, category?: string | null): string {
  const fallback = getCategoryFallback(category);
  if (!photoPath || photoPath.trim() === '') return fallback;
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  const cleanPath = photoPath.replace(/^\/+/, '');
  const { data } = supabase.storage.from('listing-photos').getPublicUrl(cleanPath);
  return data.publicUrl || fallback;
}

export function getPhotoPublicUrls(photoPaths?: string[] | null, category?: string | null): string[] {
  const fallback = getCategoryFallback(category);
  if (!photoPaths || photoPaths.length === 0) {
    return [fallback];
  }
  return photoPaths.map((p) => getPhotoPublicUrl(p, category));
}
