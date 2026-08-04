import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Live UX Walkthrough', () => {
  test('Primary Flow - Browse, Search, View, Edit Profile', async ({ page, browserName }) => {
    // 1. Visit Home (unauth -> redirects to signin)
    await page.goto('/');
    
    // 2. Sign In
    await page.fill('input[type="email"]', 'pepperjet@kgpian.iitkgp.ac.in');
    await page.fill('input[type="password"]', 'pepperjet@14627912');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });

    // 3. Search and filter
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('cycle');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000); // See results
    }

    // 4. Open filters
    const filterBtn = await page.getByRole('button', { name: /Filters/i });
    if (filterBtn) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
      
      const conditionRadio = await page.getByText('Good', { exact: true });
      if (conditionRadio) await conditionRadio.click();
      
      const applyBtn = await page.getByRole('button', { name: /Apply/i });
      if (applyBtn) await applyBtn.click();
      await page.waitForTimeout(2000);
    }

    // 5. Open a category
    const electronicsCat = await page.getByText('Electronics', { exact: true });
    if (electronicsCat) {
      await electronicsCat.click();
      await page.waitForTimeout(2000);
    }

    // 6. Go to wanted board
    await page.goto('/wanted');
    await page.waitForTimeout(2000);

    // 7. Go to profile
    await page.goto('/profile');
    await page.waitForTimeout(2000);

    // 8. Go to create listing
    await page.goto('/new');
    await page.waitForTimeout(2000);

    // Make sure artifact dir exists
    if (!fs.existsSync('audit-artifacts')) {
      fs.mkdirSync('audit-artifacts');
    }
  });
});
