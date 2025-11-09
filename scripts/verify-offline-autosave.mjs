import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on('console', (msg) => {
      console.log(`[page:${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (error) => {
      console.error('[pageerror]', error);
    });
    await page.addInitScript(() => {
      window.__forceOfflineTest = true;
    });
    const url = 'http://localhost:3000/f/offline-test';
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.react-flow__node', { timeout: 15000 });
    console.log('Triggering graph change');
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('graphChange', {
          detail: {
            nodes: [
              {
                id: 'offline-test',
                data: { label: 'Offline QA Node' },
              },
            ],
            edges: [],
          },
        })
      );
    });
    console.log('Waiting for error toast');
    await page.waitForSelector('text=Fehler beim Speichern ⚠️', {
      timeout: 15000,
    });
    console.log('Offline autosave toast displayed OK');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error('Offline verification failed:', error);
  process.exit(1);
});