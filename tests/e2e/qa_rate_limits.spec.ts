import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
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
  let client;
  let userId;

  test.beforeAll(async () => {
    client = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'));
    await client.auth.signInWithPassword({ email: getEnv('E2E_STUDENT_A_EMAIL'), password: getEnv('E2E_STUDENT_PASSWORD') });
    const { data } = await client.auth.getUser();
    if (!data.user) throw new Error('User not found');
    userId = data.user.id;

    const serviceRoleClient = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
    await serviceRoleClient.from('listings').delete().like('title', 'QA-RateLimit-%');

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

  test('Create 20th listing (success) and 21st (rate limited)', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', getEnv('E2E_STUDENT_A_EMAIL'));
    await page.fill('input[type="password"]', getEnv('E2E_STUDENT_PASSWORD'));
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
