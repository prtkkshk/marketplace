# Task List: KGP Bazaar

Work one phase at a time. Run `/verify-phase` before ticking a phase's Definition of
Done. Owner tags map to the personas in `AGENTS.md`.

---

## Phase 0 — Foundation & Tooling

- [x] Convert the project to TypeScript: `tsconfig.json` (strict, `noUncheckedIndexedAccess`), rename `vite.config.js` → `vite.config.ts` — owner: DevOps
- [x] Install and configure TailwindCSS + PostCSS + Autoprefixer; add the sky/slate design tokens to `tailwind.config.ts` — owner: Frontend
- [x] Add dependencies: `@supabase/supabase-js`, `@tanstack/react-query`, `react-router-dom`, `react-hook-form`, `zod`, `@hookform/resolvers`, `browser-image-compression` — owner: DevOps
- [x] Add dev dependencies: `typescript`, `vitest`, `@testing-library/react`, `jsdom`, `@playwright/test`, `eslint` + TS/react-hooks/jsx-a11y plugins, `prettier` — owner: DevOps
- [x] Add scripts: `dev`, `build`, `preview`, `lint`, `format`, `typecheck`, `test`, `test:e2e`, `db:types` — owner: DevOps
- [x] Create the folder skeleton from `.agents/rules/coding-standards.md` — owner: Frontend
- [x] Create `.env.example`, `.gitignore`, and a startup env-var assertion that throws a readable error — owner: DevOps
- [x] `src/main.tsx` + `App.tsx` rendering a placeholder route; app boots clean — owner: Frontend
- [x] Update `index.html`: script src `/src/main.jsx` → `/src/main.tsx` (currently points at a file that won't exist) — owner: Frontend
- [x] GitHub Actions workflow: lint + typecheck + test + build on push; e2e on PR — owner: DevOps
- [x] `npm audit` step in CI, failing on high/critical — owner: DevOps

**Definition of Done:** `npm run dev` serves a blank styled shell; `lint`, `typecheck`,
`test`, `build` all pass locally and in CI; no `any` in the codebase.

---

## Phase 1 — Supabase Schema, RLS & Storage (no UI)

- [x] Init `supabase/` locally; confirm `npx supabase db reset` replays cleanly — owner: Backend
- [x] Migration: all enums from `docs/DATA_MODEL.md` — owner: Backend
- [x] Migration: `profiles` + email-domain check + roll-number check + `on auth.users` insert trigger — owner: Backend
- [x] Migration: `is_admin()` and `is_active_student()` helper functions — owner: Backend
- [x] Migration: `protect_privileged_columns()` trigger guarding `is_admin` / `is_banned` — owner: Backend
- [x] Migration: `listings` with all constraints and indexes (incl. full-text GIN) — owner: Backend
- [x] Migration: `wanted_requests` — owner: Backend
- [x] Migration: `saved_items`, `reports`, `announcements`, `admin_audit_log`, `contact_events` — owner: Backend
- [x] Migration: RLS enabled + per-operation policies on every table, matching the matrix in `docs/DATA_MODEL.md` — owner: Backend
- [x] Migration: `get_contact_number()` and `get_requester_number()` RPCs with ban check, 30/hour rate limit, and `contact_events` logging — owner: Backend
- [x] Migration: `listing-photos` private bucket + per-user-prefix storage policies + delete-cascade trigger — owner: Backend
- [x] Migration: pg_cron expiry and purge jobs — owner: Backend
- [x] `supabase/seed.sql`: 10 students across halls, 30 listings across all 6 categories, 8 wanted requests, 3 reports, 1 admin, fake phone numbers only — owner: Backend
- [x] `npm run db:types` → commit `src/lib/database.types.ts` — owner: Backend
- [x] `src/lib/supabase.ts` typed client with env assertions — owner: Backend
- [x] RLS deny-case tests in `tests/rls/` for every table (anon / student A / student B / banned / admin) — owner: QA
- [x] Test: a student cannot set their own `is_admin` or clear their own `is_banned` — owner: QA
- [x] Test: `get_contact_number` rejects banned users and enforces the rate limit — owner: QA

**Definition of Done:** `supabase db reset` replays all migrations from scratch; every
table reports `rowsecurity = true`; the full deny matrix passes; types are generated and
committed. Run the `rls-audit` skill and paste the results.

---

## Phase 2 — Authentication & Profile

- [x] Configure email+password with email confirmation; OTP entry screen with 60s resend cooldown, max 3 per 15 min — owner: Backend
- [x] Configure Google OAuth provider; reject non-KGP emails and destroy the session with a clear message — owner: Backend
- [x] Server-side domain enforcement (auth hook / trigger) — not just client validation — owner: Backend
- [x] `AuthProvider` exposing `{ session, profile, isAdmin, loading, signOut }`; nothing else touches `supabase.auth` — owner: Frontend
- [x] Sign-up, sign-in, forgot-password, OTP screens — mobile-first, all three async states — owner: Frontend
- [x] Profile completion screen: name, roll number, hall dropdown, WhatsApp number, with zod validation matching the DB constraints — owner: Frontend
- [x] `KGP_HALLS` constant, copied verbatim from `docs/PRODUCT_SPEC.md` §4 (confirmed correct — do not modify the list) — owner: Frontend
- [x] Single allowed domain `@kgpian.iitkgp.ac.in` covering all cohorts; roll-number regex `^[0-9]{2}[A-Z]{2}[0-9]{5}$` confirmed for all cohorts — owner: Backend
- [x] Route guards: `<ProtectedRoute>` (signed in + profile complete), `<AdminRoute>`, `<BannedScreen>` — owner: Frontend
- [x] Profile screen: details, My Listings, My Requests, Saved, Settings, Admin Panel link if admin — owner: Frontend
- [x] Edit profile and delete account (cascades listings, requests, storage objects) — owner: Frontend + Backend
- [x] Unit tests for every validation schema, including the rejection cases — owner: QA
- [x] E2E: sign up → OTP → profile completion → land on the feed — owner: QA
- [x] E2E: a `@gmail.com` address is rejected at signup — owner: QA

**Definition of Done:** Both sign-in methods work end to end; a non-KGP email cannot
create a usable account even via a direct API call; an incomplete profile cannot reach
the feed; a banned user sees only the suspension screen.

---

## Phase 3 — App Shell & Navigation

- [x] UI primitives in `src/components/ui/`: Button, Input, Textarea, Select, Badge, Card, Sheet, Dialog, Skeleton, Toast, EmptyState, ErrorState, Spinner — owner: Frontend
- [x] `BottomNav` (4 items, raised centre FAB, safe-area inset, `layoutId` sliding indicator) — owner: Frontend
- [x] `DesktopHeader` (sticky, `backdrop-blur-md bg-white/80`) — owner: Frontend
- [x] `AppShell` composing them with the router outlet — owner: Frontend
- [x] All routes registered; `/admin/*` lazy-loaded behind `<AdminRoute>` — owner: Frontend
- [x] TanStack Query provider with sane defaults (refetch on focus, 30s stale time) — owner: Frontend
- [x] Global error boundary + 404 screen — owner: Frontend
- [x] `formatINR`, `whatsappLink`, `timeAgo`, `cn` utils, each with unit tests — owner: Frontend + QA
- [x] Accessibility pass: focus rings, 44px targets, keyboard navigation of the nav — owner: QA

**Definition of Done:** Every route renders its placeholder; navigation works by tap and
by keyboard at 390px and 1280px; no layout shift; motion respects `prefers-reduced-motion`.

---

## Phase 4 — For Sale Feed

- [x] `src/lib/data/listings.ts`: paginated fetch with category, search, sort, condition, hall, max-price filters — never selects `whatsapp_number` — owner: Backend
- [x] Segmented control switching For Sale ↔ Wanted Board — owner: Frontend
- [x] Search bar, debounced 250ms, backed by the full-text index — owner: Frontend
- [x] Horizontally scrollable category pills with "All" default — owner: Frontend
- [x] Sort dropdown: Newest / Price ↑ / Price ↓ — owner: Frontend
- [x] Filter sheet: condition, negotiable-only, hall, max price — owner: Frontend
- [x] All filter state in the URL query string; a filtered feed is shareable and survives refresh — owner: Frontend
- [x] `ListingCard` with every badge, lazy image with fixed aspect ratio, muted SOLD state — owner: Frontend
- [x] Infinite scroll, 20 per page, with skeleton / empty / error states — owner: Frontend
- [x] Listing detail screen with swipeable photo carousel — owner: Frontend
- [x] Pinned listings and the active announcement render above the feed — owner: Frontend
- [x] Unit tests for the query builder; E2E for search + filter + sort — owner: QA

**Definition of Done:** With 30 seeded listings, search, all filters, and all sorts return
correct results; feed p95 under 400ms; no phone number appears in any network payload
(verify in the Network tab).

---

## Phase 5 — Create, Edit & Manage Listings

- [x] Zod listing schema mirroring the DB constraints exactly — owner: Frontend
- [x] Create-listing form: title, category, price, negotiable, condition, description, hall (read-only) — owner: Frontend
- [x] Photo pipeline: pick up to 4 → preview → compress to ≤1600px WebP → strip EXIF → per-image upload progress → remove before submit — owner: Frontend
- [x] Upload to `listing-photos/{user_id}/{listing_id}/`; a single failed image doesn't lose the form — owner: Frontend
- [x] Success: confetti + toast + redirect to the new listing — owner: Frontend
- [x] Edit listing (owner only, enforced by RLS) — owner: Frontend
- [x] Mark as Sold / Unmark, with the muted badge and disabled contact button — owner: Frontend
- [x] Delete with confirmation sheet; storage objects removed by the DB trigger — owner: Frontend + Backend
- [x] My Listings tab in Profile, active/sold segmented — owner: Frontend
- [x] Unit tests for validation and the compression helper; E2E post-a-listing — owner: QA

**Definition of Done:** A student can post a 4-photo listing on a phone-sized viewport in
under a minute; another student cannot edit or delete it (verified against the API, not
just the UI); deleting removes the storage objects.

---

## Phase 6 — WhatsApp Contact & Saved Items

- [x] `get_contact_number` RPC wired into the data layer with typed errors — owner: Backend
- [x] Contact Seller button: call RPC → build `wa.me` link → open; number never rendered — owner: Frontend
- [x] Prefilled message exactly per `docs/PRODUCT_SPEC.md` §7, URL-encoded — owner: Frontend
- [x] Friendly error when rate-limited ("You've contacted a lot of sellers recently — try again in an hour") — owner: Frontend
- [x] Contact button disabled on sold/expired listings — owner: Frontend
- [x] Save/unsave (heart) with optimistic update — owner: Frontend
- [x] Saved Items screen in Profile — owner: Frontend
- [x] Tests: rate limit enforced server-side; `contact_events` row written; no phone number in any payload except the RPC response — owner: QA

**Definition of Done:** Tapping Contact opens WhatsApp with the correct prefilled text on
a real phone; the 31st reveal in an hour is refused by the database.

---

## Phase 7 — Wanted Board

- [x] `src/lib/data/wantedRequests.ts` — owner: Backend
- [x] Wanted feed with search, category filter, sort — owner: Frontend
- [x] `RequestCard`: title, category badge, `Budget: Under ₹X`, description, hall, time — owner: Frontend
- [x] "I Have This! (WhatsApp)" button via `get_requester_number` — owner: Frontend
- [x] Create-request form (title, category, max budget optional, description) — owner: Frontend
- [x] Mark Found / Fulfilled and Delete, owner only — owner: Frontend
- [x] My Requests tab in Profile — owner: Frontend
- [x] Sell/Request FAB opens a chooser: "Sell an item" / "Post a request" — owner: Frontend
- [x] E2E: post a request → respond from another account — owner: QA

**Definition of Done:** Both feeds are reachable from the segmented control; the response
message matches the spec exactly; fulfilled requests are visibly muted and unresponsive.

---

## Phase 8 — Reporting & Admin Panel

- [x] Report sheet on listings and requests: reason picker + optional ≤200 char details; one report per user per item — owner: Frontend
- [x] `src/lib/data/admin.ts` with every admin query, all admin-gated in SQL — owner: Backend
- [x] Admin dashboard: stat cards + signups/day, listings/category, listings/hall charts, recent activity — owner: Frontend
- [x] Realtime pending-report badge (the only realtime subscription in the app) — owner: Frontend
- [x] Moderation queue: preview, filter by status/reason, bulk select, actions (hide / delete / dismiss / ban), mandatory reason note — owner: Frontend
- [x] User management: search by name/roll/hall, ban with reason, unban, promote to admin, view a user's listings — owner: Frontend
- [x] Guard: admins cannot ban or demote other admins from the UI — owner: Backend
- [x] Content management: all listings and requests incl. hidden/deleted; edit, force-sold, hide, delete, restore, pin — owner: Frontend
- [x] Announcements: create/edit/activate, ≤200 chars, type, start/end; one active banner shown, dismissible — owner: Frontend
- [x] Audit log screen: read-only, paginated, filterable by actor and action — owner: Frontend
- [x] Every destructive admin action writes an `admin_audit_log` row — owner: Backend
- [x] Tests: a non-admin is refused by every admin RPC and policy at the API level, not just the UI — owner: QA
- [x] E2E: report a listing → admin sees it → deletes it → it disappears from the feed → audit row exists — owner: QA

**Definition of Done:** A non-admin calling any admin endpoint directly is refused by
Postgres; every destructive action is in the audit log; the admin bundle is lazy-loaded
and absent from the student's initial download.

---

## Phase 9 — PWA & Polish

- [x] Delete the redundant `public/manifest.json`; `vite-plugin-pwa` owns the manifest — owner: DevOps
- [x] Generate and add real icons from the brand logo: `pwa-192/512`, `pwa-maskable-192/512` (safe zone verified), `apple-touch-icon.png`, `favicon.svg`/`.ico`/PNG fallbacks, `masked-icon.svg`, `og-image.png`; manifest + `index.html` head wired up — owner: DevOps
- [x] Decide the brand-colour conflict: logo is `#4787F9`, tokens are `#0284C7` — see `docs/brand/README.md` — owner: PM
- [x] Service worker: shell + static assets only, never Supabase responses — owner: DevOps
- [x] Android install banner via `beforeinstallprompt`; iOS instruction sheet; dismissal remembered 30 days — owner: Frontend
- [x] Offline banner and cached shell; no blank screen — owner: Frontend
- [x] "Update available" toast on new service worker — owner: Frontend
- [x] iOS: `apple-mobile-web-app-capable` meta, safe-area insets, 16px inputs to stop zoom — owner: Frontend
- [x] Full a11y sweep: labels, focus order, contrast, screen-reader pass on the golden paths — owner: QA
- [x] Lighthouse mobile: PWA ✅, Perf ≥ 85, A11y ≥ 95, BP ≥ 95 — owner: QA
- [x] Bundle check: student bundle ≤ 200 kB gzipped — owner: DevOps

**Definition of Done:** The `pwa-verify` skill passes every item on a real Android phone
and a real iPhone.

---

## Phase 10 — Testing & Hardening

- [x] Playwright golden paths: signup → profile → post → contact; wanted post → respond; report → admin delete; admin ban → user blocked — owner: QA
- [x] Full `rls-audit` skill run against a fresh database; paste the deny matrix — owner: QA
- [x] Error boundaries around each route; no raw Postgres errors ever reach the UI — owner: Frontend
- [x] Sanity load test: 1,000 seeded listings, verify feed pagination and query timings — owner: QA
- [x] Verify EXIF stripping on a real geotagged photo — owner: QA
- [x] Grep for `service_role`, `any`, `dangerouslySetInnerHTML`, direct `supabase` calls in components — zero hits — owner: QA
- [x] Rate-limit and abuse review: contact reveals, report spam, signup flooding — owner: Backend

**Definition of Done:** Full suite green in CI; the audit report shows PASS on every deny
case; no rule violation from `AGENTS.md` remains.

---

## Phase 11 — Deploy & Launch

- [ ] Apply all migrations to the hosted Supabase project; verify local and hosted lists match — owner: DevOps
- [ ] Configure hosted Auth: Site URL, redirect URLs (prod + preview), Google client, email templates — owner: DevOps
- [ ] Vercel project connected to GitHub `main`; env vars set; no `service_role` anywhere — owner: DevOps
- [ ] Run the `deploy` workflow; smoke test all 7 items on the live URL from a real phone — owner: DevOps + QA
- [ ] Bootstrap the sole admin account `pepperjet@kgpian.iitkgp.ac.in` (per `docs/SETUP_MANUAL.md` §8); verify no other profile has `is_admin = true` — owner: DevOps
- [ ] Seed the live app with genuine initial listings before promoting it — owner: PM
- [ ] Build the `/rules` page from `docs/PRODUCT_SPEC.md` §11 (prohibited items + enforcement ladder + trade-at-your-own-risk note), linked from Profile and the create-listing form — owner: Frontend

**Definition of Done:** A KGP student can install the app from the live URL on their
phone, sign up, post a listing, and be contacted on WhatsApp by another student.

---

## Definition of Done (MVP overall)

- Only verified `@kgpian.iitkgp.ac.in` accounts can use the app, enforced server-side.
- A student can post a listing with photos and be contacted on WhatsApp in one tap.
- The Wanted Board works in both directions.
- No student's phone number is obtainable in bulk.
- An admin can moderate reports, ban users, manage content, post announcements, and see
  analytics — and every destructive action is audited.
- The app installs to the home screen on Android and iOS and works offline as a shell.
- `lint`, `typecheck`, unit, RLS, and E2E suites all pass in CI.
- Deployed on Vercel at an HTTPS URL, running on free tiers.
