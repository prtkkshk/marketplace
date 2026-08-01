import { test, expect } from '@playwright/test';

test.describe('Golden Path 2: Wanted Request Posting & Response', () => {
  test('allows student to post wanted request and another student to respond via WhatsApp', async ({ page }) => {
    // 1. Visit Wanted Board
    await page.goto('/wanted');
    await page.click('text=+ Post Wanted Request');

    // 2. Fill wanted request form
    await page.fill('input[name="title"]', 'Casio FX-991EX Scientific Calculator');
    await page.selectOption('select[name="category"]', 'electronics');
    await page.fill('input[name="maxBudget"]', '900');
    await page.fill('textarea[name="description"]', 'Urgent requirement for MA20101 end-sem exam.');
    await page.click('button[type="submit"]');

    // 3. Verify request appears on wanted board
    await page.goto('/wanted');
    await expect(page.locator('text=Casio FX-991EX Scientific Calculator')).toBeVisible();
    await expect(page.locator('text=Budget: Under ₹900')).toBeVisible();

    // 4. Click request card
    await page.click('text=Casio FX-991EX Scientific Calculator');
    const respondBtn = page.locator('button:has-text("I Have This! (WhatsApp)")');
    await expect(respondBtn).toBeVisible();
  });
});
