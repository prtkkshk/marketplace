import { test, expect } from '@playwright/test';
import { signIn, admin, createThrowawayStudent, deleteThrowawayStudent } from './_credentials';

test.describe('Golden Path 4: Admin User Ban Enforcement', () => {
  test('admin bans a user and banned user is redirected to banned screen', async ({ browser }) => {
    // 1. Create a throwaway user to ban
    const timestamp = Date.now();
    const throwawayEmail = `qa.ban.${timestamp}@kgpian.iitkgp.ac.in`;
    const throwawayUser = await createThrowawayStudent(throwawayEmail, true);
    
    try {
      // 2. Admin signs in and bans the user
      const contextAdmin = await browser.newContext();
      const pageAdmin = await contextAdmin.newPage();
      await signIn(pageAdmin, admin());
      
      await pageAdmin.goto('/admin/users');
      await expect(pageAdmin.locator('h1')).toContainText('User Management');

      // Search for our throwaway user
      await pageAdmin.fill('input[placeholder*="Search"]', throwawayEmail);

      // Verify the user is found and click Ban
      // The user row might contain their email or we just wait for table to filter
      const userRow = pageAdmin.locator(`tr:has-text("${throwawayEmail}")`);
      await expect(userRow).toBeVisible();
      
      const banBtn = userRow.locator('button:has-text("Ban")');
      await expect(banBtn).toBeVisible();
      
      await banBtn.click();
      await pageAdmin.fill('textarea', 'Repeated policy violations.');
      await pageAdmin.click('button:has-text("Confirm ban")');
      
      // Wait for success toast or badge update
      const badge = userRow.locator('span:has-text("Banned")');
      await expect(badge).toBeVisible();
      
      await contextAdmin.close();

      // 3. Try signing in as the banned user
      const contextBanned = await browser.newContext();
      const pageBanned = await contextBanned.newPage();
      
      // We can use signIn because it fills the form and waits for URL change,
      // but if banned, it will redirect to /banned
      await signIn(pageBanned, throwawayUser);
      
      // Wait for the banned screen
      await pageBanned.waitForURL('**/banned');
      await expect(pageBanned.locator('text=Account Suspended')).toBeVisible();
      
      await contextBanned.close();
    } finally {
      // 4. Cleanup
      await deleteThrowawayStudent(throwawayUser.id);
    }
  });
});
