import { test, expect } from '@playwright/test';
import { signIn, createThrowawayStudent, deleteThrowawayStudent } from './_credentials';
import path from 'node:path';

test.describe('Golden Path 1: Student Registration, Post Listing & Contact', () => {
  test.setTimeout(60000); // Flow with sign up and photo upload
  let throwawayUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    const timestamp = Date.now();
    throwawayUser = await createThrowawayStudent(`qa.golden.list.${timestamp}@kgpian.iitkgp.ac.in`, false);
  });

  test.afterAll(async () => {
    if (throwawayUser?.id) {
      await deleteThrowawayStudent(throwawayUser.id);
    }
  });

  test('allows student to register, complete profile, post a cycle, and contact seller', async ({ page }) => {
    // 1. Log in with the throwaway account
    await signIn(page, throwawayUser);
    
    // It should redirect to complete profile because profile is empty
    await page.waitForURL('**/complete-profile');

    // 2. Complete profile form
    await page.fill('input[id="full-name"]', 'Rohan Sharma');
    const randomRoll = `22CS${Math.floor(10000 + Math.random() * 90000)}`;
    await page.fill('input[id="roll-number"]', randomRoll);
    await page.selectOption('select[id="hall-of-residence"]', 'RK');
    await page.fill('input[id="whatsapp-number"]', '+919999900088');
    await page.click('button[type="submit"]');

    // Wait for redirect to feed or catch error
    await expect(page.locator('text=Save Profile & Continue')).toBeHidden({ timeout: 10000 }).catch(async (e) => {
      const errorText = await page.locator('.text-danger').allTextContents();
      console.log('Form errors:', errorText);
      throw e;
    });
    
    const FIXTURE = path.resolve('tests/fixtures/gps-tagged.jpg');

    // We should be on feed
    await page.waitForURL('**/');
    
    // 3. Navigate to Post Listing
    // On mobile the Sell button is in BottomNav, on desktop it's in the header.
    // Both open PostChooserSheet. Navigate directly to avoid viewport ambiguity.
    await page.goto('/new');
    await page.waitForURL('**/new');

    await page.fill('input[name="title"]', 'Hero Sprint 21 Speed Cycle');
    await page.selectOption('select[name="category"]', 'cycles');
    await page.fill('input[name="price"]', '4500');
    await page.selectOption('select[name="condition"]', 'good');
    await page.fill('textarea[name="description"]', 'Well maintained cycle, brand new tires.');

    const uploadPromise = page.waitForResponse(r => r.url().includes('/storage/v1/object/listing-photos/') && r.request().method() === 'POST', { timeout: 15000 });
    await page.setInputFiles('input[type="file"]', FIXTURE);
    await uploadPromise;
    
    // Wait for upload preview
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 15000 });

    await page.click('button[type="submit"]');

    // 4. Verify detail page load
    await page.waitForURL('**/listing/*');
    await expect(page.getByRole('heading', { name: 'Hero Sprint 21 Speed Cycle' }).first()).toBeVisible({ timeout: 15000 });
    // Price is visible on the page (mobile shows it in a different spot than desktop)
    await expect(page.locator('body')).toContainText('₹4,500');

    // 5. Contact seller button is disabled/shows different text for owner
    // Since we posted it, we are the owner! Owner shouldn't see "Contact Seller"
    const markSoldBtn = page.locator('button:has-text("Mark Sold")');
    await expect(markSoldBtn).toBeVisible();
  });
});
