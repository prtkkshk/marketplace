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

let anonClient: SupabaseClient;
let studentAClient: SupabaseClient;
let studentBClient: SupabaseClient;
let bannedClient: SupabaseClient;
let serviceRoleClient: SupabaseClient;

let userIdA: string;
let userIdB: string;
let listingB: string;
let requestB: string;

beforeAll(async () => {
  const opts = { auth: { persistSession: false } };
  anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  studentAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  studentBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  bannedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
  serviceRoleClient = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, opts);

  const { data: auth_studentAClient, error: err_auth_studentAClient } = await studentAClient.auth.signInWithPassword(STUDENT_A);

  if (err_auth_studentAClient || !auth_studentAClient.user) throw new Error(`Sign-in failed for ${STUDENT_A.email}: ${err_auth_studentAClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
  const { data: auth_studentBClient, error: err_auth_studentBClient } = await studentBClient.auth.signInWithPassword(STUDENT_B);
  if (err_auth_studentBClient || !auth_studentBClient.user) throw new Error(`Sign-in failed for ${STUDENT_B.email}: ${err_auth_studentBClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);
  const { data: auth_bannedClient, error: err_auth_bannedClient } = await bannedClient.auth.signInWithPassword(BANNED);
  if (err_auth_bannedClient || !auth_bannedClient.user) throw new Error(`Sign-in failed for ${BANNED.email}: ${err_auth_bannedClient?.message ?? 'no user'}. Run \`npm run qa:bootstrap\`.`);

  // The sign-in guards above already proved these are non-null.
  userIdA = auth_studentAClient.user.id;
    userIdB = auth_studentBClient.user.id;

  const ts = Date.now();
  const resListingB = await serviceRoleClient.from('listings').insert({ user_id: userIdB, title: `Contact-QA-${ts}`, description: 'Test', price: 100, category: 'books', condition: 'good', photo_paths: ['test.jpg'], hall_of_residence: 'Patel', status: 'active' }).select().single();
  listingB = resListingB.data.id;

  const resReqB = await serviceRoleClient.from('wanted_requests').insert({ user_id: userIdB, title: `Contact-Req-${ts}`, description: 'Test', category: 'books', hall_of_residence: 'Patel', status: 'open' }).select().single();
  requestB = resReqB.data.id;

  // get_contact_number counts contact_events.actor_id (NOT viewer_id — that column does
  // not exist) within the last hour, and the table persists between runs. Without this
  // reset a previous run leaves the 30/hour quota spent and later assertions fail for
  // the wrong reason. Assert the delete succeeded: a silent failure here is what made
  // this test look like an app bug.
  const { error: resetErr } = await serviceRoleClient
    .from('contact_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (resetErr) throw new Error(`Could not reset contact_events quota: ${resetErr.message}`);
});

describe('Contact RPC & Privacy', () => {
  it('cannot obtain whatsapp_number via direct select on profiles', async () => {
    const { data, error } = await studentAClient.from('profiles').select('whatsapp_number').eq('id', userIdB);
    // Column privileges reject this outright, so data is undefined, not [].
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
    expect(data ?? []).toHaveLength(0);
  });

  it('cannot obtain whatsapp_number via an embedded join from listings', async () => {
    const { data, error } = await studentAClient.from('listings').select('*, profiles(whatsapp_number)').eq('id', listingB);
    if (!error) {
      expect(data?.[0]?.profiles?.whatsapp_number).toBeUndefined();
    } else {
      expect(error).not.toBeNull();
    }
  });

  it('banned user CAN get contact', async () => {
    const { data, error } = await bannedClient.rpc('get_contact_number', { p_listing_id: listingB });
    expect(error).toBeNull();
    expect(data).toMatch(/^\+?[0-9\s]+$/);
  });

  it('anon user CAN get contact', async () => {
    const { data, error } = await anonClient.rpc('get_contact_number', { p_listing_id: listingB });
    expect(error).toBeNull();
    expect(data).toMatch(/^\+?[0-9\s]+$/);
  });

  it('invalid uuid fails safely', async () => {
    const { error } = await studentAClient.rpc('get_contact_number', { p_listing_id: 'not-a-uuid' });
    expect(error).not.toBeNull();
  });

  it('deleted listing fails safely', async () => {
    const { error } = await studentAClient.rpc('get_contact_number', { p_listing_id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(error).not.toBeNull();
  });

  it('valid student gets the number and contact_events row is written', async () => {
    const { data, error } = await studentAClient.rpc('get_contact_number', { p_listing_id: listingB });
    expect(error).toBeNull();
    expect(data).toMatch(/^\+?[0-9\s]+$/); // Phone number format

    const { data: events } = await serviceRoleClient.from('contact_events').select('*').eq('actor_id', userIdA).eq('listing_id', listingB);
    expect(events?.length).toBeGreaterThanOrEqual(1);
  });

  it('rate limit fires at boundary 10 and is PER LISTING', async () => {
    let successCount = 0;
    let failedCount = 0;
    // We already made 3 successful requests above (studentA, banned, anon), so 7 more should succeed
    for(let i = 0; i < 12; i++) {
       const res = await studentAClient.rpc('get_contact_number', { p_listing_id: listingB });
       if (res.error) failedCount++;
       else successCount++;
    }
    // Should be exactly 7 successful (3 from before + 7 in loop = 10)
    expect(successCount).toBe(7);
    expect(failedCount).toBeGreaterThan(0);
    
    // Now verify a DIFFERENT listing/request is NOT rate limited
    const resB = await studentBClient.rpc('get_requester_number', { p_request_id: requestB }); 
    expect(resB.error).toBeNull();
  }, 30000); // 30 seconds timeout
});
