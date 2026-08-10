-- Migration: Public Read Access for KGP Bazaar
-- Allow anonymous users to view active listings, wanted requests, and seller profiles.

-- 1. Profiles: Add anon SELECT policy for non-banned profiles
create policy "profiles_select_anon" on public.profiles
  for select to anon using (is_banned = false);

-- 2. Listings: Add anon SELECT policy
create policy "listings_select_anon" on public.listings
  for select to anon using (
    status = 'active' and deleted_at is null and exists (
      select 1 from public.profiles seller where seller.id = user_id and seller.is_banned = false
    )
  );

-- 3. Wanted Requests: Add anon SELECT policy
create policy "wanted_requests_select_anon" on public.wanted_requests
  for select to anon using (
    status = 'open' and deleted_at is null and exists (
      select 1 from public.profiles requester where requester.id = user_id and requester.is_banned = false
    )
  );

-- 4. Contact Events: Allow anonymous actor_id
alter table public.contact_events alter column actor_id drop not null;

-- 5. RPCs: get_contact_number & get_requester_number

create or replace function public.get_contact_number(p_listing_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
  v_seller_id uuid;
  v_status public.listing_status;
  v_number text;
begin
  select count(*) into v_count
  from public.contact_events
  where listing_id = p_listing_id and created_at > now() - interval '1 hour';

  if v_count >= 10 then
    raise exception 'Rate limit exceeded: maximum 10 contact reveals per hour';
  end if;

  select user_id, status into v_seller_id, v_status
  from public.listings
  where id = p_listing_id and deleted_at is null;

  if v_status is null or v_status != 'active' then
    raise exception 'Listing is not active';
  end if;

  insert into public.contact_events (actor_id, listing_id)
  values (auth.uid(), p_listing_id);

  select whatsapp_number into v_number
  from public.profiles
  where id = v_seller_id;

  if v_number is null then
    raise exception 'Seller contact number not available';
  end if;

  return v_number;
end;
$$;

create or replace function public.get_requester_number(p_request_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
  v_requester_id uuid;
  v_status public.request_status;
  v_number text;
begin
  select count(*) into v_count
  from public.contact_events
  where request_id = p_request_id and created_at > now() - interval '1 hour';

  if v_count >= 10 then
    raise exception 'Rate limit exceeded: maximum 10 contact reveals per hour';
  end if;

  select user_id, status into v_requester_id, v_status
  from public.wanted_requests
  where id = p_request_id and deleted_at is null;

  if v_status is null or v_status != 'open' then
    raise exception 'Wanted request is not active';
  end if;

  insert into public.contact_events (actor_id, request_id)
  values (auth.uid(), p_request_id);

  select whatsapp_number into v_number
  from public.profiles
  where id = v_requester_id;

  if v_number is null then
    raise exception 'Requester contact number not available';
  end if;

  return v_number;
end;
$$;

-- Grant execute to anon
grant execute on function public.get_contact_number(uuid) to anon;
grant execute on function public.get_requester_number(uuid) to anon;
