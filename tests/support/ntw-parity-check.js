// One-time migration verification: drives the OLD (root-level, still
// self-contained, opened via file://) and NEW (rebuilt pages/, served over
// http:// via `vite preview`) numbers-to-words.html through an identical
// interaction script and diffs the resulting DOM text + screenshots.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');

const OLD_URL = 'file://' + path.join(__dirname, '..', '..', 'numbers-to-words.html');
const NEW_URL = process.argv[2] || 'http://localhost:4321/pages/numbers-to-words.html';

async function run(page, url) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(url);
  await page.waitForTimeout(150);
  return errs;
}

async function snapshot(page) {
  return {
    outNumeric: await page.textContent('#outNumeric'),
    outEnglish: await page.textContent('#outEnglish'),
    outArabic: await page.textContent('#outArabic'),
    amountValue: await page.inputValue('#amount'),
    hint: await page.textContent('#amountHint')
  };
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const oldPage = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const newPage = await b.newPage({ viewport: { width: 1100, height: 900 } });

  const oldErrs = await run(oldPage, OLD_URL);
  const newErrs = await run(newPage, NEW_URL);

  let mismatches = 0;
  function compare(label, oldVal, newVal) {
    const ok = oldVal === newVal;
    if (!ok) { mismatches++; console.log('MISMATCH', label, '\n  old:', JSON.stringify(oldVal), '\n  new:', JSON.stringify(newVal)); }
    return ok;
  }

  console.log('=== Basic conversion ===');
  for (const page of [oldPage, newPage]) {
    await page.fill('#amount', '1000');
    await page.selectOption('#currency', 'SAR');
    await page.waitForTimeout(80);
  }
  compare('SAR 1000', JSON.stringify(await snapshot(oldPage)), JSON.stringify(await snapshot(newPage)));

  console.log('=== 3-decimal currency (KWD) + boundary values ===');
  for (const v of ['1', '1.1', '1.123', '1.999']) {
    for (const page of [oldPage, newPage]) {
      await page.selectOption('#currency', 'KWD');
      await page.fill('#amount', v);
      await page.waitForTimeout(60);
    }
    compare('KWD ' + v, JSON.stringify(await snapshot(oldPage)), JSON.stringify(await snapshot(newPage)));
  }

  console.log('=== Arabic / RTL ===');
  for (const page of [oldPage, newPage]) {
    await page.click('#langAr');
    await page.waitForTimeout(100);
    await page.fill('#amount', '1250.50');
    await page.selectOption('#currency', 'SAR');
    await page.waitForTimeout(80);
  }
  const oldDir = await oldPage.evaluate(() => document.documentElement.dir);
  const newDir = await newPage.evaluate(() => document.documentElement.dir);
  compare('html dir', oldDir, newDir);
  compare('AR snapshot', JSON.stringify(await snapshot(oldPage)), JSON.stringify(await snapshot(newPage)));

  console.log('=== Currency switching precision adaptation ===');
  for (const page of [oldPage, newPage]) {
    await page.click('#langEn');
    await page.waitForTimeout(80);
    await page.fill('#amount', '1000');
    await page.selectOption('#currency', 'SAR');
    await page.selectOption('#currency', 'KWD');
    await page.waitForTimeout(80);
  }
  compare('SAR->KWD switch amount field', await oldPage.inputValue('#amount'), await newPage.inputValue('#amount'));

  console.log('=== Find-currency auto-select-on-focus ===');
  for (const page of [oldPage, newPage]) {
    await page.click('#currencyFilter');
    await page.type('#currencyFilter', 'sar', { delay: 10 });
    await page.click('#amount');
    await page.click('#currencyFilter');
    await page.type('#currencyFilter', 'usd', { delay: 10 });
  }
  compare('filter replace-not-append', await oldPage.inputValue('#currencyFilter'), await newPage.inputValue('#currencyFilter'));

  console.log('=== XSS payload rejection ===');
  for (const page of [oldPage, newPage]) {
    await page.fill('#amount', '<img src=x onerror=alert(1)>');
    await page.waitForTimeout(60);
  }
  compare('XSS payload error state', await oldPage.isVisible('#error'), await newPage.isVisible('#error'));

  console.log('=== Custom currency ===');
  for (const page of [oldPage, newPage]) {
    await page.selectOption('#currency', 'CUSTOM');
    await page.fill('#cCode', 'xyz');
    await page.fill('#cEnS', 'Widget');
    await page.fill('#cEnP', 'Widgets');
    await page.fill('#cArS', 'قطعة');
    await page.fill('#cArD', 'قطعتان');
    await page.fill('#cArP', 'قطع');
    await page.fill('#cArA', 'قطعةً');
    await page.fill('#amount', '2');
    await page.waitForTimeout(80);
  }
  compare('custom currency snapshot', JSON.stringify(await snapshot(oldPage)), JSON.stringify(await snapshot(newPage)));

  console.log('\n=== Responsive screenshots (8 breakpoints, EN+AR) ===');
  for (const page of [oldPage, newPage]) {
    await page.click('#langEn');
    await page.fill('#currencyFilter', ''); // clear the narrowing left over from the filter test above
    await page.waitForTimeout(30);
    await page.selectOption('#currency', 'SAR');
    await page.fill('#amount', '1234567.89');
    await page.waitForTimeout(60);
  }
  const fs = require('fs');
  const outDir = path.join(__dirname, '..', '..', '.migration-screenshots');
  fs.mkdirSync(outDir, { recursive: true });
  for (const bp of [320, 375, 390, 414, 768, 1024, 1280, 1440]) {
    for (const [name, page] of [['old', oldPage], ['new', newPage]]) {
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
