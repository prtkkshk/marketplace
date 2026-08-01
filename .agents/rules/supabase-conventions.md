# Supabase Conventions — KGP Bazaar

## Client

- Exactly one client instance, in `src/lib/supabase.ts`, typed with the generated
  `Database` type:
  `createClient<Database>(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)`.
- Assert both env vars at module load and throw a readable error if missing.
- The **anon key is the only key that may exist client-side**. The `service_role` key
  must never appear in `src/`, in `.env` files that get committed, in CI logs, or in
  any documentation example.

## Migrations

- Every schema change is a new file: `supabase/migrations/<timestamp>_<slug>.sql`.
- Never edit a migration that has been applied. Write a new one.
- Never make schema changes only in the dashboard — the dashboard is for inspecting
  and for one-time bootstrap actions documented in `docs/SETUP_MANUAL.md`.
- Each migration is idempotent where reasonable (`create table if not exists`,
  `drop policy if exists` before `create policy`).
- After every migration: `npm run db:types` and commit the regenerated
  `src/lib/database.types.ts`.

## Row Level Security — non-negotiable rules

1. `alter table <t> enable row level security;` is in the **same migration** that
   creates the table. A table is never left readable-by-default.
2. Policies are written per operation (`select`, `insert`, `update`, `delete`) — never
   a single `for all` policy.
3. Ownership checks use `auth.uid() = user_id`. Never compare on email.
4. Admin checks use the SQL helper, never a claim the client can set:
   ```sql
   create or replace function public.is_admin()
   returns boolean
   language sql stable security definer set search_path = public as $$
     select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
   $$;
   ```
5. `profiles.is_admin` and `profiles.is_banned` must be **unwritable by the owner**.
   Enforce with a column-level trigger that rejects changes to those columns unless
   `is_admin()` — RLS alone cannot restrict individual columns on update.
6. Phone numbers are **not** in the publicly-selectable projection. Expose listings
   through a view or RPC that omits `whatsapp_number`, and fetch the number only via a
   dedicated `get_contact_number(listing_id)` RPC that is rate-limited and logged.
7. Every policy gets a Vitest/pgTAP test asserting both the allow and the **deny** case.

## Data-access layer

- One file per table under `src/lib/data/`: `listings.ts`, `profiles.ts`,
  `wantedRequests.ts`, `reports.ts`, `savedItems.ts`, `admin.ts`, `announcements.ts`.
- Each function: typed params in, typed domain object out, throws on error.
- Map snake_case DB rows to camelCase domain types in this layer, once. Components
  never see snake_case.
- Always `.select()` explicit columns. Never `select('*')` on a table containing
  phone numbers or admin flags.
- Use `.range()` for pagination; the feed never fetches unbounded rows.

## Storage

- Bucket `listing-photos`, **private**, path convention
  `{user_id}/{listing_id}/{index}.webp`.
- Storage policies: authenticated users may insert only under their own `{user_id}/`
  prefix; select is allowed to any authenticated user; delete allowed to the owner or
  `is_admin()`.
- Serve images via signed URLs or the image transform endpoint with a width parameter.
- Deleting a listing must delete its storage objects — do it in a database trigger or
  an edge function, not in client code that can be interrupted.

## Auth

- Two enabled providers only: **email + password** (with email confirmation) and
  **Google OAuth**.
- Domain restriction `@kgpian.iitkgp.ac.in` is enforced in **three** places:
  1. Client-side zod validation (fast feedback).
  2. A Supabase Auth Hook / `before user created` trigger that rejects other domains.
  3. A `check` constraint on `profiles.email`.
  Client-side alone is worthless — anyone can POST to the auth endpoint directly.
- A row in `profiles` is created by an `on auth.users insert` trigger with
  `is_profile_complete = false`. The app routes users to the profile-completion screen
  until name, roll number, hall, and WhatsApp number are filled in.
- Never store a password, OTP, or session token in application tables.

## Realtime

- Use Supabase Realtime only for the admin report queue badge. The student feed uses
  ordinary polling/refetch-on-focus. Realtime subscriptions on the main feed are a
  battery and quota drain for negligible benefit.

## Things that will break this project — avoid

- Doing authorisation in React (`{isAdmin && <DeleteButton/>}` is cosmetic; the delete
  must also be denied by RLS).
- Storing money as `float`. Use `integer` rupees with a `check (price >= 0 and price <= 500000)`.
- Soft-deleting by hiding in the client. Deleted means `deleted_at` set **and** excluded
  by the RLS select policy.
- Trusting `user_metadata` for anything security-relevant — the user can edit it.
