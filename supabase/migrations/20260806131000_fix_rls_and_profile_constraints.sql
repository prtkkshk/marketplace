-- KGP Bazaar Migration: Fix RLS Infinite Recursion & Profile Constraints
-- 1. Replace recursive INSERT rate-limiting policies with a BEFORE INSERT trigger
-- 2. Add CHECK constraint to enforce is_profile_complete requirements

-- Recreate INSERT policies without the recursive subquery
drop policy if exists "listings_insert" on public.listings;
create policy "listings_insert" on public.listings
  for insert with check (user_id = auth.uid() and public.is_active_student());

drop policy if exists "wanted_requests_insert" on public.wanted_requests;
create policy "wanted_requests_insert" on public.wanted_requests
  for insert with check (user_id = auth.uid() and public.is_active_student());

drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports
  for insert with check (reporter_id = auth.uid() and public.is_active_student());

-- Create a generic rate limiting function
create or replace function public.check_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  if auth.uid() is null then
    return new; -- Allow bypass for service_role / internal inserts
  end if;

  if TG_TABLE_NAME = 'listings' then
    select count(*) into v_count from public.listings 
    where user_id = auth.uid() and created_at > (now() - interval '24 hours');
    if v_count >= 20 then
      raise exception 'Rate limit exceeded: maximum 20 listings per 24 hours';
    end if;
  elsif TG_TABLE_NAME = 'wanted_requests' then
    select count(*) into v_count from public.wanted_requests 
    where user_id = auth.uid() and created_at > (now() - interval '24 hours');
    if v_count >= 20 then
      raise exception 'Rate limit exceeded: maximum 20 wanted requests per 24 hours';
    end if;
  elsif TG_TABLE_NAME = 'reports' then
    select count(*) into v_count from public.reports 
    where reporter_id = auth.uid() and created_at > (now() - interval '24 hours');
    if v_count >= 10 then
      raise exception 'Rate limit exceeded: maximum 10 reports per 24 hours';
    end if;
  end if;
  return new;
end $$;

-- Attach the trigger to the tables
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

-- Enforce complete profile constraints
alter table public.profiles
  add constraint enforce_complete_profile check (
    not is_profile_complete or (
      full_name is not null and 
      roll_number is not null and 
      whatsapp_number is not null
    )
  );
