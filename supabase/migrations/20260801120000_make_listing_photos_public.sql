-- KGP Bazaar Migration: 20260801120000_make_listing_photos_public.sql
-- Goal: Make listing-photos storage bucket public and update SELECT policy so browser <img> tags can fetch and render photos natively.

-- 1. Ensure listing-photos storage bucket exists and is set to public = true
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set public = true;

-- 2. Allow public unauthenticated SELECT policy for listing-photos bucket
drop policy if exists "listing_photos_select" on storage.objects;

create policy "listing_photos_select" on storage.objects
  for select using (bucket_id = 'listing-photos');
