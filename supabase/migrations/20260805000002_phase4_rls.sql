-- KGP Bazaar Migration: Phase 4 Scale & Hardening RLS
-- Rate limit inserts and properly hide/restrict banned users

-- 1. Listings: SELECT policy (hide banned sellers)
drop policy if exists "listings_select" on public.listings;
create policy "listings_select" on public.listings
  for select using (
    (status = 'active' and deleted_at is null and public.is_active_student() and exists (
      select 1 from public.profiles seller where seller.id = user_id and seller.is_banned = false
    ))
    or user_id = auth.uid()
    or public.is_admin()
  );

-- 2. Listings: INSERT policy (rate limit to 20/day)
drop policy if exists "listings_insert" on public.listings;
create policy "listings_insert" on public.listings
  for insert with check (
    user_id = auth.uid() 
    and public.is_active_student()
    and (
      (select count(*) from public.listings 
       where user_id = auth.uid() 
         and created_at > (now() - interval '24 hours')) < 20
    )
  );

-- 3. Listings: UPDATE & DELETE policies (block banned users)
drop policy if exists "listings_update" on public.listings;
create policy "listings_update" on public.listings
  for update using ((user_id = auth.uid() and public.is_active_student()) or public.is_admin())
  with check ((user_id = auth.uid() and public.is_active_student()) or public.is_admin());

drop policy if exists "listings_delete" on public.listings;
create policy "listings_delete" on public.listings
  for delete using ((user_id = auth.uid() and public.is_active_student()) or public.is_admin());

-- 4. Wanted Requests: SELECT policy (hide banned requesters)
drop policy if exists "wanted_requests_select" on public.wanted_requests;
create policy "wanted_requests_select" on public.wanted_requests
  for select using (
    (status = 'open' and deleted_at is null and public.is_active_student() and exists (
      select 1 from public.profiles requester where requester.id = user_id and requester.is_banned = false
    ))
    or user_id = auth.uid()
    or public.is_admin()
  );

-- 5. Wanted Requests: INSERT policy (rate limit to 20/day)
drop policy if exists "wanted_requests_insert" on public.wanted_requests;
create policy "wanted_requests_insert" on public.wanted_requests
  for insert with check (
    user_id = auth.uid() 
    and public.is_active_student()
    and (
      (select count(*) from public.wanted_requests 
       where user_id = auth.uid() 
         and created_at > (now() - interval '24 hours')) < 20
    )
  );

-- 6. Wanted Requests: UPDATE & DELETE policies (block banned users)
drop policy if exists "wanted_requests_update" on public.wanted_requests;
create policy "wanted_requests_update" on public.wanted_requests
  for update using ((user_id = auth.uid() and public.is_active_student()) or public.is_admin())
  with check ((user_id = auth.uid() and public.is_active_student()) or public.is_admin());

drop policy if exists "wanted_requests_delete" on public.wanted_requests;
create policy "wanted_requests_delete" on public.wanted_requests
  for delete using ((user_id = auth.uid() and public.is_active_student()) or public.is_admin());

-- 7. Reports: INSERT policy (rate limit to 10/day)
drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports
  for insert with check (
    reporter_id = auth.uid() 
    and public.is_active_student()
    and (
      (select count(*) from public.reports 
       where reporter_id = auth.uid() 
         and created_at > (now() - interval '24 hours')) < 10
    )
  );
