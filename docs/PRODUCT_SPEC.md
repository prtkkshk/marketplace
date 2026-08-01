# KGP Bazaar — Product Specification (v1)

Source of truth for what gets built. If an agent finds behaviour undefined here, it
stops and asks rather than inventing it.

Supersedes the original `PROJECT_SPECIFICATIONS.md` (kept for history; where they
disagree, **this file wins**).

---

## 1. What this is

An installable PWA for IIT Kharagpur students to buy and sell second-hand items and to
post "wanted" requests. Discovery and trust happen in the app; the actual conversation
and payment happen on WhatsApp and in person. There is no payment gateway, no escrow,
and no in-app chat — deliberately.

**The one-sentence test for any feature:** does it help a KGP student sell a cycle or
find a second-hand textbook faster? If not, it's out of scope for v1.

---

## 2. Users and roles

| Role | How you get it | What you can do |
|---|---|---|
| **Visitor** | Not signed in | See the landing/auth screen only. No browsing. |
| **Student** | Verified `@kgpian.iitkgp.ac.in` email + completed profile | Browse, search, post listings and wanted requests, save items, contact sellers, manage and delete own content, report content, delete own account |
| **Admin** | `profiles.is_admin = true`. At launch there is exactly one: **Prateek — `pepperjet@kgpian.iitkgp.ac.in`**, bootstrapped by hand in the Supabase dashboard. Further admins are promoted from inside the admin panel. | Everything a student can do, plus the full admin panel (§8) |
| **Banned** | `profiles.is_banned = true`, set by an admin | Can sign in and see a "your account is suspended" screen; cannot read the feed, post, or contact anyone |

**Browsing requires an account.** This is intentional: it keeps the student directory
out of public reach and makes moderation possible.

---

## 3. Branding & design system

- **Theme:** light mode, sky-blue accent. Primary `#0284C7` (`sky-600`), light accent
  `#38BDF8` (`sky-400`), background `#F8FAFC` (`slate-50`), surfaces white.
- **Cards:** `rounded-2xl`, `border-slate-200/80`, soft shadow.
- **Type:** Inter (already loaded in `index.html`).
- **Motion:** `framer-motion`, subtle — sliding tab indicator, tap scale, sheet
  slide-up, toasts. Respects `prefers-reduced-motion`.
- **Icons:** `lucide-react` only.
- Full token table and component rules: `.agents/rules/react-conventions.md`.

### Navigation

- **Mobile (< 768px):** fixed bottom bar, 4 items — 🏠 Home, 📢 Wanted, ➕ Sell/Request
  (raised centre FAB), 👤 Profile. Respects `safe-area-inset-bottom`.
- **Desktop (≥ 768px):** sticky glassmorphic top header with the same destinations.
- **Admin** is reached from Profile → "Admin Panel" and at `/admin`. It is not a 5th tab.

---

## 4. Authentication & profile

### Sign-up / sign-in — two methods, both restricted to the KGP domain

**A. Email + password**
1. Student enters `@kgpian.iitkgp.ac.in` email + password (min 8 chars, must contain a
   letter and a number).
2. Supabase sends a 6-digit confirmation code (OTP). Student enters it in-app.
   Resend allowed after 60s, max 3 resends per 15 minutes.
3. On verification → profile completion screen.

**B. Google Sign-In**
1. Google OAuth. If the returned email is not `@kgpian.iitkgp.ac.in`, the account is
   rejected immediately with a clear message and the session is destroyed.
2. On success → profile completion screen (pre-filled with the Google display name).

Domain enforcement lives in three layers: zod on the client, a Supabase auth hook that
rejects the signup server-side, and a `check` constraint on `profiles.email`. The
client check alone is decorative.

### Profile completion (mandatory before using the app)

| Field | Rules |
|---|---|
| Full name | 2–60 chars |
| Roll number | `^[0-9]{2}[A-Z]{2}[0-9]{5}$` e.g. `22CS10045`; unique across profiles; stored uppercase |
| KGP email | From auth, read-only |
| Hall of residence | Dropdown, from the canonical list below |
| WhatsApp number | 10 digits, normalised to `+91XXXXXXXXXX` |

**Halls of residence (canonical list — use exactly this, in `src/lib/constants.ts`):**
Azad, Patel, Nehru, RK (Radhakrishnan), RP (Rajendra Prasad), LLR (Lal Bahadur
Shastri), MMM (Madan Mohan Malaviya), VS (Vidyasagar), HJB (Homi Jehangir Bhabha),
JCB (JC Bose), Zakir Hussain, Gokhale, Nivedita, SNIG (Sarojini Naidu / Indira Gandhi),
MS (Mother Teresa / MS), MT (Mega Tower), Rani Laxmibai, BCR (BC Roy), Vikramshila
Residency, Other.

✅ **Confirmed by the product owner (2026-08-01).** Use this list verbatim in
`src/lib/constants.ts`. Do not add, rename, or reorder entries.

**Domain scope — confirmed:** `@kgpian.iitkgp.ac.in` is the *only* allowed domain, and it
covers **all student cohorts** — UG, PG, dual degree, MSc and research scholars alike.
There is no second domain to support. IIT Kharagpur runs this domain on Google
Workspace, which is why Google Sign-In is viable.

**Roll number — confirmed:** `^[0-9]{2}[A-Z]{2}[0-9]{5}$` (e.g. `22CS10045`) is valid for
every cohort. Stored uppercase, unique across profiles.

**Explicitly excluded:** room number, any sports data, any sports filter.

### Profile screen contents
Name, roll number, hall, email; My Listings (active / sold, with edit + delete);
My Wanted Requests (open / fulfilled); Saved Items; Settings (edit profile, sign out,
delete account); "Admin Panel" entry if `is_admin`.

---

## 5. For Sale feed

### Categories (exactly six)
1. 🚲 Cycles & Accessories
2. 📚 Books, Notes & Academics
3. 💻 Electronics & Gadgets
4. 🛏️ Room Essentials & Furniture
5. 🥼 Lab & Course Gear
6. 📦 Other / Misc

### Feed behaviour
- Segmented control at the top switches between **🛍️ For Sale** and **📢 Wanted Board**.
- **Search:** debounced 250ms, matches title and description, case-insensitive
  (Postgres `ilike` or full-text index).
- **Category pills:** horizontally scrollable, single-select, "All" default.
- **Sort:** Newest First (default), Price: Low→High, Price: High→Low.
- **Extra filters** (in a filter sheet): condition, negotiable only, hall, max price.
- Search / category / sort / filters are all reflected in the URL query string.
- **Pagination:** infinite scroll, 20 per page. Never fetch the whole table.
- Pinned admin announcements and pinned listings appear above the feed.

### Listing card
Photo (first image, lazy, fixed aspect ratio to avoid layout shift) · title ·
price badge (`₹1,200`) · condition badge (Brand New / Like New / Good / Fair) ·
negotiability badge (Fixed / Negotiable) · seller's hall · relative time ("2h ago") ·
Save (heart) · **Contact Seller on WhatsApp** button · overflow menu with Report.

Sold items show a muted "SOLD" badge, are greyed, and their contact button is disabled.

### Listing detail
Photo carousel (up to 4, swipeable) · full description · all badges · seller's name and
hall (never the phone number as text) · Contact Seller · Save · Report · and, for the
owner or an admin, Edit / Mark as Sold / Delete.

---

## 6. Wanted Board

Students post what they're looking for; anyone who has it responds.

**Request fields:** title (what they want), category (same six), max budget (₹,
optional), description/specs, hall (auto from profile).

**Request card:** title · category badge · `Budget: Under ₹X` badge · description ·
requester's hall · relative time · **"I Have This! (WhatsApp)"** button · Report.

**WhatsApp response message:**
```
Hi! I saw your request "<Item Title>" on KGP Bazaar Wanted Board. I have this item available!
```

**Lifecycle:** the requester can mark a request **Found / Fulfilled** (shows a muted
badge, disables the response button) or delete it. Requests auto-archive after 30 days
with a "still looking?" nudge.

---

## 7. Posting, editing, contacting

### Create listing
Title (≤80) · category · price (integer ₹, 0–500000) · negotiable toggle · condition ·
1–4 photos · description (≤1000) · hall (auto-filled, read-only).

Photos are compressed client-side to ≤1600px long edge, EXIF stripped, converted to
WebP, uploaded to the private `listing-photos` bucket under `{user_id}/{listing_id}/`.
Upload progress shown per image; failure of one image doesn't lose the form.

On success: confetti (`canvas-confetti`), toast, redirect to the new listing.

### Manage
Mark as Sold (reversible) · Edit (any field except photos count rules) ·
Delete (confirmation sheet; deletes storage objects too).

### Contact seller — the privacy-critical path
1. Phone numbers are **never** included in feed or detail payloads.
2. Tapping Contact Seller calls the `get_contact_number(listing_id)` RPC.
3. The RPC rejects banned users, rate-limits to 30 reveals/hour per user, logs a row in
   `contact_events`, and returns the number.
4. The client opens:
   ```
   https://wa.me/<number>?text=Hi! I saw your listing "<Title>" for ₹<Price> on KGP Bazaar. Is it available?
   ```
   (URL-encoded.) The number is never rendered on screen.

No payments, no escrow, no in-app chat. Cash/UPI in person on campus.

---

## 8. Admin panel (`/admin`, admins only)

Lazy-loaded route bundle, guarded by `<AdminRoute>` in the UI **and** by RLS policies in
the database. Every destructive action writes to `admin_audit_log`.

### 8.1 Dashboard (`/admin`)
Stat cards: total students · active listings · sold listings · open wanted requests ·
pending reports (with a realtime badge) · signups today / this week.
Charts: signups per day (30 days), listings per category, listings per hall,
sold-vs-active over time. Recent activity feed.

### 8.2 Moderation queue (`/admin/reports`)
Table of reports: reported content preview, reason, reporter, timestamp, status
(pending / actioned / dismissed). Actions per report: **view content**, **hide**,
**delete**, **dismiss**, **ban the poster**. Bulk select supported. Filter by status
and reason. Every action requires a short reason note, stored in the audit log.

**Report reasons (student-facing):** Spam or scam · Prohibited item · Offensive content ·
Wrong category · Already sold · Harassment · Other (free text ≤200 chars).

### 8.3 User management (`/admin/users`)
Searchable, sortable table: name, roll number, hall, email, joined date, listing count,
report count, status. Row actions: view full profile and their listings, **ban**
(blocks posting and contacting, hides all their content) with a reason, **unban**,
**promote to admin**. Admins cannot ban or demote other admins from the UI.

### 8.4 Content management (`/admin/listings`)
All listings and wanted requests, including hidden and deleted ones. Filter by
category, status, hall, date. Actions: edit any field, force mark-sold, hide, delete,
restore, **pin to top of feed**.

### 8.5 Announcements (`/admin/announcements`)
Create a campus-wide banner: message (≤200 chars), type (info / warning / success),
start and end datetime, active toggle. Only one announcement is shown at a time (the
most recent active one); students can dismiss it and it stays dismissed.

### 8.6 Audit log (`/admin/audit`)
Read-only, paginated: who did what to which record, when, and why. Not deletable from
the UI.

---

## 9. PWA

- Single manifest generated by `vite-plugin-pwa` (delete the static
  `public/manifest.json` — having both is the current bug in the repo).
- Service worker caches the app shell and static assets only. **Never** caches Supabase
  API responses.
- Custom "Add to Home Screen" banner: Android via `beforeinstallprompt`; iOS via a
  detected-Safari instruction sheet. Dismissal remembered for 30 days.
- Offline: app shell + an "You're offline" banner. No blank screen.
- Update available → toast prompting reload; never swap content mid-session.

---

## 10. Non-functional requirements

| Area | Target |
|---|---|
| Lighthouse (mobile) | PWA installable ✅, Perf ≥ 85, A11y ≥ 95, Best Practices ≥ 95 |
| First load | ≤ 200 kB gzipped JS for the student bundle (admin lazy-loaded) |
| Feed query | ≤ 400ms p95 with 5,000 listings |
| Viewport | Designed at 390×844; must work 320px → 1920px |
| Browsers | Chrome/Edge Android, Safari iOS 16+, desktop Chrome/Safari/Firefox |
| Accessibility | Keyboard reachable, 44px targets, visible focus, meaningful alt text |
| Cost | Must fit Supabase + Vercel free tiers at ~2,000 students |

---

## 11. Content policy — prohibited items

Confirmed by the product owner. This is both the moderator's reference for the
"Prohibited item" report reason **and** the copy for the in-app Rules page
(`/rules`, linked from Profile and from the create-listing form).

### You may not post

1. **Alcohol** — in any quantity or form.
2. **Drugs and tobacco** — including cigarettes, vapes, e-cigarettes, hookah gear, and
   any controlled or prescription substance.
3. **Weapons** — knives beyond ordinary kitchen use, air guns, replicas, or anything
   intended as a weapon.
4. **Exam or academic material that isn't yours to sell** — leaked papers, solution
   manuals for live courses, question banks obtained improperly, or any offer to do
   someone's assignment, project, or attendance.
5. **Room sublets, room swaps, or hall allotment trading** — this is an items
   marketplace, not a housing board.

### Also removable at an admin's discretion

Counterfeit goods · stolen property · anything requiring a licence to sell · live
animals · adult content · services rather than items · commercial or bulk reselling ·
personal data of any kind · spam, scams, and payment-in-advance requests.

### Enforcement ladder

| Occurrence | Action |
|---|---|
| First, clearly accidental | Listing removed, student notified with the reason |
| Repeat, or clearly deliberate | Listing removed + account banned, reason recorded |
| Illegal (drugs, weapons, stolen goods) | Immediate ban, content preserved in the audit log rather than hard-deleted |

Every one of these actions writes to `admin_audit_log` with a reason. Nothing is removed
silently.

> **Note:** the app is a listing board only. Transactions happen off-platform, so the
> app cannot and does not verify what actually changes hands. The Rules page must say
> this plainly: students trade at their own risk, meet in public campus spaces, and
> inspect items before paying.

---

## 12. Out of scope for v1

In-app chat · payments/escrow/UPI · push notifications (v2) · ratings & reviews ·
room numbers · sports data or filters · native apps · multi-campus support ·
SSR / Next.js migration · a custom backend server.
