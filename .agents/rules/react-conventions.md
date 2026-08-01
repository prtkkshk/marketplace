# React & UI Conventions — KGP Bazaar

## Design tokens (do not invent new colours)

| Token | Value | Use |
|---|---|---|
| Primary | `sky-600` `#0284C7` | Buttons, active tab, links, price badge |
| Primary light | `sky-400` `#38BDF8` | Hover, gradients, focus ring |
| Primary wash | `sky-50` | Selected pill background, info banners |
| Background | `slate-50` `#F8FAFC` | App background |
| Surface | `white` | Cards, sheets, nav bars |
| Border | `slate-200/80` | Card and input borders |
| Text primary | `slate-800` | Headings, body |
| Text muted | `slate-500` | Metadata, timestamps, hall names |
| Success | `emerald-500` | "Fulfilled", "Available" |
| Warning | `amber-500` | "Fair" condition, pending reports |
| Danger | `rose-500` | Delete, ban, report |

- Cards: `rounded-2xl border border-slate-200/80 bg-white shadow-sm`.
- Sheets/modals: `rounded-t-3xl` bottom sheet on mobile, centred dialog on `md:` up.
- Font: Inter, already loaded in `index.html`. Do not add another font.
- Never use raw hex in JSX. Extend `tailwind.config.js` if a token is genuinely missing.

## Component rules

- Function components only. No class components.
- Props typed inline as `{ foo }: { foo: string }` for ≤3 props, otherwise a named
  `type XProps`.
- Destructure props in the signature.
- No prop drilling more than 2 levels — lift to a context in `lib/hooks/` or colocate.
- A component either fetches data **or** renders it, not both. Container components
  (`*Screen.tsx`, `*Page.tsx`) call hooks; presentational components take props.
- `key` on lists is always the row's database `id`, never the array index.

## State

- **Server state:** TanStack Query only. Query keys are arrays with a stable shape:
  `['listings', { category, search, sort }]`, `['listing', id]`, `['profile', userId]`.
  Invalidate precisely after mutations — never `queryClient.clear()`.
- **URL state:** search text, category filter, sort order, and active tab live in the
  URL query string so a filtered feed is shareable and survives refresh.
- **Local state:** `useState` for ephemeral UI (sheet open, form step).
- **Auth state:** one `AuthProvider` in `src/features/auth/AuthProvider.tsx` exposing
  `{ session, profile, isAdmin, loading, signOut }`. Nothing else subscribes to
  `supabase.auth` directly.
- **Never use `localStorage` for domain data.** Supabase is the source of truth.
  `localStorage` is allowed only for UI preferences (last-used sort, dismissed
  install banner).

## Required states for every async surface

1. **Loading** — skeleton cards matching the real layout's shape. Not a centred spinner.
2. **Empty** — a `lucide-react` icon, one line of copy in `slate-500`, and a primary
   CTA ("Be the first to post a cycle").
3. **Error** — plain-language message plus a Retry button that refetches.

## Forms

- `react-hook-form` + `zodResolver`, schema imported from `src/lib/validation/`.
- Validate on blur, show errors under the field in `rose-500` text-sm.
- Submit button shows a spinner and is disabled while pending; disable the whole form,
  not just the button, to prevent double submits.
- Image upload: preview immediately from an object URL, upload on submit, show
  per-image progress, allow removing before submit. Max 4 images, each ≤ 5 MB,
  compressed client-side to ≤ 1600px on the long edge before upload.

## Motion (framer-motion)

- Keep it subtle and fast. Durations 150–250ms, `ease-out`.
- Approved uses: sliding tab indicator (`layoutId`), `whileTap={{ scale: 0.97 }}` on
  buttons and cards, bottom-sheet slide-up, toast enter/exit, feed item stagger of at
  most 40ms per item for the first 8 items only.
- Wrap everything in `useReducedMotion()` — respect `prefers-reduced-motion`.
- Never animate layout-affecting properties on scroll; it kills mobile performance.

## Navigation

- Mobile (`< md`): fixed bottom nav, 4 items — Home, Wanted, Sell (centre, raised
  primary FAB), Profile. Admins see a 5th "Admin" item replacing nothing — it appears
  in the Profile screen and as a route, not as a 5th tab (5 tabs is too cramped at
  390px).
- Desktop (`md:` up): sticky top header, `backdrop-blur-md bg-white/80 border-b`.
- Bottom nav must respect `env(safe-area-inset-bottom)` for iPhone home-indicator.
- Routes: `/` (feed), `/wanted`, `/new`, `/listing/:id`, `/request/:id`, `/profile`,
  `/profile/saved`, `/rules`, `/auth/*`, `/admin`, `/admin/reports`, `/admin/users`,
  `/admin/listings`, `/admin/announcements`, `/admin/audit`.
  `/admin/*` is wrapped in an `<AdminRoute>` guard and lazy-loaded.

## Accessibility

- Every icon-only button gets `aria-label`.
- Tap targets ≥ 44×44px.
- Focus ring visible: `focus-visible:ring-2 focus-visible:ring-sky-400`.
- Sheets trap focus and close on `Escape`.
- Images have meaningful `alt` (the listing title), decorative ones `alt=""`.

## Performance

- Lazy-load route chunks with `React.lazy` for `/admin/*` — students shouldn't download
  the admin bundle.
- Listing images: `loading="lazy"`, explicit `width`/`height` to prevent layout shift,
  served from Supabase Storage with a transform width matching the render size.
- Feed paginates 20 at a time with infinite scroll, never fetches the whole table.
