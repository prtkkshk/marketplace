#!/usr/bin/env node
/**
 * gate-a11y.mjs — axe-core on every route, at 375px and 1440px. Exit 1 on any
 * violation, any route, either width.
 *
 * WHY THIS EXISTS
 * @axe-core/playwright was installed and never genuinely run; one report claimed PASS
 * by copying the contrast table out of the design doc instead of scanning a rendered
 * page (HANDOVER.md §2). This actually renders every route the app has — public,
 * signed-in student, banned, incomplete-profile, and admin (see gate-lib.mjs's route
 * matrix) — and fails loud on any real violation axe finds.
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadEnvTest, ensureLocalServer, buildRouteList, prepareAllSessions, fail, pass } from './gate-lib.mjs';

const WIDTHS = [
  { width: 375, height: 812, name: '375px' },
  { width: 1440, height: 900, name: '1440px' },
];

async function main() {
  const env = loadEnvTest();
  const server = await ensureLocalServer(env);
  const baseUrl = server.baseUrl;

  let sessionCleanup = null;
  try {
    const { routes, listingId, requestId } = await buildRouteList(env);
    if (!listingId || !requestId) {
      console.warn(
        `  Warning: ${!listingId ? 'no active listing' : ''}${!listingId && !requestId ? ' and ' : ''}` +
          `${!requestId ? 'no open wanted request' : ''} found — those detail routes are skipped.`
      );
    }

    console.log('  Preparing sessions (student, banned, admin, incomplete-profile)...');
    const { sessions, cleanup } = await prepareAllSessions(env, baseUrl);
    sessionCleanup = cleanup;

    const browser = await chromium.launch({ headless: true });
    const allViolations = [];
    const artifacts = [];

    try {
      for (const route of routes) {
        for (const vp of WIDTHS) {
          const label = `${route.path} @ ${vp.name} (${route.as})`;
          console.log(`  Scanning ${label}...`);
          const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
          const page = await context.newPage();

          if (route.as !== 'public') {
            await context.addCookies(sessions[route.as].cookies);
            await page.goto(new URL('/auth/signin', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
            await page.evaluate((items) => {
              for (const [key, value] of Object.entries(items)) window.localStorage.setItem(key, value);
            }, sessions[route.as].localStorage);
          }

          await page.goto(new URL(route.path, baseUrl).toString(), { waitUntil: 'load', timeout: 30000 });
          await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
          await page
            .waitForFunction(() => !document.querySelector('[data-skeleton], .animate-pulse'), null, {
              timeout: 8000,
            })
            .catch(() => {});
          await page.waitForTimeout(300);

          const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();

          artifacts.push({ route: route.path, width: vp.name, violationCount: results.violations.length });

          if (results.violations.length > 0) {
            console.log(`    ✗ ${results.violations.length} violation(s)`);
            for (const v of results.violations) {
              console.log(`      [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`);
              allViolations.push({
                route: route.path,
                width: vp.name,
                impact: v.impact,
                id: v.id,
                description: v.description,
                help: v.helpUrl,
                nodeCount: v.nodes.length,
                sampleHtml: v.nodes[0]?.html,
              });
            }
          } else {
            console.log('    ✓ clean');
          }

          await context.close();
        }
      }
    } finally {
      await browser.close();
    }

    mkdirSync(join(ROOT, 'qa-artifacts'), { recursive: true });
    writeFileSync(
      join(ROOT, 'qa-artifacts', 'gate-a11y-results.json'),
      JSON.stringify({ ranAt: new Date().toISOString(), artifacts, violations: allViolations }, null, 2)
    );

    console.log(`\n\n  === SUMMARY: ${routes.length} routes x ${WIDTHS.length} widths = ${artifacts.length} scans ===\n`);
    console.log(`  Total violations: ${allViolations.length}`);
    console.log('  Full results: qa-artifacts/gate-a11y-results.json');

    if (allViolations.length > 0) {
      fail(
        `${allViolations.length} axe violation(s) across ${new Set(allViolations.map((v) => v.route)).size} route(s). ` +
          `See qa-artifacts/gate-a11y-results.json.`
      );
    }
    pass(`No axe violations on any of ${routes.length} routes at ${WIDTHS.map((w) => w.name).join(' / ')}.`);
  } finally {
    if (sessionCleanup) await sessionCleanup();
    await server.stop();
  }
}

main().catch((e) => fail(e?.stack ?? String(e)));
