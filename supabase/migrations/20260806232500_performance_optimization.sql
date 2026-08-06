-- Migration: Performance Optimization for Feed Load
-- Adds composite indexes to support default feed sorting and optimizes RLS policies to force InitPlans.

-- 1. Index for the default feed view
CREATE INDEX IF NOT EXISTS idx_listings_feed_sort 
ON public.listings (is_pinned DESC, status ASC, created_at DESC) 
WHERE deleted_at IS NULL;

-- 2. Index for category-filtered feed view
CREATE INDEX IF NOT EXISTS idx_listings_category_feed_sort 
ON public.listings (category, is_pinned DESC, status ASC, created_at DESC) 
WHERE deleted_at IS NULL;

-- 3. Optimize RLS Policies to force InitPlans for stable function calls
-- This prevents Postgres from running the profiles subquery on every single row

-- Drop the slow listings select policy
DROP POLICY IF EXISTS "listings_select" ON public.listings;

-- Recreate with InitPlan wrapping (SELECT public.is_active_student())
CREATE POLICY "listings_select" ON public.listings
  FOR SELECT USING (
    (status = 'active' AND deleted_at IS NULL AND (SELECT public.is_active_student()))
    OR user_id = auth.uid()
    OR (SELECT public.is_admin())
  );

-- Optimize wanted_requests_select similarly
DROP POLICY IF EXISTS "wanted_requests_select" ON public.wanted_requests;
CREATE POLICY "wanted_requests_select" ON public.wanted_requests
  FOR SELECT USING (
    (status = 'open' AND deleted_at IS NULL AND (SELECT public.is_active_student()))
    OR user_id = auth.uid()
    OR (SELECT public.is_admin())
  );

-- Optimize profiles_select_public
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING ((SELECT public.is_active_student()));
