import { test, expect } from '@playwright/test';

test.describe('Authentication & Profile Flows', () => {
  test('navigates from sign in to sign up screens', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.locator('h2')).toContainText('Sign In');

    await page.click('a:has-text("Sign Up")');
    await expect(page.url()).toContain('/auth/signup');

    await page.click('a:has-text("Sign In")');
    await expect(page.url()).toContain('/auth/signin');
  });
});
