// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const NTW_PATH = 'file://' + path.join(__dirname, '..', '..', 'numbers-to-words.html');
const TF_PATH = 'file://' + path.join(__dirname, '..', '..', 'trade-finance-reference.html');

test.describe('tooling smoke test — proves the Playwright layer works before migration parity tests are written', () => {
  test('numbers-to-words.html loads and converts', async ({ page }) => {
    await page.goto(NTW_PATH);
    await page.fill('#amount', '1000');
    await page.selectOption('#currency', 'SAR');
    await expect(page.locator('#outNumeric')).toHaveText('1,000.00 SAR');
  });

  test('trade-finance-reference.html loads and searches', async ({ page }) => {
    await page.goto(TF_PATH);
    await page.fill('#q', 'FOB');
    await expect(page.locator('.result-title').first()).toHaveText('Free on Board');
  });
});
