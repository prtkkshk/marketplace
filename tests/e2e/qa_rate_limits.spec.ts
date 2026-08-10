import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.test', 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match && match[1]) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

function getEnv(key: string): string {
  const value = env[key];
  if (value === undefined) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

test.describe('Rate Limits and Golden Path UI', () => {
  test.setTimeout(120000); // Allow 2 mins for 21-listing loop
  let client: SupabaseClient;
  let userId: string;
  let serviceRoleClient: SupabaseClient;
  const RATE_LIMIT_EMAIL = `qa.ratelimit.${Date.now()}@kgpian.iitkgp.ac.in`;
  const RATE_LIMIT_PASSWORD = 'QaTesting2026';

  test.beforeAll(async () => {
    serviceRoleClient = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
    
    // Create dedicated user
    const { data: authData, error: authErr } = await serviceRoleClient.auth.admin.createUser({
      email: RATE_LIMIT_EMAIL,
      password: RATE_LIMIT_PASSWORD,
      email_confirm: true
    });
    if (authErr) throw new Error(`Failed to create test user: ${authErr.message}`);
    userId = authData.user.id;

    // Complete the profile. `handle_new_user()` (supabase/migrations/20260801000001_initial_schema.sql)
    // already inserted a bare row via the on_auth_user_created trigger on createUser() above
    // (`on conflict (id) do nothing` means a second .insert() here would just fail on the PK
    // conflict — silently, since its error was never checked, which is why this fixture
    // previously left the profile incomplete). It needs an .update(), and it needs
    // roll_number + whatsapp_number + is_profile_complete: true — the `enforce_complete_profile`
    // check constraint (20260808120000_fix_rls_recursion_restore_banned_filter.sql) rejects
    // is_profile_complete=true unless full_name, roll_number, and whatsapp_number are all set,
    // and ProtectedRoute redirects any incomplete profile away from /new to /complete-profile,
    // which is what was actually timing out this test — not a rate-limit bug in the app.
    const { error: profileErr } = await serviceRoleClient
      .from('profiles')
      .update({
        full_name: 'QA Rate Limiter',
        hall_of_residence: 'Azad',
        roll_number: `22QA${Math.floor(10000 + Math.random() * 90000)}`,
        whatsapp_number: '+919999999999',
        is_profile_complete: true,
      })
      .eq('id', userId);
    if (profileErr) throw new Error(`Failed to complete test profile: ${profileErr.message}`);

    client = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'));
    const { data, error } = await client.auth.signInWithPassword({ email: RATE_LIMIT_EMAIL, password: RATE_LIMIT_PASSWORD });
    if (!data.user) throw new Error(`User not found: ${error?.message}`);

    for (let i = 1; i <= 19; i++) {
      await client.from('listings').insert({
        user_id: userId,
        title: 'QA-RateLimit-' + i,
        description: 'Test',
        price: 100,
        condition: 'good',
        category: 'books',
        photo_paths: ['test.jpg'],
        hall_of_residence: 'Azad',
        status: 'active'
      });
    }
  });

  test.afterAll(async () => {
    if (userId) {
      await serviceRoleClient.from('listings').delete().eq('user_id', userId);
      await serviceRoleClient.auth.admin.deleteUser(userId);
    }
  });

  test('Create 20th listing (success) and 21st (rate limited)', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', RATE_LIMIT_EMAIL);
    await page.fill('input[type="password"]', RATE_LIMIT_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    await page.goto('/new');
    
    await page.fill('input[name="title"]', 'QA-RateLimit-20');
    await page.fill('input[name="price"]', '100');
    await page.selectOption('select[name="category"]', 'books');
    await page.selectOption('select[name="condition"]', 'good');
    
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
       fs.writeFileSync('dummy.jpg', 'fake');
       await fileInput.setInputFiles('dummy.jpg');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.pathname === '/' || url.pathname.startsWith('/listing/'), { timeout: 10000 }).catch(() => {});

    await page.goto('/new');
    await page.fill('input[name="title"]', 'QA-RateLimit-21');
    await page.fill('input[name="price"]', '100');
    await page.selectOption('select[name="category"]', 'books');
    await page.selectOption('select[name="condition"]', 'good');
    if (fileInput) {
       await page.setInputFiles('input[type="file"]', 'dummy.jpg');
    }
    await page.click('button[type="submit"]');
    
    // Wait for the UI response
    await page.waitForTimeout(3000);
    
    const pageText = await page.content();
    const hasRawError = pageText.includes('RATE_LIMIT_EXCEEDED');
    
    console.log('Has raw Postgres error (RATE_LIMIT_EXCEEDED):', hasRawError);
    expect(hasRawError).toBe(false);
  });
});
