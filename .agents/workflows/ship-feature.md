---
description: Build one feature end to end — spec check, migration, data layer, UI, tests, verification — following KGP Bazaar conventions.
---

1. Restate the feature in one sentence and quote the matching section of
   `docs/PRODUCT_SPEC.md`. If it isn't in the spec, stop and ask the user.
2. Identify which personas this touches (Backend / Frontend / QA) and list the files
   you expect to create or change. Pause for approval if it's more than ~8 files.
3. If the database changes, run the `new-migration` skill first. Do not write UI
   against a table whose RLS policies don't exist yet.
4. Add or update the zod schema in `src/lib/validation/` and mirror its rules as
   database `check` constraints.
5. Implement the typed data-access functions in `src/lib/data/`, with Vitest unit tests
   in the same commit.
6. Build the UI with the `new-screen` skill — mobile-first at 390px, loading + empty +
   error states, accessibility baseline.
7. Run the full gate: `npm run lint && npm run typecheck && npm run test && npm run build`.
8. Manually verify at 390×844 and 1280×800. Describe what you clicked and what happened.
9. If this is on a golden path, add or update the Playwright spec and run `npm run test:e2e`.
10. Tick the matching items in `task.md` and commit with a Conventional Commit message.
11. Report: files changed, tests added, anything you had to assume, and anything you
    deliberately left for a later phase.
