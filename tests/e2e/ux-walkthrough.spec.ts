import { test, expect } from '@playwright/test';
import { signIn, studentA } from './_credentials';

test.describe('Live UX Walkthrough', () => {
  test('Primary Flow - Browse, Search, View, Edit Profile', async ({ page, isMobile }) => {
    // 1. Visit Home
    await signIn(page, studentA());
    await page.goto('/');

    // 2. Search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('cycle');
    await page.keyboard.press('Enter');
    
    // Wait for the URL to update with search params
    await page.waitForURL(/q=cycle/);

    // 3. Open filters based on viewport
    if (isMobile) {
      // Mobile has a "Filters" button that opens a drawer
      const filterBtn = page.getByRole('button', { name: /Filters/i });
      await filterBtn.click();
      
      // The mobile filter sheet uses a native <select> for condition.
      // Must use selectOption() — clicking <option> elements doesn't work.
      await page.getByRole('dialog').locator('#item-condition').selectOption('good');
      
      // Apply filters
      await page.getByRole('dialog').getByRole('button', { name: /Apply/i }).click();
    } else {
      // Desktop has a sidebar (<aside>) always visible
      const conditionRadio = page.locator('aside').getByText('Good', { exact: true });
      await conditionRadio.click();
    }
    
    await page.waitForURL(/cond=good/);

    // 4. Open a category
    // In v5, categories are a horizontal scrollable list or sidebar
    const electronicsCat = page.locator('a, button').filter({ hasText: /^Electronics/i }).first();
    await electronicsCat.click();
    await page.waitForURL(/cat=electronics/);

    // 5. Go to wanted board
    await page.goto('/wanted');
    await expect(page.locator('h1')).toContainText('Wanted Board');

    // 6. Go to profile
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText('QA Student A');
  });
});
