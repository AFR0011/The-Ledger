import { expect, test } from '@playwright/test';

for (const width of [320, 390, 1280]) {
  test(`navigation fits a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/#/');
    await expect(page.getByRole('heading', { name: /Start a fresh entry|right step/u })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    if (width < 768) {
      await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();
      for (const label of ['Home', 'Entries', 'Handoffs', 'Threads', 'Settings']) {
        const box = await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: label, exact: true }).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
    }
  });
}

test('corrupt bytes are preserved in Recovery before reset', async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => localStorage.setItem('the-ledger:v2', '{synthetic broken json'));
  await page.reload();
  await page.goto('/#/settings');
  await expect(page.getByRole('heading', { name: 'Recovery' })).toBeVisible();
  await expect(page.getByText('corrupted current')).toBeVisible();
});

test('an unpreservable corrupt value stays blocked until its raw download', async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => {
    localStorage.setItem('the-ledger:recovery:v1', '{synthetic broken recovery store');
    localStorage.setItem('the-ledger:v2', '{synthetic untouched active value');
  });
  await page.reload();
  await page.goto('/#/settings');
  const startFresh = page.getByRole('button', { name: 'Discard active value and start fresh' });
  await expect(startFresh).toBeDisabled();
  await page.getByRole('button', { name: 'Download untouched raw value' }).click();
  await expect(startFresh).toBeEnabled();
  await startFresh.click();
  await expect(page.getByText('A fresh ledger was created after the raw value was downloaded.')).toBeVisible();
});

test('an immediate autosave navigation keeps the latest synthetic answer', async ({ page }) => {
  await page.goto('/#/entry/daily');
  const answer = 'Synthetic evidence written immediately before navigation.';
  await page.locator('textarea').first().fill(answer);
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Entries', exact: true }).click();
  await expect(page).toHaveURL(/#\/entries$/u);
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('the-ledger:v2') ?? '{}'));
  expect(Object.values(persisted.drafts.daily.answers)).toContain(answer);
});

test('autosave-off navigation requires Save or Discard', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByLabel('Toggle autosave drafts').uncheck();
  await page.goto('/#/entry/daily');
  await page.locator('textarea').first().fill('Synthetic manual-save draft.');
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Entries', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Save or discard before leaving?');
  await page.getByRole('button', { name: 'Save and leave' }).click();
  await expect(page).toHaveURL(/#\/entries$/u);
});

test('an imported destination change is shown and requires confirmation', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByRole('button', { name: 'light' }).click();
  const backup = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('the-ledger:v2') ?? '{}');
    data.settings.contextOsUrl = 'https://new-context.example';
    return JSON.stringify({ format: 'the-ledger-backup', version: 2, exportedAt: new Date().toISOString(), data });
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: 'synthetic-import.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup)
  });
  await expect(page.getByText('new-context.example')).toBeVisible();
  const confirm = page.getByRole('button', { name: 'Confirm overwrite import' });
  await expect(confirm).toBeDisabled();
  await page.getByLabel(/I reviewed the changed ContextOS/u).check();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByRole('heading', { name: 'Recovery' })).toBeVisible();
});

test('a second tab change freezes the first tab until reload', async ({ context, page }) => {
  await page.goto('/#/settings');
  await page.getByRole('button', { name: 'light' }).click();
  const secondTab = await context.newPage();
  await secondTab.goto('/#/settings');
  await secondTab.getByRole('button', { name: 'dark' }).click();
  await expect(page.getByRole('alert')).toContainText('Another tab changed this ledger');
  await expect(page.getByRole('button', { name: 'Reload other tab changes' })).toBeVisible();
  await secondTab.close();
});

test('the cached application shell reopens offline', async ({ context, page }) => {
  await page.goto('/#/');
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload();
  try {
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Start a fresh entry|right step/u })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
