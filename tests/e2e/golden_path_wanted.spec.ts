import { test, expect } from '@playwright/test';
import { signIn, studentA, studentB } from './_credentials';

test.describe('Golden Path 2: Wanted Request Posting & Response', () => {
  test('allows student to post wanted request and another student to respond via WhatsApp', async ({ browser }) => {
    // 0. Use separate contexts for Student A and Student B
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    
    await signIn(pageA, studentA());
    
    // 1. Visit Wanted Board
    await pageA.goto('/wanted');
    await pageA.click('button:has-text("Post a Request")');
    await pageA.waitForURL('**/new-request');

    // 2. Fill wanted request form (adding timestamp to ensure uniqueness)
    const uniqueTitle = `Casio FX-991EX Scientific Calculator - ${Date.now()}`;
    await pageA.fill('input[name="title"]', uniqueTitle);
    await pageA.selectOption('select[name="category"]', 'electronics');
    await pageA.fill('input[name="maxBudget"]', '900');
    await pageA.fill('textarea[name="description"]', 'Urgent requirement for MA20101 end-sem exam.');
    await pageA.click('button[type="submit"]');

    // Wait for redirect to wanted board and see our request
    await pageA.waitForURL('**/wanted');
    await expect(pageA.locator(`text=${uniqueTitle}`)).toBeVisible();
    await contextA.close();

    // 3. Sign in as Student B to view and respond
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await signIn(pageB, studentB());
    
    // 4. Verify request appears on wanted board
    await pageB.goto('/wanted');
    await expect(pageB.locator(`text=${uniqueTitle}`)).toBeVisible();
    await expect(pageB.locator('text=₹900').first()).toBeVisible();

    // 5. Click request card
    await pageB.click(`text=${uniqueTitle}`);
    
    // Wait for detail view
    await pageB.waitForURL('**/request/*');
    
    const respondBtn = pageB.locator('button:has-text("I Have This!")').first();
    await expect(respondBtn).toBeVisible();
    await contextB.close();
  });
});
