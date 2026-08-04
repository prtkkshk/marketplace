---
name: new-migration
description: Create, apply and verify a Supabase schema change for KGP Bazaar, including RLS policies, generated types and deny-case tests. Use whenever a table, column, index, constraint, policy, trigger or RPC needs to change.
---

# New Supabase Migration

## When to use this

Any time the database shape changes: new table, new column, new index, new constraint,
new RLS policy, new trigger, new RPC. Never change the schema through the Supabase
dashboard UI — that produces drift no one can reproduce.

## Steps

1. **State the intent first.** One sentence: what data problem this solves and which
   feature needs it. If it isn't traceable to a task in `task.md`, stop and ask.
2. Create `supabase/migrations/<UTC timestamp>_<kebab_slug>.sql`. Timestamp format
   `YYYYMMDDHHMMSS`.
3. Write the DDL. In the same file, for any new table:
   - `alter table public.<t> enable row level security;`
   - separate `create policy` statements for `select`, `insert`, `update`, `delete`
   - `created_at timestamptz not null default now()` and, where edits are possible,
     `updated_at` maintained by the shared `set_updated_at()` trigger
   - `check` constraints mirroring the zod schema in `src/lib/validation/`
   - indexes for every column the feed filters or sorts on
4. Apply locally: `npx supabase db reset` (recreates from all migrations — proves the
   migration chain is replayable from scratch, which is the whole point).
5. Regenerate types: `npm run db:types`, commit `src/lib/database.types.ts`.
6. Add or update the data-access functions in `src/lib/data/<table>.ts`.
7. Write RLS tests in `tests/rls/<table>.test.ts` covering, at minimum:
   - owner can read/write their own row ✅
   - a different student **cannot** update or delete it ❌
   - an anonymous client **cannot** read it ❌
   - a banned user **cannot** insert ❌
   - an admin **can** perform the admin-only action ✅
   - a non-admin **cannot** perform the admin-only action ❌
8. Run `npm run test` and `npm run typecheck`. Both green before moving on.
9. Report: the migration filename, what it changed, and the deny-cases now covered.

## Conventions to follow

- snake_case, plural table names, `id uuid primary key default gen_random_uuid()`.
- Foreign keys to auth users go through `public.profiles(id)`, not `auth.users`.
- Money is `integer` rupees, never float or numeric with decimals.
- Enumerated values (`category`, `condition`, `listing_status`) are Postgres enums, and
  the same values are exported from `src/lib/constants.ts` — keep them in sync.
- Soft delete = `deleted_at timestamptz`, and the select policy filters it out.
- Never edit an already-applied migration. Roll forward with a new one.
- See `.agents/rules/supabase-conventions.md` for the full policy rules.
