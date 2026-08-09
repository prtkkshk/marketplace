import { chromium } from 'playwright';

async function measureLCP(url, email, password) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const cdpSession = await context.newCDPSession(page);
  // Emulate Slow 3G
  await cdpSession.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150
  });
  // Emulate 4x CPU throttling
  await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // 1. Go to sign in
  await page.goto(new URL('/auth/signin', url).toString());
  
  // 2. Log in
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]')
  ]);

  // Wait for the feed to load
  await page.waitForSelector('article'); // ListingCard

  // 3. Inject PerformanceObserver to get LCP
  const lcp = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // Fallback if already fired
      setTimeout(() => {
        const entries = performance.getEntriesByType('largest-contentful-paint');
        if (entries.length > 0) {
           resolve(entries[entries.length - 1].startTime);
        } else {
           resolve(null);
        }
      }, 2000);
    });
  });

  console.log(`LCP for Feed on ${url}: ${lcp} ms`);
  await browser.close();
}

const email = process.env.E2E_STUDENT_A_EMAIL || 'qa.student.a@kgpian.iitkgp.ac.in';
const password = process.env.E2E_STUDENT_PASSWORD || 'QaTesting2026';

(async () => {
  await measureLCP('http://localhost:4175', email, password);
  await measureLCP('https://kgpbazaar.vercel.app', email, password);
})();
