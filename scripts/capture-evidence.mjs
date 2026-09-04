import { chromium } from '@playwright/test';

const baseUrl = process.env.LEDGER_CAPTURE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' });

await page.goto(`${baseUrl}/#/settings`);
await page.getByRole('button', { name: 'dark' }).click();
await page.evaluate(() => {
  const data = JSON.parse(localStorage.getItem('the-ledger:v2'));
  data.entries = [{
    id: 'synthetic-portfolio-entry',
    type: 'daily',
    promptVersion: 2,
    date: '2026-09-04',
    periodKey: '2026-09-04',
    periodLabel: 'Fri, Sep 4, 2026',
    headline: 'A calm release with evidence',
    answers: {
      day_story: 'Validated the local-first trust paths with synthetic data.',
      meaningful_progress: 'Recovery, destination, and conflict checks passed.',
      inner_state: 'Clear and deliberate.',
      drift_struggle_learning: 'Small verified steps kept the release legible.',
      tomorrow_attention: 'Publish only after the clean-clone gate passes.'
    },
    domainTags: ['career-research'],
    stateTags: ['Clear'],
    createdAt: '2026-09-04T09:00:00.000Z',
    updatedAt: '2026-09-04T09:30:00.000Z'
  }];
  localStorage.setItem('the-ledger:v2', JSON.stringify(data));
});

await page.goto(`${baseUrl}/#/`);
await page.reload();
await page.screenshot({ path: 'docs/assets/the-ledger-overview.png', fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: 'docs/assets/the-ledger-mobile.png' });

await page.evaluate(() => localStorage.setItem('the-ledger:v2', '{synthetic corrupt snapshot'));
await page.reload();
await page.goto(`${baseUrl}/#/settings`);
await page.setViewportSize({ width: 1280, height: 900 });
await page.getByRole('heading', { name: 'Recovery' }).scrollIntoViewIfNeeded();
await page.screenshot({ path: 'docs/assets/the-ledger-recovery.png' });

await browser.close();
