import { test, expect } from '@playwright/test';

test('App shell renders placeholder', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('KGP Bazaar');
});
