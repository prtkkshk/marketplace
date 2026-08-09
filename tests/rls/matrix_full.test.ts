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

let studentAClient: SupabaseClient;
let studentBClient: SupabaseClient;
let bannedClient: SupabaseClient;
let adminClient: SupabaseClient;
let serviceRoleClient: SupabaseClient;

let userIdA: string;
let userIdB: string;

let listingA: string;
let listingB: string;
let requestB: string;

beforeAll(async () => {
  const opts = { auth: { persistSession: false } };
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
  
  // The sign-in guards above already proved these are non-null.
  userIdA = auth_studentAClient.user.id;
    userIdB = auth_studentBClient.user.id;

  // Insert seed data via service role
  const ts = Date.now();
  const resListingA = await serviceRoleClient.from('listings').insert({ user_id: userIdA, title: `QA-${ts}-A`, description: 'Test', price: 100, category: 'books', condition: 'good', photo_paths: ['test.jpg'], hall_of_residence: 'Azad', status: 'active' }).select().single();
  listingA = resListingA.data.id;
  const resListingB = await serviceRoleClient.from('listings').insert({ user_id: userIdB, title: `QA-${ts}-B`, description: 'Test', price: 100, category: 'books', condition: 'good', photo_paths: ['test.jpg'], hall_of_residence: 'Patel', status: 'active' }).select().single();
  listingB = resListingB.data.id;

  const resReqA = await serviceRoleClient.from('wanted_requests').insert({ user_id: userIdA, title: `Req-${ts}-A`, description: 'Test', category: 'books', hall_of_residence: 'Azad', status: 'open', expires_at: new Date(Date.now() + 86400000).toISOString() }).select().single();
  if (resReqA.error) console.log("resReqA ERROR:", resReqA.error);
  const resReqB = await serviceRoleClient.from('wanted_requests').insert({ user_id: userIdB, title: `Req-${ts}-B`, description: 'Test', category: 'books', hall_of_residence: 'Patel', status: 'open', expires_at: new Date(Date.now() + 86400000).toISOString() }).select().single();
  requestB = resReqB.data.id;
});

describe('RLS Matrix (Task 1)', () => {
  describe('Student A modifying Student B data (EXPECT TO FAIL)', () => {
    it('Should not update Student B listing', async () => {
      const { data } = await studentAClient.from('listings').update({ title: 'Hacked' }).eq('id', listingB).select();
      expect(data?.length).toBe(0);
    });
    it('Should not delete Student B listing', async () => {
      const { data } = await studentAClient.from('listings').delete().eq('id', listingB).select();
      expect(data?.length).toBe(0);
    });
    it('Should not update Student B wanted request', async () => {
      const { data } = await studentAClient.from('wanted_requests').update({ title: 'Hacked' }).eq('id', requestB).select();
      expect(data?.length).toBe(0);
    });
    it('Should not delete Student B wanted request', async () => {
      const { data } = await studentAClient.from('wanted_requests').delete().eq('id', requestB).select();
      expect(data?.length).toBe(0);
    });
    it('Should not update Student B profile', async () => {
      const { data } = await studentAClient.from('profiles').update({ full_name: 'Hacked' }).eq('id', userIdB).select('id');
      expect(data?.length).toBe(0);
    });
  });

  describe('Banned user creating data (EXPECT TO FAIL)', () => {
    it('Should not create listing', async () => {
      const { error } = await bannedClient.from('listings').insert({ title: 'Banned Listing', price: 100, category: 'books', condition: 'good' });
      expect(error).not.toBeNull();
    });
    it('Should not create wanted request', async () => {
      const { error } = await bannedClient.from('wanted_requests').insert({ title: 'Banned Req', description: 'Test' });
      expect(error).not.toBeNull();
    });
    it('Should not create report', async () => {
      const { error } = await bannedClient.from('reports').insert({ listing_id: listingA, reason: 'spam' });
      expect(error).not.toBeNull();
    });
    it('Should not save an item', async () => {
      const { error } = await bannedClient.from('saved_items').insert({ listing_id: listingA });
      expect(error).not.toBeNull();
    });
  });

  describe('Student writing to restricted columns (EXPECT TO FAIL/IGNORE)', () => {
    it('Should not change user_id of their own listing', async () => {
      await studentAClient.from('listings').update({ user_id: userIdB }).eq('id', listingA);
      const { data } = await serviceRoleClient.from('listings').select('user_id').eq('id', listingA).single();
      expect(data?.user_id).toBe(userIdA); // Should remain A
    });
    it('Should not update view counts', async () => {
      await studentAClient.from('listings').update({ view_count: 9999 }).eq('id', listingA);
      const { data } = await serviceRoleClient.from('listings').select('view_count').eq('id', listingA).single();
      expect(data?.view_count).not.toBe(9999); 
    });
    it('Should not update profile is_admin or is_banned', async () => {
      await studentAClient.from('profiles').update({ is_admin: true, is_banned: true }).eq('id', userIdA);
      const { data } = await serviceRoleClient.from('profiles').select('is_admin, is_banned').eq('id', userIdA).single();
      expect(data?.is_admin).toBe(false);
      expect(data?.is_banned).toBe(false);
    });
  });

  describe('Non-admin accessing admin data (EXPECT TO FAIL)', () => {
    it('Should not read admin_audit_log', async () => {
      // RLS filters SELECT silently: denial is an empty set, not an error.
      const { data, error } = await studentAClient.from('admin_audit_log').select('*');
      expect(error !== null || data?.length === 0).toBe(true);
    });
    it('Should not read analytics views', async () => {
      const { error } = await studentAClient.from('analytics_daily_active_users').select('*');
      expect(error).not.toBeNull();
    });
    it('Should not call admin RPC ban_user', async () => {
      const { error } = await studentAClient.rpc('ban_user', { target_user_id: userIdB });
      expect(error).not.toBeNull();
    });
  });
});
