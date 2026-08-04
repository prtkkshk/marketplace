---
name: rls-audit
description: Systematically audit every Supabase table, policy, storage bucket and RPC in KGP Bazaar for authorisation holes, especially student-data and phone-number exposure. Run at the end of every phase that touches the database and before any deploy.
---

# RLS & Authorisation Audit

## When to use this

- At the end of any phase that added or changed a table, policy, RPC, or bucket.
- Before the first production deploy, and before any deploy that changes auth.
- Any time an agent has written `{isAdmin && ...}` in React — that is a hint that a
  matching database-side check may be missing.

## Steps

1. **Enumerate.** List every table in `public` with whether RLS is enabled:
   ```sql
   select tablename, rowsecurity from pg_tables where schemaname = 'public';
   ```
   Any `false` is an immediate failure — fix before continuing.
2. **List policies per table:**
   ```sql
   select tablename, policyname, cmd, qual, with_check from pg_policies
   where schemaname = 'public' order by tablename, cmd;
   ```
   Every table needs a distinct policy for each of `select`, `insert`, `update`,
   `delete` that it supports. A missing policy for an operation means *denied* — verify
   that is intentional, not accidental.
3. **Run the deny matrix.** For each table, using three real test clients (anonymous,
   student A, student B, admin), assert:

   | Actor | Own row | Other's row | Admin-only action |
   |---|---|---|---|
   | anon | denied read/write | denied | denied |
   | student A | read+write ✅ | read public fields only, no write ❌ | denied ❌ |
   | banned student | denied insert ❌ | denied ❌ | denied ❌ |
   | admin | ✅ | ✅ per policy | ✅ |

4. **Phone-number check.** Grep the codebase for `whatsapp` / `phone`. Confirm:
   - no list or detail query selects the column
   - the only path is the `get_contact_number` RPC
   - the RPC rate-limits and writes to `contact_events`
   - no phone number is ever rendered as visible text
5. **Privilege-escalation check.** Attempt, as student A:
   `update profiles set is_admin = true where id = auth.uid()` — must fail.
   Same for `is_banned = false` when banned.
6. **Storage check.** Attempt to upload to another user's prefix and to delete another
   user's object — both must fail. Confirm the bucket is private and file-size limited.
7. **Secret check.** Grep for `service_role`, `SUPABASE_SERVICE`, and any key-shaped
   string in `src/`, `.env.example`, docs, and CI config. Zero hits allowed.
8. **Report** as a table: table/bucket, policies present, deny-cases tested, verdict
   (PASS / FAIL + fix). Do not report "looks fine" — show the assertions.

## Conventions to follow

- Cosmetic UI hiding is never a control. Assume the attacker has the JS bundle and a
  `curl`.
- Every hole found gets a migration + a regression test in `tests/rls/`, in the same
  commit as the fix.
- Rules of record: `.agents/rules/security-and-privacy.md`.
