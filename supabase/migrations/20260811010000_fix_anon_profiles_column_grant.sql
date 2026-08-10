-- Migration: fix "failed to fetch listings" for anonymous visitors
-- Follows 20260811000000_public_read_access.sql — that migration added RLS *row*
-- policies for anon on profiles/listings/wanted_requests, but RLS only restricts what a
-- role is already allowed to touch. It does not grant access back.
--
-- sql/STAGE2C_FIX_v2_column_security.sql (SEC-05 fix) already revoked table-level SELECT
-- on public.profiles from BOTH authenticated and anon, then granted a safe column list
-- back to `authenticated` only:
--
--   revoke select on public.profiles from authenticated, anon;
--   grant select (id, full_name, hall_of_residence, is_profile_complete, is_admin, ...)
--     on public.profiles to authenticated;
--
-- anon was never granted anything back. So even with the new profiles_select_anon RLS
-- policy in place, any query that touches public.profiles as anon — including the
-- profiles!listings_user_id_fkey(full_name, hall_of_residence) embed that
-- src/lib/data/listings.ts and wantedRequests.ts use on every feed/detail fetch — hits a
-- real "permission denied for table profiles" error before RLS is even evaluated. That's
-- the exact failure being reported as "failed to fetch listings".
--
-- Fix: grant anon SELECT on exactly the columns the public feed/detail views need, and
-- nothing else. whatsapp_number, roll_number, email, banned_reason stay revoked for
-- anon — those never had a grant to begin with, this migration does not touch them.
--
--   id            — needed for the profiles!listings_user_id_fkey join predicate and
--                   for the seller/requester EXISTS lookup inside the new anon RLS
--                   policies (listings_select_anon, wanted_requests_select_anon).
--   is_banned     — needed because profiles_select_anon's USING clause and both EXISTS
--                   lookups read this column directly.
--   full_name, hall_of_residence — the only profile columns the feed/detail queries
--                   actually select (see src/lib/data/listings.ts, wantedRequests.ts).

grant select (id, full_name, hall_of_residence, is_banned) on public.profiles to anon;

-- =============================================================================
-- VERIFY (read-only). Paste this output back if the feed still doesn't load.
-- =============================================================================

select 'anon can read id, full_name, hall_of_residence, is_banned (want: all true)' as check_name,
       string_agg(c || '=' ||
         has_column_privilege('anon', 'public.profiles'::regclass, c, 'SELECT')::text, ', ')
  from unnest(array['id', 'full_name', 'hall_of_residence', 'is_banned']) c
union all
select 'anon still CANNOT read whatsapp_number/roll_number/email/banned_reason (want: all false)',
       string_agg(c || '=' ||
         has_column_privilege('anon', 'public.profiles'::regclass, c, 'SELECT')::text, ', ')
  from unnest(array['whatsapp_number', 'roll_number', 'email', 'banned_reason']) c
union all
select 'anon SELECT policies present on listings/wanted_requests/profiles (want: 3)',
       count(*)::text
  from pg_policies
 where schemaname = 'public'
   and policyname in ('listings_select_anon', 'wanted_requests_select_anon', 'profiles_select_anon');
