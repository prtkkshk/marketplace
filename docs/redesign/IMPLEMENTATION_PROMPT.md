# Implementation prompt — KGP Bazaar Redesign v2

Paste the block below into your coding agent (Antigravity, Claude Code, Cursor) from the repo root.
It assumes `docs/redesign/REDESIGN_SPEC.md` and `docs/redesign/mockups.html` are present.

Run it **one phase at a time**. Do not paste all seven phases at once — the token rename in Phase 1 touches every file in `src/`, and reviewing that diff mixed in with new component code is how this goes wrong.

---

## Phase 0 — Kickoff (paste once, at the start)

```
You are redesigning KGP Bazaar, an existing Vite + React 18 + TypeScript + TailwindCSS +
Supabase PWA for IIT Kharagpur students. The app works and is deployed. This is a visual
and layout redesign, NOT a rewrite and NOT a feature project.

READ FIRST, IN THIS ORDER:
1. docs/redesign/REDESIGN_SPEC.md   — the authoritative spec for this work
2. docs/redesign/mockups.html       — the approved visual target; every screen is in here
3. docs/PRODUCT_SPEC.md             — existing product behaviour, unchanged by this work
4. AGENTS.md                        — repo conventions

HARD CONSTRAINTS — violating any of these means the change is wrong:
- Do NOT change the Supabase schema, RLS policies, RPCs, or anything in supabase/.
- Do NOT change data-fetching logic, react-query keys, or any file in src/lib/data/.
- Do NOT add user-facing features. The only new query in the whole project is
  useFeedStats, and it must degrade to null silently on error.
- Do NOT change routes in App.tsx, except to keep every existing path working.
- Do NOT introduce a component library, CSS-in-JS, or any new runtime dependency.
  Tailwind + framer-motion + lucide-react is the whole toolkit.
- Preserve all existing accessibility attributes, and add the ones the spec calls for.

WORKING AGREEMENT:
- Work phase by phase. I will tell you which phase to start.
- At the end of each phase: run `npm run typecheck`, `npm run lint`, `npm run build`.
  All three must pass before you report done.
- Report as: files changed, files created, files deleted, anything in the spec you could
  not do and why. No summaries of what the spec already says.
- If the spec and the mockup disagree, the mockup wins for visuals, the spec wins for
  behaviour. If something is genuinely ambiguous, ask me — do not invent a third option.

Confirm you have read the four documents and state which phase you are starting.
```

---

## Phase 1 — Token layer

```
Phase 1: the token layer. Spec §2, §3 (theme.tsx, ThemeToggle only).

1. Replace src/styles/index.css entirely with the CSS in spec §2.1.
   Delete .thin-scrollbar — it is the cause of the visible scrollbar in the category rail.
2. Replace the theme.extend block in tailwind.config.ts with spec §2.2, including
   darkMode: ['class', '[data-theme="dark"]'].
3. Update index.html per §2.3: add Instrument Serif to the font link, add the
   no-flash inline theme script, add both theme-color metas, update the body class.
4. Create src/lib/theme.tsx — ThemeProvider + useTheme(), state 'light'|'dark'|'system',
   persisted to localStorage under 'kgp-theme', writes data-theme on <html>, subscribes
   to matchMedia when set to 'system'. Wrap the app in AppShell.tsx.
5. Create src/components/ui/ThemeToggle.tsx — a three-way segmented control.
   Do not mount it anywhere yet; Phase 2 places it.
6. Project-wide, mechanically rename every old Tailwind token to its new name using the
   table in §2.2. This touches nearly every file in src/. Rename only — do not restyle
   anything in this phase, do not change any layout, do not touch any JSX structure.

Success criteria: the app builds and renders with the warm palette, every screen still
has the same layout it had before, and toggling data-theme="dark" on <html> in devtools
visibly flips the whole app with no unreadable text anywhere.
```

---

## Phase 2 — Shell & navigation

```
Phase 2: shell and navigation. Spec §4.1, plus PageContainer from §3.

1. Create src/components/layout/PageContainer.tsx:
   max-w-[1280px] mx-auto px-5 md:px-[34px]. This is the ONLY place a max-width is set.
2. Rebuild BottomNav.tsx — five slots: Browse / Wanted / ＋FAB / Saved / You.
   The FAB is inline at 52px rounded-[19px] bg-brand, not floating with -top-4.
   Keep the framer-motion layoutId indicator and the useReducedMotion guard.
3. Rebuild DesktopHeader.tsx — wordmark (KGP in Instrument Serif + Bazaar in italic
   maroon, no emoji), inline nav Browse/Wanted/Saved, centred search with a ⌘K hint
   that syncs to the ?q= param, then Post button, ThemeToggle, bell, user block.
   Move the Admin link into a dropdown on the user block.
4. Update PostChooserSheet.tsx to the two colour-keyed rows in the mockup:
   maroon "Sell something", amber "Ask for something".
5. Delete src/features/listings/SegmentedControl.tsx and remove every import of it
   (FeedScreen.tsx and WantedBoardScreen.tsx). Wanted is reached from nav now.
6. Update AppShell.tsx: remove max-w-6xl from <main>, bottom padding pb-[76px] md:pb-0.
7. Apply PageContainer to every screen that currently sets its own width — especially
   FeedScreen (drop the nested max-w-5xl) and ProfileScreen (drop its narrower wrapper).

Success criteria: exactly one navigation system on each breakpoint, no segmented control
anywhere, every page the same width, keyboard-navigable, ⌘K focuses desktop search.
```

---

## Phase 3 — UI primitives

```
Phase 3: shared primitives. Spec §4.6.

Restyle every file in src/components/ui/ per the table in §4.6, matching the mockup's
.btn / .pill / .card / .empty / .skel classes.

Key points:
- Button variants: primary (maroon), whats (green), ghost, danger. All rounded-full,
  active:scale-[0.975], focus-visible ring-2 ring-brand/40 ring-offset-2 ring-offset-paper.
- Badge variants: cond / neg / fixed / flag / pin. Uppercase 10px tracking-[0.07em].
  Only 'neg' is amber. Condition badges are neutral — this is deliberate.
- EmptyState gains an optional secondaryAction so every empty state can offer
  "Post a request instead" alongside "Clear filters".
- Sheet gets an md: variant that renders as a right-side drawer instead of a bottom sheet.
- Create SectionLabel.tsx and Stat.tsx from spec §3.

Do not change any component's public props except EmptyState's new optional
secondaryAction. Every existing call site must keep compiling.
```

---

## Phase 4 — Feed

```
Phase 4: the feed. Spec §4.2. Match the "Feed · Mobile" and "Feed · Desktop" tabs of
the mockup closely — this is the screen most sessions start on.

1. ListingCard.tsx — the biggest change in the project:
   - aspect-[4/5] media, was 4/3
   - top-right action cluster, ALWAYS VISIBLE: a 31px circular bg-whats WhatsApp icon
     button plus the 31px glass save heart. On md: group-hover the WhatsApp button
     widens to a pill and reveals the label via a max-width transition.
   - DELETE the full-width emerald contact button from the card body entirely
   - price in font-display text-[25px] with a smaller ₹, not a coloured badge
   - neutral condition pills; only Negotiable is amber
   - remove the ⋮ overflow menu — report lives on the detail page now
   - both action buttons stopPropagation; WhatsApp gets
     aria-label="Contact seller on WhatsApp about {title}"
2. FeedScreen.tsx — remove SegmentedControl, add FeedMasthead (hidden md:block),
   make SearchBar md:hidden, restructure the toolbar so sort+filters are grouped on the
   right with no dead space, add removable active-filter chips, and change the grid to
   grid-cols-2 / sm:3 / lg:4. Replace Load More with an IntersectionObserver sentinel,
   keeping the button as fallback.
3. Create FeedMasthead.tsx and useFeedStats.ts per spec §3. If the stats query fails or
   returns nothing, render the headline alone — never an error, never a zero.
4. CategoryPills.tsx — no-scrollbar + rail-fade mask, remove thin-scrollbar, active pill
   is ink not maroon, add drag-to-scroll and arrow-key navigation with role="tablist".
5. SearchBar.tsx — clear button, 250ms debounce before writing ?q=.
6. ListingSkeleton.tsx — mirror the new card geometry exactly so nothing shifts on load.
7. SortDropdown.tsx / FilterSheet.tsx — .tool pill styling; FilterSheet becomes a right
   drawer on md:.

Success criteria: no wall of green in the feed, four columns on a wide desktop, two on a
phone, no visible scrollbar under the pills, no dead space in the toolbar, and product
photos no longer cropped top-and-bottom.
```

---

## Phase 5 — Detail pages & Wanted Board

```
Phase 5: detail and wanted. Spec §4.3, §4.4.

1. Create src/lib/utils/categoryLabel.ts and use it in RequestCard.tsx. The live site
   currently prints the raw enum "room_essentials" to users. This is a bug fix.
2. ListingDetailScreen.tsx — restructure per §4.4:
   - mobile: gallery capped at aspect-[4/3], then category eyebrow, serif title, serif
     price, 2x2 spec grid (Condition / Hall / Posted / Expires), description, seller row,
     Save/Share/Report ghost buttons
   - sticky bottom bar carries the PRICE next to the CTA so it earns its height
   - md:: two columns 1.25fr/1fr with a sticky top-[88px] buy-box on the right and the
     gallery + thumbnails + description on the left; no sticky bottom bar on desktop
   - add a Browse → Category → Title breadcrumb
   - report link moves here from the card
3. WantedBoardScreen.tsx — amber masthead, no SegmentedControl, list layout
   (flex-col on mobile, grid-cols-2 on desktop), "Post a request" CTA in the masthead.
4. RequestCard.tsx — 3px amber left rule, category label pill, budget as the hero number
   in font-display text-accent, 2-line clamped description, meta row, full-width
   bg-whats "I have this" button. Wanted cards KEEP their full green button — there are
   only ever a handful on screen. Fulfilled state: opacity-60 + static ghost button.
5. RequestDetailScreen.tsx — mirror the listing detail structure in amber, minus gallery.
```

---

## Phase 6 — Profile, saved, create/edit

```
Phase 6: profile and forms. Spec §4.5.

1. ProfileScreen.tsx — PageContainer (same width as the feed; it is currently narrower
   for no reason), gradient hero with a 64px rounded-[22px] maroon avatar and serif name,
   a three-up stat strip (Active/Sold/Saved), and tabs reduced to
   Listings / Requests / Settings.
   Settings holds: Campus trading rules, Appearance (mount ThemeToggle here), Edit
   profile, Sign out in text-danger.
2. Saved moves out of the profile tabs and onto the bottom nav. Keep /profile/saved
   working as the route; update SavedItemsScreen.tsx to PageContainer + the card grid.
3. MyListingsTab.tsx — Active·N / Sold·N / Expired·N chips; owner cards show inline
   Edit and Mark sold ghost buttons instead of the WhatsApp cluster.
4. CreateListingScreen / EditListingScreen / CreateWantedRequestScreen — restyle the
   forms to the new Input/Select/Textarea, group fields under SectionLabel headings,
   sticky submit bar on mobile. Do not change any validation schema in src/lib/validation/.
5. PhotoUploader.tsx — 4:5 preview tiles to match the card ratio, dashed drop zone,
   drag-to-reorder if it is cheap, per-tile remove button.
```

---

## Phase 7 — Auth, admin, PWA, polish

```
Phase 7: the long tail. Spec §4.7, §5, §6.

1. Auth screens — centred max-w-[420px] card on bg-paper, wordmark above, serif headline,
   new inputs. On lg: split screen with the masthead headline over a warm gradient panel.
   Covers SignIn, SignUp, Otp, ForgotPassword, CompleteProfile, Banned.
2. Admin screens — token swap only, no layout work. Sidebar bg-surface-alt, tables get
   border-line hairlines at text-[13px].
3. AnnouncementBanner → amber. OfflineBanner / UpdateToast / PWAInstaller → ink pills.
   NotFoundScreen / RulesScreen → PageContainer + serif headings.
4. PWA: manifest theme_color and background_color to #FBF9F6; regenerate icons, the
   maskable icon, and og-image.png against the new palette.
5. Motion pass — spec §5. Every animation guarded by useReducedMotion.
   Suppress the body colour transition on first paint or the app flashes on load.
6. Accessibility pass — spec §6. Verify --ink-3 on --paper hits 4.5:1 in BOTH themes and
   darken it in light mode if it does not. Focus-visible rings everywhere.
7. Update the Playwright tests in tests/ — anything selecting SegmentedControl or the
   card's contact button will be failing.
8. Final gate: npm run typecheck && npm run lint && npm run build && npm run test:e2e.
```

---

## Verification checklist

Walk this before you call the redesign done. Each line is a specific failure observed on the current site.

**Structure**
- [x] Exactly one navigation system per breakpoint; `SegmentedControl.tsx` no longer exists
- [x] Every page uses `PageContainer`; no component sets its own `max-w-*`
- [x] Profile and Feed are visually the same width on desktop

**Feed**
- [x] No scrollbar or ◄ ► arrows under the category pills at any width
- [x] No dead space in the toolbar — sort and filters are grouped
- [x] 4 columns at ≥1280px, 3 at ≥640px, 2 on a phone
- [x] Product photos are 4:5 and not cropped top-and-bottom
- [x] No full-width green button anywhere in the feed
- [x] WhatsApp icon button expands with its label on desktop card hover
- [x] Tapping the WhatsApp or save button does not navigate to the detail page

**Content correctness**
- [x] Wanted cards show "Room Essentials & Furniture", never `room_essentials`
- [x] Every empty state offers "Post a request instead"
- [x] Skeletons match the real card geometry — no layout shift when data lands

**Detail**
- [x] Title and price visible above the fold on a 390×844 viewport
- [x] Sticky mobile bar shows the price, not just a button
- [x] Desktop is two-column with a sticky buy-box; no sticky bottom bar

**Theme**
- [x] No flash of the wrong theme on hard reload in either mode
- [x] Toggle persists across reload and respects `system`
- [x] Nothing unreadable in dark mode — check badges, disabled buttons, the sold stamp,
      skeletons, toasts, and the admin tables specifically

**Quality**
- [x] `typecheck`, `lint`, `build`, `test:e2e` all pass
- [x] Every interactive element has a visible focus ring
- [x] `prefers-reduced-motion` disables all transforms and springs
- [x] Lighthouse mobile performance has not regressed
