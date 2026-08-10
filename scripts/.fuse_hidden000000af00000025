import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  const outDir = path.resolve('../qa-artifacts/v5');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const capture = async (url, name, width, height) => {
    const page = await context.newPage();
    await page.setViewportSize({ width, height });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, `${name}-${width}.png`), fullPage: true });
    await page.close();
  };

  await capture('http://localhost:5173/dev/gallery', 'gallery', 390, 844);
  await capture('http://localhost:5173/dev/gallery', 'gallery', 1440, 900);

  await browser.close();
  console.log('Gallery captured');
})();
