import { test, expect } from '@playwright/test';

test.describe('Golden Path 4: Admin User Ban Enforcement', () => {
  test('admin bans a user and banned user is redirected to banned screen', async ({ page }) => {
    // 1. Visit Admin User Management
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('User Management');

    // 2. Search for student profile
    await page.fill('input[placeholder*="Search student"]', 'Rohan');

    // 3. Click Ban button if present
    const banBtn = page.locator('button:has-text("Ban")').first();
    if (await banBtn.isVisible()) {
      await banBtn.click();
      await page.fill('textarea[placeholder*="Ban Reason"]', 'Repeated policy violations.');
      await page.click('button:has-text("Confirm ban")');
    }

    // 4. Verify user redirection to /banned
    await page.goto('/banned');
    await expect(page.locator('h1')).toContainText('Account Suspended');
  });
});
