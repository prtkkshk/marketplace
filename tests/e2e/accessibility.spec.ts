import { test, expect } from '@playwright/test';
import { signIn, studentA } from './_credentials';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase C: Accessibility Validation', () => {
  test('home page passes axe checks', async ({ page }) => {
    await signIn(page, studentA());
    await page.goto('/');
    
    // Wait for the feed to load
    await expect(page.locator('h1:has-text("KGP Bazaar")')).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('.ignore-axe') // Exclude specific components if known and documented
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('new listing form passes axe checks', async ({ page }) => {
    await signIn(page, studentA());
    await page.goto('/new');
    
    // Wait for the form to load
    await expect(page.locator('h1:has-text("Post a Listing")')).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('profile page passes axe checks', async ({ page }) => {
    await signIn(page, studentA());
    await page.goto('/profile');
    
    // Wait for profile to load
    await expect(page.locator('h1')).toContainText('Student A');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
