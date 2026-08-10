import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = join(ROOT, '.env.test');
const RESULTS_DIR = join(ROOT, 'lighthouse-results');

function loadEnv(path) {
  if (!existsSync(path)) throw new Error('no .env.test');
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv(ENV_PATH);
const URLS = [
  { name: 'Localhost', url: 'http://localhost:4173' },
  { name: 'Production', url: 'https://kgpbazaar.vercel.app' }
];

const PAGES = [
  { name: 'signin', path: '/auth/signin', needsAuth: false },
  { name: 'feed', path: '/', needsAuth: true },
  { name: 'wanted', path: '/wanted', needsAuth: true },
  { name: 'profile', path: '/profile', needsAuth: true },
  { name: 'listing-detail', path: null, needsAuth: true }, // Will discover listing path dynamically
];

const FORM_FACTORS = ['mobile', 'desktop'];
const THROTTLING_MODES = [
  { name: 'Unthrottled', apply: false },
  { name: 'Throttled (4x CPU, 4G)', apply: true }
];
const RUNS_PER_PAGE = 3;

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function getAuthCookies(baseUrl) {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto(`${baseUrl}/auth/signin`);
  await page.fill('input[type="email"]', env.E2E_STUDENT_A_EMAIL);
  await page.fill('input[type="password"]', env.E2E_STUDENT_PASSWORD);
  await page.click('button:has-text("Sign In")');
  
  await page.waitForURL('**/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const cookies = await context.cookies();
  
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      items[key] = window.localStorage.getItem(key);
    }
    return items;
  });
  
  // Discover a listing URL
  const listingHref = await page.evaluate(() => {
    const link = document.querySelector('a[href^="/listing/"]');
    return link ? link.getAttribute('href') : null;
  });
  
  await browser.close();
  return { cookies, localStorage, listingHref };
}

async function main() {
  mkdirSync(RESULTS_DIR, { recursive: true });
  console.log('=== KGP Bazaar Lighthouse LCP Measurement (v2) ===');
  
  const allResults = [];

  for (const envObj of URLS) {
    const baseUrl = envObj.url;
    console.log(`\n===========================================`);
    console.log(`Testing Environment: ${envObj.name} (${baseUrl})`);
    
    console.log('Signing in to get auth cookies & discover listings...');
    let authData;
    try {
      authData = await getAuthCookies(baseUrl);
      console.log(`Auth successful. Found listing: ${authData.listingHref}`);
    } catch (e) {
      console.log(`Could not get auth for ${baseUrl}. Error: ${e.message}`);
      continue;
    }

    for (const page of PAGES) {
      let pathToTest = page.path;
      if (page.name === 'listing-detail') {
        if (!authData.listingHref) {
          console.log(`Skipping listing-detail for ${envObj.name}, no listing found.`);
          continue;
        }
        pathToTest = authData.listingHref;
      }

      for (const ff of FORM_FACTORS) {
        for (const throttle of THROTTLING_MODES) {
          console.log(`\n--- ${envObj.name} | ${page.name} | ${ff} | ${throttle.name} ---`);
          const results = await measureWithPlaywright(baseUrl, pathToTest, ff, throttle.apply, authData || { cookies: [] });
          allResults.push({
            env: envObj.name,
            page: page.name,
            formFactor: ff,
            throttled: throttle.apply,
            ...results
          });
        }
      }
    }
  }
  
  console.log('\n\n=== SUMMARY ===\n');
  console.log('| Env | Page | Form Factor | Mode | Median LCP (s) | Pass? |');
  console.log('|-----|------|-------------|------|----------------|-------|');
  for (const r of allResults) {
    const lcpS = (r.medianLcp / 1000).toFixed(2);
    // Gate is < 2.5s for throttled
    const pass = (!r.throttled || r.medianLcp <= 2500) ? '✅' : '❌';
    const modeStr = r.throttled ? 'Throttled' : 'Unthrottled';
    console.log(`| ${r.env} | ${r.page} | ${r.formFactor} | ${modeStr} | ${lcpS} | ${pass} |`);
  }
  
  writeFileSync(
    join(RESULTS_DIR, 'summary-v2.json'),
    JSON.stringify(allResults, null, 2)
  );
  console.log(`\nDetailed results saved to ${RESULTS_DIR}/summary-v2.json`);
}

async function measureWithPlaywright(baseUrl, path, formFactor, applyThrottling, authData) {
  const { chromium } = await import('@playwright/test');
  
  const viewport = formFactor === 'mobile' 
    ? { width: 375, height: 812 }
    : { width: 1440, height: 900 };
  
  const lcpValues = [];
  
  for (let run = 1; run <= RUNS_PER_PAGE; run++) {
    console.log(`  Run ${run}/${RUNS_PER_PAGE}...`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport,
      userAgent: formFactor === 'mobile' 
        ? 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36'
        : undefined,
    });
    
    if (authData.cookies.length > 0) {
      await context.addCookies(authData.cookies);
    }
    
    const page = await context.newPage();
    
    // Setup CDP throttling if needed BEFORE navigation
    if (applyThrottling) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false, 
        downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
        uploadThroughput: (750 * 1024) / 8,          // 750 Kbps
        latency: 150                                 // 150ms
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    
    // To restore local storage we need to be on the origin
    if (authData.localStorage) {
      await page.goto(`${baseUrl}/auth/signin`, { waitUntil: 'domcontentloaded' });
      await page.evaluate((items) => {
        for (const [key, value] of Object.entries(items)) {
          window.localStorage.setItem(key, value);
        }
      }, authData.localStorage);
    }
    
    // Navigate to the target page
    // We don't use 'load' because LCP often happens before 'load'. 
    // We just start the observer before navigating, but since we can't easily inject observer before navigation
    // without `addInitScript`, let's inject it.
    await page.addInitScript(() => {
      window.__LCP_OBSERVER_DATA__ = 0;
      window.__LCP_OBSERVER__ = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__LCP_OBSERVER_DATA__ = entry.startTime;
        }
      });
      window.__LCP_OBSERVER__.observe({ type: 'largest-contentful-paint', buffered: true });
    });
    
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'load' });
    
    // Wait for network idle to ensure LCP has settled
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    
    const lcp = await page.evaluate(() => {
      if (window.__LCP_OBSERVER__) window.__LCP_OBSERVER__.disconnect();
      return window.__LCP_OBSERVER_DATA__;
    });
    
    console.log(`    LCP: ${(lcp / 1000).toFixed(2)}s`);
    lcpValues.push(lcp);
    
    await browser.close();
  }
  
  const medLcp = median(lcpValues);
  console.log(`  Median LCP: ${(medLcp / 1000).toFixed(2)}s`);
  
  return {
    medianLcp: medLcp,
    runs: lcpValues,
  };
}

main().catch(console.error);
