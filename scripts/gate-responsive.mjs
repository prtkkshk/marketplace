#!/usr/bin/env node
/**
 * gate-responsive.mjs — every route at 320/375/390/768/1280/1440px. Exit 1 on any
 * horizontal scroll, or if the ₹ glyph (U+20B9) fails to render.
 *
 * WHY THIS EXISTS
 * Cross-browser/viewport behaviour was never run at multiple viewports (HANDOVER.md
 * §2). 320px is the hard floor (HANDOVER.md §5). Archivo is self-hosted and subset —
 * design/v5/DESIGN_SYSTEM.md flags that the ₹ glyph "is not in every subset," and it
 * is printed on every single listing card and price, so a silently-missing glyph would
 * be the single most visible launch bug this app could ship.
 *
 * The ₹ check does not just look for '₹' in the DOM (that only proves the character is
 * *in the markup*, not that any font actually drew a glyph for it). It renders '₹' on a
 * canvas with the page's real computed font and compares it PIXEL-FOR-PIXEL against a
 * Private Use Area codepoint that no real font maps — see checkRupeeGlyph() below for
 * why pixels, not measureText() width, is the part that's actually reliable.
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadEnvTest, ensureLocalServer, buildRouteList, prepareAllSessions, fail, pass } from './gate-lib.mjs';

/** Turns a route path into a filesystem-safe slug for screenshot filenames. */
function slugifyRoute(routePath) {
  return routePath === '/' ? 'root' : routePath.replace(/^\/+/, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '');
}

const WIDTHS = [
  { width: 320, height: 568, name: '320px' },
  { width: 375, height: 812, name: '375px' },
  { width: 390, height: 844, name: '390px' },
  { width: 768, height: 1024, name: '768px' },
  { width: 1280, height: 800, name: '1280px' },
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
    const scrollViolations = [];
    const artifacts = [];
    let rupeeChecked = false;
    const rupeeViolations = [];
    const screenshotDir = join(ROOT, 'qa-artifacts', 'screenshots');
    mkdirSync(screenshotDir, { recursive: true });
    const screenshots = [];

    try {
      for (const route of routes) {
        for (const vp of WIDTHS) {
          const label = `${route.path} @ ${vp.name} (${route.as})`;
          console.log(`  Checking ${label}...`);
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
          await page.waitForTimeout(400);

          const scroll = await checkHorizontalScroll(page);
          const rupee = await checkRupeeGlyph(page);

          const screenshotFile = `${slugifyRoute(route.path)}__${vp.name}.png`;
          await page.screenshot({ path: join(screenshotDir, screenshotFile), fullPage: true });
          screenshots.push({ route: route.path, width: vp.name, file: `screenshots/${screenshotFile}` });

          artifacts.push({ route: route.path, width: vp.name, scroll, rupee });

          if (scroll.hasScroll) {
            console.log(`    ✗ horizontal scroll: docOverflow=${scroll.docOverflow}px bodyOverflow=${scroll.bodyOverflow}px`);
            if (scroll.culprit) console.log(`      widest offender: ${scroll.culprit}`);
            scrollViolations.push({ route: route.path, width: vp.name, ...scroll });
          } else {
            console.log('    ✓ no horizontal scroll');
          }

          if (rupee.found) {
            rupeeChecked = true;
            if (!rupee.renders) {
              console.log(`    ✗ ₹ glyph does not render (font: ${rupee.fontFamily}, diffPixels: ${rupee.diffPixels})`);
              rupeeViolations.push({ route: route.path, width: vp.name, ...rupee });
            } else {
              console.log(`    ✓ ₹ glyph renders (font: ${rupee.fontFamily})`);
            }
          }

          await context.close();
        }
      }
    } finally {
      await browser.close();
    }

    if (!rupeeChecked) {
      fail(
        'The ₹ glyph check never actually ran — no route in this pass rendered any text containing ₹. ' +
          'That makes the glyph check vacuous, not a pass. Check that at least one active listing or ' +
          'price display is reachable.'
      );
    }

    mkdirSync(join(ROOT, 'qa-artifacts'), { recursive: true });
    writeFileSync(
      join(ROOT, 'qa-artifacts', 'gate-responsive-results.json'),
      JSON.stringify(
        { ranAt: new Date().toISOString(), artifacts, scrollViolations, rupeeViolations, screenshots },
        null,
        2
      )
    );

    console.log(
      `\n\n  === SUMMARY: ${routes.length} routes x ${WIDTHS.length} widths = ${artifacts.length} checks ===\n`
    );
    console.log(`  Horizontal scroll violations: ${scrollViolations.length}`);
    console.log(`  ₹ glyph rendering violations: ${rupeeViolations.length}`);
    console.log(`  Screenshots saved: ${screenshots.length} to qa-artifacts/screenshots/`);
    console.log('  Full results: qa-artifacts/gate-responsive-results.json');

    if (scrollViolations.length > 0 || rupeeViolations.length > 0) {
      const parts = [];
      if (scrollViolations.length > 0)
        parts.push(`${scrollViolations.length} horizontal-scroll violation(s) across ${new Set(scrollViolations.map((v) => v.route)).size} route(s)`);
      if (rupeeViolations.length > 0)
        parts.push(`${rupeeViolations.length} ₹-glyph violation(s) across ${new Set(rupeeViolations.map((v) => v.route)).size} route(s)`);
      fail(parts.join('; ') + '. See qa-artifacts/gate-responsive-results.json.');
    }
    pass(`No horizontal scroll and the ₹ glyph renders on every checked route, all ${WIDTHS.length} widths.`);
  } finally {
    if (sessionCleanup) await sessionCleanup();
    await server.stop();
  }
}

async function checkHorizontalScroll(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const docOverflow = doc.scrollWidth - doc.clientWidth;
    const bodyOverflow = body.scrollWidth - body.clientWidth;
    const hasScroll = docOverflow > 1 || bodyOverflow > 1;

    let culprit = null;
    if (hasScroll) {
      const vw = doc.clientWidth;
      let widest = null;
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.right > vw + 1) {
          if (!widest || rect.right > widest.right) {
            widest = { right: rect.right, el };
          }
        }
      }
      if (widest) {
        const el = widest.el;
        culprit = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').filter(Boolean).join('.') : ''} (right edge ${Math.round(widest.right)}px, viewport ${vw}px)`;
      }
    }

    return { docOverflow, bodyOverflow, hasScroll, culprit };
  });
}

/**
 * Renders '₹' and compares it PIXEL-FOR-PIXEL against a Private Use Area codepoint
 * (U+E000, which no real font maps — whatever draws is the font's fallback/notdef box)
 * at the same computed font. If they're pixel-identical, '₹' fell back to the same
 * empty box; if they differ, a real glyph was drawn.
 *
 * An earlier version of this check compared canvas measureText() *advance widths*
 * instead of pixels, on the theory that a missing glyph's box would measure
 * differently from a real one. It didn't: font renderers frequently size .notdef close
 * to an average glyph's width, so a real digit, '₹', and the notdef box all measured
 * within ~1px of each other in this app's font — confirmed false by rendering both to
 * a canvas and diffing pixels directly, which showed several hundred pixels differing.
 * Advance width tells you how far the cursor moved, not what got drawn; only pixels
 * answer that.
 */
async function checkRupeeGlyph(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    const el = Array.from(document.querySelectorAll('body *')).find(
      (e) => e.children.length === 0 && e.textContent && e.textContent.includes('₹')
    );
    if (!el) return { found: false };

    const style = getComputedStyle(el);

    function render(char) {
      const canvas = document.createElement('canvas');
      canvas.width = 60;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 60, 60);
      ctx.fillStyle = 'black';
      ctx.font = `${style.fontWeight} 32px ${style.fontFamily}`;
      ctx.textBaseline = 'top';
      ctx.fillText(char, 5, 5);
      return ctx.getImageData(0, 0, 60, 60).data;
    }

    const rupeePixels = render('₹');
    const notdefPixels = render('');

    let diffPixels = 0;
    for (let i = 0; i < rupeePixels.length; i += 4) {
      if (rupeePixels[i] !== notdefPixels[i]) diffPixels++;
    }

    return {
      found: true,
      fontFamily: style.fontFamily,
      diffPixels,
      // A handful of anti-aliasing edge pixels differing would be noise; a real
      // glyph differs from a notdef box by hundreds of pixels (verified empirically).
      renders: diffPixels > 5,
    };
  });
}

main().catch((e) => fail(e?.stack ?? String(e)));
