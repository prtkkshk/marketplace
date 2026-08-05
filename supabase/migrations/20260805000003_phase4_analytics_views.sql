-- Migration: Phase 4 Analytics & Admin KPIs
-- Adds columns and views required for the Admin KPI dashboard (Option A)

-- 1. Add tracking columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- 2. RPC to increment view count safely (bypasses RLS update restriction for non-owners)
CREATE OR REPLACE FUNCTION public.increment_listing_view(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.listings 
  SET view_count = view_count + 1 
  WHERE id = p_listing_id;
END;
$$;

-- 3. Admin KPI RPC: Returns aggregated metrics for the dashboard
-- We use an RPC instead of a view because we need to return a structured JSON object 
-- for easy consumption by the frontend admin.ts
CREATE OR REPLACE FUNCTION public.get_admin_kpis()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_dau integer;
  v_wau integer;
  v_total_views integer;
  v_total_contacts integer;
  v_conversion_rate numeric;
  v_listings_per_day json;
  v_fulfillment_rate numeric;
  v_total_requests integer;
  v_fulfilled_requests integer;
BEGIN
  -- DAU / WAU
  SELECT count(*) INTO v_dau FROM public.profiles WHERE last_active_at >= now() - interval '24 hours';
  SELECT count(*) INTO v_wau FROM public.profiles WHERE last_active_at >= now() - interval '7 days';

  -- View to Contact Conversion Rate
  SELECT sum(view_count) INTO v_total_views FROM public.listings;
  SELECT count(*) INTO v_total_contacts FROM public.contact_events WHERE listing_id IS NOT NULL;
  
  IF v_total_views > 0 THEN
    v_conversion_rate := ROUND((v_total_contacts::numeric / v_total_views::numeric) * 100, 2);
  ELSE
    v_conversion_rate := 0;
  END IF;

  -- Listings Posted Per Day (Last 7 Days)
  SELECT json_agg(row_to_json(t)) INTO v_listings_per_day
  FROM (
    SELECT date(created_at) as date, count(*) as count
    FROM public.listings
    WHERE created_at >= date_trunc('day', now() - interval '7 days')
    GROUP BY date(created_at)
    ORDER BY date(created_at) ASC
  ) t;

  -- Wanted Request Fulfillment Rate
  SELECT count(*) INTO v_total_requests FROM public.wanted_requests;
  
  -- A request is considered fulfilled if its status is 'fulfilled' AND a matching listing was posted after it
  SELECT count(*) INTO v_fulfilled_requests 
  FROM public.wanted_requests w
  WHERE w.status = 'fulfilled' 
  AND EXISTS (
    SELECT 1 FROM public.listings l 
    WHERE l.category = w.category 
    AND l.created_at >= w.created_at 
    AND (w.fulfilled_at IS NULL OR l.created_at <= w.fulfilled_at)
  );

  IF v_total_requests > 0 THEN
    v_fulfillment_rate := ROUND((v_fulfilled_requests::numeric / v_total_requests::numeric) * 100, 2);
  ELSE
    v_fulfillment_rate := 0;
  END IF;

  RETURN json_build_object(
    'dau', coalesce(v_dau, 0),
    'wau', coalesce(v_wau, 0),
    'viewToContactRate', coalesce(v_conversion_rate, 0),
    'listingsPerDay', coalesce(v_listings_per_day, '[]'::json),
    'wantedFulfillmentRate', coalesce(v_fulfillment_rate, 0)
  );
END;
$$;
