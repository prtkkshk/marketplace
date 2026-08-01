# KGP Bazaar

An installable PWA for IIT Kharagpur students to buy, sell, and request second-hand
items across campus halls of residence. Deals are arranged in-app and closed in
person over WhatsApp — there is no payment gateway and there never will be.

## Overview

- **Goal:** Ship a real, usable campus marketplace that a KGP student can install on
  their phone, sign into with their institute email, and use to sell a cycle or find
  a second-hand textbook within two minutes.
- **Target users:** IIT Kharagpur students with an `@kgpian.iitkgp.ac.in` email.
  Secondary user: a small set of student admins who moderate the platform.
- **Tech stack:** Vite 5 + React 18 + **TypeScript (strict)** · TailwindCSS ·
  `lucide-react` · `framer-motion` · **Supabase** (Postgres + Auth + Storage +
  Row Level Security) · `vite-plugin-pwa` · Vitest + Playwright · GitHub Actions ·
  deployed on **Vercel**.
- **Platform:** Mobile-first installable web app (PWA). Desktop is supported but
  secondary — design for a 390px viewport first.
- **Status:** Greenfield. Only `index.html`, `package.json`, `vite.config.js`,
  `public/manifest.json` and docs exist. No `src/` yet. `AGENTS.md`, `task.md`,
  `implementation_plan.md` and `docs/` are the starting context for the first
  work session.
- **Settled decisions:** the "Resolved" table in `implementation_plan.md` records seven
  product decisions confirmed by the owner (hall list, allowed domain, roll-number
  format, Google Workspace, sole admin, prohibited-items policy, production URL). These
  are closed. Do not re-ask them, and do not "improve" the confirmed constants.

## Agent Team

Adopt the persona relevant to the task at hand. When a task spans personas, say so
in the plan and hand off explicitly through `task.md`.

### Product Manager
- **Owns:** Scope, acceptance criteria, phase boundaries, the "is this actually
  usable by a KGP student" judgement call.
- **Responsibilities:**
  - Read `docs/PRODUCT_SPEC.md` before any feature work; it is the source of truth.
  - Refuse scope creep. Anything in "Out of Scope" below needs explicit user approval
    before a line of code is written for it.
  - Convert each phase in `implementation_plan.md` into checkable tasks in `task.md`
    with acceptance criteria that a human can verify by clicking.
  - Flag any requirement that is ambiguous rather than guessing. Ambiguity resolved
    by guessing is the single most expensive failure mode on this project.

### Frontend Engineer
- **Owns:** Everything under `src/` that renders — components, screens, routing,
  state, styling, animations, PWA shell.
- **Tech:** React 18 function components, TypeScript strict, Tailwind utility classes,
  React Router v6, `framer-motion` for motion, `lucide-react` for icons, TanStack
  Query for server state.
- **Responsibilities:**
  - Mobile-first. Every screen must be verified at 390×844 before it is called done.
  - Bottom tab bar on mobile, sticky glassmorphic header on desktop (`md:` and up).
  - No component file over ~200 lines. Extract sub-components into the same feature
    folder rather than growing a file.
  - Every async surface needs three states: loading (skeleton, not a spinner-only
    screen), empty (illustration + one-line CTA), and error (message + retry button).
  - Never call Supabase directly from a component. Go through `src/lib/data/` only.
- **Conventions:** see `.agents/rules/react-conventions.md`.

### Backend Engineer
- **Owns:** Supabase schema, migrations, Row Level Security policies, storage buckets,
  edge functions, and the typed data-access layer in `src/lib/data/`.
- **Tech:** Postgres via Supabase, SQL migrations checked into `supabase/migrations/`,
  types generated into `src/lib/database.types.ts`.
- **Responsibilities:**
  - **RLS is not optional.** Every table has RLS enabled with explicit policies before
    any UI touches it. A table with RLS off is a production incident.
  - Never trust the client for authorisation. `is_admin` is checked in SQL policies,
    never only in React.
  - Every schema change is a new numbered migration file. Never edit an applied
    migration; never make schema changes only through the Supabase dashboard.
  - Regenerate `database.types.ts` after every migration and commit it.
- **Conventions:** see `.agents/rules/supabase-conventions.md`.

### QA Engineer
- **Owns:** Test strategy, the Vitest unit suite, the Playwright E2E suite, RLS policy
  tests, and the manual verification checklist at the end of each phase.
- **Responsibilities:**
  - A phase is not done until: `npm run lint`, `npm run typecheck`, `npm run test`,
    and `npm run test:e2e` all pass, and the phase's manual checklist is ticked.
  - Write RLS tests that assert the *negative* case: student A must not be able to
    update, delete, or read the private fields of student B's rows; a non-admin must
    be rejected by every admin-only policy.
  - E2E must cover the golden paths: sign up → verify → complete profile → post a
    listing → contact seller; post a wanted request → respond; admin deletes a
    reported listing → it disappears from the feed.
  - Report failures with the exact command, the failing assertion, and a hypothesis —
    never "tests are failing".

### DevOps Engineer
- **Owns:** Environment variables, GitHub Actions CI, Vercel deployment, PWA build
  output, Lighthouse budgets.
- **Responsibilities:**
  - CI runs lint + typecheck + unit tests + build on every push, E2E on PRs.
  - No secret ever enters the repo. Only `VITE_`-prefixed public keys reach the client;
    the Supabase `service_role` key must never appear in client code, CI logs, or docs.
  - Keep `.env.example` accurate and in sync with what the app actually reads.
  - Verify the production build is installable: valid manifest, service worker
    registered, icons present, Lighthouse PWA checks green.

## Standing Rules

1. **TypeScript strict mode, no `any`.** If a type is genuinely unknown use `unknown`
   and narrow it. `@ts-ignore` requires a comment explaining why on the line above.
2. **No secrets in code.** All config via `import.meta.env.VITE_*`, documented in
   `.env.example`. The app must fail loudly at startup with a clear message if a
   required env var is missing — never silently fall back to a broken client.
3. **No direct Supabase calls from components.** All data access goes through typed
   functions in `src/lib/data/*.ts`. This is what makes the app testable.
4. **RLS before UI.** Never build a screen against a table whose policies aren't
   written and tested.
5. **Validate on both sides.** Zod schemas in `src/lib/validation/` are the single
   definition of a valid listing/profile/request, used by forms *and* asserted by
   database constraints. Email domain, roll number format, phone format, price range,
   and photo count are all enforced in the database too — a determined user can call
   the API directly.
6. **Every new function in `src/lib/` gets a Vitest test in the same commit.**
7. **Mobile-first, 390px.** Tailwind classes are written mobile-first with `md:`/`lg:`
   overrides, never the reverse.
8. **Feature-folder structure.** `src/features/<feature>/` holds the components,
   hooks, and types for that feature. Shared primitives live in `src/components/ui/`.
9. **Indian rupee formatting** via a single `formatINR()` helper — never inline
   `₹${price}`. Prices are stored as integer paise-free rupees (`integer`), never floats.
10. **Accessibility is not a phase.** Every interactive element is a real `<button>`
    or `<a>`, has an accessible name, and is keyboard reachable. Tap targets ≥ 44px.
11. **Conventional Commits** (`feat:`, `fix:`, `chore:`, `test:`). One phase may span
    several commits; never one giant commit per phase.
12. **Stop and ask** when a decision would be expensive to reverse (schema shape, auth
    flow, dependency additions). Do not add a new npm dependency without stating why
    the existing stack can't do it.

## Workflow

1. Read `task.md`, `implementation_plan.md`, and the relevant section of
   `docs/PRODUCT_SPEC.md` before starting any work.
2. Use Planning mode for anything larger than a single-file change, and pause for
   approval before executing.
3. Work one phase at a time. Do not start Phase N+1 until Phase N's Definition of
   Done is met.
4. Update `task.md` as tasks complete or scope changes.
5. Skills in `.agents/skills/` — `new-migration`, `new-screen`, `rls-audit`,
   `pwa-verify`. Workflows in `.agents/workflows/`, invoked as `/ship-feature`,
   `/verify-phase`, `/deploy`.
6. Phase-by-phase build prompts live in `docs/AGENT_PROMPTS.md`; the human runs them.
   Manual setup the agent cannot do is in `docs/SETUP_MANUAL.md`.

## Out of Scope (v1)

Do not build these. If they seem necessary, stop and ask first.

- **In-app chat or messaging.** Contact is WhatsApp deep links only, by design.
- **Any payment, escrow, wallet, or UPI integration.** Cash/UPI in person, off-platform.
- **Push notifications** (web-push, VAPID, match alerts). Deferred to v2 — noted in
  `implementation_plan.md`.
- **Ratings, reviews, or seller reputation scores.**
- **Sports data, sports filters, or room numbers** — explicitly excluded by the
  product owner.
- **Native iOS/Android apps.** PWA only.
- **Multi-campus / multi-institute support.** Hardcoded to IIT Kharagpur.
- **Server-side rendering, Next.js migration, or a custom backend server.**
  Vite SPA + Supabase is the architecture.
