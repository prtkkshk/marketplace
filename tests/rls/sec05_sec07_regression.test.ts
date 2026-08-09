import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env.test');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match && match[1]) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
});

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const STUDENT_A = { email: process.env.E2E_STUDENT_A_EMAIL!, password: process.env.E2E_STUDENT_PASSWORD! };
const STUDENT_B = { email: process.env.E2E_STUDENT_B_EMAIL!, password: process.env.E2E_STUDENT_PASSWORD! };
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! };

let clientA: SupabaseClient;
let clientB: SupabaseClient;
let clientAdmin: SupabaseClient;
let userIdA: string;
let userIdB: string;

beforeAll(async () => {
  clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: authA, error: err_authA } = await clientA.auth.signInWithPassword(STUDENT_A);
  if (err_authA || !authA.user) {
    throw new Error(
      `Sign-in failed for ${STUDENT_A.email}: ${err_authA?.message ?? 'no user returned'}. `
      + 'QA identities are missing — run `npm run qa:bootstrap` before this suite. '
      + 'Without this check the suite silently skips every assertion.'
    );
  }
  userIdA = authA.user!.id;

  clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: authB, error: err_authB } = await clientB.auth.signInWithPassword(STUDENT_B);
  if (err_authB || !authB.user) {
    throw new Error(
      `Sign-in failed for ${STUDENT_B.email}: ${err_authB?.message ?? 'no user returned'}. `
      + 'QA identities are missing — run `npm run qa:bootstrap` before this suite. '
      + 'Without this check the suite silently skips every assertion.'
    );
  }
  userIdB = authB.user!.id;

  clientAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: auth_clientAdmin, error: err_auth_clientAdmin } = await clientAdmin.auth.signInWithPassword(ADMIN);
  if (err_auth_clientAdmin || !auth_clientAdmin.user) throw new Error(`Sign-in failed for ${ADMIN.email}: ${err_auth_clientAdmin?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
});

describe('SEC-05 regression tests', () => {
  it('SEC-05: student cannot read another user\'s whatsapp_number', async () => {
    const { error } = await clientA.from('profiles').select('whatsapp_number');
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501'); // permission denied
  });

  it('SEC-05: student cannot read another user\'s roll_number', async () => {
    const { error } = await clientA.from('profiles').select('roll_number');
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('SEC-05: student cannot read another user\'s email', async () => {
    const { error } = await clientA.from('profiles').select('email');
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('SEC-05: student cannot read another user\'s banned_reason', async () => {
    const { error } = await clientA.from('profiles').select('banned_reason');
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('SEC-05: student cannot select * from profiles (expands to revoked columns)', async () => {
    const { error } = await clientA.from('profiles').select('*');
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('SEC-05: student can select id, full_name, hall_of_residence from profiles', async () => {
    const { error, data } = await clientA.from('profiles').select('id, full_name, hall_of_residence').limit(1);
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('SEC-05: get_my_profile() returns own row with contact info', async () => {
    const { error, data } = await clientA.rpc('get_my_profile').single();
    expect(error).toBeNull();
    expect((data as { id: string }).id).toBe(userIdA);
    expect(data as object).toHaveProperty('whatsapp_number');
  });

  it('SEC-05: get_my_profile() called as student B returns B\'s row, not A\'s', async () => {
    const { error, data } = await clientB.rpc('get_my_profile').single();
    expect(error).toBeNull();
    expect((data as { id: string }).id).toBe(userIdB);
  });

  it('SEC-05: get_admin_user_list() fails for non-admin', async () => {
    const { error } = await clientA.rpc('get_admin_user_list', { p_search: null, p_limit: 10, p_offset: 0 });
    expect(error).not.toBeNull();
  });
});

describe('SEC-07 regression tests', () => {
  it('SEC-07: cannot update own listings.is_pinned to true', async () => {
    const { error } = await clientA.from('listings').update({ is_pinned: true }).eq('user_id', userIdA);
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('SEC-07: cannot update own listings.view_count', async () => {
    const { error } = await clientA.from('listings').update({ view_count: 999999 }).eq('user_id', userIdA);
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('SEC-07: cannot update own listings.user_id to another user', async () => {
    const { error } = await clientA.from('listings').update({ user_id: userIdB }).eq('user_id', userIdA);
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('SEC-07: cannot update own wanted_requests.is_pinned', async () => {
    const { error } = await clientA.from('wanted_requests').update({ is_pinned: true }).eq('user_id', userIdA);
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('SEC-07: cannot update own profiles.is_admin', async () => {
    const { error } = await clientA.from('profiles').update({ is_admin: true }).eq('id', userIdA);
    expect(error).not.toBeNull();
    // P0001 = protect_privileged_columns trigger; 42501 = column privilege.
    // The trigger is the correct guard here: it is row-aware, so admins can still ban
    // while students cannot self-promote. A column REVOKE cannot express that.
    expect(['P0001', '42501']).toContain(error?.code);
  });
});
