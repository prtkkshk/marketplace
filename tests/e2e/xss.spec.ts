import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('XSS and Injection tests', () => {
  let throwawayListingId: string;
  let throwawayUserId: string;
  let throwawayEmail: string;

  test.beforeAll(async () => {
    // 1. Setup admin client
    const adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 2. Create throwaway user
    const timestamp = Date.now();
    throwawayEmail = `qa.xss.${timestamp}@kgpian.iitkgp.ac.in`;
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email: throwawayEmail,
      password: process.env.E2E_STUDENT_PASSWORD!,
      email_confirm: true
    });
    if (userError) throw userError;
    throwawayUserId = userData.user.id;
    
    // 3. Complete profile with XSS payload
    const xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
    await adminClient.from('profiles').update({
      full_name: xssPayload,
      roll_number: '22CS10099',
      hall_of_residence: 'RK',
      whatsapp_number: '+919999900099',
      is_profile_complete: true
    }).eq('id', throwawayUserId);
    
    // 4. Create listing with XSS payload
    const { data: listingData, error: listingError } = await adminClient.from('listings').insert({
      user_id: throwawayUserId,
      title: xssPayload,
      description: xssPayload,
      price: 10,
      category: 'other',
      condition: 'good',
      status: 'active',
      photo_paths: [],
      hall_of_residence: 'RK'
    }).select().single();
    if (listingError) throw listingError;
    throwawayListingId = listingData.id;
  });

  test.afterAll(async () => {
    if (throwawayUserId) {
      const adminClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await adminClient.auth.admin.deleteUser(throwawayUserId);
    }
  });

  test('React escaping - literal text rendering', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'alert' || dialog.type() === 'prompt') {
        alertFired = true;
      }
      await dialog.dismiss();
    });

    const xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';

    // Actually, let's just login
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', throwawayEmail);
    await page.fill('input[type="password"]', process.env.E2E_STUDENT_PASSWORD!);
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/');
    
    // Check if the feed renders the payload literally
    await expect(page.locator('article, div').filter({ hasText: 'xss' }).first()).toBeVisible();
    
    // Verify no alerts fired
    expect(alertFired).toBe(false);

    // Visit listing detail page
    await page.goto(`/listing/${throwawayListingId}`);
    
    // Verify the payload is rendered literally as text (not executed as script).
    // The detail page has separate mobile / desktop h1 elements — only one is
    // visible at any viewport — so we assert on body text instead.
    await expect(page.locator('body')).toContainText(xssPayload);
    // Seller name also contains the XSS payload rendered as text
    await expect(page.locator('body')).toContainText('xss');
    
    // Verify no alerts fired
    expect(alertFired).toBe(false);
  });
});

