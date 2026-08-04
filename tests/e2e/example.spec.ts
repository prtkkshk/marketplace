import { test, expect } from '@playwright/test';

test('App shell redirects to sign in placeholder', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Your campus');
});
