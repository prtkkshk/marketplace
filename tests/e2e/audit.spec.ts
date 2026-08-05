import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { width: 375, height: 812, name: 'mobile-small' },
  { width: 390, height: 844, name: 'mobile-primary' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1280, height: 800, name: 'desktop' },
  { width: 1440, height: 900, name: 'desktop-wide' },
];

const ROUTES = [
  { path: '/', name: 'browse' },
  { path: '/wanted', name: 'wanted' },
  { path: '/profile', name: 'profile' },
  { path: '/profile/saved', name: 'saved' },
  { path: '/admin', name: 'admin' },
];

const CREDENTIALS = {
  email: 'pepperjet@kgpian.iitkgp.ac.in',
  password: 'pepperjet@14627912'
};

const BASE_URL = 'http://localhost:4173';
const OUTPUT_DIR = path.join(process.cwd(), '../audit-artifacts-v4');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

test.describe('Audit', () => {
  for (const { width, height, name: viewportName } of VIEWPORTS) {
    test.describe(`Viewport: ${viewportName}`, () => {
      
      for (const route of ROUTES) {
        test(`Audit Route: ${route.name}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          
          // Login
          await page.goto(`${BASE_URL}/auth/login`);
          await page.waitForSelector('input[type="email"]', { timeout: 10000 });
          await page.fill('input[type="email"]', CREDENTIALS.email);
          await page.fill('input[type="password"]', CREDENTIALS.password);
          await page.click('button[type="submit"]');
          await page.waitForURL(BASE_URL + '/', { timeout: 10000 });

          // Navigate to route
          await page.goto(`${BASE_URL}${route.path}`);
          await page.waitForLoadState('networkidle');

          // Light mode
          await page.emulateMedia({ colorScheme: 'light' });
          await page.evaluate(() => document.documentElement.classList.remove('dark'));
          // Take time for UI to update
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(OUTPUT_DIR, `${viewportName}-${route.name}-light.png`), fullPage: true });
          
          const accessibilityScanResultsLight = await new AxeBuilder({ page })
            .withTags(['wcag2aa', 'wcag21aa'])
            .analyze();
          fs.writeFileSync(path.join(OUTPUT_DIR, `${viewportName}-${route.name}-light-axe.json`), JSON.stringify(accessibilityScanResultsLight, null, 2));

          // Dark mode
          await page.emulateMedia({ colorScheme: 'dark' });
          await page.evaluate(() => document.documentElement.classList.add('dark'));
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(OUTPUT_DIR, `${viewportName}-${route.name}-dark.png`), fullPage: true });
          
          const accessibilityScanResultsDark = await new AxeBuilder({ page })
            .withTags(['wcag2aa', 'wcag21aa'])
            .analyze();
          fs.writeFileSync(path.join(OUTPUT_DIR, `${viewportName}-${route.name}-dark-axe.json`), JSON.stringify(accessibilityScanResultsDark, null, 2));
        });
      }
    });
  }
});
