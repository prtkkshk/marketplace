import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.test manually
const envPath = path.resolve(__dirname, '../../.env.test');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    if (key) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  }
});

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

// Credentials
const STUDENT_A = { email: process.env.E2E_STUDENT_A_EMAIL!, password: process.env.E2E_STUDENT_PASSWORD! };
const STUDENT_B = { email: process.env.E2E_STUDENT_B_EMAIL!, password: process.env.E2E_STUDENT_PASSWORD! };
const STUDENT_BANNED = { email: process.env.E2E_BANNED_EMAIL!, password: process.env.E2E_STUDENT_PASSWORD! };
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! };

// Clients
let anonClient: SupabaseClient;
let studentAClient: SupabaseClient;
let studentBClient: SupabaseClient;
let bannedClient: SupabaseClient;
let adminClient: SupabaseClient;
let serviceRoleClient: SupabaseClient; // For setup/teardown only

let listingAId: string;
let userIdA: string;

beforeAll(async () => {
  const opts = { auth: { persistSession: false } };
  anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  studentAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  studentBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  bannedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  serviceRoleClient = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, opts);

  // Sign in
  const { data: auth_studentAClient, error: err_auth_studentAClient } = await studentAClient.auth.signInWithPassword(STUDENT_A);
  if (err_auth_studentAClient || !auth_studentAClient.user) throw new Error(`Sign-in failed for ${STUDENT_A.email}: ${err_auth_studentAClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
  const { data: auth_studentBClient, error: err_auth_studentBClient } = await studentBClient.auth.signInWithPassword(STUDENT_B);
  if (err_auth_studentBClient || !auth_studentBClient.user) throw new Error(`Sign-in failed for ${STUDENT_B.email}: ${err_auth_studentBClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
  const { data: auth_bannedClient, error: err_auth_bannedClient } = await bannedClient.auth.signInWithPassword(STUDENT_BANNED);
  if (err_auth_bannedClient || !auth_bannedClient.user) throw new Error(`Sign-in failed for ${STUDENT_BANNED.email}: ${err_auth_bannedClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
  const { data: auth_adminClient, error: err_auth_adminClient } = await adminClient.auth.signInWithPassword(ADMIN);
  if (err_auth_adminClient || !auth_adminClient.user) throw new Error(`Sign-in failed for ${ADMIN.email}: ${err_auth_adminClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);

  userIdA = auth_studentAClient.user.id;

  // Use existing admin listings because of INSERT policy recursion bug
  const { data: listings } = await serviceRoleClient.from('listings').select('id').limit(1);
  if (listings && listings.length > 0 && listings[0]) {
    listingAId = listings[0].id;
  }
});

afterAll(async () => {
  // No teardown needed as we didn't insert
});

describe('Listings RLS Matrix', () => {
  describe('SELECT', () => {
    it('Anon should NOT see active listings (requires is_active_student = true)', async () => {
      const { data, error } = await anonClient.from('listings').select('*').eq('id', listingAId);
      // Anon is denied either by RLS (0 rows) or by column privileges on profiles.
      expect(error !== null || data?.length === 0).toBe(true);
    });

    it('Student A should see Admin listing', async () => {
      const { data, error } = await studentAClient.from('listings').select('*').eq('id', listingAId);
      expect(error).toBeNull();
      expect(data?.length).toBe(1);
    });

    it('Banned Student should NOT see Admin listing', async () => {
      const { data, error } = await bannedClient.from('listings').select('*').eq('id', listingAId);
      expect(error).toBeNull();
      expect(data?.length).toBe(0);
    });
  });

  describe('INSERT, UPDATE, DELETE', () => {
    it('Student A can insert their own listing', async () => {
      // Previously skipped for the 42P17 infinite-recursion bug in listings_insert.
      // Fixed 8 Aug 2026 by migration 20260808120000 — rate limiting moved to a
      // BEFORE INSERT trigger, so the policy no longer queries its own table.
      const { data, error } = await studentAClient
        .from('listings')
        .insert({
          user_id: userIdA,
          title: `QA-rls-${Date.now()}`,
          description: 'Insert path regression',
          price: 100,
          category: 'books',
          condition: 'good',
          photo_paths: ['test.jpg'],
          hall_of_residence: 'Azad',
          status: 'active',
        })
        .select('id')
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeTruthy();
      if (data?.id) await serviceRoleClient.from('listings').delete().eq('id', data.id);
    });
  });
});
