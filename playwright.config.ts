import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';

/**
 * Load .env.test into process.env for the e2e run.
 *
 * The RLS suites each parse this file themselves, but Playwright specs had no access to it,
 * so credentials were being hardcoded into specs — which is both a leak risk and the reason
 * a spec kept signing in with a stale password and failing with a confusing
 * "input[name=title] not found" twenty seconds later.
 *
 * .env.test is gitignored. Values already in the environment win, so CI secrets are not
 * overwritten.
 */
if (existsSync('.env.test')) {
  for (const line of readFileSync('.env.test', 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    const key = match?.[1];
    const rawValue = match?.[2];
    if (!key || rawValue === undefined) continue;
    if (process.env[key]) continue;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-tablet',
      use: { ...devices['iPad (gen 7)'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 12'], viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
