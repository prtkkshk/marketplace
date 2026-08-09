import { test, expect } from '@playwright/test';
import { signIn, studentA, studentB, admin } from './_credentials';
import path from 'node:path';

test.describe('Golden Path 3: Reporting, Moderation Queue & Audit Log', () => {
  test('reports a listing, admin sees it, deletes it, and verifies audit log entry', async ({ browser }) => {
    const timestamp = Date.now();
    const uniqueTitle = `Violating Item ${timestamp}`;

    // 1. Student A posts a listing
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await signIn(pageA, studentA());

    const FIXTURE = path.resolve('tests/fixtures/gps-tagged.jpg');

    await pageA.goto('/');
    
    // Navigate to create listing directly (avoids viewport-dependent Sell button visibility)
    await pageA.goto('/new');
    await pageA.waitForURL('**/new');
    
    await pageA.fill('input[name="title"]', uniqueTitle);
    await pageA.selectOption('select[name="category"]', 'electronics');
    await pageA.fill('input[name="price"]', '100');
    await pageA.selectOption('select[name="condition"]', 'fair');
    await pageA.fill('textarea[name="description"]', 'This is a test listing that will be reported.');
    
    // Upload real photo
    await pageA.setInputFiles('input[type="file"]', FIXTURE);
    await expect(pageA.locator('img[alt="Preview"]')).toBeVisible({ timeout: 15000 });
    await expect(pageA.locator('.animate-spin').first()).toBeHidden({ timeout: 15000 });

    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('**/listing/*');
    await contextA.close();

    // 2. Student B logs in and reports it
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await signIn(pageB, studentB());
    await pageB.goto('/');
    // Dismiss PWA install dialog if present
    const pwaClose = pageB.locator('button:has-text("Close"), button[aria-label="Close sheet"]').first();
    if (await pwaClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pwaClose.click();
    }
    
    // Find our specific listing
    await pageB.getByLabel(`View details for ${uniqueTitle}`).first().click();
    await pageB.waitForURL('**/listing/*');
    
    // Click report
    await pageB.click('text=Report this listing');

    // Select reason and submit report
    await pageB.selectOption('select', 'prohibited');
    await pageB.fill('textarea', `Item violates campus policy. ${timestamp}`);
    await pageB.click('button:has-text("Submit Report")');
    await pageB.waitForSelector('text=Report submitted');
    await contextB.close();

    // 3. Admin logs in and handles the report
    const contextAdmin = await browser.newContext();
    const pageAdmin = await contextAdmin.newPage();
    await signIn(pageAdmin, admin());
    
    await pageAdmin.goto('/admin/reports');
    await expect(pageAdmin.locator('text=Moderation Queue')).toBeVisible();

    // 4. Perform delete action
    // Verify the report is in the pending list
    const reportRow = pageAdmin.locator('.shadow-card').filter({ hasText: `Item violates campus policy. ${timestamp}` }).first();
    await expect(reportRow).toBeVisible();
    const deleteBtn = reportRow.locator('button:has-text("Delete")');
    
    await deleteBtn.click();
    await pageAdmin.fill('textarea', 'Violation confirmed during moderation review.');
    await pageAdmin.click('button:has-text("Confirm delete")');
    
    // Wait for the report to be gone or marked deleted
    // Since delete might just change the row or we can just proceed to audit log
    await pageAdmin.waitForTimeout(1000); // Wait briefly for mutation

    // 5. Verify audit log entry exists
    await pageAdmin.goto('/admin/audit');
    await expect(pageAdmin.locator('text=Admin Audit Log')).toBeVisible();
    await expect(pageAdmin.locator('table')).toContainText('report_delete');
    await expect(pageAdmin.locator('table')).toContainText('Violation confirmed during moderation review.');
    await contextAdmin.close();
  });
});
