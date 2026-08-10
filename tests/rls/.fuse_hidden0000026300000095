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
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! };

let clientA: SupabaseClient;
let clientAdmin: SupabaseClient;

beforeAll(async () => {
  clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: auth_clientA, error: err_auth_clientA } = await clientA.auth.signInWithPassword(STUDENT_A);
  if (err_auth_clientA || !auth_clientA.user) throw new Error(`Sign-in failed for ${STUDENT_A.email}: ${err_auth_clientA?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);

  clientAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: auth_clientAdmin, error: err_auth_clientAdmin } = await clientAdmin.auth.signInWithPassword(ADMIN);
  if (err_auth_clientAdmin || !auth_clientAdmin.user) throw new Error(`Sign-in failed for ${ADMIN.email}: ${err_auth_clientAdmin?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
});

describe('SEC-06 regression tests', () => {
  it('SEC-06: student cannot read admin_audit_log', async () => {
    // Generate some admin audit logs first
    await clientAdmin.from('admin_audit_log').insert({
      actor_id: (await clientAdmin.auth.getUser()).data.user!.id,
      action: 'test_action',
      target_table: 'profiles'
    });

    // Attempt to read as student A
    const { error, data } = await clientA.from('admin_audit_log').select('*');
    
    // RLS policy on SELECT returns empty array if unauthorized
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.length).toBe(0);
  });
});
