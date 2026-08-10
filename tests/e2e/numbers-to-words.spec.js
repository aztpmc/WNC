// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const PAGE_PATH = 'file://' + path.join(__dirname, '..', '..', 'pages', 'numbers-to-words.html');

// These run against the SOURCE page (pages/numbers-to-words.html) directly.
// Because it uses <script type="module">, file:// works for the page shell
// but the module script itself needs an HTTP origin to load (browser ES
// module CORS rules) -- so this suite expects to be run against a served
// URL. Override with PW_BASE_URL, e.g.:
//   npx vite preview --port 4321 &
//   PW_BASE_URL=http://localhost:4321/pages/numbers-to-words.html npx playwright test tests/e2e/numbers-to-words.spec.js
const URL = process.env.PW_BASE_URL || PAGE_PATH;

test.describe('numbers-to-words — critical workflows', () => {
  test('basic conversion', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#amount', '1000');
    await page.selectOption('#currency', 'SAR');
    await expect(page.locator('#outNumeric')).toHaveText('1,000.00 SAR');
    await expect(page.locator('#outEnglish')).toHaveText('One Thousand Saudi Riyals Only');
  });

  test('3-decimal currency precision + words truncation', async ({ page }) => {
    await page.goto(URL);
    await page.selectOption('#currency', 'KWD');
    await page.fill('#amount', '1.123');
    await expect(page.locator('#outNumeric')).toHaveText('1.123 KWD');
    await expect(page.locator('#outEnglish')).toHaveText('One Kuwaiti Dinar and 12/100 Only');
  });

  test('output format: standard drops currency and fraction', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#amount', '125450.75');
    await page.selectOption('#currency', 'USD');
    await page.selectOption('#format', 'standard');
    await expect(page.locator('#outEnglish')).toHaveText('One Hundred Twenty-Five Thousand Four Hundred Fifty');
  });

  test('output format: check moves the fraction before the currency name and never suppresses 00/100', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#amount', '1000.00');
    await page.selectOption('#currency', 'USD');
    await page.selectOption('#format', 'check');
    await expect(page.locator('#outEnglish')).toHaveText('One Thousand and 00/100 US Dollars Only');
  });

  test('output format: switching to Arabic drops "check" from the list and falls back to financial', async ({ page }) => {
    await page.goto(URL);
    await page.selectOption('#format', 'check');
    await page.click('#langAr');
    const values = await page.locator('#format option').evaluateAll((opts) => opts.map((o) => o.value));
    expect(values).toEqual(['standard', 'financial']);
    await expect(page.locator('#format')).toHaveValue('financial');
  });

  test('Arabic / RTL', async ({ page }) => {
    await page.goto(URL);
    await page.click('#langAr');
    await page.fill('#amount', '2');
    await page.selectOption('#currency', 'SAR');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#outArabic')).toHaveText('ريالان سعوديان فقط لا غير');
  });

  test('currency switch adapts decimal precision losslessly', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#amount', '1000');
    await page.selectOption('#currency', 'SAR');
    await page.selectOption('#currency', 'KWD');
    await expect(page.locator('#amount')).toHaveValue('1,000.000');
  });

  test('Find-currency focus-select replaces rather than appends', async ({ page }) => {
    await page.goto(URL);
    await page.click('#currencyFilter');
    await page.type('#currencyFilter', 'sar', { delay: 10 });
    await page.click('#amount');
    await page.click('#currencyFilter');
    await page.type('#currencyFilter', 'usd', { delay: 10 });
    await expect(page.locator('#currencyFilter')).toHaveValue('usd');
  });

  test('non-numeric / adversarial input is rejected, never executed', async ({ page }) => {
    let dialogFired = false;
    page.on('dialog', async (d) => { dialogFired = true; await d.dismiss(); });
    await page.goto(URL);
    await page.fill('#amount', '<img src=x onerror=alert(1)>');
    await expect(page.locator('#error')).toBeVisible();
    expect(dialogFired).toBe(false);
  });

  test('custom currency', async ({ page }) => {
    await page.goto(URL);
    await page.selectOption('#currency', 'CUSTOM');
    await page.fill('#cCode', 'xyz');
    await page.fill('#cEnS', 'Widget');
    await page.fill('#cEnP', 'Widgets');
    await page.fill('#cArS', 'قطعة');
    await page.fill('#cArD', 'قطعتان');
    await page.fill('#cArP', 'قطع');
    await page.fill('#cArA', 'قطعةً');
    await page.fill('#amount', '2');
    await expect(page.locator('#outNumeric')).toHaveText('2.00 XYZ');
    await expect(page.locator('#outEnglish')).toHaveText('Two Widgets Only');
  });

  test('bulk conversion: one amount per line, mixed valid/invalid', async ({ page }) => {
    await page.goto(URL);
    await page.selectOption('#currency', 'SAR');
    await page.fill('#bulkInput', '1000\nabc\n2');
    await page.click('#btnBulkConvert');
    const rows = page.locator('#bulkTableBody tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('1,000.00 SAR');
    await expect(rows.nth(1)).toHaveClass(/row-error/);
    await expect(rows.nth(2)).toContainText('2.00 SAR');
    await expect(page.locator('#bulkSummary')).toContainText('2 converted, 1 error');
  });

  test('bulk conversion uses the selected output format and language', async ({ page }) => {
    await page.goto(URL);
    await page.selectOption('#currency', 'USD');
    await page.selectOption('#format', 'standard');
    await page.fill('#bulkInput', '1000');
    await page.click('#btnBulkConvert');
    await expect(page.locator('#bulkTableBody tr').first()).toContainText('One Thousand');
    await expect(page.locator('#bulkTableBody tr').first()).not.toContainText('US Dollars');
  });

  test('bulk conversion: blank lines are skipped, empty batch shows guidance text', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#bulkInput', '\n\n');
    await page.click('#btnBulkConvert');
    await expect(page.locator('#bulkTableBody tr')).toHaveCount(0);
    await expect(page.locator('#bulkSummary')).not.toHaveText('');
  });

  test('bulk conversion: CSV import (single column, no header) populates and auto-converts', async ({ page }) => {
    await page.goto(URL);
    await page.selectOption('#currency', 'SAR');
    await page.setInputFiles('#bulkCsvFile', {
      name: 'amounts.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('1000\n2500.50\n10000')
    });
    const rows = page.locator('#bulkTableBody tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('1,000.00 SAR');
    await expect(page.locator('#bulkInput')).toHaveValue('1000\n2500.50\n10000');
    await expect(page.locator('#bulkSummary')).toContainText('Imported 3 amounts');
  });

  test('bulk conversion: CSV import with a header row uses the "Amount" column', async ({ page }) => {
    await page.goto(URL);
    await page.selectOption('#currency', 'USD');
    await page.setInputFiles('#bulkCsvFile', {
      name: 'invoices.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Description,Amount\nInvoice 1,1000\nInvoice 2,"2,500.50"')
    });
    const rows = page.locator('#bulkTableBody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('1,000.00 USD');
    await expect(rows.nth(1)).toContainText('2,500.50 USD');
  });

  test('bulk conversion: CSV import with no usable amounts reports an error, not a crash', async ({ page }) => {
    await page.goto(URL);
    await page.setInputFiles('#bulkCsvFile', {
      name: 'empty.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('\n\n')
    });
    await expect(page.locator('#bulkTableBody tr')).toHaveCount(0);
    await expect(page.locator('#bulkSummary')).not.toHaveText('');
  });

  test('bulk conversion: Export CSV downloads a file containing the current results', async ({ page }) => {
    await page.goto(URL);
    await page.selectOption('#currency', 'SAR');
    await page.fill('#bulkInput', '1000\nabc');
    await page.click('#btnBulkConvert');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btnBulkExportCsv')
    ]);
    expect(download.suggestedFilename()).toBe('bulk-conversion-results.csv');
    const csvPath = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(csvPath, 'utf-8');
    expect(content.charCodeAt(0)).toBe(0xfeff); // UTF-8 BOM for Excel
    expect(content).toContain('1,000.00 SAR');
    expect(content).toContain('Line,Amount,Numeric,Amount in Words');
  });

  test('bulk conversion: Export CSV with no results yet shows guidance instead of downloading', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnBulkExportCsv');
    await expect(page.locator('#bulkSummary')).toContainText('Convert All');
  });

  test('print: single-conversion certificate scopes to #results only', async ({ page }) => {
    await page.goto(URL);
    await page.selectOption('#currency', 'SAR');
    await page.fill('#amount', '1000');
    await page.click('#btnPrintResult');
    await expect(page.locator('body')).toHaveClass(/print-target-single/);
    await expect(page.locator('#certificateMeta')).toContainText('SAR');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#inputSection')).toBeHidden();
    await expect(page.locator('#bulkSection')).toBeHidden();
    await expect(page.locator('#results .certificate-title')).toBeVisible();
  });

  test('print: with no conversion yet, the Print button is a no-op', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnPrintResult');
    await expect(page.locator('body')).not.toHaveClass(/print-target-single/);
  });

  test('print: bulk report scopes to #bulkSection only, hiding the input controls', async ({ page }) => {
    await page.goto(URL);
    await page.selectOption('#currency', 'USD');
    await page.fill('#bulkInput', '1000\nabc');
    await page.click('#btnBulkConvert');
    await page.click('#btnBulkPrint');
    await expect(page.locator('body')).toHaveClass(/print-target-bulk/);
    await expect(page.locator('#bulkReportMeta')).toContainText('USD');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#bulkSection')).toBeVisible();
    await expect(page.locator('#bulkTable')).toBeVisible();
    await expect(page.locator('#inputSection')).toBeHidden();
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#bulkInput')).toBeHidden();
  });

  test('print: bulk report with no results yet shows guidance instead of printing', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnBulkPrint');
    await expect(page.locator('#bulkSummary')).toContainText('Convert All');
    await expect(page.locator('body')).not.toHaveClass(/print-target-bulk/);
  });

  for (const bp of [320, 375, 390, 414, 768, 1024, 1280, 1440]) {
    test(`no horizontal overflow at ${bp}px`, async ({ page }) => {
      await page.setViewportSize({ width: bp, height: 900 });
      await page.goto(URL);
      await page.fill('#amount', '1234567.89');
      await page.selectOption('#currency', 'KWD');
      await page.fill('#bulkInput', '1000\nabc\n999999.999');
      await page.click('#btnBulkConvert');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);
    });
  }
});
