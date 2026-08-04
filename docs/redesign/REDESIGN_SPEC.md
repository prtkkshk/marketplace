# KGP Bazaar — Redesign v2 Specification
### "Warm Editorial Marketplace"

**Status:** approved design, ready to implement
**Companion:** [`mockups.html`](./mockups.html) — open in a browser, use the tab bar and the Dark toggle
**Supersedes:** `docs/UI_IMPROVEMENT_PLAN.md` (that document described a polish pass on the sky-blue theme; this replaces the theme entirely)

---

## 0. Decisions locked

| Decision | Choice |
|---|---|
| Visual direction | Warm Editorial Marketplace — paper ground, oxblood brand, amber accent, serif display |
| Scope | Restyle + layout fix. All existing routes, features, data model and Supabase schema unchanged. **No new features.** |
| Theme | Light **and** dark from day one, via CSS custom properties, `prefers-color-scheme` aware with a manual override |
| Device priority | Mobile-first; desktop is a genuine adaptation, not a stretched phone |
| Brand colour | Oxblood maroon `#8C2F39` |
| Display face | Instrument Serif (Google Fonts) for titles, prices and stat numbers only |
| Contact CTA | 31px circular WhatsApp icon button beside the save heart on cards; expands to show its label on card hover (desktop). Full-width button remains on the detail page only. |
| Desktop masthead | Keep, with live stats. Mobile skips it. |

---

## 1. What is actually wrong today

Observed on the live deployment and confirmed in source. Each item maps to a fix below.

| # | Problem | Evidence |
|---|---|---|
| 1 | **Three competing navigation systems.** `DesktopHeader` (Home / Post / Profile / Admin), `SegmentedControl` (For Sale / Wanted Board), and `BottomNav` (Home / + / Profile) all describe the same space differently. | `AppShell.tsx`, `FeedScreen.tsx:96` |
| 2 | **Segmented control eats the fold.** A full-width grey slab is the first thing on the page, pushing products ~90px down. | `SegmentedControl.tsx` |
| 3 | **Native scrollbar under the category pills.** Renders with ◄ ► arrows on desktop. `.no-scrollbar` exists in `index.css` but `CategoryPills` uses `.thin-scrollbar`. | `index.css`, `CategoryPills.tsx` |
| 4 | **Toolbar dead space.** `justify-between` puts sort at the far left and Filters at the far right with ~900px of nothing between them on a 1512px viewport. | `FeedScreen.tsx:117` |
| 5 | **Colour chaos on cards.** Sky price + sky condition badge + grey badge + full-width **emerald** button, repeated 20× down the feed. The loudest thing on the page is a green bar you didn't ask for. | `ListingCard.tsx:200–230` |
| 6 | **Wrong aspect ratio.** `aspect-[4/3]` landscape crops the top and bottom off phone-shot photos. | `ListingCard.tsx:126` |
| 7 | **Raw enum leaks to users.** The Wanted card prints `room_essentials` instead of "Room Essentials & Furniture". | `RequestCard.tsx` |
| 8 | **Inconsistent containers.** `AppShell` sets `max-w-6xl`, `FeedScreen` nests `max-w-5xl` inside it, `ProfileScreen` uses a third narrower width. | `AppShell.tsx:11`, `FeedScreen.tsx:85` |
| 9 | **Detail page buries the essentials.** Image fills the viewport, no title or price above the fold, and the sticky green bar covers content instead of carrying information. | `ListingDetailScreen.tsx` |
| 10 | **No theme layer.** Hex values are hard-coded in `tailwind.config.ts`, so dark mode is impossible without a rewrite. | `tailwind.config.ts` |
| 11 | **Flat empty states.** "No listings found" with a generic button — the single best moment to convert a failed search into a Wanted request is wasted. | `EmptyState.tsx` |

---

## 2. Token layer

### 2.1 `src/styles/index.css` — replace the whole file

Tokens live as CSS custom properties on `:root` and `[data-theme="dark"]`. Tailwind then references them, so every existing `bg-surface-card` style class keeps working while gaining dark-mode support for free.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --paper: 251 249 246;        /* #FBF9F6 */
    --paper-sunk: 243 239 233;   /* #F3EFE9 */
    --surface: 255 255 255;      /* #FFFFFF */
    --surface-alt: 247 243 238;  /* #F7F3EE */
    --line: 231 224 214;         /* #E7E0D6 */
    --line-strong: 214 204 190;  /* #D6CCBE */

    --ink: 26 22 20;             /* #1A1614 */
    --ink-2: 88 80 74;           /* #58504A */
    --ink-3: 140 129 121;        /* #8C8179 */

    --brand: 140 47 57;          /* #8C2F39 oxblood */
    --brand-hover: 116 36 45;    /* #74242D */
    --brand-wash: 247 235 236;   /* #F7EBEC */
    --brand-line: 232 210 212;   /* #E8D2D4 */

    --accent: 201 130 31;        /* #C9821F text-safe amber */
    --accent-bright: 232 163 61; /* #E8A33D fills */
    --accent-wash: 253 243 227;  /* #FDF3E3 */
    --accent-line: 240 223 192;  /* #F0DFC0 */

    --whats: 31 122 90;          /* #1F7A5A */
    --whats-hover: 25 101 73;    /* #196549 */
    --danger: 179 38 30;         /* #B3261E */
    --danger-wash: 251 235 234;  /* #FBEBEA */
  }

  [data-theme='dark'] {
    --paper: 20 17 15;
    --paper-sunk: 14 12 11;
    --surface: 29 25 23;
    --surface-alt: 38 33 32;
    --line: 48 42 39;
    --line-strong: 66 58 54;

    --ink: 245 240 234;
    --ink-2: 181 171 162;
    --ink-3: 133 122 114;

    --brand: 224 131 140;
    --brand-hover: 238 154 162;
    --brand-wash: 44 27 29;
    --brand-line: 69 41 45;

    --accent: 240 182 92;
    --accent-bright: 240 182 92;
    --accent-wash: 43 33 20;
    --accent-line: 69 53 32;

    --whats: 63 163 125;
    --whats-hover: 79 182 142;
    --danger: 242 147 140;
    --danger-wash: 45 25 23;
  }

  html { color-scheme: light; }
  [data-theme='dark'] { color-scheme: dark; }

  body {
    @apply bg-paper text-ink antialiased;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* gradient edge-fade that signals horizontal overflow without a scrollbar */
  .rail-fade { -webkit-mask-image: linear-gradient(90deg, #000 88%, transparent); mask-image: linear-gradient(90deg, #000 88%, transparent); }

  .font-display { font-family: 'Instrument Serif', Georgia, serif; letter-spacing: -0.01em; }
}
```

> **Delete `.thin-scrollbar` entirely.** It is the source of the visible scrollbar in the category rail.

### 2.2 `tailwind.config.ts` — replace the `theme.extend` block

```ts
import type { Config } from 'tailwindcss';

const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: rgb('--paper'), sunk: rgb('--paper-sunk') },
        surface: { DEFAULT: rgb('--surface'), alt: rgb('--surface-alt') },
        line: { DEFAULT: rgb('--line'), strong: rgb('--line-strong') },
        ink: { DEFAULT: rgb('--ink'), 2: rgb('--ink-2'), 3: rgb('--ink-3') },
        brand: {
          DEFAULT: rgb('--brand'), hover: rgb('--brand-hover'),
          wash: rgb('--brand-wash'), line: rgb('--brand-line'),
        },
        accent: {
          DEFAULT: rgb('--accent'), bright: rgb('--accent-bright'),
          wash: rgb('--accent-wash'), line: rgb('--accent-line'),
        },
        whats: { DEFAULT: rgb('--whats'), hover: rgb('--whats-hover') },
        danger: { DEFAULT: rgb('--danger'), wash: rgb('--danger-wash') },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Instrument Serif', 'Georgia', 'serif'],
      },
      borderRadius: { md: '12px', lg: '18px', xl: '26px' },
      boxShadow: {
        1: '0 1px 2px rgb(26 22 20 / 0.05)',
        2: '0 4px 16px -6px rgb(26 22 20 / 0.14)',
        3: '0 18px 48px -18px rgb(26 22 20 / 0.30)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(.22,.61,.36,1)' },
    },
  },
  plugins: [],
} satisfies Config;
```

**Migration note:** the old token names (`brand-primary`, `surface-bg`, `surface-card`, `content-primary`, `content-muted`, `status-*`) are gone. Do a project-wide replace:

| Old | New |
|---|---|
| `bg-surface-bg` | `bg-paper` |
| `bg-surface-card` | `bg-surface` |
| `border-surface-border` | `border-line` |
| `text-content-primary` | `text-ink` |
| `text-content-muted` | `text-ink-3` |
| `text-brand-primary` / `bg-brand-primary` | `text-brand` / `bg-brand` |
| `bg-brand-wash` | `bg-brand-wash` *(unchanged name)* |
| `text-status-danger` | `text-danger` |
| `bg-emerald-600` (contact button) | `bg-whats` |
| `shadow-xs` | `shadow-1` |

### 2.3 `index.html`

Add Instrument Serif to the existing font link and set the theme before first paint so there is no flash:

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<script>
  (function () {
    var s = localStorage.getItem('kgp-theme');
    var d = s === 'dark' || (!s && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = d ? 'dark' : 'light';
  })();
</script>
```

Also update `<meta name="theme-color">` to `#FBF9F6`, and add a dark variant:
```html
<meta name="theme-color" content="#FBF9F6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#14110F" media="(prefers-color-scheme: dark)">
```
Change the `<body>` class to `bg-paper text-ink font-sans antialiased selection:bg-brand-wash selection:text-brand`.

### 2.4 `public/manifest.webmanifest` (or the `vite-plugin-pwa` config in `vite.config.ts`)

Update `theme_color` and `background_color` to `#FBF9F6`. Regenerate the maskable icon and `og-image.png` against the new palette.

---

## 3. New files

| Path | Purpose |
|---|---|
| `src/lib/theme.tsx` | `ThemeProvider` + `useTheme()`. State is `'light' \| 'dark' \| 'system'`, persisted to `localStorage` under `kgp-theme`, writes `data-theme` on `<html>`, subscribes to `matchMedia` changes when set to `system`. |
| `src/components/ui/ThemeToggle.tsx` | Three-way segmented toggle (Light / Dark / System). Rendered in the desktop header and in Profile → Settings. |
| `src/components/layout/PageContainer.tsx` | The single container primitive: `max-w-[1280px] mx-auto px-5 md:px-[34px]`. **Every** screen uses this and nothing sets its own max-width. |
| `src/components/ui/Stat.tsx` | Display-serif number over a caps label. Used by the masthead and the profile stat strip. |
| `src/components/ui/SectionLabel.tsx` | `text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3`. Used everywhere a small section heading appears. |
| `src/features/listings/FeedMasthead.tsx` | Desktop-only editorial masthead with headline, subhead and the four live stats. Hidden below `md`. |
| `src/features/listings/useFeedStats.ts` | One lightweight aggregate query for the masthead counts (live listings, open wanted, active halls, traded this month). Cached 5 min. Returns `null` on error and the masthead renders headline-only. |
| `src/lib/utils/categoryLabel.ts` | `categoryLabel(id)` → looks up `CATEGORIES` from `constants.ts` and falls back to a title-cased id. Fixes the `room_essentials` leak. |

---

## 4. File-by-file changes

### 4.1 Layout & navigation

**`src/components/layout/AppShell.tsx`**
- Wrap in `ThemeProvider`.
- Remove `max-w-6xl` from `<main>` — containment moves to `PageContainer` inside each screen.
- `bg-surface-bg` → `bg-paper`.
- Bottom padding becomes `pb-[76px] md:pb-0` to clear the taller 68px nav plus safe-area.

**`src/components/layout/BottomNav.tsx`** — rebuild
- Five slots: **Browse** (`/`) · **Wanted** (`/wanted`) · **＋ FAB** · **Saved** (`/profile/saved`) · **You** (`/profile`).
- FAB becomes a 52px `rounded-[19px]` maroon square-ish button, no longer floating above the bar — it sits inline with a soft brand-tinted shadow. This kills the awkward `-top-4` overlap.
- Active state: 2.5px maroon bar across the top of the slot (`layoutId` motion indicator retained), label goes `font-semibold text-brand`.
- Height 68px, `bg-surface/92 backdrop-blur-xl`, `pb-[env(safe-area-inset-bottom)]`.
- Every tap target ≥ 44px.

**`src/components/layout/DesktopHeader.tsx`** — rebuild
- Single row, 64px, `bg-paper/85 backdrop-blur-xl border-b border-line`.
- Left: wordmark — `KGP` in Instrument Serif regular + `Bazaar` in Instrument Serif *italic* maroon. Drop the 🚲 emoji.
- Then inline nav: **Browse · Wanted · Saved**. Active = `bg-brand-wash text-brand font-semibold` pill.
- Centre: search input, `max-w-[420px]`, with a `⌘K` kbd hint. **This replaces the in-page SearchBar on desktop** — the feed's own search bar hides at `md` and up and syncs to the same `?q=` param.
- Right: primary **Post** button (opens `PostChooserSheet`), `ThemeToggle`, notification bell, then the user block (avatar + name + `RP Hall · 23BT10027`).
- Admin link moves **out** of the main nav into the user dropdown — it is not a student destination and currently sits third in the tab order for admins.

**`src/components/layout/PostChooserSheet.tsx`**
- Two colour-keyed rows: 🏷️ **Sell something** (maroon icon well) and 📣 **Ask for something** (amber icon well), each with a one-line description and a chevron.
- Grab handle, `rounded-t-[26px]`, spring transition, `Escape` and backdrop close, focus trap.

### 4.2 Feed

**`src/features/listings/FeedScreen.tsx`**
- **Delete the `<SegmentedControl>` render.** Wanted is reached from nav now.
- Wrap in `PageContainer`; remove the nested `max-w-5xl`.
- Render `<FeedMasthead>` — `hidden md:block`.
- `<SearchBar>` becomes `md:hidden` (desktop search lives in the header).
- Toolbar restructured:
  - **Mobile:** result count left, `[Sort ▾] [Filters ⋅2]` grouped right.
  - **Desktop:** category rail takes the free space on the left, sort + filters pinned right in the same row. No `justify-between` void.
  - Below it, a row of **active filter chips** with `✕` to remove individually, plus a "Clear all" text link. Only rendered when `activeFilterCount > 0`.
- Grid: `grid-cols-2 gap-3.5` mobile → `sm:grid-cols-3` → `lg:grid-cols-4 gap-5`. (Currently `1 / 2 / 3` — one column on a phone wastes the whole screen.)
- Replace "Load More Items" with an `IntersectionObserver` sentinel that auto-loads, keeping the button as the no-JS/reduced-motion fallback.

**`src/features/listings/SegmentedControl.tsx`** — **delete the file** and its imports. `WantedBoardScreen` also renders it; remove there too.

**`src/features/listings/CategoryPills.tsx`**
- Container: `flex gap-2 overflow-x-auto no-scrollbar rail-fade`, and **remove `thin-scrollbar`**.
- Pill: `rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink-2`.
- Active: `bg-ink text-paper border-ink font-semibold` — an ink pill, not a maroon one. Maroon is reserved for brand and identity, not for a filter that is on by default.
- Add pointer drag-to-scroll and `scroll-snap-type: x proximity`.

**`src/features/listings/SearchBar.tsx`**
- `h-11 rounded-full bg-surface border border-line shadow-1`, focus ring `ring-2 ring-brand/15 border-brand`.
- Clear `✕` button appears when there is text.
- 250ms debounce before writing `?q=` (currently every keystroke rewrites the URL and refires the query).

**`src/features/listings/ListingCard.tsx`** — the biggest single change
- Card: `rounded-lg border border-line bg-surface overflow-hidden`, hover `-translate-y-[3px] border-line-strong shadow-2`.
- Media: **`aspect-[4/5]`** (was `4/3`), image `object-cover`, `group-hover:scale-[1.045]` over 500ms.
- **Action cluster, top-right, always visible:**
  - `.card-wa` — 31px circular `bg-whats` button, white WhatsApp glyph, `shadow`. On `group-hover` (desktop only, `md:`) it widens to a pill and reveals the label "WhatsApp" via a `max-width` transition.
  - `.card-save` — 31px glass circle, heart fills maroon when saved.
  - Both `stopPropagation` so they never trigger the card link.
- **Remove the full-width emerald button from the card body entirely.**
- Body: title (`text-[13.5px] font-semibold`, single line) → **price in `font-display text-[25px]`** with a smaller `₹` → condition/negotiable pills → hairline divider → `Hall` and `timeAgo` as `text-[11.5px] text-ink-3`.
- Pills lose their colours: condition is `bg-surface-alt text-ink-2 border-line`, "Fixed" is a bare outline, only **Negotiable** keeps amber. A "New today" ink flag and the existing "Pinned" flag sit top-left; pinned turns amber.
- Sold: greyscale media + a rotated serif-italic "Sold" stamp; action cluster hidden.
- The overflow `⋮` menu moves off the card face — **report is available on the detail page only**. It currently opens a floating menu inside a grid cell and clips.

**`src/features/listings/ListingSkeleton.tsx`**
- Match the new geometry exactly: `aspect-[4/5]` media block, then 11px title bar, 21px price bar, two pill bars. Shimmer sweep, `bg-paper-sunk`.

**`src/features/listings/SortDropdown.tsx` / `FilterSheet.tsx`**
- Restyle to the `.tool` pattern — `rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px]`.
- `FilterSheet` on desktop (`md:`) becomes a right-side drawer rather than a bottom sheet; mobile keeps the bottom sheet.
- Filter count badge moves inside the button as a 16px maroon dot.

### 4.3 Wanted Board

**`src/features/wanted/WantedBoardScreen.tsx`**
- Own masthead in **amber**, not maroon: headline "Someone's *looking* for it", subhead, and stats (open requests, median budget, fulfilled all-time).
- Remove the `SegmentedControl`.
- Layout is a **list**, not a photo grid: `flex-col gap-3` mobile, `grid-cols-2 gap-4` desktop. There are no images, so a 3-up grid of text cards looks broken with fewer than 3 items — which is the normal case.
- Primary CTA "Post a request" lives in the masthead.

**`src/features/wanted/RequestCard.tsx`**
- 3px amber left rule via a `::before` — the visual signature that distinguishes wanted from for-sale at a glance.
- Header row: title + `categoryLabel(category)` pill on the left, **budget as the hero** on the right (`font-display text-[27px] text-accent` over a caps "Budget" label).
- Description clamped to 2 lines, then a meta row (`Hall · Name`, `timeAgo`), then a full-width `bg-whats` "I have this" button. **The wanted card keeps its full green button** — there is only ever a handful of them on screen, so the wall-of-green problem does not apply.
- Fulfilled: `opacity-60`, button replaced by a static "✓ Found & fulfilled" ghost.
- **Fix the enum leak** — use `categoryLabel()`.

### 4.4 Listing detail

**`src/features/listings/ListingDetailScreen.tsx`** — restructure
- **Mobile:** gallery capped at `aspect-[4/3]` with a glass back button and pill page-dots → category eyebrow (caps, maroon) → title in `font-display text-[31px]` → price in `font-display text-[42px]` beside a Fixed/Negotiable pill → a 2×2 **spec grid** (Condition, Hall, Posted, Expires) → Description → Seller row → Save / Share / Report ghost buttons.
- **Sticky bottom bar** carries the price alongside the CTA so the space it occupies is informative, not just a floating button. `bg-surface/93 backdrop-blur-xl border-t border-line`.
- **Desktop (`md:`):** two columns, `1.25fr / 1fr`, gap 40px. Left = gallery + thumbnail strip + description. Right = a `sticky top-[88px] rounded-xl border` **buy-box** holding eyebrow, title, price, spec grid, the full-width WhatsApp CTA, Save/Share, and the seller row. No sticky bottom bar on desktop.
- Add a breadcrumb above the fold: `Browse → Category → Title`.
- Report link moves here, as quiet text under the buy-box.

**`src/features/wanted/RequestDetailScreen.tsx`** — mirror the same structure in amber, minus the gallery.

### 4.5 Profile

**`src/features/profile/ProfileScreen.tsx`**
- Use `PageContainer` — same width as the feed. Remove the bespoke narrow wrapper.
- Hero: `bg-gradient-to-b from-brand-wash to-transparent`, 64px `rounded-[22px]` maroon avatar with a serif initial, name in `font-display text-[26px]`, email as meta, then chips for roll number, hall and (if applicable) Admin.
- **Stat strip** — Active / Sold / Saved, hairline-separated, serif numbers.
- Tabs reduce to **Listings · Requests · Settings**. Saved moves to the bottom nav and gets its own route; keep `/profile/saved` working.
- Settings tab holds: Campus trading rules, **Appearance** (the `ThemeToggle`), Edit profile, Sign out (in `text-danger`).

**`src/features/profile/MyListingsTab.tsx`**
- Sub-filter as chips: `Active · N` / `Sold · N` / `Expired · N`.
- Owner cards swap the WhatsApp cluster for inline **Edit** and **Mark sold** ghost buttons.

**`src/features/saved/SavedItemsScreen.tsx`** — `PageContainer` + the standard card grid; reachable directly from the bottom nav.

### 4.6 Shared UI primitives

| File | Change |
|---|---|
| `Button.tsx` | Variants become `primary` (maroon), `whats` (green), `ghost` (surface + line), `danger`. All `rounded-full`, `active:scale-[0.975]`, focus-visible ring `ring-2 ring-brand/40 ring-offset-2 ring-offset-paper`. |
| `Badge.tsx` | Variants `cond` (neutral), `neg` (amber), `fixed` (outline), `flag` (ink solid), `pin` (amber solid). Uppercase, 10px, `tracking-[0.07em]`. |
| `Card.tsx` | `rounded-lg border border-line bg-surface`, optional `interactive` prop for the hover lift. |
| `Input.tsx` / `Select.tsx` / `Textarea.tsx` | `bg-surface border-line rounded-md`, focus `border-brand ring-2 ring-brand/15`, error `border-danger`, 44px min height. |
| `Sheet.tsx` | `rounded-t-[26px]`, grab handle, spring `stiffness 400 / damping 38`, `md:` variant that renders as a right drawer. |
| `Dialog.tsx` | `rounded-xl`, `shadow-3`, backdrop `bg-ink/40 backdrop-blur-sm`. |
| `Toast.tsx` | Ink-solid pill, bottom-centre on mobile (above the nav), bottom-right on desktop. |
| `EmptyState.tsx` | Dashed `border-line-strong`, `rounded-xl`, large muted emoji/illustration, serif heading, and **two** actions — a neutral "Clear filters" plus a maroon "Post a request instead". Accept an optional `secondaryAction`. |
| `ErrorState.tsx` | Same shell in `bg-danger-wash border-brand-line`, "⚡ Couldn't load the feed", retry button. |
| `Skeleton.tsx` | Shimmer keyframe on `bg-paper-sunk`. |
| `Spinner.tsx` | `text-brand`. |
| `ReportSheet.tsx` | Restyle only. |

### 4.7 Auth & admin

- **Auth screens** (`SignIn`, `SignUp`, `Otp`, `ForgotPassword`, `CompleteProfile`, `Banned`): centred `max-w-[420px]` card on `bg-paper`, wordmark above, serif headline, restyled inputs. Split-screen on `lg:` with the masthead headline and a warm gradient panel on the left.
- **Admin** (`AdminLayout` + the six screens): token swap only. Left sidebar `bg-surface-alt`, tables get `border-line` hairlines and `text-[13px]`. No layout work — it is staff-facing.
- `AnnouncementBanner.tsx`: amber, not sky — `bg-accent-wash border-accent-line text-ink`.
- `OfflineBanner.tsx` / `UpdateToast.tsx` / `PWAInstaller.tsx`: ink-solid pill styling.
- `NotFoundScreen.tsx` / `RulesScreen.tsx`: `PageContainer`, serif headings.

---

## 5. Motion

Everything uses `cubic-bezier(.22,.61,.36,1)`. All of it must be wrapped in `useReducedMotion()` — the app already imports it in `BottomNav`; apply it consistently.

| Element | Motion |
|---|---|
| Card hover | `translateY(-3px)` + shadow, 200ms |
| Card image | `scale(1.045)`, 500ms |
| WhatsApp icon → pill | `max-width` + `padding`, 250ms, desktop hover only |
| Bottom nav indicator | `layoutId` spring, `stiffness 500 / damping 35` (already correct) |
| Sheets | spring `stiffness 400 / damping 38` |
| Page transitions | 180ms opacity + 6px rise |
| Skeleton shimmer | 1.5s linear infinite |
| Theme switch | 300ms colour transition on `body`; **suppress it during the initial paint** or the first load flashes |

---

## 6. Accessibility & quality gates

- Contrast: `--ink-3` on `--paper` is the tightest pair in the system. Verify ≥ 4.5:1 in **both** themes; nudge `--ink-3` darker in light mode if it fails.
- The WhatsApp icon button needs `aria-label="Contact seller on WhatsApp about {title}"` — an icon alone is not a label.
- Category rail: arrow-key navigation, `role="tablist"`.
- Focus-visible rings on every interactive element, offset against `--paper`.
- The masthead is decorative — the page's `<h1>` must remain meaningful for screen readers.
- Run the existing Playwright suite; the selectors in `tests/` will need updating wherever they target `SegmentedControl` or the card's contact button.
- `npm run typecheck && npm run lint && npm run build` must pass clean.
- Lighthouse: no regression on mobile performance. The only added weight is one extra font family (~28KB woff2, subset to Latin).

---

## 7. Suggested sequencing

Each phase leaves the app in a shippable state.

| Phase | Work | Why here |
|---|---|---|
| **1 — Token layer** | `index.css`, `tailwind.config.ts`, `index.html`, `theme.tsx`, `ThemeToggle`, project-wide class rename | Nothing else can be built until the tokens exist. App will look half-migrated at the end of this phase; that is expected. |
| **2 — Shell** | `PageContainer`, `AppShell`, `BottomNav`, `DesktopHeader`, `PostChooserSheet`, delete `SegmentedControl` | Fixes the navigation redundancy, which is the biggest structural problem. |
| **3 — Primitives** | `Button`, `Badge`, `Card`, `Input`, `Select`, `Textarea`, `Sheet`, `Dialog`, `Toast`, `EmptyState`, `ErrorState`, `Skeleton` | Everything downstream composes from these. |
| **4 — Feed** | `FeedScreen`, `FeedMasthead`, `useFeedStats`, `ListingCard`, `ListingSkeleton`, `CategoryPills`, `SearchBar`, `SortDropdown`, `FilterSheet` | The screen 90% of sessions start on. |
| **5 — Detail & Wanted** | `ListingDetailScreen`, `WantedBoardScreen`, `RequestCard`, `RequestDetailScreen`, `categoryLabel` | Includes the `room_essentials` bug fix. |
| **6 — Profile, Saved, Create/Edit** | `ProfileScreen`, `MyListingsTab`, `MyRequestsTab`, `SavedItemsScreen`, `CreateListingScreen`, `EditListingScreen`, `PhotoUploader`, `CreateWantedRequestScreen` | |
| **7 — Auth, admin, PWA, polish** | Auth screens, admin token swap, manifest + icons + OG image, motion pass, a11y audit, test updates | |

---

## 8. Explicitly out of scope

No schema changes. No new Supabase tables, columns, RPCs or policies. No new user-facing features — no chat, no ratings, no seller pages beyond the existing profile, no price history, no notifications system. `useFeedStats` is the only new query, and it is a read-only aggregate that degrades gracefully to nothing when it fails.
