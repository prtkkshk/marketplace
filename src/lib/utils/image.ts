import { supabase } from '../supabase';

export const DEFAULT_FALLBACK_PHOTO: string =
 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80';

export const CATEGORY_FALLBACK_PHOTOS: Record<string, string> = {
 cycles: DEFAULT_FALLBACK_PHOTO,
 books: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
 electronics: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
 room_essentials: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
 lab_gear: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
 other: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
};

export function getCategoryFallback(category?: string | null): string {
 if (!category) return DEFAULT_FALLBACK_PHOTO;
 const match = CATEGORY_FALLBACK_PHOTOS[category];
 return match ?? DEFAULT_FALLBACK_PHOTO;
}

/**
 * Resolves a storage photo path or array of paths to a full public URL from Supabase Storage.
 * Handles full HTTP URLs, relative paths, category fallbacks, and empty/missing paths.
 */
export function getPhotoPublicUrl(photoPath?: string | null, category?: string | null): string {
 const fallback = getCategoryFallback(category);
 if (!photoPath || photoPath.trim() === '') return fallback;
 if (photoPath.startsWith('http://') || photoPath.startsWith('https://') || photoPath.startsWith('data:')) {
 return photoPath;
 }
 const cleanPath = photoPath.replace(/^\/+/, '');
 const { data } = supabase.storage.from('listing-photos').getPublicUrl(cleanPath);
 return data.publicUrl || fallback;
}

/**
 * Like getPhotoPublicUrl but appends Supabase Storage image transform params so the browser
 * receives an image at the actual rendered size instead of the full-resolution upload.
 *
 * Supabase Storage supports: ?width=N&quality=N&format=webp (via image transformation API).
 * A phone camera photo can be 3–12 MB. A ListingCard renders at ~180px on mobile and up to
 * ~300px on desktop. Serving 400px covers 2× DPR without over-fetching.
 *
 * Fallback Unsplash URLs already carry their own size params and are passed through unchanged.
 * Non-Supabase HTTP URLs are passed through unchanged (no transform support assumed).
 */
/**
 * Returns a display URL for a listing photo.
 *
 * NOTE: this deliberately does NOT append ?width=/quality=/format= parameters.
 *
 * A previous version did, on the assumption Supabase would resize server-side. It does not:
 * Supabase's image transformation API is served from
 *     /storage/v1/render/image/public/<bucket>/<path>?width=...
 * while getPublicUrl() returns
 *     /storage/v1/object/public/<bucket>/<path>
 * Query params on an /object/ URL are silently IGNORED, so the full-resolution file was
 * still being downloaded while the code looked like it was optimised. Transformations are
 * also a paid Pro feature, so switching to the render path would fail on the free tier.
 *
 * Photos are instead resized to a 1600px max edge at UPLOAD time in
 * src/utils/imageUtils.ts (stripExif), which is free, works on any plan, and keeps the
 * 500MB storage cap from filling with 4MB originals.
 *
 * The `width` argument is kept so call sites do not need changing, and so this reads as a
 * deliberate no-op rather than an oversight.
 */
export function getPhotoPublicUrlTransformed(
  photoPath?: string | null,
  category?: string | null
): string {
  return getPhotoPublicUrl(photoPath, category);
}

export function getPhotoPublicUrls(photoPaths?: string[] | null, category?: string | null): string[] {
 const fallback = getCategoryFallback(category);
 if (!photoPaths || photoPaths.length === 0) {
 return [fallback];
 }
 return photoPaths.map((p) => getPhotoPublicUrl(p, category));
}
