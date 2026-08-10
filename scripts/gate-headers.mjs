#!/usr/bin/env node
/**
 * gate-headers.mjs — curls the LIVE site (never localhost) and exits 1 if any expected
 * security header is missing, or if loading every route in a real browser throws a
 * CSP violation.
 *
 * WHY THIS EXISTS
 * CSP headers were added to vercel.json and never verified against the deployed site
 * (HANDOVER.md §2) — a CSP that silently blocks listing photos is worse than no CSP,
 * because it fails quiet instead of loud. This script checks both halves: the headers
 * are actually present on the response Vercel serves, and the policy they describe
 * doesn't break the app it's supposed to protect.
 *
 * Deliberately does not read vercel.json to build its expectation list — that would
 * make the gate check "does the live site match the config" instead of "does the live
 * site have the headers a security review actually requires." The list below is that
 * independent requirement.
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, fail, pass } from './gate-lib.mjs';

const LIVE_URL = 'https://kgpbazaar.vercel.app';

const EXPECTED_HEADERS = [
  { key: 'content-security-policy', required: true },
  { key: 'strict-transport-security', required: true },
  { key: 'x-frame-options', required: true },
  { key: 'x-content-type-options', required: true },
  { key: 'referrer-policy', required: true },
  { key: 'permissions-policy', required: true },
];

// Routes that render without requiring a live session — this gate has no test
// credentials for the live site by design (it curls and loads pages anonymously; a
// signed-out visitor is exactly the traffic a CSP gap would hit first).
const PUBLIC_ROUTES = ['/', '/auth/signin', '/auth/signup', '/auth/otp', '/auth/forgot-password', '/rules', '/banned'];

async function main() {
  console.log(`  Checking headers on ${LIVE_URL} (live site, not localhost)...\n`);

  const resp = await fetch(LIVE_URL);
  const headerFailures = [];
  console.log('  Response headers:');
  for (const { key, required } of EXPECTED_HEADERS) {
    const value = resp.headers.get(key);
    if (value) {
      console.log(`    ✓ ${key}: ${value}`);
    } else {
      console.log(`    ✗ ${key}: MISSING`);
      if (required) headerFailures.push(key);
    }
  }

  console.log(`\n  Checking for CSP violations across ${PUBLIC_ROUTES.length} public routes on the live site...\n`);
  const browser = await chromium.launch({ headless: true });
  const cspViolations = [];
  try {
    const context = await browser.newContext();
    for (const route of PUBLIC_ROUTES) {
      const page = await context.newPage();
      const routeViolations = [];
      page.on('console', (msg) => {
        const text = msg.text();
        if (
          msg.type() === 'error' &&
          (text.includes('Content Security Policy') || text.includes('Refused to'))
        ) {
          routeViolations.push(text);
        }
      });
      try {
        await page.goto(new URL(route, LIVE_URL).toString(), { waitUntil: 'load', timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log(`    ${route}: navigation error (${e.message}) — treated as a failure, not skipped`);
        cspViolations.push({ route, violation: `navigation failed: ${e.message}` });
      }
      if (routeViolations.length > 0) {
        console.log(`    ✗ ${route}: ${routeViolations.length} CSP violation(s)`);
        for (const v of routeViolations) {
          console.log(`        ${v}`);
          cspViolations.push({ route, violation: v });
        }
      } else {
        console.log(`    ✓ ${route}: clean`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  mkdirSync(join(ROOT, 'qa-artifacts'), { recursive: true });
  writeFileSync(
    join(ROOT, 'qa-artifacts', 'gate-headers-results.json'),
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        url: LIVE_URL,
        headers: Object.fromEntries(resp.headers.entries()),
        headerFailures,
        cspViolations,
      },
      null,
      2
    )
  );
  console.log('\n  Full results: qa-artifacts/gate-headers-results.json');

  if (headerFailures.length > 0 || cspViolations.length > 0) {
    const parts = [];
    if (headerFailures.length > 0) parts.push(`${headerFailures.length} missing header(s): ${headerFailures.join(', ')}`);
    if (cspViolations.length > 0) parts.push(`${cspViolations.length} CSP violation(s) across ${new Set(cspViolations.map(v => v.route)).size} route(s)`);
    fail(parts.join('; '));
  }
  pass(`All ${EXPECTED_HEADERS.length} expected headers present; no CSP violations on ${PUBLIC_ROUTES.length} routes.`);
}

main().catch((e) => fail(e?.stack ?? String(e)));
