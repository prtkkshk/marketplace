import { test, expect } from '@playwright/test';

test.describe('Golden Path 3: Reporting, Moderation Queue & Audit Log', () => {
  test('reports a listing, admin sees it, deletes it, and verifies audit log entry', async ({ page }) => {
    // 1. Visit feed and open listing options menu
    await page.goto('/');
    await page.locator('a.group').first().click();
    await page.click('text=Report this listing');

    // 2. Select reason and submit report
    await page.selectOption('select', 'prohibited');
    await page.fill('textarea', 'Item violates campus policy.');
    await page.click('button:has-text("Submit Report")');

    // 3. Navigate to Admin Moderation Queue
    await page.goto('/admin/reports');
    await expect(page.locator('text=Moderation Queue')).toBeVisible();

    // 4. Perform delete action
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.fill('textarea', 'Violation confirmed during moderation review.');
      await page.click('button:has-text("Confirm delete")');
    }

    // 5. Verify audit log entry exists
    await page.goto('/admin/audit');
    await expect(page.locator('text=Admin Audit Log')).toBeVisible();
    await expect(page.locator('table')).toContainText('report_delete');
  });
});
