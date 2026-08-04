# Manual Setup — What Prateek Must Do By Hand

The AI agent can write every line of code in this project. It **cannot** create accounts,
click consent screens, or hold secrets. This is your list.

Legend: 🔴 blocks the agent · 🟡 needed mid-build · 🟢 needed before launch

---

## 🔴 1. Before the agent starts (15 min)

### 1.1 Install the toolchain
- **Node.js 20 LTS** — https://nodejs.org (`node -v` should print `v20.x` or newer)
- **Git** — https://git-scm.com
- **Google Antigravity** — open this project folder as the workspace. (It's still named
  `kgp_marketplace` on disk; rename it to `kgp-bazaar` if you like — nothing in the
  project depends on the folder name.)
- Optional but recommended: **Supabase CLI** (`npm i -g supabase`) so the agent can run
  migrations locally instead of only against the cloud

### 1.2 Create the GitHub repo
1. Create an empty **private** repo named `kgp-bazaar` (no README, no .gitignore).
2. In this folder:
   ```
   git init
   git remote add origin https://github.com/<you>/kgp-bazaar.git
   ```
   Don't commit yet — the agent will create `.gitignore` in Phase 0. Committing before
   that risks pushing `.env`.

### 1.3 Open questions — already answered ✅
All seven are resolved and recorded in `implementation_plan.md` → "Resolved". Nothing is
blocking. For reference: the hall list is confirmed, `@kgpian.iitkgp.ac.in` is the only
domain and covers all cohorts, KGP is on Google Workspace, the roll-number format holds,
you are the sole admin (`pepperjet@kgpian.iitkgp.ac.in`), the prohibited-items policy is
written into `docs/PRODUCT_SPEC.md` §11, and the app lives at
`kgpbazaar.vercel.app`.

---

## 🔴 2. Supabase project (20 min)

1. Sign up at https://supabase.com (free tier is enough for ~2,000 students).
2. **New project** → name `kgp-bazaar` → region **Southeast Asia (Singapore)** —
   the closest region to Kharagpur; latency is noticeably better than US/EU.
3. Save the database password in a password manager. You will need it and Supabase
   will not show it again.
4. Wait ~2 minutes for provisioning.
5. **Settings → API**, copy two values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
6. On the same page there is a **`service_role` key**. Never copy it into this project,
   never paste it into Antigravity chat, never put it in Vercel. It bypasses all
   security. If you ever paste it somewhere by accident, rotate it immediately.

---

## 🔴 3. Local environment file (2 min)

After the agent creates `.env.example` in Phase 0, copy it:

```
copy .env.example .env.local
```

Fill in:
```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_APP_URL=http://localhost:5173
```

`.env.local` must be in `.gitignore`. Verify with `git status` that it never appears.

> These are "public" keys in the sense that they ship to the browser — the security
> comes entirely from Row Level Security, which is why Phase 1 exists and why the
> `rls-audit` skill is mandatory before deploy.

---

## 🟡 4. Supabase Auth configuration (15 min, before Phase 2)

**Authentication → Providers → Email**
- Enable Email provider
- Turn **on** "Confirm email"
- Set OTP expiry to 600 seconds
- Minimum password length 8

**Authentication → URL Configuration**
- Site URL: `http://localhost:5173` for now (change to the Vercel URL at launch)
- Redirect URLs: add `http://localhost:5173/**`

**Authentication → Email Templates**
- Edit the confirmation template so it sends a **6-digit code** (`{{ .Token }}`), not
  only a magic link. Brand it "KGP Bazaar" so students don't think it's spam.

> ⚠️ The built-in Supabase email service is rate-limited to a handful of emails per
> hour — fine for development, **not** for launch. Before you promote the app, connect
> a real SMTP provider under **Settings → Auth → SMTP Settings**. Resend
> (https://resend.com) has a free tier of 3,000 emails/month and takes ~10 minutes to
> set up including a DNS record. Skipping this means students stop receiving OTPs on
> day one.

---

## 🟡 5. Google Sign-In (30 min, before Phase 2)

✅ Confirmed: `@kgpian.iitkgp.ac.in` is on Google Workspace, so Google Sign-In is in
scope and domain-hinting works.

1. https://console.cloud.google.com → new project `kgp-bazaar`
2. **APIs & Services → OAuth consent screen**
   - User type: **External**. (Internal would auto-restrict to the KGP domain, but it
     requires that your Google Cloud project sits inside the KGP Workspace organisation —
     which needs institute IT admin rights you almost certainly don't have. External +
     the server-side domain check the agent builds in Phase 2 achieves the same result.)
   - App name: KGP Bazaar · support email: yours · developer email: yours
   - Scopes: `email`, `profile`, `openid` only
   - While in "Testing" mode only accounts you list can sign in — add your own test
     accounts, and publish the app before launch
3. **Credentials → Create Credentials → OAuth client ID → Web application**
   - Authorised JavaScript origins: `http://localhost:5173` **and**
     `https://kgpbazaar.vercel.app`
   - Authorised redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
     (copy this exact URL from Supabase → Authentication → Providers → Google)
4. Copy the **Client ID** and **Client Secret** into Supabase → Authentication →
   Providers → Google, and enable it.
5. Optional hardening: set the `hd` (hosted domain) parameter to
   `kgpian.iitkgp.ac.in` in the OAuth call. Note this is a **hint, not a guarantee** —
   the server-side domain check the agent builds in Phase 2 is what actually enforces it.

---

## ✅ 6. App icons — DONE

Generated from your `marketplace_app_logo.png` (now archived as
`docs/brand/kgp-bazaar-logo-1024.png`). Nothing left to do here.

Everything below is already in `public/` and wired into `vite.config.ts` and
`index.html`:

`pwa-192x192.png` · `pwa-512x512.png` · `pwa-maskable-192x192.png` ·
`pwa-maskable-512x512.png` · `apple-touch-icon.png` · `favicon.svg` · `favicon.ico` ·
`favicon-16/32/48.png` · `masked-icon.svg` (Safari pinned tab) · `og-image.png`
(1200×630, for WhatsApp link previews — which is how this app will actually spread).

Maskable safe zone verified: the bag artwork sits 180.6px from centre on the 512 icon,
inside the 204.8px limit, so Android won't crop it on any mask shape.

The redundant `public/manifest.json` has been deleted — `vite-plugin-pwa` now owns the
single manifest, which closes the duplicate-manifest bug flagged in Phase 9.

> ⚠️ **One decision left:** your logo is royal blue `#4787F9`; the app's design tokens
> and `theme_color` are sky blue `#0284C7`. The icon and the app chrome will look like
> two different brands. See `docs/brand/README.md` for the three options — recolouring
> the logo to `#0284C7` is the cheapest fix.

---

## 🟢 7. Vercel deployment (15 min, Phase 11)

1. https://vercel.com → sign in with GitHub → **Add New Project** → import
   `kgp-bazaar`
2. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
   Set the **Vercel project name to `kgpbazaar`** (no hyphen) so the URL resolves to the
   confirmed **`https://kgpbazaar.vercel.app`**. No custom domain for v1.
3. **Environment Variables** — add for Production **and** Preview:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL` = `https://kgpbazaar.vercel.app`
   No `service_role`. Ever.
4. Deploy. Confirm the URL is `https://kgpbazaar.vercel.app`.
5. **Go back to Supabase** and add the production URL to:
   - Authentication → URL Configuration → Site URL and Redirect URLs
     (`https://kgpbazaar.vercel.app/**` and
      `https://kgpbazaar-*.vercel.app/**` for previews)
   - Google Cloud Console → authorised origins
   Forgetting this is the single most common launch bug: Google sign-in works locally
   and fails silently in production.
6. Add `vercel.json` with an SPA rewrite (the agent does this) so deep links like
   `/listing/abc` don't 404 on refresh.

---

## 🟢 8. Make yourself an admin (2 min, once, Phase 11)

You are the **sole admin** at launch: `pepperjet@kgpian.iitkgp.ac.in`. There is
deliberately no "become admin" button, so bootstrap yourself by hand:

1. Sign up in the live app as `pepperjet@kgpian.iitkgp.ac.in` and complete your profile.
2. Supabase → **Table Editor → profiles** → find that row → set `is_admin` to `true` → save.
3. Reload the app. "Admin Panel" appears in Profile.
4. Any future admins get promoted from inside the app — never again from the dashboard.

> Being the only admin means you are the only person who sees reports. The realtime
> badge only helps if you open the app. Check the moderation queue on a routine, and
> promote a second trusted admin as soon as you have one — the system supports it, the
> risk is purely that you become a bottleneck.

(The column is trigger-protected, so this only works from the dashboard, which uses the
`service_role` connection. That's the intended design.)

---

## 🟢 9. Before you tell students about it

- [ ] Real SMTP connected (§4) — otherwise OTP emails stop after a handful
- [ ] Google OAuth consent screen **published**, not left in Testing
- [ ] `rls-audit` skill run against production and fully green
- [ ] 15–20 genuine listings seeded — an empty marketplace gets one visit per student
- [ ] Prohibited-items policy (`docs/PRODUCT_SPEC.md` §11) live on the in-app Rules page
- [ ] A routine for checking the moderation queue — you're the only admin, so nothing
      gets reviewed unless you review it
- [ ] Tested on a real Android phone **and** a real iPhone, installed to home screen
- [ ] You've decided what you'll do if someone posts something illegal — the audit log
      and ban tools exist, but the decision is yours

---

## Cost expectation

| Service | Free tier | Realistic usage at ~2,000 students |
|---|---|---|
| Supabase | 500 MB DB, 1 GB storage, 50k MAU | Comfortable. Storage is the first thing to run out — the WebP compression and 90-day purge exist for this reason. |
| Vercel | 100 GB bandwidth/month | Comfortable for a PWA. |
| Resend (email) | 3,000/month | Comfortable. |
| Domain (optional) | ~₹800/year | Only if you don't want `.vercel.app`. |

Realistic total: **₹0/month** unless you buy a domain.

---

## Things you should NOT do

- Don't paste the `service_role` key into Antigravity, a config file, or a chat.
- Don't make schema changes in the Supabase dashboard — they won't be in the migrations
  and the next `db reset` will silently erase them.
- Don't commit `.env.local`.
- Don't disable RLS "just to test something". Fix the policy instead.
- Don't skip the phase gates. The whole plan assumes each phase is verified before the
  next one builds on it.
