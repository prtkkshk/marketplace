---
name: new-screen
description: Scaffold a new screen or feature surface in the KGP Bazaar PWA with the project's mobile-first layout, loading/empty/error states, TanStack Query wiring and accessibility baseline. Use when adding any new route or major UI surface.
---

# New Screen / Feature Surface

## When to use this

Adding a route (`/wanted`, `/admin/reports`, `/profile/saved`) or a major surface
(a bottom sheet, a multi-step form) to the app.

## Steps

1. **Confirm the spec.** Find the screen in `docs/PRODUCT_SPEC.md`. If it isn't
   described there, stop and ask rather than inventing behaviour.
2. Create the folder: `src/features/<feature>/`. Files:
   - `<Name>Screen.tsx` — container. Calls hooks, handles the three async states.
   - `<Name>Card.tsx` / sub-components — presentational, props only.
   - `use<Name>.ts` — TanStack Query hooks wrapping `src/lib/data/`.
   - `types.ts` — only if the feature has shapes not already in `database.types.ts`.
3. Add the route in `src/routes/` and register it in `App.tsx`. Admin routes go inside
   `<AdminRoute>` and are `React.lazy`-loaded.
4. Build mobile-first at 390×844:
   - safe-area padding at the bottom if the screen scrolls under the tab bar
   - `md:` overrides for desktop, never the other way round
   - cards use `rounded-2xl border border-slate-200/80 bg-white shadow-sm`
5. Implement all three async states before wiring the happy path:
   - skeleton that matches the real layout
   - empty state with icon + one-line copy + CTA
   - error state with a Retry that refetches
6. Filters, search text, sort, and active tab go in the URL query string via
   `useSearchParams`, not component state.
7. Accessibility pass: `aria-label` on icon buttons, 44px tap targets, visible focus
   ring, `Escape` closes sheets, focus trapped inside modals.
8. Motion: `whileTap={{ scale: 0.97 }}` on tappables, `layoutId` for the tab
   indicator, all wrapped in `useReducedMotion()`.
9. Verify manually at 390px **and** 1280px. Then run `npm run lint && npm run typecheck`.
10. Add a Playwright spec if this screen is on a golden path (signup, post, contact,
    admin delete).

## Conventions to follow

- Never import from another `features/` folder — promote shared code to
  `components/ui/` or `lib/`.
- Never call `supabase` directly here; go through `src/lib/data/`.
- Never render a phone number. Contact goes through the `get_contact_number` RPC on tap.
- Prices always through `formatINR()`.
- Full detail in `.agents/rules/react-conventions.md`.
