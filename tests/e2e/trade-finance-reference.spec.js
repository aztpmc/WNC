// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const PAGE_PATH = 'file://' + path.join(__dirname, '..', '..', 'pages', 'trade-finance-reference.html');
const URL = process.env.PW_BASE_URL || PAGE_PATH;

test.describe('trade-finance-reference — critical workflows', () => {
  test('initial load: all 99 entries indexed', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#resultCount')).toHaveText('99 results');
  });

  test('direct article lookup ranks the exact article first', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#q', 'UCP 30');
    await expect(page.locator('.result-title').first()).toHaveText('Tolerance in Credit Amount, Quantity and Unit Prices');
  });

  test('rule-code lookup outranks an incidental mention elsewhere', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#q', 'FOB');
    await expect(page.locator('.result-title').first()).toHaveText('Free on Board');
  });

  test('natural-language question finds the right entry', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#q', 'who pays for insurance under CIF');
    await expect(page.locator('.result-title').first()).toHaveText('Cost, Insurance and Freight');
  });

  test('source chip filters results', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#q', '');
    await page.locator('.chip', { hasText: 'Incoterms 2020' }).first().click();
    await expect(page.locator('#resultCount')).toHaveText('11 results');
  });

  test('Incoterms responsibility matrix: known cell values', async ({ page }) => {
    await page.goto(URL);
    const headers = await page.locator('#matrixTable thead th').allTextContents();
    const exwCol = headers.indexOf('EXW');
    const exportRow = page.locator('#matrixTable tbody tr', { has: page.locator('th', { hasText: 'Export packaging' }) });
    const cells = await exportRow.locator('td').allTextContents();
    expect(cells[exwCol - 1]).toBe('Seller');
  });

  test('clicking a rule code highlights its matrix column', async ({ page }) => {
    await page.goto(URL);
    await page.locator('.chip', { hasText: /^FOB$/ }).first().click();
    await expect(page.locator('#matrixTable thead th', { hasText: 'FOB' })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.locator('#matrixTable td.hl').count()).toBe(14);
  });

  test('Arabic / RTL', async ({ page }) => {
    await page.goto(URL);
    await page.click('#langAr');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.fill('#q', 'المادة 30');
    await expect(page.locator('.result-title').first()).toHaveText('هامش التفاوت في مبلغ الاعتماد والكمية وسعر الوحدة');
  });

  test('search box never executes injected markup', async ({ page }) => {
    let dialogFired = false;
    page.on('dialog', async (d) => { dialogFired = true; await d.dismiss(); });
    await page.goto(URL);
    await page.fill('#q', '<img src=x onerror=alert(1)>');
    await page.waitForTimeout(100);
    expect(dialogFired).toBe(false);
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
