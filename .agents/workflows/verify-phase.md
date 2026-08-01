---
description: Gate check at the end of a phase — full test suite, RLS audit, manual checklist, and an honest status report before moving on.
---

1. Re-read the current phase in `implementation_plan.md` and list its Definition of
   Done items verbatim.
2. Run, in order, and paste real output for each:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run build`
   - `npm run test:e2e`
   Do not proceed past a failure. Fix it, then restart this workflow from step 2.
3. If this phase touched the database, storage, or auth, run the `rls-audit` skill in
   full and paste the deny-matrix results.
4. Walk the phase's manual checklist in `task.md` in a real browser at 390×844. For each
   item, state what you did and what you saw. "Should work" is not a result.
5. Check the standing rules in `AGENTS.md` for violations introduced this phase:
   any `any`, any direct `supabase` call inside a component, any phone number rendered
   as text, any hardcoded hex colour, any file over ~200 lines, any new dependency.
6. Produce a status table: each Definition of Done item → PASS / FAIL / PARTIAL, with
   evidence.
7. List everything deferred or assumed, and add it to `implementation_plan.md` under
   "Still genuinely open" rather than leaving it in chat. Do not re-open anything in the
   "Resolved" table — those are settled.
8. Only if every item is PASS: update `task.md`, commit, and tell the user the phase is
   complete and what the next phase will do. Otherwise report the blockers and stop.
