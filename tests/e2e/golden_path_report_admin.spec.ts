import { test, expect } from '@playwright/test';
import { signIn, studentA, admin, createThrowawayStudent, deleteThrowawayStudent } from './_credentials';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

test.describe('Golden Path 3: Reporting, Moderation Queue & Audit Log', () => {
  test.setTimeout(90000); // multi-actor flow with photo uploads
  test('reports a listing, admin sees it, deletes it, and verifies audit log entry', async ({ browser }) => {
    // The listing this test creates is only cleaned up by the admin UI's delete step
    // further down — if any assertion earlier in this single long test throws first, the
    // listing is orphaned live in production with no cleanup at all. That's exactly what
    // happened: 5 of 11 "Violating Item ..." fixtures from past runs were found still
    // `status=active` in production (2026-08-10 launch session), the other 6 correctly
    // `hidden`+`deleted_at` by a completed run. `listingId` is now captured right after
    // creation and force-hidden in a `finally` as a safety net — redundant (and harmless)
    // if the UI delete already succeeded, but guarantees no orphan on any failure.
    //
    // The reporter used to be the shared, persistent `studentB` QA account. That account
    // hit the app's own real 10-reports/24h rate limit (`RATE_LIMIT_EXCEEDED`) after enough
    // runs of this exact test in one day — a correctly-functioning anti-abuse feature, not
    // an app bug, but it made this test fail deterministically once the account was
    // exhausted. Reporting now goes through a throwaway account, same pattern already used
    // by golden_path_listing.spec.ts / golden_path_admin_ban.spec.ts / xss.spec.ts, so this
    // test's own repeated runs can never burn through a shared account's limit again.
    const timestamp = Date.now();
    const uniqueTitle = `Violating Item ${timestamp}`;
    let listingId: string | null = null;
    const reporter = await createThrowawayStudent(`qa.reporter.${timestamp}@kgpian.iitkgp.ac.in`, true);

    try {
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
    
    const uploadPromiseA = pageA.waitForResponse(r => r.url().includes('/storage/v1/object/listing-photos/') && r.request().method() === 'POST', { timeout: 15000 });
    await pageA.setInputFiles('input[type="file"]', FIXTURE);
    await uploadPromiseA;
    await expect(pageA.locator('img[alt="Preview"]')).toBeVisible({ timeout: 15000 });

    await pageA.waitForTimeout(1000);
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('**/listing/*');
    listingId = new URL(pageA.url()).pathname.split('/').pop() ?? null;
    await contextA.close();

    // 2. Throwaway reporter account logs in and reports it
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await signIn(pageB, reporter);
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
    } finally {
      if (listingId) {
        const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        await adminClient
          .from('listings')
          .update({ status: 'hidden', deleted_at: new Date().toISOString() })
          .eq('id', listingId);
      }
      await deleteThrowawayStudent(reporter.id);
    }
  });
});
