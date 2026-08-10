#!/usr/bin/env node
/**
 * gate-perf.mjs — Playwright + CDP-throttled LCP, exits 1 on regression.
 *
 * WHY THIS EXISTS
 * A previous report claimed "LCP under 1.0s" by measuring unthrottled localhost
 * against a throttled 4.4s baseline — different measurements, not a 4x win
 * (HANDOVER.md §3). A resized browser window is also not a mobile profile: real phones
 * are network- and CPU-constrained in ways a desktop Chrome window at 375px is not.
 * This script applies both `Network.emulateNetworkConditions` and
 * `Emulation.setCPUThrottlingRate` via CDP, on a real mobile device emulation
 * (Playwright's Pixel 5 profile: viewport, UA, touch, device pixel ratio), and reports
 * a median of 3 runs so one lucky/unlucky run can't decide the result.
 *
 * Refuses to run under 500 active listings — that count is the floor this gate's
 * thresholds were written against (HANDOVER.md §7); numbers from a toy dataset don't
 * transfer to campus-wide scale.
 *
 * Exit 1 if feed / mobile median LCP >= 2500ms. Other page/form-factor combinations
 * are measured and reported but do not gate — they are context, not launch blockers.
 */

import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT,
  loadEnvTest,
  ensureLocalServer,
  signIn,
  studentA,
  discoverRealIds,
  countActiveListings,
  median,
  fail,
  pass,
} from './gate-lib.mjs';

const LISTING_FLOOR = 500;
const LCP_THRESHOLD_MS = 2500;
const RUNS_PER_COMBO = 3;

// Slow-4G-ish profile, consistent with the throttling already used elsewhere in this
// repo (scripts/measure-lcp.mjs, scripts/lighthouse-measure-v2.mjs).
const NETWORK_CONDITIONS = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
};
const CPU_THROTTLE_RATE = 4;

async function main() {
  const env = loadEnvTest();

  const activeListings = await countActiveListings(env);
  if (activeListings < LISTING_FLOOR) {
    fail(
      `Only ${activeListings} active listings in the DB — refusing to run.\n` +
        `  This gate's thresholds were written against a ${LISTING_FLOOR}+ listing floor ` +
        `(HANDOVER.md §7, campus-wide launch). LCP numbers from a smaller dataset don't ` +
        `transfer and would be a false pass.`
    );
  }
  console.log(`  Active listings: ${activeListings} (floor ${LISTING_FLOOR}) — proceeding.`);

  const server = await ensureLocalServer(env);
  const baseUrl = server.baseUrl;

  try {
    const { listingId } = await discoverRealIds(env);

    const PAGES = [
      { name: 'signin', path: '/auth/signin', auth: false },
      { name: 'feed', path: '/', auth: true },
      { name: 'wanted', path: '/wanted', auth: true },
      { name: 'profile', path: '/profile', auth: true },
      {
        name: 'listing-detail',
        path: listingId ? `/listing/${listingId}` : null,
        auth: true,
      },
    ].filter((p) => p.path !== null);

    if (PAGES.length < 5) {
      console.warn(
        `  Warning: only ${PAGES.length}/5 pages resolved (no active listing found for ` +
          `listing-detail). Continuing with what's available.`
      );
    }

    const FORM_FACTORS = ['mobile', 'desktop'];

    console.log(`  Capturing auth session for ${studentA(env).email}...`);
    const authData = await captureAuthSession(baseUrl, studentA(env));

    const results = [];
    for (const page of PAGES) {
      for (const formFactor of FORM_FACTORS) {
        console.log(`\n  --- ${page.name} | ${formFactor} ---`);
        const runs = [];
        for (let run = 1; run <= RUNS_PER_COMBO; run++) {
          const lcp = await measureOnce(baseUrl, page, formFactor, page.auth ? authData : null);
          console.log(`    run ${run}/${RUNS_PER_COMBO}: ${lcp === null ? 'no LCP' : (lcp / 1000).toFixed(2) + 's'}`);
          if (lcp !== null) runs.push(lcp);
        }
        const med = median(runs);
        console.log(`    median: ${isNaN(med) ? 'N/A' : (med / 1000).toFixed(2) + 's'}`);
        results.push({ page: page.name, formFactor, runs, medianMs: med });
      }
    }

    console.log('\n\n  === SUMMARY (median of 3 runs, throttled Slow-4G + 4x CPU) ===\n');
    console.log('  page             form factor   median LCP   gates?');
    console.log('  ---------------- ------------- ------------ -------');
    let gateFailed = false;
    let gateChecked = false;
    for (const r of results) {
      const isGate = r.page === 'feed' && r.formFactor === 'mobile';
      const medS = isNaN(r.medianMs) ? 'N/A' : `${(r.medianMs / 1000).toFixed(2)}s`;
      let flag = '';
      if (isGate) {
        gateChecked = true;
        const gateFails = isNaN(r.medianMs) || r.medianMs >= LCP_THRESHOLD_MS;
        if (gateFails) gateFailed = true;
        flag = gateFails ? '  <-- GATE FAIL' : '  <-- gate pass';
      }
      console.log(
        `  ${r.page.padEnd(16)} ${r.formFactor.padEnd(13)} ${medS.padEnd(12)} ${isGate ? 'yes' : 'no'}${flag}`
      );
    }

    mkdirSync(join(ROOT, 'qa-artifacts'), { recursive: true });
    writeFileSync(
      join(ROOT, 'qa-artifacts', 'gate-perf-results.json'),
      JSON.stringify({ ranAt: new Date().toISOString(), activeListings, results }, null, 2)
    );
    console.log('\n  Full results: qa-artifacts/gate-perf-results.json');

    if (!gateChecked) {
      fail('feed / mobile combination never measured — cannot evaluate the gate.');
    }
    if (gateFailed) {
      fail(
        `Feed mobile median LCP ${(results.find((r) => r.page === 'feed' && r.formFactor === 'mobile').medianMs / 1000).toFixed(2)}s >= ${LCP_THRESHOLD_MS / 1000}s threshold.`
      );
    }
    pass(`Feed mobile LCP is under ${LCP_THRESHOLD_MS / 1000}s.`);
  } finally {
    await server.stop();
  }
}

async function captureAuthSession(baseUrl, who) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, baseUrl, who);
    const cookies = await context.cookies();
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    return { cookies, localStorage };
  } finally {
    await browser.close();
  }
}

async function measureOnce(baseUrl, targetPage, formFactor, authData) {
  const browser = await chromium.launch({ headless: true });
  try {
    const contextOptions =
      formFactor === 'mobile' ? { ...devices['Pixel 5'] } : { viewport: { width: 1440, height: 900 } };
    const context = await browser.newContext(contextOptions);

    if (authData) {
      await context.addCookies(authData.cookies);
    }

    const page = await context.newPage();

    if (authData) {
      await page.goto(new URL('/auth/signin', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
      await page.evaluate((items) => {
        for (const [key, value] of Object.entries(items)) window.localStorage.setItem(key, value);
      }, authData.localStorage);
    }

    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE });

    await page.addInitScript(() => {
      window.__LCP__ = 0;
      window.__LCP_OBS__ = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__LCP__ = entry.startTime;
      });
      window.__LCP_OBS__.observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto(new URL(targetPage.path, baseUrl).toString(), {
      waitUntil: 'load',
      timeout: 45000,
    });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    // CPU throttling can delay the LCP callback past networkidle; give it a moment.
    await page.waitForTimeout(1000);

    const lcp = await page.evaluate(() => {
      if (window.__LCP_OBS__) window.__LCP_OBS__.disconnect();
      return window.__LCP__ || null;
    });
    return lcp;
  } finally {
    await browser.close();
  }
}

main().catch((e) => fail(e?.stack ?? String(e)));
