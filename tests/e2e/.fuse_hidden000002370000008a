import { test, expect } from '@playwright/test';

test.describe('Authentication & Profile Flows', () => {
  test('rejects non-KGP email addresses at signup', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.fill('input[type="email"]', 'user@gmail.com');
    await page.fill('input[name="password"]', 'Password123');
    await page.fill('input[name="confirmPassword"]', 'Password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Only @kgpian.iitkgp.ac.in email addresses are allowed')).toBeVisible();
  });

  test('navigates from sign in to sign up and forgot password screens', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.locator('h2')).toContainText('Sign In');

    await page.click('a:has-text("Sign Up")');
    await expect(page.url()).toContain('/auth/signup');

    await page.click('a:has-text("Sign In")');
    await expect(page.url()).toContain('/auth/signin');

    await page.click('text=Forgot Password?');
    await expect(page.url()).toContain('/auth/forgot-password');
  });
});
