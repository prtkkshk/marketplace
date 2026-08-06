#!/usr/bin/env node
/**
 * QA test-identity bootstrap for KGP Bazaar.
 *
 *   node scripts/qa-bootstrap.mjs             create + complete the QA student accounts
 *   node scripts/qa-bootstrap.mjs --teardown  delete them and everything they own
 *   node scripts/qa-bootstrap.mjs --status    report what currently exists
 *
 * Why this exists: signup is gated on an @kgpian.iitkgp.ac.in address plus email
 * confirmation, so a QA agent cannot create a second identity through the UI. Without a
 * second identity the entire RLS matrix is unprovable — you cannot demonstrate that
 * student A is blocked from student B's data with only one account.
 *
 * Uses the service_role key. That key bypasses row level security, so this file is the
 * only place outside tests/ allowed to touch it. It is read from .env.test, which is
 * gitignored. Never import this module from src/.
 *
 * Note on banning: profiles has a `protect_privileged_columns` BEFORE UPDATE trigger that
 * rejects changes to is_admin/is_banned unless public.is_admin() is true. Triggers fire
 * even for service_role (auth.uid() is null there, so is_admin() returns false), so the
 * ban below is applied through a real admin session instead — which is also the honest
 * path, since it is how a human admin does it.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = join(ROOT, '.env.test');

// ---------------------------------------------------------------- env

function loadEnv(path) {
  if (!existsSync(path)) {
    fail(
      `.env.test not found at ${path}\n` +
        `Copy .env.test.example to .env.test and fill it in.`
    );
  }
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return env;
}

function fail(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}

function need(env, key) {
  if (!env[key]) fail(`${key} is missing or empty in .env.test`);
  return env[key];
}

const env = loadEnv(ENV_PATH);
const SUPABASE_URL = need(env, 'SUPABASE_URL');
const ANON_KEY = need(env, 'SUPABASE_ANON_KEY');
const SERVICE_KEY = need(env, 'SUPABASE_SERVICE_ROLE_KEY');
const STUDENT_PASSWORD = need(env, 'E2E_STUDENT_PASSWORD');
const ADMIN_EMAIL = need(env, 'E2E_ADMIN_EMAIL');
const ADMIN_PASSWORD = need(env, 'E2E_ADMIN_PASSWORD');

const DOMAIN = '@kgpian.iitkgp.ac.in';

// ---------------------------------------------------------------- identities

/** Roll numbers must match ^[0-9]{2}[A-Z]{2}[0-9]{5}$ and are UNIQUE.
 *  WhatsApp numbers must match ^\+91[0-9]{10}$.
 *  Halls must be one of the values in the profiles CHECK constraint. */
const IDENTITIES = [
  {
    key: 'A',
    email: env.E2E_STUDENT_A_EMAIL || `qa.student.a${DOMAIN}`,
    full_name: 'QA Student A',
    roll_number: '22QA10001',
    hall_of_residence: 'Azad',
    whatsapp_number: '+919000000101',
    banned: false,
  },
  {
    key: 'B',
    email: env.E2E_STUDENT_B_EMAIL || `qa.student.b${DOMAIN}`,
    full_name: 'QA Student B',
    roll_number: '22QA10002',
    hall_of_residence: 'Patel',
    whatsapp_number: '+919000000102',
    banned: false,
  },
  {
    key: 'BANNED',
    email: env.E2E_BANNED_EMAIL || `qa.student.banned${DOMAIN}`,
    full_name: 'QA Student Banned',
    roll_number: '22QA10003',
    hall_of_residence: 'Nehru',
    whatsapp_number: '+919000000103',
    banned: true,
  },
];

for (const id of IDENTITIES) {
  if (!id.email.endsWith(DOMAIN)) {
    fail(`${id.email} must end in ${DOMAIN} — the profiles table has a CHECK constraint on it.`);
  }
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------- helpers

async function findAuthUser(email) {
  // listUsers has no server-side email filter in supabase-js v2; page through it.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`listUsers failed: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function adminSession() {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (error) {
    fail(
      `Could not sign in as ${ADMIN_EMAIL}: ${error.message}\n` +
        `Check E2E_ADMIN_PASSWORD in .env.test.`
    );
  }
  return client;
}

// ---------------------------------------------------------------- commands

async function bootstrap() {
  console.log(`\n  Bootstrapping QA identities against ${SUPABASE_URL}\n`);
  const created = [];

  for (const id of IDENTITIES) {
    let user = await findAuthUser(id.email);

    if (user) {
      console.log(`  · ${id.email} — already exists (${user.id}), reusing`);
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        password: STUDENT_PASSWORD,
        email_confirm: true,
      });
      if (error) fail(`updateUserById failed for ${id.email}: ${error.message}`);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: id.email,
        password: STUDENT_PASSWORD,
        email_confirm: true, // skip the confirmation email; there is no inbox for these
      });
      if (error) fail(`createUser failed for ${id.email}: ${error.message}`);
      user = data.user;
      console.log(`  ✓ ${id.email} — created (${user.id})`);
    }

    // The on_auth_user_created trigger inserts a bare profile row. Complete it, so
    // is_active_student() passes and the account can actually use the app.
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        full_name: id.full_name,
        roll_number: id.roll_number,
        hall_of_residence: id.hall_of_residence,
        whatsapp_number: id.whatsapp_number,
        is_profile_complete: true,
      })
      .eq('id', user.id);
    if (profileError) fail(`profile update failed for ${id.email}: ${profileError.message}`);

    created.push({ ...id, id: user.id });
  }

  // Banning has to go through a real admin session — see the note at the top of this file.
  const toBan = created.filter((c) => c.banned);
  if (toBan.length) {
    const client = await adminSession();
    for (const c of toBan) {
      const { error } = await client
        .from('profiles')
        .update({ is_banned: true, banned_reason: 'QA fixture — banned-user policy testing' })
        .eq('id', c.id);
      if (error) {
        console.error(
          `  ! could not ban ${c.email}: ${error.message}\n` +
            `    (expected if the signed-in account is not actually an admin — check profiles.is_admin)`
        );
      } else {
        console.log(`  ✓ ${c.email} — banned`);
      }
    }
    await client.auth.signOut();
  }

  console.log('\n  Identities ready:\n');
  for (const c of created) {
    console.log(`    ${c.key.padEnd(7)} ${c.email.padEnd(38)} ${c.id}${c.banned ? '  [banned]' : ''}`);
  }
  console.log(`\n  Password for all three: E2E_STUDENT_PASSWORD in .env.test`);
  console.log(`  Tear down with: npm run qa:teardown\n`);
}

async function teardown() {
  console.log(`\n  Tearing down QA identities on ${SUPABASE_URL}\n`);
  for (const id of IDENTITIES) {
    const user = await findAuthUser(id.email);
    if (!user) {
      console.log(`  · ${id.email} — not present, skipping`);
      continue;
    }
    // profiles.id -> auth.users(id) ON DELETE CASCADE, and listings/wanted_requests
    // -> profiles(id) ON DELETE CASCADE, so this removes everything they own.
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) fail(`deleteUser failed for ${id.email}: ${error.message}`);
    console.log(`  ✓ ${id.email} — deleted (${user.id})`);
  }

  const { data: orphans, error } = await admin
    .from('profiles')
    .select('id, email')
    .in('email', IDENTITIES.map((i) => i.email));
  if (!error && orphans?.length) {
    console.error(`\n  ! orphan profile rows survived the cascade — this is a P0 finding:`);
    for (const o of orphans) console.error(`    ${o.email} ${o.id}`);
  }

  console.log(
    `\n  Note: rows created by the ADMIN account are not touched here.\n` +
      `  Clean those up from qa-artifacts/created-rows.md.\n`
  );
}

async function status() {
  console.log(`\n  QA identity status on ${SUPABASE_URL}\n`);
  for (const id of IDENTITIES) {
    const user = await findAuthUser(id.email);
    if (!user) {
      console.log(`  · ${id.key.padEnd(7)} ${id.email.padEnd(38)} MISSING`);
      continue;
    }
    const { data: profile } = await admin
      .from('profiles')
      .select('is_profile_complete, is_banned')
      .eq('id', user.id)
      .single();
    console.log(
      `  · ${id.key.padEnd(7)} ${id.email.padEnd(38)} ${user.id}` +
        `  complete=${profile?.is_profile_complete ?? '?'} banned=${profile?.is_banned ?? '?'}`
    );
  }
  console.log('');
}

const mode = process.argv.includes('--teardown')
  ? teardown
  : process.argv.includes('--status')
    ? status
    : bootstrap;

mode().catch((e) => fail(e?.message ?? String(e)));
