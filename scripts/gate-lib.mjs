/**
 * Shared plumbing for the gate-*.mjs scripts: .env.test loading, a local preview
 * server, and student sign-in. Not a gate itself — has no exit code opinions.
 *
 * Three of the five gates (perf, a11y, responsive) need the same built app served
 * locally and the same "sign in as studentA" flow, so it lives here once instead of
 * five times.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnvTest() {
  const path = join(ROOT, '.env.test');
  if (!existsSync(path)) {
    fail(`.env.test not found at ${path}. Copy .env.test.example and fill it in.`);
  }
  // Same precedence rule as playwright.config.ts's own .env.test loader: a value
  // already present in process.env wins over the file. Without this, `E2E_BASE_URL=
  // https://... node scripts/gate-perf.mjs` (e.g. to point a gate at the live site
  // for a one-off comparison) is silently ignored in favour of the file's localhost
  // default — the override looks like it worked but every measurement is local.
  const env = { ...process.env };
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    env[key] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return env;
}

export function need(env, key) {
  if (!env[key]) fail(`${key} is missing or empty in .env.test`);
  return env[key];
}

/** Prints the failure and exits 1. Every gate funnels its failure through this. */
export function fail(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}

export function pass(msg) {
  console.log(`\n  ✓ ${msg}\n`);
}

export function median(values) {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function isUp(url) {
  try {
    const resp = await fetch(url, { method: 'GET' });
    return resp.status < 500;
  } catch {
    return false;
  }
}

/**
 * Ensures the built app is served at env.E2E_BASE_URL. If something is already
 * answering there (e.g. a `npm run preview` left running, or a previous gate in the
 * same `npm run gates` chain that started it), it is reused untouched. Otherwise this
 * builds and starts `npm run preview` itself and returns a handle to stop it.
 *
 * Returns { baseUrl, stop() }. `stop()` is a no-op if the server was reused.
 */
export async function ensureLocalServer(env) {
  const baseUrl = env.E2E_BASE_URL || 'http://localhost:4173';

  if (await isUp(baseUrl)) {
    console.log(`  Reusing already-running server at ${baseUrl}`);
    return { baseUrl, stop: async () => {} };
  }

  console.log(`  No server at ${baseUrl} — building and starting \`npm run preview\`...`);
  // Deliberately `vite build`, not `npm run build` (which is `tsc && vite build`).
  // These gates serve and exercise the app bundle; whether test-spec files under
  // tests/ typecheck is `npm run typecheck`'s job, not this one's, and coupling the
  // two means an unrelated test-file type error silently blocks perf/a11y/responsive
  // gates that have nothing to do with it.
  await runToCompletion('npx', ['vite', 'build'], ROOT);

  // npm on Windows resolves to npm.cmd, a batch file — spawn() can only launch those
  // via a shell (EINVAL otherwise). shell:true is safe here: args are fixed literals,
  // nothing from user input touches this command line.
  const proc = spawn('npm', ['run', 'preview'], {
    cwd: ROOT,
    stdio: 'ignore',
    shell: true,
  });

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await isUp(baseUrl)) {
      return { baseUrl, stop: () => killProcessTree(proc) };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  killProcessTree(proc);
  fail(`\`npm run preview\` did not answer at ${baseUrl} within 60s`);
}

/**
 * proc.kill() only kills the shell wrapper spawned by shell:true, not npm's own
 * child (vite preview) — that process would otherwise leak and hold port 4173 for
 * every gate run after this one.
 */
function killProcessTree(proc) {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore', shell: true });
  } else {
    proc.kill();
  }
}

function runToCompletion(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
    proc.on('error', reject);
  });
}

/**
 * Signs a page in as the given student and dismisses the PWA install prompt, exactly
 * like tests/e2e/_credentials.ts's signIn — duplicated rather than imported because
 * that file lives under tests/ (a Playwright testDir) and importing across into
 * scripts/ would couple a gate's behaviour to test-runner resolution.
 */
export async function signIn(page, baseUrl, who) {
  await page.goto(new URL('/auth/signin', baseUrl).toString());
  await page.fill('input[type="email"]', who.email);
  await page.fill('input[type="password"]', who.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 20000 });
  await page.evaluate(() => {
    window.localStorage.setItem('pwa_install_dismissed_until', '9999999999999');
  });
}

export function studentA(env) {
  return { email: need(env, 'E2E_STUDENT_A_EMAIL'), password: need(env, 'E2E_STUDENT_PASSWORD') };
}

export function bannedStudent(env) {
  return { email: need(env, 'E2E_BANNED_EMAIL'), password: need(env, 'E2E_STUDENT_PASSWORD') };
}

export function adminUser(env) {
  return { email: need(env, 'E2E_ADMIN_EMAIL'), password: need(env, 'E2E_ADMIN_PASSWORD') };
}

export function serviceClient(env) {
  return createClient(need(env, 'SUPABASE_URL'), need(env, 'SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Real listing/request ids to use for /listing/:id and /request/:id, instead of a
 *  fake id that only ever exercises the not-found state. */
export async function discoverRealIds(env) {
  const client = serviceClient(env);
  const [{ data: listings }, { data: requests }] = await Promise.all([
    client.from('listings').select('id').eq('status', 'active').limit(1),
    client.from('wanted_requests').select('id').eq('status', 'open').limit(1),
  ]);
  return {
    listingId: listings?.[0]?.id ?? null,
    requestId: requests?.[0]?.id ?? null,
  };
}

export async function countActiveListings(env) {
  const client = serviceClient(env);
  const { count, error } = await client
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  if (error) fail(`Could not count active listings: ${error.message}`);
  return count ?? 0;
}

// ---------------------------------------------------------------------------------
// Shared route matrix + session prep, used by gate-a11y.mjs and gate-responsive.mjs.
// "Every route" (HANDOVER.md §3) means every route, not just the ones reachable while
// signed in as one ordinary student — /banned and /complete-profile only render for
// accounts in those exact states, and /admin only for an admin.
// ---------------------------------------------------------------------------------

const STATIC_ROUTE_MATRIX = [
  { path: '/auth/signin', as: 'public' },
  { path: '/auth/signup', as: 'public' },
  { path: '/auth/otp', as: 'public' },
  { path: '/auth/forgot-password', as: 'public' },
  { path: '/', as: 'student' },
  { path: '/wanted', as: 'student' },
  { path: '/new', as: 'student' },
  { path: '/new-request', as: 'student' },
  { path: '/profile', as: 'student' },
  { path: '/profile/saved', as: 'student' },
  { path: '/rules', as: 'student' },
  { path: '/banned', as: 'banned' },
  { path: '/complete-profile', as: 'incomplete' },
  { path: '/admin', as: 'admin' },
];

/** The static route list plus real /listing/:id and /request/:id, discovered from the
 *  live DB instead of a fake id that would only ever exercise the not-found state. */
export async function buildRouteList(env) {
  const { listingId, requestId } = await discoverRealIds(env);
  const routes = [...STATIC_ROUTE_MATRIX];
  if (listingId) routes.push({ path: `/listing/${listingId}`, as: 'student' });
  if (requestId) routes.push({ path: `/request/${requestId}`, as: 'student' });
  return { routes, listingId, requestId };
}

export async function captureAuthSession(baseUrl, who) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, baseUrl, who);
    const cookies = await context.cookies();
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    return { cookies, localStorage };
  } finally {
    await browser.close();
  }
}

/** A fresh, unverified-profile account so /complete-profile has something real to
 *  render. Callers must invoke the returned cleanup() — this must never leave a stray
 *  row behind for a later gate run or the QA identity count to drift. */
export async function createThrowawayIncompleteStudent(env) {
  const admin = serviceClient(env);
  const email = `gate.throwaway.${Date.now()}@kgpian.iitkgp.ac.in`;
  const password = need(env, 'E2E_STUDENT_PASSWORD');
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) fail(`Could not create throwaway account: ${error.message}`);
  return {
    email,
    password,
    cleanup: async () => {
      await admin.auth.admin.deleteUser(data.user.id);
    },
  };
}

/** Signs in as every account shape the route matrix needs (student, banned, admin,
 *  incomplete-profile) and returns {cookies, localStorage} sessions keyed the same way
 *  as each route's `as`. Returns a cleanup() that must be called to remove the
 *  throwaway incomplete-profile account. */
export async function prepareAllSessions(env, baseUrl) {
  const sessions = {};
  sessions.student = await captureAuthSession(baseUrl, studentA(env));
  sessions.banned = await captureAuthSession(baseUrl, bannedStudent(env));
  sessions.admin = await captureAuthSession(baseUrl, adminUser(env));

  const throwaway = await createThrowawayIncompleteStudent(env);
  sessions.incomplete = await captureAuthSession(baseUrl, {
    email: throwaway.email,
    password: throwaway.password,
  });

  return { sessions, cleanup: throwaway.cleanup };
}

/** Primes a fresh page/context with a session's cookies + localStorage. No-op for
 *  `as: 'public'` routes, which need no session at all. */
export async function primeSession(context, page, baseUrl, sessions, as) {
  if (as === 'public') return;
  const session = sessions[as];
  await context.addCookies(session.cookies);
  await page.goto(new URL('/auth/signin', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
  await page.evaluate((items) => {
    for (const [key, value] of Object.entries(items)) window.localStorage.setItem(key, value);
  }, session.localStorage);
}
