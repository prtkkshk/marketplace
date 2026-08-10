-- KGP Bazaar Initial Schema & Security Policies
-- Migration: 20260801000001_initial_schema.sql

-- 1. Helper function for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Enums
create type public.listing_category as enum (
  'cycles', 'books', 'electronics', 'room_essentials', 'lab_gear', 'other'
);
create type public.item_condition as enum (
  'brand_new', 'like_new', 'good', 'fair'
);
create type public.listing_status as enum (
  'active', 'sold', 'hidden', 'expired'
);
create type public.request_status as enum (
  'open', 'fulfilled', 'hidden', 'expired'
);
create type public.report_reason as enum (
  'spam_scam', 'prohibited', 'offensive', 'wrong_category', 'already_sold', 'harassment', 'other'
);
create type public.report_status as enum (
  'pending', 'actioned', 'dismissed'
);
create type public.announcement_type as enum (
  'info', 'warning', 'success'
);

-- 3. Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (email like '%@kgpian.iitkgp.ac.in'),
  full_name text check (full_name is null or (char_length(full_name) between 2 and 60)),
  roll_number text unique check (roll_number is null or roll_number ~ '^[0-9]{2}[A-Z]{2}[0-9]{5}$'),
  hall_of_residence text check (
    hall_of_residence is null or hall_of_residence in (
      'Azad', 'Patel', 'Nehru', 'RK', 'RP', 'LLR', 'MMM', 'VS', 'HJB', 'JCB',
      'Zakir Hussain', 'Gokhale', 'Nivedita', 'SNIG', 'MS', 'MT', 'Rani Laxmibai',
      'BCR', 'Vikramshila Residency', 'Other'
    )
  ),
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^\+91[0-9]{10}$'),
  is_profile_complete boolean not null default false,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  banned_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_roll_number on public.profiles(roll_number);
create index idx_profiles_hall on public.profiles(hall_of_residence);
create index idx_profiles_created_at on public.profiles(created_at);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auth trigger to create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email not like '%@kgpian.iitkgp.ac.in' then
    raise exception 'Domain restricted to @kgpian.iitkgp.ac.in';
  end if;

  insert into public.profiles (id, email, is_profile_complete, is_admin, is_banned)
  values (new.id, new.email, false, false, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Auth/Admin helper functions
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.is_active_student() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_profile_complete and not p.is_banned
                   from public.profiles p where p.id = auth.uid()), false);
$$;

-- Protect privileged columns trigger
create or replace function public.protect_privileged_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin or new.is_banned is distinct from old.is_banned)
     and not public.is_admin() then
    raise exception 'not authorised to change privileged columns';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileged
  before update on public.profiles
  for each row execute function public.protect_privileged_columns();

-- 5. Listings Table
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text check (description is null or char_length(description) <= 1000),
  category public.listing_category not null,
  price integer not null check (price >= 0 and price <= 500000),
  is_negotiable boolean not null default false,
  condition public.item_condition not null,
  photo_paths text[] not null check (array_length(photo_paths, 1) between 1 and 4),
  hall_of_residence text not null check (
    hall_of_residence in (
      'Azad', 'Patel', 'Nehru', 'RK', 'RP', 'LLR', 'MMM', 'VS', 'HJB', 'JCB',
      'Zakir Hussain', 'Gokhale', 'Nivedita', 'SNIG', 'MS', 'MT', 'Rani Laxmibai',
      'BCR', 'Vikramshila Residency', 'Other'
    )
  ),
  status public.listing_status not null default 'active',
  is_pinned boolean not null default false,
  sold_at timestamptz,
  deleted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_listings_status_created on public.listings(status, created_at desc);
create index idx_listings_category_status on public.listings(category, status);
create index idx_listings_price on public.listings(price);
create index idx_listings_hall on public.listings(hall_of_residence);
create index idx_listings_fts on public.listings using gin (to_tsvector('english', title || ' ' || coalesce(description, '')));

create trigger set_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- 6. Wanted Requests Table
create table public.wanted_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text check (description is null or char_length(description) <= 1000),
  category public.listing_category not null,
  max_budget integer check (max_budget is null or (max_budget >= 0 and max_budget <= 500000)),
  hall_of_residence text not null check (
    hall_of_residence in (
      'Azad', 'Patel', 'Nehru', 'RK', 'RP', 'LLR', 'MMM', 'VS', 'HJB', 'JCB',
      'Zakir Hussain', 'Gokhale', 'Nivedita', 'SNIG', 'MS', 'MT', 'Rani Laxmibai',
      'BCR', 'Vikramshila Residency', 'Other'
    )
  ),
  status public.request_status not null default 'open',
  is_pinned boolean not null default false,
  fulfilled_at timestamptz,
  deleted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_wanted_status_created on public.wanted_requests(status, created_at desc);
create index idx_wanted_category_status on public.wanted_requests(category, status);

create trigger set_wanted_requests_updated_at
  before update on public.wanted_requests
  for each row execute function public.set_updated_at();

-- 7. Saved Items Table
create table public.saved_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- 8. Reports Table
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  request_id uuid references public.wanted_requests(id) on delete cascade,
  reason public.report_reason not null,
  details text check (details is null or char_length(details) <= 200),
  status public.report_status not null default 'pending',
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  check ((listing_id is not null and request_id is null) or (listing_id is null and request_id is not null)),
  unique(reporter_id, listing_id),
  unique(reporter_id, request_id)
);

-- 9. Announcements Table
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) <= 200),
  type public.announcement_type not null default 'info',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 10. Admin Audit Log Table
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 11. Contact Events Table
create table public.contact_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  request_id uuid references public.wanted_requests(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 12. Enable RLS on every table
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.wanted_requests enable row level security;
alter table public.saved_items enable row level security;
alter table public.reports enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.contact_events enable row level security;

-- 13. RLS Policies

-- PROFILES Policies
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_select_public" on public.profiles
  for select using (public.is_active_student());

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id or public.is_admin());

-- LISTINGS Policies
create policy "listings_select" on public.listings
  for select using (
    (status = 'active' and deleted_at is null and public.is_active_student())
    or user_id = auth.uid()
    or public.is_admin()
  );

create policy "listings_insert" on public.listings
  for insert with check (user_id = auth.uid() and public.is_active_student());

create policy "listings_update" on public.listings
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "listings_delete" on public.listings
  for delete using (user_id = auth.uid() or public.is_admin());

-- WANTED_REQUESTS Policies
create policy "wanted_requests_select" on public.wanted_requests
  for select using (
    (status = 'open' and deleted_at is null and public.is_active_student())
    or user_id = auth.uid()
    or public.is_admin()
  );

create policy "wanted_requests_insert" on public.wanted_requests
  for insert with check (user_id = auth.uid() and public.is_active_student());

create policy "wanted_requests_update" on public.wanted_requests
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "wanted_requests_delete" on public.wanted_requests
  for delete using (user_id = auth.uid() or public.is_admin());

-- SAVED_ITEMS Policies
create policy "saved_items_select" on public.saved_items
  for select using (user_id = auth.uid());

create policy "saved_items_insert" on public.saved_items
  for insert with check (user_id = auth.uid() and public.is_active_student());

create policy "saved_items_delete" on public.saved_items
  for delete using (user_id = auth.uid());

-- REPORTS Policies
create policy "reports_select" on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());

create policy "reports_insert" on public.reports
  for insert with check (reporter_id = auth.uid() and public.is_active_student());

create policy "reports_update" on public.reports
  for update using (public.is_admin());

create policy "reports_delete" on public.reports
  for delete using (public.is_admin());

-- ANNOUNCEMENTS Policies
create policy "announcements_select" on public.announcements
  for select using (
    (is_active = true and starts_at <= now() and (ends_at is null or ends_at > now()) and public.is_active_student())
    or public.is_admin()
  );

create policy "announcements_insert" on public.announcements
  for insert with check (public.is_admin());

create policy "announcements_update" on public.announcements
  for update using (public.is_admin());

create policy "announcements_delete" on public.announcements
  for delete using (public.is_admin());

-- ADMIN_AUDIT_LOG Policies (Insert & Select for admins only; no update/delete)
create policy "admin_audit_log_select" on public.admin_audit_log
  for select using (public.is_admin());

create policy "admin_audit_log_insert" on public.admin_audit_log
  for insert with check (public.is_admin());

-- CONTACT_EVENTS Policies (Select for admins only; insert via RPC; no update/delete)
create policy "contact_events_select" on public.contact_events
  for select using (public.is_admin());

-- 14. Contact RPCs
create or replace function public.get_contact_number(p_listing_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
  v_seller_id uuid;
  v_status public.listing_status;
  v_number text;
begin
  if not public.is_active_student() then
    raise exception 'Not authorized or account suspended';
  end if;

  select count(*) into v_count
  from public.contact_events
  where actor_id = auth.uid() and created_at > now() - interval '1 hour';

  if v_count >= 30 then
    raise exception 'Rate limit exceeded: maximum 30 contact reveals per hour';
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
  if not public.is_active_student() then
    raise exception 'Not authorized or account suspended';
  end if;

  select count(*) into v_count
  from public.contact_events
  where actor_id = auth.uid() and created_at > now() - interval '1 hour';

  if v_count >= 30 then
    raise exception 'Rate limit exceeded: maximum 30 contact reveals per hour';
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

-- 15. Storage Configuration & Bucket Policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  false,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
) on conflict (id) do nothing;

create policy "listing_photos_select" on storage.objects
  for select using (bucket_id = 'listing-photos' and auth.role() = 'authenticated');

create policy "listing_photos_insert" on storage.objects
  for insert with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_active_student()
  );

create policy "listing_photos_update" on storage.objects
  for update using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing_photos_delete" on storage.objects
  for delete using (
    bucket_id = 'listing-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- 16. Maintenance Functions & Scheduled Jobs
create or replace function public.cron_expire_items()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.listings
  set status = 'expired'
  where status = 'active' and expires_at < now();

  update public.wanted_requests
  set status = 'expired'
  where status = 'open' and expires_at < now();
end;
$$;

create or replace function public.cron_purge_deleted()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.listings
  where deleted_at is not null and deleted_at < now() - interval '90 days';

  delete from public.wanted_requests
  where deleted_at is not null and deleted_at < now() - interval '90 days';
end;
$$;
