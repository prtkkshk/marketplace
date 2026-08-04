import { test, expect } from '@playwright/test';

test.describe('Golden Path 1: Student Registration, Post Listing & Contact', () => {
  test('allows student to register, complete profile, post a cycle, and contact seller', async ({ page }) => {
    // 1. Visit sign in and navigate to sign up
    await page.goto('/auth/signin');
    await page.click('a:has-text("Sign Up")');

    // 2. Fill registration with valid KGP email
    await page.fill('input[type="email"]', 'teststudent1@kgpian.iitkgp.ac.in');
    await page.fill('input[type="password"]', 'KgpPass2026!');
    await page.click('button[type="submit"]');

    // 3. Complete profile form
    await page.fill('input[id="full-name"]', 'Rohan Sharma');
    await page.fill('input[id="roll-number"]', '22CS10088');
    await page.selectOption('select[id="hall-of-residence"]', 'RK');
    await page.fill('input[id="whatsapp-number"]', '+919999900088');
    await page.click('button[type="submit"]');

    // 4. Navigate to Post Listing via FAB
    await page.goto('/new');
    await page.fill('input[name="title"]', 'Hero Sprint 21 Speed Cycle');
    await page.selectOption('select[name="category"]', 'cycles');
    await page.fill('input[name="price"]', '4500');
    await page.selectOption('select[name="condition"]', 'good');
    await page.fill('textarea[name="description"]', 'Well maintained cycle, brand new tires.');

    // Upload mock photo
    await page.setInputFiles('input[type="file"]', {
      name: 'cycle.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-bytes'),
    });

    await page.click('button[type="submit"]');

    // 5. Verify detail page load
    await expect(page.locator('h1')).toContainText('Hero Sprint 21 Speed Cycle');
    await expect(page.locator('text=₹4,500')).toBeVisible();

    // 6. Contact seller button exists
    const contactBtn = page.locator('button:has-text("Contact Seller on WhatsApp")');
    await expect(contactBtn).toBeVisible();
  });
});
