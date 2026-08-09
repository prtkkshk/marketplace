const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  const runAxe = async (pathUrl, width, height) => {
    const page = await context.newPage();
    await page.setViewportSize({ width, height });
    await page.goto(`http://localhost:5173${pathUrl}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    try {
      const results = await new AxeBuilder({ page }).analyze();
      console.log(`\n=== Route: ${pathUrl} (${width}x${height}) ===`);
      if (results.violations.length === 0) {
        console.log('No violations found!');
      } else {
        results.violations.forEach(v => {
          console.log(`[${v.impact}] ${v.id}: ${v.description}`);
          v.nodes.forEach(n => console.log(`  - ${n.html}`));
        });
      }
    } catch (e) {
      console.log(`Error on ${pathUrl}: ${e.message}`);
    }
    await page.close();
  };

  const routes = ['/', '/wanted', '/rules', '/auth/sign-in', '/auth/sign-up'];
  const viewports = [{w: 375, h: 812}, {w: 1440, h: 900}];

  for (const route of routes) {
    for (const vp of viewports) {
      await runAxe(route, vp.w, vp.h);
    }
  }

  await browser.close();
})();
