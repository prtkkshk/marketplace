-- KGP Bazaar Migration: fix RLS recursion, restore banned-seller filter, profile constraint
--
-- Applied to production (mxvgzdmxdrevxcjiyvqt) on 2026-08-08 and verified.
-- Supersedes 20260806131000_fix_rls_and_profile_constraints.sql, which was written but
-- never applied and has been deleted. Do not resurrect it.
--
-- Three things this fixes:
--
-- 1. F-01/F-02 — RLS infinite recursion (SQLSTATE 42P17).
--    20260805000002 put a rate limit inside the INSERT policies as
--      (select count(*) from public.listings where ...)
--    A policy on `listings` that queries `listings` is a self-reference; Postgres
--    refuses to evaluate it. This blocked every insert on listings, wanted_requests
--    and reports — i.e. the entire point of the app. Rate limiting moves to a
--    BEFORE INSERT trigger, which is SECURITY DEFINER and owned by the table owner,
--    so its count query does not re-enter RLS.
--
-- 2. SEC-04 — 20260806232500_performance_optimization dropped and recreated
--    listings_select / wanted_requests_select without carrying over the
--    `EXISTS (... seller.is_banned = false)` clause. That migration was never applied
--    to production, so this was latent rather than live — but on any replay
--    (db reset, fresh staging project, or applying it to prod) banning a user would
--    silently stop hiding their listings. Restored here, after that migration in
--    timestamp order so replay lands correctly.
--
-- 3. F-05 — is_profile_complete could be true while full_name / roll_number /
--    whatsapp_number were NULL, breaking the app's assumption that a "complete"
--    profile is contactable.

-- =============================================================================
-- 1. Rate limiting via trigger, not policy
-- =============================================================================

create or replace function public.check_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_limit int;
  v_label text;
begin
  -- No authenticated user => service_role, seeding, or an internal job. Not rate
  -- limited. Not a loophole: RLS still requires user_id = auth.uid() for real users.
  if auth.uid() is null then
    return new;
  end if;

  if tg_table_name = 'listings' then
    v_limit := 20;
    v_label := 'listings';
    select count(*) into v_count
      from public.listings
     where user_id = auth.uid()
       and created_at > now() - interval '24 hours';

  elsif tg_table_name = 'wanted_requests' then
    v_limit := 20;
    v_label := 'wanted requests';
    select count(*) into v_count
      from public.wanted_requests
     where user_id = auth.uid()
       and created_at > now() - interval '24 hours';

  elsif tg_table_name = 'reports' then
    v_limit := 10;
    v_label := 'reports';
    select count(*) into v_count
      from public.reports
     where reporter_id = auth.uid()
       and created_at > now() - interval '24 hours';

  else
    return new;
  end if;

  if v_count >= v_limit then
    -- Stable, greppable prefix so the client can render a friendly message rather
    -- than a raw Postgres error. Asserted in tests/rls/rate_limits.test.ts.
    raise exception 'RATE_LIMIT_EXCEEDED: maximum % % per 24 hours', v_limit, v_label
      using errcode = 'P0001',
            hint = 'Try again tomorrow.';
  end if;

  return new;
end;
$$;

comment on function public.check_rate_limit() is
  'BEFORE INSERT rate limiter. Lives here rather than in an RLS policy because a '
  'policy that queries its own table self-references and raises 42P17.';

drop trigger if exists enforce_rate_limit_listings on public.listings;
create trigger enforce_rate_limit_listings
  before insert on public.listings
  for each row execute function public.check_rate_limit();

drop trigger if exists enforce_rate_limit_wanted on public.wanted_requests;
create trigger enforce_rate_limit_wanted
  before insert on public.wanted_requests
  for each row execute function public.check_rate_limit();

drop trigger if exists enforce_rate_limit_reports on public.reports;
create trigger enforce_rate_limit_reports
  before insert on public.reports
  for each row execute function public.check_rate_limit();

-- =============================================================================
-- 2. INSERT policies: authorisation only, no self-referencing subqueries.
--    auth.uid() and is_active_student() wrapped in (select ...) so Postgres
--    evaluates them once as an InitPlan rather than per row.
-- =============================================================================

drop policy if exists "listings_insert" on public.listings;
create policy "listings_insert" on public.listings
  for insert with check (
    user_id = (select auth.uid())
    and (select public.is_active_student())
  );

drop policy if exists "wanted_requests_insert" on public.wanted_requests;
create policy "wanted_requests_insert" on public.wanted_requests
  for insert with check (
    user_id = (select auth.uid())
    and (select public.is_active_student())
  );

drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports
  for insert with check (
    reporter_id = (select auth.uid())
    and (select public.is_active_student())
  );

-- =============================================================================
-- 3. SELECT policies: banned-seller filter restored, InitPlan wrapping kept.
--    The EXISTS is a primary-key lookup on profiles (index scan). It is not what
--    made the feed slow — that was is_active_student() re-evaluating per row,
--    which the (select ...) wrapping fixes and which is preserved here.
-- =============================================================================

drop policy if exists "listings_select" on public.listings;
create policy "listings_select" on public.listings
  for select using (
    (
      status = 'active'
      and deleted_at is null
      and (select public.is_active_student())
      and exists (
        select 1 from public.profiles seller
         where seller.id = listings.user_id
           and seller.is_banned = false
      )
    )
    or user_id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists "wanted_requests_select" on public.wanted_requests;
create policy "wanted_requests_select" on public.wanted_requests
  for select using (
    (
      status = 'open'
      and deleted_at is null
      and (select public.is_active_student())
      and exists (
        select 1 from public.profiles requester
         where requester.id = wanted_requests.user_id
           and requester.is_banned = false
      )
    )
    or user_id = (select auth.uid())
    or (select public.is_admin())
  );

create index if not exists idx_profiles_not_banned
  on public.profiles (id) where is_banned = false;

-- =============================================================================
-- 4. Feed indexes.
--    Declared in 20260806232500 but that migration was never applied to
--    production, so production had neither. Repeated here (IF NOT EXISTS) so the
--    live schema and the migration history agree.
--    NOT yet validated with EXPLAIN ANALYZE — that happens in the performance
--    phase. Present to close repo/production drift, not because anyone measured.
-- =============================================================================

create index if not exists idx_listings_feed_sort
  on public.listings (is_pinned desc, status asc, created_at desc)
  where deleted_at is null;

create index if not exists idx_listings_category_feed_sort
  on public.listings (category, is_pinned desc, status asc, created_at desc)
  where deleted_at is null;

-- =============================================================================
-- 5. Profile completeness (F-05).
--    Repair first: any row claiming completeness while missing required fields was
--    never actually complete, so send it back through profile completion.
--    Production had 0 such rows at time of application.
-- =============================================================================

update public.profiles
   set is_profile_complete = false
 where is_profile_complete
   and (full_name is null or roll_number is null or whatsapp_number is null);

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'enforce_complete_profile'
       and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint enforce_complete_profile check (
        not is_profile_complete
        or (full_name is not null
            and roll_number is not null
            and whatsapp_number is not null)
      );
  end if;
end $$;
