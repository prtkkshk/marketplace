# Security & Privacy Rules — KGP Bazaar

This app holds a directory of real students' names, roll numbers, hall of residence,
and phone numbers. Treat that as the highest-value asset in the system.

## Threat model (what we are actually defending against)

| Threat | Mitigation |
|---|---|
| Someone scrapes every student's WhatsApp number | Numbers never in list payloads; revealed one at a time via rate-limited RPC, logged |
| A non-KGP person signs up | Domain check enforced in an auth hook + DB constraint, not just the form |
| A student deletes/edits someone else's listing | RLS `using (auth.uid() = user_id)` on update/delete, with deny-case tests |
| A student grants themselves admin | `is_admin` column is trigger-protected; only an existing admin can set it |
| Someone posts illegal or abusive content | Report button + admin moderation queue + audit log |
| A banned user keeps using the app | `is_banned` checked in RLS on every insert policy, not just at login |
| Someone uploads a huge file or 500 images | Client compression + `check` on photo count + storage bucket file-size limit |
| XSS through a listing description | React escapes by default; **never** use `dangerouslySetInnerHTML` anywhere |
| Secrets leak | Only `VITE_*` public keys client-side; `service_role` never leaves Supabase |

## Contact-number disclosure flow (implement exactly this)

1. Listing/wanted payloads returned to the client contain **no** phone number.
2. Tapping "Contact Seller on WhatsApp" calls RPC `get_contact_number(p_listing_id)`.
3. The RPC: rejects banned users, rejects if the caller has already made > 30 such
   calls in the last hour, inserts a row into `contact_events`, and returns the number.
4. The client immediately builds the `wa.me` deep link and opens it. The number is
   never rendered as text and never stored in client state longer than that call.
5. `contact_events` gives admins a trail if someone is harassing sellers.

## Input validation

- Every user-supplied string is validated by a zod schema **and** constrained in the
  database. Client validation is UX; database constraints are security.
- Roll number: `/^[0-9]{2}[A-Z]{2}[0-9]{5}$/` (e.g. `22CS10045`), uppercased on save.
- Phone: normalise to E.164 with a default `+91`; reject anything that isn't 10 digits
  after the country code.
- Title ≤ 80 chars, description ≤ 1000 chars, price 0–500000, photos 1–4.
- Strip EXIF metadata from uploaded images before upload — geotags in a photo taken in
  a hall room are a real privacy leak.

## Admin behaviour

- Every destructive admin action writes to `admin_audit_log`: actor, action, target
  table + id, reason, timestamp. No silent deletes.
- Admins cannot demote or ban other admins from the UI — that requires the Supabase
  dashboard. Prevents an account takeover cascading.
- The admin route bundle is lazy-loaded, but hiding the UI is **not** a security
  control. Assume the bundle is downloadable by anyone; the database must refuse.

## Data retention

- Deleting an account deletes or anonymises the profile, its listings, its requests,
  and its storage objects. Provide "Delete my account" in Profile → Settings.
- Sold/fulfilled items are retained 90 days then hard-deleted by a scheduled job.
- Never log a full phone number or email in analytics or `console`.

## Dependencies

- Do not add a dependency without justifying it. Every package is attack surface.
- `npm audit` runs in CI; high/critical vulnerabilities fail the build.
- Pin major versions; no `*` or `latest` ranges.
