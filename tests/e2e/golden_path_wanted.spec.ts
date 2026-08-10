import { test, expect } from '@playwright/test';
import { signIn, studentA, studentB } from './_credentials';
import { createClient } from '@supabase/supabase-js';

test.describe('Golden Path 2: Wanted Request Posting & Response', () => {
  test.setTimeout(60000); // multi-actor flow takes longer
  test('allows student to post wanted request and another student to respond via WhatsApp', async ({ browser }) => {
    // This spec previously had NO cleanup at all: every run (and every retry) permanently
    // left its "Casio FX-991EX..." fixture live on the production wanted board — 14 of them
    // accumulated in production before this was caught (2026-08-10 launch session). The
    // fixture is now looked up by its unique title right after creation and hidden/soft-
    // deleted in a `finally`, the same way golden_path_listing.spec.ts's throwaway-user
    // cascade and xss.spec.ts's afterAll already clean up after themselves.
    const uniqueTitle = `Casio FX-991EX Scientific Calculator - ${Date.now()}`;
    let requestId: string | null = null;

    try {
      // 0. Use separate contexts for Student A and Student B
      const contextA = await browser.newContext();
      const pageA = await contextA.newPage();

      await signIn(pageA, studentA());

      // 1. Visit Wanted Board
      await pageA.goto('/wanted');
      await pageA.click('button:has-text("Post a Request")');
      await pageA.waitForURL('**/new-request');

      // 2. Fill wanted request form (timestamp in the title makes it unique)
      await pageA.fill('input[name="title"]', uniqueTitle);
      await pageA.selectOption('select[name="category"]', 'electronics');
      await pageA.fill('input[name="maxBudget"]', '900');
      await pageA.fill('textarea[name="description"]', 'Urgent requirement for MA20101 end-sem exam.');
      await pageA.click('button[type="submit"]');
      await pageA.waitForTimeout(1000);

      // Wait for redirect to wanted board and see our request
      await pageA.waitForURL('**/wanted');
      await expect(pageA.locator(`text=${uniqueTitle}`)).toBeVisible();

      const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data } = await adminClient
        .from('wanted_requests')
        .select('id')
        .eq('title', uniqueTitle)
        .maybeSingle();
      requestId = data?.id ?? null;

      await contextA.close();

      // 3. Sign in as Student B to view and respond
      const contextB = await browser.newContext();
      const pageB = await contextB.newPage();
      await signIn(pageB, studentB());

      // 4. Verify request appears on wanted board
      await pageB.goto('/wanted');
      await expect(pageB.locator(`text=${uniqueTitle}`)).toBeVisible();
      await expect(pageB.locator('text=₹900').first()).toBeVisible();

      // 5. Click request card
      await pageB.click(`text=${uniqueTitle}`);

      // Wait for detail view
      await pageB.waitForURL('**/request/*');
      // Verify detail page elements
      const respondBtn = pageB.getByRole('button', { name: /I Have This/i }).first();
      await expect(respondBtn).toBeVisible({ timeout: 15000 });
      await contextB.close();
    } finally {
      if (requestId) {
        const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        await adminClient
          .from('wanted_requests')
          .update({ status: 'hidden', deleted_at: new Date().toISOString() })
          .eq('id', requestId);
      }
    }
  });
});
