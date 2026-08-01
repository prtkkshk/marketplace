# Implementation Plan: KGP Bazaar

## Objective

Ship a production-usable, installable PWA that lets any verified IIT Kharagpur student
sign in with their institute email, browse and post second-hand listings and wanted
requests across six categories, and reach the other party on WhatsApp in one tap —
backed by Supabase with properly enforced Row Level Security, and governed by a
built-in admin panel for moderation, user management, analytics and announcements.
Deployed on Vercel, verified by a full test suite.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Vite + React 18 + TypeScript (strict) SPA  │
│  Tailwind · framer-motion · lucide-react    │
│  TanStack Query · React Router · react-hook-form + zod │
│                                             │
│  src/features/*  →  src/lib/data/*  ────────┼──┐
│  (no component ever calls supabase directly)│  │
│  vite-plugin-pwa: shell caching, install    │  │
└─────────────────────────────────────────────┘  │
                                                 │ supabase-js (anon key only)
┌────────────────────────────────────────────────▼──────────┐
│ Supabase                                                   │
│  Auth: email+password (OTP confirm) · Google OAuth         │
│        domain-locked to @kgpian.iitkgp.ac.in via auth hook │
│  Postgres: profiles, listings, wanted_requests, saved_items│
│            reports, announcements, admin_audit_log,        │
│            contact_events  — RLS on every table            │
│  RPC: get_contact_number() — the only path to a phone no.  │
│  Storage: private bucket listing-photos, per-user prefixes │
│  pg_cron: expiry + purge jobs                              │
└────────────────────────────────────────────────────────────┘
                    │
              Vercel (HTTPS, auto-deploy from GitHub main)
              GitHub Actions: lint · typecheck · test · build · e2e
```

**Key architectural commitments**

1. **The data layer is the seam.** Every query lives in `src/lib/data/`. This is what
   makes the app testable and what would make a backend swap survivable.
2. **Authorisation lives in Postgres, not React.** UI guards are cosmetic.
3. **Phone numbers are never in a list payload.** One rate-limited, logged RPC.
4. **Migrations are the schema.** The Supabase dashboard is for inspection only.

## Approach — phases

Each phase ends with `/verify-phase`. No phase starts before the previous one passes.

| # | Phase | Outcome |
|---|---|---|
| 0 | Foundation & tooling | TS + Tailwind + lint + test + CI skeleton runs green on an empty app |
| 1 | Supabase schema & RLS | All tables, policies, RPCs, storage, seed data + deny-case tests passing. No UI. |
| 2 | Auth & profile | Both sign-in methods, domain lock, OTP, profile completion, route guards, ban screen |
| 3 | App shell & navigation | Bottom nav, desktop header, routing, UI primitives, loading/empty/error patterns |
| 4 | For Sale feed | Feed, search, category pills, sort, filters, infinite scroll, listing detail |
| 5 | Create & manage listings | Post form, photo pipeline, edit, mark sold, delete |
| 6 | WhatsApp contact | `get_contact_number` RPC wired, rate limiting, deep links, saved items |
| 7 | Wanted Board | Request feed, create, respond, fulfil, delete |
| 8 | Reporting & admin panel | Report flow + dashboard, moderation queue, users, content, announcements, audit log |
| 9 | PWA & polish | Manifest cleanup, service worker, install banners, offline, a11y, Lighthouse |
| 10 | Testing & hardening | Full E2E, RLS audit, load sanity, error boundaries |
| 11 | Deploy | Vercel, prod Supabase config, smoke test, launch checklist |

Detailed task breakdown per phase: `task.md`.
Copy-paste prompts per phase: `docs/AGENT_PROMPTS.md`.

## Decisions made (and why)

| Decision | Choice | Rationale |
|---|---|---|
| Backend | Supabase from day 1 | LocalStorage can't share listings between students — that's the entire product |
| Language | TypeScript strict | Agent-written code drifts on data shapes; types catch it at build |
| Auth | Email+password (OTP confirm) **and** Google OAuth, both domain-locked | User's explicit choice; Google is one-tap, password is the fallback if KGP isn't on Workspace |
| Admin access | `profiles.is_admin` + RLS | Cannot be forged client-side; promotable from the UI after the first bootstrap |
| Hosting | Vercel | Free, HTTPS (required for PWA install), zero-config Vite, GitHub auto-deploy |
| Quality bar | Full rigour | User's choice: Vitest + Playwright + RLS tests + CI |
| Phone privacy | RPC-only disclosure | Otherwise the app is a scrapeable directory of every student's WhatsApp |
| Browsing | Requires login | Keeps the student directory off the public internet |

## Assumptions made where the user said "you decide"

- **Saved / wishlist items are IN v1** (Phase 6). Cheap, and it's the main reason a
  student re-opens the app.
- **Push notifications are OUT of v1**, deferred to v2. They need VAPID keys, an edge
  function, and iOS PWA push has real limitations. Noted as the top v2 candidate.
- **In-app chat is OUT**, permanently — it contradicts the WhatsApp-first design.
- **Listing expiry (30 days) is IN** — it was offered under trust & safety and the user
  selected the other two items; expiry is included anyway because a feed full of stale
  items is the most common way campus marketplaces die. Cheap to remove: one cron job.

## Resolved — answered by the product owner (2026-08-01)

All seven previously-open questions are now closed. Agents must treat these as settled
and must not re-litigate them.

| # | Question | Answer |
|---|---|---|
| 1 | Hall list accuracy | **Confirmed correct** as written in `docs/PRODUCT_SPEC.md` §4. Use it verbatim. |
| 2 | Is `@kgpian.iitkgp.ac.in` on Google Workspace? | **Yes.** Google Sign-In is in scope and can be domain-hinted with `hd`. |
| 3 | Do UG and PG students share the `kgpian` domain? | **Yes.** One allowed domain, `@kgpian.iitkgp.ac.in`, covers every student cohort. No second domain. |
| 4 | Roll-number regex for all cohorts | **Confirmed.** `^[0-9]{2}[A-Z]{2}[0-9]{5}$` (e.g. `22CS10045`) is valid for all cohorts. |
| 5 | Initial admins | **Exactly one:** Prateek — `pepperjet@kgpian.iitkgp.ac.in`. No other admin at launch. Bootstrapped by hand per `docs/SETUP_MANUAL.md` §8. |
| 6 | Prohibited-items policy | **Confirmed** as drafted: no alcohol, no drugs or tobacco, no weapons, no exam/leaked academic material, no room sublets. Written out in `docs/PRODUCT_SPEC.md` §11. |
| 7 | Domain name | **`kgpbazaar.vercel.app`** — confirmed available, no custom domain for v1. |

### Consequences to remember

- Because there is only one admin, **the moderation queue has a single point of
  failure.** Build the report-notification path well (realtime badge is not enough on
  its own if Prateek isn't in the app). Consider a daily digest as an early v2 item.
- Because there is exactly one admin, "admins cannot demote other admins from the UI"
  (`docs/PRODUCT_SPEC.md` §8.3) is currently untestable in production — but keep the
  rule and test it with seeded accounts, since a second admin will exist eventually.
- Because the domain is `*.vercel.app`, the OAuth redirect and Supabase Site URL values
  in `docs/SETUP_MANUAL.md` §5 and §7 are final. If a custom domain is ever bought, three
  places must change together: Vercel domains, Supabase Auth URL configuration, and the
  Google Cloud authorised origins.

### Still genuinely open (non-blocking)

- Nothing blocks Phase 0 through Phase 11. If an agent discovers a new ambiguity, it
  adds it here rather than guessing.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Student phone numbers get scraped** | Severe, irreversible, reputational | RPC-only disclosure, rate limiting, `contact_events` log, mandatory `rls-audit` before deploy |
| **RLS gap ships to production** | Any student can edit/delete others' data | Deny-case tests are part of the Definition of Done, not an afterthought |
| **Single admin (Prateek only)** | Reports pile up unseen; no cover if he's unavailable | Realtime badge + a visible pending-report count on the Profile screen; promote a second admin as soon as one is trusted |
| Agent builds UI before RLS exists | Rework + insecure defaults | Phase 1 is database-only, on purpose |
| Photo storage costs on free tier | Service degradation | Client compression to WebP ≤1600px, 4-photo cap, 90-day purge of deleted items |
| Empty marketplace at launch | Nobody comes back | Seed with real listings before promoting; announcements feature to drive a launch week |
| Scope creep into chat/payments | Never ships | Explicit Out of Scope list in `AGENTS.md`; agent must stop and ask |
| Agent writes one giant phase | Unreviewable diff | One phase per branch, `/verify-phase` gate, ~8-file approval threshold |
