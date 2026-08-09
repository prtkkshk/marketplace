/**
 * Lighthouse LCP measurement script for KGP Bazaar.
 *
 * Runs Lighthouse 3 times per page, per form factor (mobile + desktop),
 * reports median LCP. For authenticated pages, uses Playwright to sign in
 * and capture cookies, then passes them to Lighthouse.
 *
 * Usage: node scripts/lighthouse-measure.mjs
 * Prerequisites:
 *   - npm run build && npm run preview (on port 4173) must be running
 *   - .env.test must contain E2E_STUDENT_EMAIL, E2E_STUDENT_PASSWORD, SUPABASE_URL
 *   - lighthouse and playwright must be installed
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = join(ROOT, '.env.test');
const RESULTS_DIR = join(ROOT, 'lighthouse-results');

// Load env
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
const BASE_URL = 'http://localhost:4173';

const PAGES = [
  { name: 'signin', path: '/auth/signin', needsAuth: false },
  { name: 'feed', path: '/', needsAuth: true },
  { name: 'wanted', path: '/wanted', needsAuth: true },
  { name: 'profile', path: '/profile', needsAuth: true },
];

const FORM_FACTORS = ['mobile', 'desktop'];
const RUNS_PER_PAGE = 3;

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function getAuthCookies() {
  // Use Playwright to sign in and get cookies
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.fill('input[type="email"]', env.E2E_STUDENT_EMAIL);
  await page.fill('input[type="password"]', env.E2E_STUDENT_PASSWORD);
  await page.click('button:has-text("Sign In")');
  
  // Wait for redirect to feed
  await page.waitForURL('**/', { timeout: 15000 });
  // Wait for feed content to load
  await page.waitForTimeout(2000);
  
  const cookies = await context.cookies();
  
  // Also get localStorage for Supabase auth tokens
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      items[key] = window.localStorage.getItem(key);
    }
    return items;
  });
  
  await browser.close();
  return { cookies, localStorage };
}

async function runLighthouse(url, formFactor, extraHeaders = '') {
  const formFactorFlag = formFactor === 'mobile' 
    ? '--preset=perf --emulated-form-factor=mobile --throttling-method=simulate'
    : '--preset=desktop --emulated-form-factor=desktop --throttling-method=simulate';
  
  const outputPath = join(RESULTS_DIR, `lh-${Date.now()}.json`);
  
  const cmd = [
    'npx lighthouse',
    `"${url}"`,
    '--output=json',
    `--output-path="${outputPath}"`,
    '--only-categories=performance',
    '--chrome-flags="--headless=new --no-sandbox --disable-gpu"',
    formFactorFlag,
    extraHeaders,
    '--quiet',
  ].filter(Boolean).join(' ');
  
  try {
    execSync(cmd, { cwd: ROOT, timeout: 120000, stdio: 'pipe' });
  } catch (e) {
    console.error(`  Lighthouse error: ${e.message?.slice(0, 200)}`);
    return null;
  }
  
  if (!existsSync(outputPath)) return null;
  
  const result = JSON.parse(readFileSync(outputPath, 'utf8'));
  const lcp = result.audits?.['largest-contentful-paint']?.numericValue;
  const perf = result.categories?.performance?.score;
  const fcp = result.audits?.['first-contentful-paint']?.numericValue;
  const tbt = result.audits?.['total-blocking-time']?.numericValue;
  const cls = result.audits?.['cumulative-layout-shift']?.numericValue;
  const si = result.audits?.['speed-index']?.numericValue;
  
  return { lcp, perf, fcp, tbt, cls, si };
}

async function main() {
  mkdirSync(RESULTS_DIR, { recursive: true });
  
  console.log('=== KGP Bazaar Lighthouse LCP Measurement ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Runs per page per form factor: ${RUNS_PER_PAGE}`);
  console.log('');
  
  // Get auth cookies for authenticated pages
  console.log('Signing in to get auth cookies...');
  let authData;
  try {
    authData = await getAuthCookies();
    console.log(`Got ${authData.cookies.length} cookies and ${Object.keys(authData.localStorage).length} localStorage items`);
  } catch (e) {
    console.error('Failed to get auth cookies:', e.message);
    console.log('Will only measure unauthenticated pages.');
    authData = null;
  }
  
  // For authenticated pages, we need to use Playwright + CDP to measure LCP
  // because Lighthouse can't use Supabase auth tokens easily
  const allResults = [];
  
  for (const page of PAGES) {
    if (page.needsAuth && !authData) {
      console.log(`\nSkipping ${page.name} (auth required, no cookies)`);
      continue;
    }
    
    for (const ff of FORM_FACTORS) {
      console.log(`\n--- ${page.name} (${ff}) ---`);
      
      if (page.needsAuth) {
        // For auth pages, use Playwright to measure LCP via PerformanceObserver
        const results = await measureWithPlaywright(page, ff, authData);
        allResults.push({ page: page.name, formFactor: ff, ...results });
      } else {
        // For public pages, use Lighthouse directly
        const lcpValues = [];
        const perfValues = [];
        const fcpValues = [];
        const tbtValues = [];
        
        for (let run = 1; run <= RUNS_PER_PAGE; run++) {
          const url = `${BASE_URL}${page.path}`;
          console.log(`  Run ${run}/${RUNS_PER_PAGE}...`);
          const result = await runLighthouse(url, ff);
          if (result) {
            console.log(`    LCP: ${(result.lcp / 1000).toFixed(2)}s, Perf: ${Math.round(result.perf * 100)}`);
            lcpValues.push(result.lcp);
            perfValues.push(result.perf);
            fcpValues.push(result.fcp);
            tbtValues.push(result.tbt);
          } else {
            console.log('    FAILED');
          }
        }
        
        if (lcpValues.length >= 3) {
          const medLcp = median(lcpValues);
          const medPerf = median(perfValues);
          console.log(`  Median LCP: ${(medLcp / 1000).toFixed(2)}s, Median Perf: ${Math.round(medPerf * 100)}`);
          allResults.push({
            page: page.name,
            formFactor: ff,
            medianLcp: medLcp,
            medianPerf: medPerf,
            medianFcp: median(fcpValues),
            medianTbt: median(tbtValues),
            runs: lcpValues,
          });
        }
      }
    }
  }
  
  // Print summary table
  console.log('\n\n=== SUMMARY ===\n');
  console.log('| Page | Form Factor | Median LCP (s) | Perf Score | Pass? |');
  console.log('|------|-------------|----------------|------------|-------|');
  for (const r of allResults) {
    const lcpS = (r.medianLcp / 1000).toFixed(2);
    const pass = r.medianLcp <= 2500 ? '✅' : '❌';
    const perf = r.medianPerf ? Math.round(r.medianPerf * 100) : 'N/A';
    console.log(`| ${r.page} | ${r.formFactor} | ${lcpS} | ${perf} | ${pass} |`);
  }
  
  // Write results to file
  writeFileSync(
    join(RESULTS_DIR, 'summary.json'),
    JSON.stringify(allResults, null, 2)
  );
  console.log(`\nDetailed results saved to ${RESULTS_DIR}/summary.json`);
}

async function measureWithPlaywright(pageInfo, formFactor, authData) {
  const { chromium } = await import('playwright');
  
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
    
    // Restore auth state
    if (authData.cookies.length > 0) {
      await context.addCookies(authData.cookies);
    }
    
    const page = await context.newPage();
    
    // Restore localStorage
    if (authData.localStorage) {
      await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'domcontentloaded' });
      await page.evaluate((items) => {
        for (const [key, value] of Object.entries(items)) {
          window.localStorage.setItem(key, value);
        }
      }, authData.localStorage);
    }
    
    // Set up LCP observer before navigation
    const lcpPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        let lastLcp = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            lastLcp = entry.startTime;
          }
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Wait for page to settle then report
        setTimeout(() => {
          observer.disconnect();
          resolve(lastLcp);
        }, 10000);
      });
    });
    
    // Navigate to the target page
    await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'load' });
    
    const lcp = await lcpPromise;
    console.log(`    LCP: ${(lcp / 1000).toFixed(2)}s`);
    lcpValues.push(lcp);
    
    await browser.close();
  }
  
  const medLcp = median(lcpValues);
  console.log(`  Median LCP: ${(medLcp / 1000).toFixed(2)}s`);
  
  return {
    medianLcp: medLcp,
    medianPerf: null,
    runs: lcpValues,
  };
}

main().catch(console.error);
