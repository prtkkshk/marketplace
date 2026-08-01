---
description: Ship KGP Bazaar to Vercel safely — env checks, migration ordering, PWA verification, smoke test on the live URL.
---

1. Confirm the working tree is clean and on the phase branch, and that
   `/verify-phase` passed for the current phase.
2. Confirm every migration in `supabase/migrations/` has been applied to the **hosted**
   Supabase project, not just the local one. List applied vs. local migrations and show
   they match. Never deploy a frontend that expects a column production doesn't have.
3. Run the `rls-audit` skill against the hosted project. A deploy with a failing deny
   case is a data breach, not a bug.
4. Verify environment variables in Vercel match `.env.example` exactly:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`. Confirm no
   `service_role` key exists in Vercel's environment.
5. Confirm the hosted Supabase Auth settings: Site URL and Redirect URLs include the
   Vercel production domain and preview domains, or Google sign-in will fail in prod
   while working locally.
6. `npm run build` locally and run the `pwa-verify` skill against `npm run preview`.
7. Push. Wait for the Vercel deployment to finish and report the URL.
8. Smoke test the live URL on a real mobile viewport:
   - sign up with a `@kgpian.iitkgp.ac.in` address → OTP arrives → profile completion
   - Google sign-in with a KGP account
   - a non-KGP email is rejected
   - post a listing with 2 photos → it appears in the feed
   - tap Contact Seller → WhatsApp opens with the prefilled message
   - install to home screen → app opens standalone
   - `/admin` as a non-admin → blocked
9. Report each smoke-test item PASS/FAIL with what you observed. If anything fails,
   state clearly whether to roll back.
