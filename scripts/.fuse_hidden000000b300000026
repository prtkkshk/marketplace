import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { dirname, join } from 'path';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __dirname = dirname(__filename);

async function checkCSP() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let cspViolations = 0;
  page.on('console', msg => {
    if (msg.text().includes('Content Security Policy') || msg.text().includes('Refused to')) {
      console.log('CSP VIOLATION:', msg.text());
      cspViolations++;
    }
  });

  await page.goto('https://kgpbazaar.vercel.app');
  await page.waitForTimeout(3000);
  
  if (cspViolations === 0) {
    console.log('No CSP violations found on homepage.');
  }
  
  await browser.close();
}

checkCSP();
