# Agent Prompts — KGP Bazaar

Copy-paste these into Google Antigravity **one at a time, in order**. Do not paste
Phase N+1 until Phase N has passed `/verify-phase`.

**How to use this file**

1. Start every phase in **Planning mode**. Let the agent produce a plan, read it, then
   approve.
2. If a prompt produces a plan touching more than ~10 files, ask it to split.
3. When a phase finishes, run `/verify-phase` and read the output honestly — "should
   work" is not a pass.
4. Commit and branch per phase (`phase-4-feed`), so a bad phase is one `git checkout` away.

---

## Prompt 0 — Kickoff (paste this first, before Phase 0)

```
This workspace contains the full planning context for a project called KGP Bazaar.
No application code exists yet.

Please:
1. Read AGENTS.md, implementation_plan.md, task.md, docs/PRODUCT_SPEC.md and
   docs/DATA_MODEL.md, plus everything in .agents/rules/.
2. Summarise back to me, in under 300 words: what we're building, the stack, the
   architectural commitments, and the four things in AGENTS.md that are non-negotiable.
3. Read the "Resolved" table in implementation_plan.md and confirm back to me the seven
   settled decisions. These are closed — do not re-open them or ask me to reconfirm.
4. Tell me if anything in these documents contradicts anything else, or if any phase in
   task.md depends on something that isn't specified. If you find a genuinely new
   ambiguity, add it to implementation_plan.md under "Still genuinely open" rather than
   guessing.

Do not write any code yet. Do not start Phase 0.
```

Nothing should block it. If it claims something is unresolved, check the "Resolved" table
before answering — it's probably already there.

---

## Phase 0 — Foundation & Tooling

```
Execute Phase 0 (Foundation & Tooling) from task.md.

Convert this Vite + React JavaScript skeleton into a strict TypeScript project with
Tailwind, testing, linting and CI. Follow .agents/rules/coding-standards.md exactly for
the folder structure, naming and tooling config.

Specifics:
- tsconfig with strict: true, noUncheckedIndexedAccess: true, noImplicitOverride: true.
- Rename vite.config.js to vite.config.ts. Keep the existing VitePWA config for now;
  Phase 9 will clean up the manifest duplication.
- tailwind.config.ts must define the design tokens from
  .agents/rules/react-conventions.md as named theme values so no one writes raw hex.
- Create the full src/ folder skeleton with .gitkeep files, matching coding-standards.md.
- .env.example with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_URL, and a
  src/lib/env.ts that validates them at startup with zod and throws a readable error
  naming the missing variable.
- .gitignore covering node_modules, dist, .env*, playwright-report, test-results,
  coverage, .vercel.
- ESLint flat config: typescript-eslint recommended, react-hooks, jsx-a11y, and
  @typescript-eslint/no-explicit-any as an error. Warnings fail CI.
- Vitest with jsdom + Testing Library; one trivial passing test so the suite is real.
- Playwright configured against the dev server; one trivial passing spec.
- package.json scripts: dev, build, preview, lint, format, typecheck, test, test:e2e,
  db:types.
- .github/workflows/ci.yml: on push run lint, typecheck, test, build, npm audit
  (fail on high/critical); on pull_request also run e2e.
- src/main.tsx and App.tsx rendering a styled placeholder so I can see Tailwind working.

Do not add any dependency not listed in task.md Phase 0 without telling me why first.

When done, run /verify-phase and report against Phase 0's Definition of Done.
```

---

## Phase 1 — Supabase Schema, RLS & Storage

> ⚠️ Before pasting: complete §2 and §3 of `docs/SETUP_MANUAL.md` so the agent has a
> Supabase project to work against.

```
Execute Phase 1 (Supabase Schema, RLS & Storage) from task.md.

This phase is database-only. Write NO React UI. The point is that no screen is ever
built against a table whose policies don't exist and haven't been tested.

Implement exactly what docs/DATA_MODEL.md specifies, following the
new-migration skill and .agents/rules/supabase-conventions.md.

Order:
1. Enums, then profiles + the auth.users insert trigger + domain and roll-number checks.
2. is_admin() and is_active_student() helpers, and the protect_privileged_columns()
   trigger that makes is_admin and is_banned unwritable by their owner.
3. listings, wanted_requests, saved_items, reports, announcements, admin_audit_log,
   contact_events — each with RLS enabled in the same migration that creates it, and
   separate policies per operation.
4. get_contact_number() and get_requester_number(): security definer, reject banned
   users, reject non-active listings, enforce 30 reveals per hour per user, log to
   contact_events, then return the number.
5. listing-photos private bucket, per-user-prefix storage policies, and an after-delete
   trigger that removes a deleted listing's storage objects.
6. pg_cron expiry and purge jobs.
7. supabase/seed.sql with 10 students across different halls, 30 listings covering all
   six categories, 8 wanted requests, 3 reports and 1 admin. Fake phone numbers only
   (+91999990000X).

Then:
- Confirm `npx supabase db reset` replays the whole chain from scratch cleanly.
- Run npm run db:types and commit src/lib/database.types.ts.
- Write src/lib/supabase.ts (typed client, env asserted).
- Write RLS tests in tests/rls/ using four clients: anonymous, student A, student B,
  banned student, admin. For every table assert both the allow AND the deny case. I
  specifically want tests proving:
    * student B cannot update or delete student A's listing
    * anonymous cannot read listings at all
    * a student cannot set their own is_admin = true
    * a banned student cannot insert a listing
    * a non-admin cannot read admin_audit_log or contact_events
    * get_contact_number refuses the 31st call within an hour

Finally run the rls-audit skill in full and paste the deny matrix. Then /verify-phase.
```

---

## Phase 2 — Authentication & Profile

```
Execute Phase 2 (Authentication & Profile) from task.md.

Two sign-in methods, both locked to @kgpian.iitkgp.ac.in:
(a) email + password with a 6-digit OTP confirmation step
(b) Google OAuth

Critical: the domain restriction must be enforced server-side (Supabase auth hook or
trigger) AND by the profiles.email check constraint, not only by client-side zod. Write
a test that proves a @gmail.com signup fails even when the client validation is bypassed.

Build:
- src/features/auth/AuthProvider.tsx exposing { session, profile, isAdmin, loading,
  signOut }. Nothing else in the app subscribes to supabase.auth.
- Screens: sign in, sign up, OTP entry (60s resend cooldown, max 3 resends per 15 min),
  forgot password, and Google button. Mobile-first at 390px, all three async states.
- Google flow: if the returned email is not a KGP address, sign the user out
  immediately and show a clear explanation rather than a generic error.
- Profile completion screen (mandatory, blocks app access until complete): full name,
  roll number, hall dropdown, WhatsApp number. Zod schema must mirror the DB
  constraints exactly — same regexes, same lengths.
- KGP_HALLS in src/lib/constants.ts, copied verbatim from docs/PRODUCT_SPEC.md §4. That
  list is confirmed correct — do not add, rename, reorder or "improve" it.
- @kgpian.iitkgp.ac.in is the ONLY allowed domain and covers every student cohort (UG,
  PG, dual degree, MSc, research). Do not add a second domain. The roll-number regex
  ^[0-9]{2}[A-Z]{2}[0-9]{5}$ is confirmed valid for all cohorts.
- Route guards: ProtectedRoute (signed in + profile complete), AdminRoute, and a
  BannedScreen that a banned user cannot navigate away from.
- Profile screen shell with sections for My Listings, My Requests, Saved, Settings, and
  an Admin Panel link when isAdmin. Sections can be placeholders this phase.
- Edit profile, and delete account (cascading listings, requests and storage objects).

Tests: unit tests for every validation schema including rejection cases; E2E for
signup → OTP → profile completion → feed, and for a non-KGP email being rejected.

Then /verify-phase.
```

---

## Phase 3 — App Shell & Navigation

```
Execute Phase 3 (App Shell & Navigation) from task.md.

Build the reusable UI layer and the navigation chrome. No feature logic yet — routes
render placeholders.

- src/components/ui/: Button (variants: primary, secondary, ghost, danger; sizes; loading
  state), Input, Textarea, Select, Badge, Card, Sheet (bottom sheet on mobile, centred
  dialog on md+), Dialog, Skeleton, Toast system, EmptyState, ErrorState, Spinner.
  Every one uses only the Tailwind tokens from .agents/rules/react-conventions.md — no
  raw hex anywhere.
- BottomNav: 4 items (Home, Wanted, Sell FAB raised in the centre, Profile), fixed,
  respects env(safe-area-inset-bottom), framer-motion layoutId sliding indicator,
  44px+ tap targets, aria-labels.
- DesktopHeader: sticky, backdrop-blur-md bg-white/80 border-b, same destinations, md+ only.
- AppShell composing both with the router outlet.
- All routes from .agents/rules/react-conventions.md registered. /admin/* lazy-loaded
  behind AdminRoute so students never download the admin bundle.
- TanStack Query provider: 30s stale time, refetch on window focus, retry 1.
- Global error boundary and a 404 screen.
- src/lib/utils/: formatINR, whatsappLink, timeAgo, cn — each with unit tests.

Verify by keyboard alone: I want to be able to tab to every nav item and activate it.
Check 390×844 and 1280×800. Confirm prefers-reduced-motion disables the animations.

Then /verify-phase.
```

---

## Phase 4 — For Sale Feed

```
Execute Phase 4 (For Sale Feed) from task.md, using the new-screen skill.

Build the main browsing experience against the seeded data.

- src/lib/data/listings.ts: a paginated query builder supporting category, free-text
  search (use the full-text index, not a client filter), sort (newest / price asc /
  price desc), condition, negotiable-only, hall, and max price. It must select explicit
  columns and must never select whatsapp_number.
- Segmented control at the top of Home switching For Sale ↔ Wanted Board (Wanted can be
  a placeholder until Phase 7).
- Search input debounced 250ms. Horizontally scrollable category pills with "All"
  default. Sort dropdown. Filter sheet for the rest.
- Every filter, the search text, the sort, and the active segment live in the URL query
  string via useSearchParams. A filtered feed must be shareable and survive a refresh.
- ListingCard: photo (lazy, explicit dimensions, fixed aspect ratio so nothing shifts),
  title, ₹ price badge via formatINR, condition badge, Fixed/Negotiable badge, seller's
  hall, relative time, save heart (non-functional until Phase 6), Contact button
  (non-functional until Phase 6), overflow menu with Report (Phase 8).
- Sold listings: muted, SOLD badge, contact disabled.
- Infinite scroll, 20 per page, with skeleton cards that match the real layout, an empty
  state with a CTA, and an error state with retry.
- Listing detail route with a swipeable photo carousel.
- Pinned listings and the active announcement render above the feed.

Verification I care about: open the Network tab, load the feed, and confirm no response
payload contains a phone number. Show me that.

Then /verify-phase.
```

---

## Phase 5 — Create, Edit & Manage Listings

```
Execute Phase 5 (Create, Edit & Manage Listings) from task.md, using /ship-feature.

- Zod listing schema in src/lib/validation/ mirroring the DB constraints exactly
  (title 3–80, description ≤1000, price integer 0–500000, 1–4 photos).
- Create form with react-hook-form: title, category, price, negotiable toggle,
  condition, description, hall (auto-filled from profile, read-only). Validate on blur,
  errors under the field, whole form disabled while submitting.
- Photo pipeline, in this order: pick up to 4 → immediate local preview → compress to
  ≤1600px long edge → strip EXIF (this matters, geotags from a hall room are a real
  privacy leak) → convert to WebP → upload to listing-photos/{user_id}/{listing_id}/
  with per-image progress. One failed upload must not lose the user's form input.
- On success: canvas-confetti, toast, redirect to the new listing.
- Edit listing (owner only), Mark as Sold / Unmark, Delete with a confirmation sheet.
- My Listings in Profile with an active/sold segmented control.

Prove that the ownership rules hold at the database level, not just in the UI: write a
test where student B attempts to update and delete student A's listing directly through
the API and is refused.

Then /verify-phase.
```

---

## Phase 6 — WhatsApp Contact & Saved Items

```
Execute Phase 6 (WhatsApp Contact & Saved Items) from task.md.

This is the privacy-critical phase. Implement docs/PRODUCT_SPEC.md §7 exactly and read
.agents/rules/security-and-privacy.md first.

- Wire get_contact_number into src/lib/data/ with typed errors for: banned, rate
  limited, listing not active.
- Contact Seller: call the RPC on tap → build the wa.me link → window.open. The number
  must never be rendered as text, never stored in component state beyond that call, and
  never logged.
- Message, URL-encoded exactly:
  Hi! I saw your listing "<Title>" for ₹<Price> on KGP Bazaar. Is it available?
- Rate-limit error shows a friendly message, not a Postgres error.
- Contact disabled on sold and expired listings.
- Save / unsave heart with an optimistic update and precise query invalidation.
- Saved Items screen in Profile.

Tests: the 31st reveal within an hour is refused by the database (not by the client); a
contact_events row is written each time; a banned user is refused.

Then /verify-phase.
```

---

## Phase 7 — Wanted Board

```
Execute Phase 7 (Wanted Board) from task.md, using /ship-feature.

Mirror the For Sale feed's patterns rather than inventing new ones.

- src/lib/data/wantedRequests.ts with search, category filter and sort.
- Wanted feed reachable from the Home segmented control and at /wanted.
- RequestCard: title, category badge, "Budget: Under ₹X" badge (omit if no budget),
  description, requester's hall, relative time, Report, and a prominent
  "I Have This! (WhatsApp)" button using get_requester_number.
- Response message, URL-encoded exactly:
  Hi! I saw your request "<Item Title>" on KGP Bazaar Wanted Board. I have this item available!
- Create request form: title, category, max budget (optional), description.
- Owner actions: Mark Found / Fulfilled (muted badge, response button disabled) and Delete.
- My Requests in Profile, open/fulfilled segmented.
- The centre FAB now opens a chooser sheet: "Sell an item" / "Post a request".

E2E: student A posts a request, student B responds and gets the correct WhatsApp link.

Then /verify-phase.
```

---

## Phase 8 — Reporting & Admin Panel

> This is the largest phase. Consider asking the agent to split it into 8a (reporting +
> dashboard), 8b (moderation + users), 8c (content + announcements + audit).

```
Execute Phase 8 (Reporting & Admin Panel) from task.md. Build it in three parts and
pause for my review after each: (a) reporting + dashboard, (b) moderation queue + user
management, (c) content management + announcements + audit log.

Read docs/PRODUCT_SPEC.md §8 for the exact feature list.

Non-negotiable for the whole phase: every admin capability is enforced by an RLS policy
or a security-definer function that checks is_admin(). The React <AdminRoute> guard is
cosmetic. For each admin feature you build, also write a test proving a normal student
calling that endpoint directly is refused by Postgres.

(a) Reporting + dashboard
- Report sheet on listings and requests: reason picker (the 7 reasons in the spec) plus
  optional details ≤200 chars. One report per user per item, enforced by a unique index.
- /admin dashboard: stat cards (students, active listings, sold, open requests, pending
  reports, signups today/this week) and charts for signups per day (30d), listings per
  category, listings per hall. Recent activity feed.
- Realtime badge for pending reports. This is the only realtime subscription in the app.

(b) Moderation + users
- /admin/reports: queue with content preview, filter by status and reason, bulk select,
  and per-report actions — hide, delete, dismiss, ban the poster. Every action requires
  a short reason note.
- /admin/users: search by name, roll number or hall; sortable; ban (with reason) /
  unban / promote to admin; view a user's listings. Admins must not be able to ban or
  demote other admins from the UI — enforce this in SQL too.

(c) Content, announcements, audit
- /admin/listings: all listings and requests including hidden and deleted; filter by
  category, status, hall, date; edit any field, force mark-sold, hide, delete, restore,
  pin to top of feed.
- /admin/announcements: message ≤200 chars, type (info/warning/success), start/end
  datetime, active toggle. Students see the most recent active one as a dismissible
  banner above the feed.
- /admin/audit: read-only, paginated, filterable by actor and action. No delete path
  exists for anyone.
- Every destructive admin action writes an admin_audit_log row with actor, action,
  target, and reason.

Confirm at the end that the admin bundle is lazy-loaded and does not appear in the
student's initial JS download — show me the bundle analysis.

Then /verify-phase.
```

---

## Phase 9 — PWA & Polish

```
Execute Phase 9 (PWA & Polish) from task.md, then run the pwa-verify skill in full.

- Delete public/manifest.json. vite-plugin-pwa must own the single manifest — having
  both is a real bug in the current repo.
- Add the icons from public/ (I will provide them; if any are missing, tell me exactly
  which filenames and sizes you need rather than shipping without them).
- Service worker: cache the app shell and static assets only. Never cache Supabase API
  responses — a stale listing or a stale auth token is worse than a spinner.
- Android install banner via beforeinstallprompt; iOS instruction sheet (detect iOS +
  not standalone) since beforeinstallprompt doesn't exist there. Remember dismissal for
  30 days in localStorage.
- Offline: cached shell plus an "You're offline" banner. Never a blank white screen.
- "Update available" toast when a new service worker is waiting; reload on user action,
  never mid-session.
- iOS specifics: apple-mobile-web-app-capable and status bar meta tags, safe-area insets
  so the bottom nav clears the home indicator, 16px font on inputs so iOS doesn't zoom.
- Full accessibility sweep of the golden paths with a screen reader.
- Lighthouse mobile: PWA installable, Performance ≥85, Accessibility ≥95, Best
  Practices ≥95. Report the actual numbers, and if any is short, fix it and re-run.
- Student bundle ≤200 kB gzipped.

Then /verify-phase.
```

---

## Phase 10 — Testing & Hardening

```
Execute Phase 10 (Testing & Hardening) from task.md.

- Playwright golden paths, each as a standalone spec:
  1. signup → OTP → profile completion → post a listing → another account contacts them
  2. post a wanted request → another account responds
  3. report a listing → admin sees it in the queue → deletes it → it's gone from the
     feed → an audit log row exists
  4. admin bans a user → that user can no longer post or contact anyone
- Run the rls-audit skill against a freshly reset database and paste the full deny matrix.
- Error boundaries around every route. Confirm no raw Postgres error string can ever
  reach the UI — those leak schema details.
- Seed 1,000 listings and verify feed pagination and query timing (target p95 < 400ms).
- Verify EXIF stripping with a genuinely geotagged photo — check the uploaded object,
  not the local preview.
- Grep the codebase and show me zero hits for: service_role, `any`,
  dangerouslySetInnerHTML, and any direct supabase call inside src/features/ or
  src/components/.
- Review abuse vectors: contact reveal limits, report spam, signup flooding. Tell me
  what's protected and what isn't.

Report honestly. If something is PARTIAL, say PARTIAL and explain what's missing.

Then /verify-phase.
```

---

## Phase 11 — Deploy & Launch

> Before pasting: complete §7 of `docs/SETUP_MANUAL.md` (Vercel + production Supabase URLs).

```
Execute Phase 11 (Deploy & Launch) from task.md using the /deploy workflow.

- Add vercel.json with an SPA rewrite so deep links like /listing/<id> don't 404 on refresh.
- Verify that every migration in supabase/migrations/ has been applied to the hosted
  project. List local vs applied and show they match. Do not deploy a frontend that
  expects a column production doesn't have.
- Run the rls-audit skill against the hosted project, not just local.
- Verify the Vercel env vars match .env.example exactly, and confirm no service_role key
  exists anywhere in Vercel or the repo.
- Confirm the hosted Supabase Site URL and redirect URLs include the production and
  preview domains, and that the Google OAuth authorised origins do too. This is the most
  common launch failure — Google sign-in works locally and dies in production.
- Deploy, then smoke test on the live URL from a mobile viewport, reporting PASS/FAIL
  with what you observed for each:
  1. KGP email signup → OTP arrives → profile completion
  2. Google sign-in with a KGP account
  3. a non-KGP email is rejected
  4. post a listing with 2 photos → appears in the feed
  5. Contact Seller opens WhatsApp with the correct prefilled text
  6. install to home screen → opens standalone
  7. /admin as a non-admin → blocked
- Build the in-app Rules page at /rules from docs/PRODUCT_SPEC.md §11 verbatim
  (prohibited items, the enforcement ladder, and the "trade at your own risk, meet in
  public campus spaces, inspect before paying" note). Link it from Profile and from the
  create-listing form.
- Bootstrap check: confirm that pepperjet@kgpian.iitkgp.ac.in is the only row in
  profiles with is_admin = true, and that no other account can reach /admin.

If any smoke test fails, tell me plainly whether to roll back.
```

---

## Useful mid-flight prompts

**When the agent drifts from the rules**
```
Stop. Re-read AGENTS.md "Standing Rules" and .agents/rules/. List every violation you've
introduced in this phase — any `any`, any direct supabase call in a component, any
rendered phone number, any raw hex colour, any file over 200 lines, any new dependency.
Fix them all, then continue.
```

**When a phase feels too big**
```
Don't implement this yet. Split this phase into 3 chunks I can review independently,
each ending in a working, committable state. Show me the split and wait for approval.
```

**When something breaks**
```
Don't patch symptoms. Give me: the exact failing command and output, your hypothesis for
the root cause, the two most likely alternative explanations, and how you'd distinguish
between them. Then fix the root cause.
```

**Security spot check (run this after Phases 5, 6 and 8)**
```
Run the rls-audit skill in full against the current database and paste the complete deny
matrix. I want to see the actual assertions, not a summary.
```

**Before you trust a "done"**
```
List everything in this phase you marked complete but only verified by reading the code
rather than by running it or clicking it. Then go verify those.
```
