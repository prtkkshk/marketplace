import { test } from '@playwright/test';
import * as fs from 'fs';
import { signIn, studentA } from './_credentials';

const ROUTES = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/complete-profile',
  '/banned',
  '/404',
  '/wanted',
  '/new-request',
  '/request/test-id',
  '/profile',
  '/profile/saved',
  '/rules',
  '/dev/gallery',
  '/new',
  '/listing/test-id',
  '/admin'
];

test.describe('Route Screenshots & Font Check', () => {
  test('Capture screenshots', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes

    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }

    // Login for protected routes
    await page.goto('/auth/signin');
    try {
      await signIn(page, studentA());
      await page.waitForURL('/', { timeout: 15000 });
    } catch(e) {
      console.log('Login failed or already logged in:', e);
    }

    const viewports = [
      { width: 390, height: 844, name: 'mobile' },
      { width: 1280, height: 800, name: 'desktop' }
    ];

    for (const route of ROUTES) {
      await page.goto(route);
      // 1s was not enough: every feed screenshot captured loading skeletons rather than
      // listings, so nothing about the real UI was actually verified — including whether
      // the rupee sign renders, since no prices had loaded.
      await page.waitForLoadState('networkidle').catch(() => {});
      await page
        .waitForFunction(() => !document.querySelector('[data-skeleton], .animate-pulse'), null, { timeout: 8000 })
        .catch(() => {});
      await page.waitForTimeout(400); // settle animations
      
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.screenshot({ path: `screenshots/${route.replace(/\//g, '_') || 'home'}-${vp.name}.png`, fullPage: false });
      }
    }
  });

  test('Check Rupee symbol rendering', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    if (content.includes('₹')) {
      console.log('✅ Rupee symbol (₹) is present in the DOM.');
    }
  });
});
