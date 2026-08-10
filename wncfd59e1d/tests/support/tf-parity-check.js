// One-time migration verification: OLD (root-level, file://) vs NEW
// (rebuilt pages/, served over http:// via `vite preview`) trade-finance-
// reference.html, driven through an identical script.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const OLD_URL = 'file://' + path.join(__dirname, '..', '..', 'trade-finance-reference.html');
const NEW_URL = process.argv[2] || 'http://localhost:4322/pages/trade-finance-reference.html';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const oldPage = await b.newPage({ viewport: { width: 1200, height: 1000 } });
  const newPage = await b.newPage({ viewport: { width: 1200, height: 1000 } });

  const oldErrs = [], newErrs = [];
  oldPage.on('pageerror', (e) => oldErrs.push(e.message));
  newPage.on('pageerror', (e) => newErrs.push(e.message));

  await oldPage.goto(OLD_URL);
  await newPage.goto(NEW_URL);
  await oldPage.waitForTimeout(150);
  await newPage.waitForTimeout(150);

  let mismatches = 0;
  function compare(label, oldVal, newVal) {
    if (oldVal !== newVal) {
      mismatches++;
      console.log('MISMATCH', label, '\n  old:', JSON.stringify(oldVal), '\n  new:', JSON.stringify(newVal));
    }
  }

  console.log('=== Initial load ===');
  compare('result count', await oldPage.textContent('#resultCount'), await newPage.textContent('#resultCount'));
  compare('chip labels', JSON.stringify(await oldPage.locator('.chip').allTextContents()), JSON.stringify(await newPage.locator('.chip').allTextContents()));

  console.log('=== Search queries ===');
  for (const q of ['UCP 30', 'article 20', 'urdg 15', 'FOB', 'CIF insurance', 'who pays for insurance under CIF', 'tolerance']) {
    for (const page of [oldPage, newPage]) {
      await page.fill('#q', q);
      await page.waitForTimeout(60);
    }
    const oldTop = await oldPage.locator('.result-title').first().textContent().catch(() => '(none)');
    const newTop = await newPage.locator('.result-title').first().textContent().catch(() => '(none)');
    const oldCount = await oldPage.textContent('#resultCount');
    const newCount = await newPage.textContent('#resultCount');
    compare('query "' + q + '" top result', oldTop, newTop);
    compare('query "' + q + '" count', oldCount, newCount);
  }

  console.log('=== Matrix table ===');
  for (const page of [oldPage, newPage]) {
    await page.fill('#q', '');
    await page.locator('.chip', { hasText: /^FOB$/ }).first().click();
    await page.waitForTimeout(60);
  }
  const oldHl = await oldPage.locator('#matrixTable td.hl').count();
  const newHl = await newPage.locator('#matrixTable td.hl').count();
  compare('FOB highlighted cell count', oldHl, newHl);
  compare('matrix legend', await oldPage.textContent('#matrixLegend'), await newPage.textContent('#matrixLegend'));

  console.log('=== Arabic / RTL ===');
  for (const page of [oldPage, newPage]) {
    await page.click('#langAr');
    await page.waitForTimeout(100);
    await page.fill('#q', 'التأمين');
    await page.waitForTimeout(60);
  }
  const oldDir = await oldPage.evaluate(() => document.documentElement.dir);
  const newDir = await newPage.evaluate(() => document.documentElement.dir);
  compare('html dir', oldDir, newDir);
  compare('AR search count', await oldPage.textContent('#resultCount'), await newPage.textContent('#resultCount'));
  compare('AR top result title', await oldPage.locator('.result-title').first().textContent(), await newPage.locator('.result-title').first().textContent());

  console.log('=== XSS payload rejection ===');
  for (const page of [oldPage, newPage]) {
    await page.fill('#q', '<img src=x onerror=alert(1)>');
    await page.waitForTimeout(50);
  }
  const oldHtml = await oldPage.locator('#q').inputValue();
  const newHtml = await newPage.locator('#q').inputValue();
  compare('search box literal value (never executed)', oldHtml, newHtml);

  console.log('\n=== Responsive screenshots (8 breakpoints, EN) ===');
  for (const page of [oldPage, newPage]) {
    await page.click('#langEn');
    await page.fill('#q', '');
    await page.waitForTimeout(60);
  }
  const outDir = path.join(__dirname, '..', '..', '.migration-screenshots');
  fs.mkdirSync(outDir, { recursive: true });
  for (const bp of [320, 375, 390, 414, 768, 1024, 1280, 1440]) {
    for (const [name, page] of [['tf-old', oldPage], ['tf-new', newPage]]) {
      await page.setViewportSize({ width: bp, height: 900 });
      await page.waitForTimeout(30);
      await page.screenshot({ path: path.join(outDir, `${name}-${bp}.png`), fullPage: true });
    }
  }
  console.log('Screenshots written to', outDir);

  console.log('\nOld JS errors:', oldErrs.length ? oldErrs : 'none');
  console.log('New JS errors:', newErrs.length ? newErrs : 'none');
  console.log('\nTotal mismatches:', mismatches);
  await b.close();
  process.exit(mismatches || oldErrs.length || newErrs.length ? 1 : 0);
})();
