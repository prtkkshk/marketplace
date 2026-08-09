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
const BANNED = { email: process.env.E2E_BANNED_EMAIL!, password: process.env.E2E_STUDENT_PASSWORD! };
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! };

let anonClient: SupabaseClient;
let studentAClient: SupabaseClient;
let studentBClient: SupabaseClient;
let bannedClient: SupabaseClient;
let adminClient: SupabaseClient;
let serviceRoleClient: SupabaseClient;

let studentAListingId: string;
let studentBListingId: string;

beforeAll(async () => {
  const opts = { auth: { persistSession: false } };
  anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  studentAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  studentBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  bannedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  serviceRoleClient = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, opts);

  const { data: auth_studentAClient, error: err_auth_studentAClient } = await studentAClient.auth.signInWithPassword(STUDENT_A);

  if (err_auth_studentAClient || !auth_studentAClient.user) throw new Error(`Sign-in failed for ${STUDENT_A.email}: ${err_auth_studentAClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
  const { data: auth_studentBClient, error: err_auth_studentBClient } = await studentBClient.auth.signInWithPassword(STUDENT_B);
  if (err_auth_studentBClient || !auth_studentBClient.user) throw new Error(`Sign-in failed for ${STUDENT_B.email}: ${err_auth_studentBClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
  const { data: auth_bannedClient, error: err_auth_bannedClient } = await bannedClient.auth.signInWithPassword(BANNED);
  if (err_auth_bannedClient || !auth_bannedClient.user) throw new Error(`Sign-in failed for ${BANNED.email}: ${err_auth_bannedClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
  const { data: auth_adminClient, error: err_auth_adminClient } = await adminClient.auth.signInWithPassword(ADMIN);
  if (err_auth_adminClient || !auth_adminClient.user) throw new Error(`Sign-in failed for ${ADMIN.email}: ${err_auth_adminClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
  
  const userIdA = (await studentAClient.auth.getUser()).data.user?.id;
  const userIdB = (await studentBClient.auth.getUser()).data.user?.id;

  // Clean up previous QA rows
  await serviceRoleClient.from('listings').delete().like('title', 'QA-%');

  const ts = Date.now();
  const validListingA = {
    user_id: userIdA,
    title: `QA-${ts}-A`,
    description: 'Test',
    price: 100,
    condition: 'good',
    category: 'books',
    photo_paths: ['test.jpg'],
    hall_of_residence: 'Azad',
    status: 'active'
  };
  
  const validListingB = {
    user_id: userIdB,
    title: `QA-${ts}-B`,
    description: 'Test',
    price: 100,
    condition: 'good',
    category: 'books',
    photo_paths: ['test.jpg'],
    hall_of_residence: 'Patel',
    status: 'active'
  };

  const resA = await studentAClient.from('listings').insert(validListingA).select().single();
  if (resA.data) studentAListingId = resA.data.id;

  const resB = await studentBClient.from('listings').insert(validListingB).select().single();
  if (resB.data) studentBListingId = resB.data.id;
});

describe('Listings RLS Matrix', () => {
  describe('SELECT', () => {
    it('Anon should NOT see active listings (requires is_active_student)', async () => {
      const { data, error } = await anonClient.from('listings').select('*').eq('id', studentAListingId);
      // Anon is denied either by RLS (0 rows) or by column privileges on profiles,
      // which listings_select references. Both are correct denials.
      expect(error !== null || data?.length === 0).toBe(true);
    });
    
    it('Student A should see their own listing', async () => {
      const { data, error } = await studentAClient.from('listings').select('*').eq('id', studentAListingId);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('Student A should see Student B listing', async () => {
      const { data, error } = await studentAClient.from('listings').select('*').eq('id', studentBListingId);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
    
    it('Banned user should NOT see Student A listing', async () => {
      const { data, error } = await bannedClient.from('listings').select('*').eq('id', studentAListingId);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe('UPDATE', () => {
    it('Student A should NOT be able to update Student B listing', async () => {
      const { error, data } = await studentAClient.from('listings').update({ price: 200 }).eq('id', studentBListingId).select();
      expect(error).toBeNull();
      // Actually update returns no error if 0 rows matched due to RLS, data will be empty array
      expect(data).toHaveLength(0);
      
      const { data: check } = await serviceRoleClient.from('listings').select('price').eq('id', studentBListingId).single();
      expect(check?.price).not.toBe(200); // Should not have changed
    });

    it('Admin should be able to update Student A listing', async () => {
      const { error } = await adminClient.from('listings').update({ price: 200 }).eq('id', studentAListingId);
      expect(error).toBeNull();
      const { data: check } = await serviceRoleClient.from('listings').select('price').eq('id', studentAListingId).single();
      expect(check?.price).toBe(200); // Should have changed
    });
  });
});
