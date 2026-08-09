import { test, expect } from '@playwright/test';

/**
 * Auth gate: an unauthenticated visitor must not reach the feed.
 *
 * This file previously asserted `h1` contained "Your campus" — placeholder copy from before
 * the v5 redesign, which no longer exists anywhere in the app. It failed on all five
 * browsers for months without indicating anything about the product.
 *
 * PRODUCT_SPEC §2 is explicit that browsing requires an account: it keeps the student
 * directory out of public reach and makes moderation possible. That is the behaviour worth
 * guarding, so the test now checks it rather than a string.
 */
test('unauthenticated visitors are redirected to sign in', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL((url) => url.pathname.startsWith('/auth'), { timeout: 15000 });
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
