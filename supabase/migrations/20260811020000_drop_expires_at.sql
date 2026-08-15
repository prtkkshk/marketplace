-- KGP Bazaar Migration: Drop expires_at
-- This removes the unused expires_at column from listings and wanted_requests,
-- drops the obsolete cron_expire_items function, and reloads the schema cache.

-- 1. Drop the dependent function first
DROP FUNCTION IF EXISTS public.cron_expire_items();

-- 2. Drop the column from both tables
ALTER TABLE public.listings DROP COLUMN IF EXISTS expires_at;
ALTER TABLE public.wanted_requests DROP COLUMN IF EXISTS expires_at;

-- 3. Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
