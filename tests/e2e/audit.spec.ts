import { test } from '@playwright/test';
import * as fs from 'fs';

const routes = [
  '/',
  '/wanted',
  '/new',
  '/new-request',
  '/profile',
  '/profile/saved',
  '/rules',
];

const publicRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
];

test.describe('Audit Pass - Authenticated', () => {
  // Use a common login for all authenticated tests to save time
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'pepperjet@kgpian.iitkgp.ac.in');
    await page.fill('input[type="password"]', 'pepperjet@14627912');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  for (const route of routes) {
    test(`Audit route: ${route}`, async ({ page, browserName }) => {
      const logs: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(`Console error: ${msg.text()}`);
        }
      });
      
      const response = await page.goto(route);
      
      // Wait for network idle or timeout
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      if (response && response.status() >= 400) {
        logs.push(`HTTP Error ${response.status()}`);
      }

      // Check for broken images
      const images = await page.evaluate(() => {
        return Array.from(document.images).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
      });
      if (images.length > 0) {
        logs.push(`Broken images: ${images.join(', ')}`);
      }

      // Simple form interactions if it's a form page
      if (route === '/new' || route === '/new-request') {
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
          // Just to trigger validation errors
        }
      }

      const viewport = page.viewportSize();
      if (!fs.existsSync('audit-artifacts')) {
        fs.mkdirSync('audit-artifacts');
      }
      
      const filename = `audit-artifacts/${route.replace(/\//g, '_') || 'home'}-${browserName}-${viewport?.width}x${viewport?.height}.png`;
      await page.screenshot({ path: filename, fullPage: true });

      if (logs.length > 0) {
        fs.appendFileSync('audit-artifacts/errors.log', `[${route}] [${browserName}] [${viewport?.width}x${viewport?.height}]\n${logs.join('\n')}\n\n`);
      }
    });
  }
});

test.describe('Audit Pass - Public', () => {
  for (const route of publicRoutes) {
    test(`Audit route: ${route}`, async ({ page, browserName }) => {
      const logs: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(`Console error: ${msg.text()}`);
        }
      });
      
      const response = await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      if (response && response.status() >= 400) {
        logs.push(`HTTP Error ${response.status()}`);
      }

      // Trigger validation
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
      }

      const viewport = page.viewportSize();
      if (!fs.existsSync('audit-artifacts')) {
        fs.mkdirSync('audit-artifacts');
      }
      const filename = `audit-artifacts/${route.replace(/\//g, '_')}-${browserName}-${viewport?.width}x${viewport?.height}.png`;
      await page.screenshot({ path: filename, fullPage: true });

      if (logs.length > 0) {
        fs.appendFileSync('audit-artifacts/errors.log', `[${route}] [${browserName}] [${viewport?.width}x${viewport?.height}]\n${logs.join('\n')}\n\n`);
      }
    });
  }
});
