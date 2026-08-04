# Data Model & Security Design — KGP Bazaar

Target: Supabase Postgres. This document is the intended shape; the authoritative
artefacts are the migration files in `supabase/migrations/` and the generated
`src/lib/database.types.ts`. Agents implement this, then keep this doc in sync.

---

## Enums

```sql
create type listing_category as enum (
  'cycles', 'books', 'electronics', 'room_essentials', 'lab_gear', 'other'
);
create type item_condition   as enum ('brand_new', 'like_new', 'good', 'fair');
create type listing_status   as enum ('active', 'sold', 'hidden', 'expired');
create type request_status   as enum ('open', 'fulfilled', 'hidden', 'expired');
create type report_reason    as enum (
  'spam_scam', 'prohibited', 'offensive', 'wrong_category',
  'already_sold', 'harassment', 'other'
);
create type report_status    as enum ('pending', 'actioned', 'dismissed');
create type announcement_type as enum ('info', 'warning', 'success');
```

Mirror these exact string values in `src/lib/constants.ts` with their display labels
and emoji. Never let the two drift.

---

## Tables

### `profiles`
One row per authenticated user, created by a trigger on `auth.users` insert.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | = `auth.users.id`, `on delete cascade` |
| `email` | `text` not null unique | `check (email like '%@kgpian.iitkgp.ac.in')` |
| `full_name` | `text` | 2–60 chars |
| `roll_number` | `text` unique | `check (roll_number ~ '^[0-9]{2}[A-Z]{2}[0-9]{5}$')` |
| `hall_of_residence` | `text` | must be in the canonical hall list |
| `whatsapp_number` | `text` | `check (whatsapp_number ~ '^\+91[0-9]{10}$')` — **never selected by feed queries** |
| `is_profile_complete` | `boolean` default false | gate for app access |
| `is_admin` | `boolean` default false | **trigger-protected**, only settable by an admin |
| `is_banned` | `boolean` default false | **trigger-protected** |
| `banned_reason` | `text` | |
| `created_at` / `updated_at` | `timestamptz` | |

Indexes: `roll_number`, `hall_of_residence`, `created_at`.

### `listings`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` → `profiles(id)` on delete cascade | |
| `title` | `text` not null | `check (char_length(title) between 3 and 80)` |
| `description` | `text` | ≤ 1000 |
| `category` | `listing_category` not null | |
| `price` | `integer` not null | `check (price >= 0 and price <= 500000)` — **rupees, never float** |
| `is_negotiable` | `boolean` default false | |
| `condition` | `item_condition` not null | |
| `photo_paths` | `text[]` not null | 1–4 storage paths, `check (array_length between 1 and 4)` |
| `hall_of_residence` | `text` not null | denormalised from profile at insert, for filtering without a join |
| `status` | `listing_status` default `'active'` | |
| `is_pinned` | `boolean` default false | admin only |
| `sold_at` / `deleted_at` | `timestamptz` | soft delete |
| `expires_at` | `timestamptz` default `now() + interval '30 days'` | |
| `created_at` / `updated_at` | `timestamptz` | |

Indexes: `(status, created_at desc)`, `(category, status)`, `price`,
`hall_of_residence`, and a GIN full-text index on `title || ' ' || description`.

### `wanted_requests`
Same shape minus condition/photos/negotiable; plus `max_budget integer null`,
`status request_status`, `fulfilled_at timestamptz`.

### `saved_items`
`(user_id, listing_id)` composite PK, `created_at`. Cascade delete both ways.

### `reports`

| Column | Notes |
|---|---|
| `id` uuid PK | |
| `reporter_id` → profiles | |
| `listing_id` / `request_id` | exactly one non-null (`check`) |
| `reason` `report_reason` | |
| `details` text ≤ 200 | |
| `status` `report_status` default `'pending'` | |
| `resolved_by` → profiles, `resolved_at`, `resolution_note` | |

Unique on `(reporter_id, listing_id)` and `(reporter_id, request_id)` — one report per
user per item.

### `announcements`
`id`, `message` (≤200), `type announcement_type`, `starts_at`, `ends_at`,
`is_active boolean`, `created_by` → profiles, `created_at`.

### `admin_audit_log`
`id`, `actor_id` → profiles, `action text` (e.g. `delete_listing`, `ban_user`,
`pin_listing`), `target_table text`, `target_id uuid`, `reason text`,
`metadata jsonb`, `created_at`. Insert-only: no update or delete policy exists for
anyone, including admins.

### `contact_events`
`id`, `actor_id` → profiles, `listing_id` / `request_id`, `created_at`.
Powers rate limiting and harassment investigation. Insert via the RPC only.

---

## Helper functions

```sql
-- Is the current user an admin? Used by every admin policy.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- Is the current user in good standing (verified, complete, not banned)?
create or replace function public.is_active_student() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_profile_complete and not p.is_banned
                   from public.profiles p where p.id = auth.uid()), false);
$$;
```

### `get_contact_number(p_listing_id uuid)` — the only path to a phone number

`security definer`, and it must:
1. `raise exception` if `not is_active_student()`.
2. `raise exception` if the caller has ≥ 30 rows in `contact_events` in the last hour.
3. `raise exception` if the target listing is not `active`.
4. `insert into contact_events (...)`.
5. `return` the seller's `whatsapp_number`.

A sibling `get_requester_number(p_request_id uuid)` does the same for the Wanted Board.

---

## RLS policy matrix

RLS is enabled on **every** table. Summary of intent — the migrations are authoritative.

| Table | select | insert | update | delete |
|---|---|---|---|---|
| `profiles` | own row fully; other rows via a public view exposing only `id, full_name, hall_of_residence, roll_number` (no email, no phone) | trigger-created only | own row, excluding `is_admin` / `is_banned` (trigger-blocked); admins may update any | own row (account deletion); admins any |
| `listings` | `status='active' and deleted_at is null` to any active student; own rows always; everything to admins | own rows only, `user_id = auth.uid()`, and `is_active_student()` | own rows; admins any | own rows (soft); admins any |
| `wanted_requests` | same pattern as listings | same | same | same |
| `saved_items` | own rows only | own rows only | — | own rows |
| `reports` | own reports; admins all | any active student, `reporter_id = auth.uid()` | admins only | admins only |
| `announcements` | active ones to all students; all to admins | admins only | admins only | admins only |
| `admin_audit_log` | admins only | admins only (usually via triggers) | **nobody** | **nobody** |
| `contact_events` | admins only | via the RPC only | nobody | nobody |

### Column-level protection (RLS can't do this alone)

```sql
create or replace function public.protect_privileged_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin
      or new.is_banned is distinct from old.is_banned)
     and not public.is_admin() then
    raise exception 'not authorised to change privileged columns';
  end if;
  return new;
end $$;

create trigger profiles_protect_privileged
before update on public.profiles
for each row execute function public.protect_privileged_columns();
```

---

## Storage

**Bucket `listing-photos`** — private, 5 MB per-file limit, allowed MIME
`image/webp, image/jpeg, image/png`.

Path: `{user_id}/{listing_id}/{0..3}.webp`

Policies:
- insert: `auth.uid()::text = (storage.foldername(name))[1]` and `is_active_student()`
- select: any authenticated user
- update: owner only
- delete: owner or `is_admin()`

Deleting a listing must remove its objects — do this in an `after delete` trigger or an
edge function, never in client code that a closed tab can interrupt.

---

## Scheduled jobs (pg_cron)

| Job | Schedule | Action |
|---|---|---|
| `expire_listings` | daily 03:00 IST | `status='active' and expires_at < now()` → `'expired'` |
| `expire_requests` | daily 03:05 IST | same for `wanted_requests` |
| `purge_deleted` | weekly | hard-delete rows soft-deleted > 90 days ago, plus their storage objects |

---

## Seed data (development only)

A `supabase/seed.sql` with ~10 fake students across different halls and ~30 listings
spread over all six categories, plus 8 wanted requests, 3 reports, and 1 admin.
Seed data must never run against production and must use obviously fake phone numbers
(`+919999900001`…).
