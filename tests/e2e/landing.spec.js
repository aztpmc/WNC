// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

// The root landing page. Run against a built-and-served URL for the same
// reason as tests/e2e/pwa.spec.js (service worker registration and
// import.meta.env.PROD gate both need a real production build):
//   npx vite preview --port 4321 &
//   PW_BASE_URL_ROOT=http://localhost:4321/ npx playwright test tests/e2e/landing.spec.js
const URL = process.env.PW_BASE_URL_ROOT
  || 'file://' + path.join(__dirname, '..', '..', 'index.html');

test.describe('root landing page', () => {
  test('loads with correct basic metadata', async ({ page }) => {
    await page.goto(URL);
    await expect(page).toHaveTitle('Number & Trade Finance Tools');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    await expect(page.locator('meta[charset]')).toHaveAttribute('charset', 'utf-8');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#161616');
  });

  test('provides working links to both tools, and does not modify either standalone tool page', async ({ page }) => {
    await page.goto(URL);
    const links = page.locator('.landing-card');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute('href', 'pages/numbers-to-words.html');
    await expect(links.nth(1)).toHaveAttribute('href', 'pages/trade-finance-reference.html');

    await links.nth(0).click();
    await expect(page.locator('#amount')).toBeVisible();
    await expect(page).toHaveTitle('Numbers to Words Converter');
  });

  test('links to the second tool also work', async ({ page }) => {
    await page.goto(URL);
    await page.locator('.landing-card').nth(1).click();
    await expect(page.locator('#q')).toBeVisible();
    await expect(page).toHaveTitle('Trade Finance Reference');
  });

  test('bilingual: language toggle switches text and applies RTL', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('h1')).toHaveText('Number & Trade Finance Tools');

    await page.click('#langAr');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('h1')).toHaveText('أدوات الأرقام والتمويل التجاري');
    await expect(page.locator('#langAr')).toHaveAttribute('aria-pressed', 'true');
  });

  test('language preference persists across a reload', async ({ page }) => {
    await page.goto(URL);
    await page.click('#langAr');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('accessibility: skip link moves focus to main content', async ({ page }) => {
    await page.goto(URL);
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#mainContent');
    await skipLink.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#mainContent')).toBeFocused();
  });

  test('offline: after one online visit, the landing page still loads with no network', async ({ page, context }) => {
    await page.goto(URL);
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return !!(reg && reg.active && reg.active.state === 'activated');
    }, { timeout: 15000 });

    await page.reload();
    await page.waitForFunction((u) => caches.match(u).then((m) => !!m), page.url(), { timeout: 15000 });

    await context.setOffline(true);
    try {
      let reloaded = false;
      for (let i = 0; i < 5 && !reloaded; i++) {
        try { await page.reload(); reloaded = true; } catch (e) { await page.waitForTimeout(200); }
      }
      expect(reloaded).toBe(true);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.landing-card')).toHaveCount(2);
    } finally {
      await context.setOffline(false);
    }
  });

  for (const bp of [320, 375, 390, 414, 768, 1024, 1280, 1440]) {
    test(`no horizontal overflow at ${bp}px`, async ({ page }) => {
      await page.setViewportSize({ width: bp, height: 900 });
      await page.goto(URL);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);
    });
  }
});
