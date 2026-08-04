# 💙 KGP Bazaar

An installable PWA for IIT Kharagpur students to buy, sell, and request second-hand
items across campus halls. Discovery in-app, deals closed on WhatsApp and in person.

**Status:** planning complete, no application code written yet.

---

## Read these in order

This repo (`codebase/`) holds only what's needed to run the app. Prompts, plans,
and agent config live one level up, outside git:

| File | What it's for |
|---|---|
| [`../prompts/AGENTS.md`](../prompts/AGENTS.md) | Project context + the agent team. The AI coding agent reads this first. |
| [`../plans/implementation_plan.md`](../plans/implementation_plan.md) | Architecture, 12 phases, resolved decisions, risks |
| [`../plans/task.md`](../plans/task.md) | Every task, per phase, with Definition of Done |
| [`../plans/PRODUCT_SPEC.md`](../plans/PRODUCT_SPEC.md) | What the app does — the source of truth for behaviour |
| [`../plans/DATA_MODEL.md`](../plans/DATA_MODEL.md) | Postgres schema, RLS policy matrix, storage design |
| [`docs/SETUP_MANUAL.md`](docs/SETUP_MANUAL.md) | **What you must configure by hand** — Supabase, Google OAuth, Vercel, admin bootstrap (kept in-repo, it's setup documentation for this code) |
| [`../prompts/AGENT_PROMPTS.md`](../prompts/AGENT_PROMPTS.md) | **Copy-paste prompts, one per phase** |
| [`../plans/PROJECT_SPECIFICATIONS.md`](../plans/PROJECT_SPECIFICATIONS.md) | Original brief. Superseded by `PRODUCT_SPEC.md`. |

Agent config lives in [`../.agents/`](../.agents/) — `rules/` (standards), `skills/`
(reusable capabilities), `workflows/` (`/ship-feature`, `/verify-phase`, `/deploy`).
Open the parent folder (not just `codebase/`) in your agent IDE so it can read
these — the agent should only ever write files inside `codebase/`.

## Stack

Vite 5 · React 18 · TypeScript strict · TailwindCSS · framer-motion · lucide-react ·
TanStack Query · Supabase (Postgres + Auth + Storage + RLS) · vite-plugin-pwa ·
Vitest + Playwright · GitHub Actions · Vercel

## Getting started

1. Work through `docs/SETUP_MANUAL.md` §1–3 (Node, GitHub repo, Supabase project).
2. Open this folder in Google Antigravity.
3. Paste Prompt 0 from `docs/AGENT_PROMPTS.md`.
4. Then one phase at a time, gating each on `/verify-phase`.

## Commands (available after Phase 0)

```bash
npm install
npm run dev        # dev server
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run test       # vitest
npm run test:e2e   # playwright
npm run build      # production build
npm run db:types   # regenerate supabase types
```
