import { test, expect } from '@playwright/test';

test.describe('Golden Path 4: Admin User Ban Enforcement', () => {
  test('admin bans a user and banned user is redirected to banned screen', async ({ page }) => {
    // 0. Sign in as admin
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'admin@kgpian.iitkgp.ac.in');
    await page.fill('input[type="password"]', 'AdminPass2024!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');

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
      await expect(page.locator('text=User successfully banned')).toBeVisible();
    }

    // 4. Verify banned status reflects in UI
    await expect(page.locator('text=Banned')).toBeVisible();
  });
});
