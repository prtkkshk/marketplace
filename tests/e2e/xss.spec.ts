import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.test
const envPath = path.resolve(process.cwd(), '.env.test');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}


test.describe('XSS and Injection tests', () => {
  test('React escaping - literal text rendering', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'alert') {
        alertFired = true;
      }
      await dialog.dismiss();
    });

    await page.goto('/signin');
    await page.fill('input[name="email"]', process.env.E2E_STUDENT_A_EMAIL!);
    await page.fill('input[name="password"]', process.env.E2E_STUDENT_PASSWORD!);
    await page.click('button[type="submit"]');
    
    // Visit Feed
    await page.waitForURL('/feed');
    await page.waitForTimeout(2000); // Wait for items to load
    expect(alertFired).toBe(false);

    // Visit Wanted
    await page.goto('/wanted');
    await page.waitForTimeout(2000);
    expect(alertFired).toBe(false);

    // Visit Profile
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    expect(alertFired).toBe(false);

    // Test wa.me link deep link injection on a listing
    await page.goto('/feed');
    // Click on the first "Contact Seller on WhatsApp" button, but intercept it
    const whatsappLink = await page.getAttribute('a[href^="https://wa.me/"]', 'href').catch(() => null);
    if (whatsappLink) {
      console.log('Found WhatsApp Link:', whatsappLink);
      // Ensure it's correctly URL encoded and doesn't contain injected parameters
      expect(whatsappLink).not.toContain('"><script>');
    }
  });
});

