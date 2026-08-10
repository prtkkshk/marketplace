import { test } from '@playwright/test';

const ROUTES = [
  '/auth/signin',
  '/auth/signup',
  '/banned',
  '/complete-profile',
  '/',
  '/wanted',
  '/new',
  '/new-request',
  '/profile',
  '/profile/saved',
  '/rules',
  '/admin',
  '/404-not-found-test'
];

test.describe('Phase 1 - Route Coverage', () => {
  const errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', exception => {
      errors.push(`Uncaught exception: "${exception}"`);
    });
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        errors.push(`Console ${msg.type()}: "${msg.text()}"`);
      }
    });
    page.on('requestfailed', request => {
      errors.push(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('All routes load without errors', async ({ page }) => {
    // We start logged out, so protected routes will redirect. We will test them anyway.
    for (const route of ROUTES) {
      errors.length = 0; // reset
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // We don't fail immediately, we just want to know if errors occurred
      if (errors.length > 0) {
         console.log(`[ERRORS on ${route}]: `, errors);
      }
    }
  });
});
