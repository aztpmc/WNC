// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

// Service worker registration only runs in production builds
// (registerServiceWorker() gates on import.meta.env.PROD -- see src/pwa.js),
// so these tests are only meaningful against a built-and-served URL, same
// convention as tests/e2e/numbers-to-words.spec.js. Run with:
//   npx vite preview --port 4321 &
//   PW_BASE_URL_NTW=http://localhost:4321/pages/numbers-to-words.html \
//   PW_BASE_URL_TFR=http://localhost:4321/pages/trade-finance-reference.html \
//   npx playwright test tests/e2e/pwa.spec.js
const NTW_URL = process.env.PW_BASE_URL_NTW
  || 'file://' + path.join(__dirname, '..', '..', 'pages', 'numbers-to-words.html');
const TFR_URL = process.env.PW_BASE_URL_TFR
  || 'file://' + path.join(__dirname, '..', '..', 'pages', 'trade-finance-reference.html');

async function waitForActivatedServiceWorker(page) {
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!(reg && reg.active && reg.active.state === 'activated');
  }, { timeout: 15000 });
}

// networkFirst()'s cache.put() in sw.js is deliberately fire-and-forget
// (the response isn't held up waiting for the cache write) -- so a fixed
// sleep after reload() is a race, not a guarantee, that caching finished
// before the test goes offline. Poll the actual Cache Storage state
// instead of guessing a timeout.
async function waitForUrlCached(page, url) {
  await page.waitForFunction(async (u) => !!(await caches.match(u)), url, { timeout: 15000 });
}

// Playwright's CDP-level context.setOffline(true) can take a moment to
// actually propagate to the browser's network stack -- reloading
// immediately after setting it sometimes races that propagation and the
// navigation fails with net::ERR_FAILED even though the SW/cache side is
// genuinely ready (confirmed by waitForUrlCached above). Retrying a few
// times, rather than a longer blind sleep, tolerates that CDP timing
// without weakening what's actually being verified -- a real reload,
// with the network genuinely cut, still has to succeed from cache.
async function reloadWhileOffline(page, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await page.reload();
      return;
    } catch (err) {
      if (i === attempts) throw err;
      await page.waitForTimeout(200);
    }
  }
}

test.describe('offline / PWA support', () => {
  test('numbers-to-words: manifest link resolves to a valid, installable manifest', async ({ page }) => {
    await page.goto(NTW_URL);
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifestUrl = new URL(href, page.url()).toString();
    const res = await page.request.get(manifestUrl);
    expect(res.ok()).toBe(true);
    const manifest = await res.json();
    expect(manifest.name).toBe('Numbers to Words Converter');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.start_url).toBeTruthy();
  });

  test('trade-finance-reference: manifest link resolves to a valid, installable manifest', async ({ page }) => {
    await page.goto(TFR_URL);
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifestUrl = new URL(href, page.url()).toString();
    const res = await page.request.get(manifestUrl);
    expect(res.ok()).toBe(true);
    const manifest = await res.json();
    expect(manifest.name).toBe('Trade Finance Reference');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('service worker registers and reaches the activated state', async ({ page }) => {
    await page.goto(NTW_URL);
    await waitForActivatedServiceWorker(page);
    const scope = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return reg.scope;
    });
    expect(scope).toBeTruthy();
  });

  test('offline: after one online visit, the page still loads and the converter still works with no network', async ({ page, context }) => {
    await page.goto(NTW_URL);
    await waitForActivatedServiceWorker(page);
    // The page that triggers a service worker's registration is never
    // itself controlled by that worker -- only the *next* navigation is.
    // Reload once online so this navigation is actually intercepted and
    // cached before testing the offline fallback.
    await page.reload();
    await waitForUrlCached(page, NTW_URL);

    await context.setOffline(true);
    try {
      await reloadWhileOffline(page);
      await expect(page.locator('#amount')).toBeVisible();
      await page.selectOption('#currency', 'SAR');
      await page.fill('#amount', '1000');
      await expect(page.locator('#outEnglish')).toHaveText('One Thousand Saudi Riyals Only');
    } finally {
      await context.setOffline(false);
    }
  });

  test('REGRESSION: the service worker never caches an HTTP error response', async ({ page }) => {
    await page.goto(NTW_URL);
    await waitForActivatedServiceWorker(page);

    const missingUrl = new URL('this-does-not-exist-12345.txt', page.url()).toString();
    const status = await page.evaluate(async (u) => (await fetch(u)).status, missingUrl);
    expect(status).toBe(404);

    // The bug: cache.put() ran unconditionally on any resolved fetch(),
    // including a 404 -- so it would get replayed as "valid" content
    // forever. Assert directly against Cache Storage, not indirectly.
    const cached = await page.evaluate(async (u) => !!(await caches.match(u)), missingUrl);
    expect(cached).toBe(false);
  });
});
