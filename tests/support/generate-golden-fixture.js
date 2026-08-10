'use strict';
/**
 * Generates tests/fixtures/golden-output.json from whichever core is passed
 * in — run once against the SHIPPED numbers-to-words.html to produce the
 * baseline, then re-run (via compare-golden-fixture.js) against each
 * extracted module set during the migration to prove zero behavioral
 * drift. Not itself a test — a fixture generator, invoked deliberately.
 */
const fs = require('fs');
const path = require('path');
const { loadShippedCore, SHIPPED_HTML_PATH } = require('./load-shipped-core');

const AMOUNTS = [
  '0', '1', '2', '10', '11', '12', '19', '20', '21', '99', '100', '101', '110', '111', '200', '999',
  '1000', '1001', '1010', '1100', '1999', '10000', '100000', '999999', '1000000', '1000001',
  '1250000', '999999999', '1000000000', '123456.01', '123456.05', '123456.10', '123456.50',
  '123456.78', '123456.99', '999999999999999.99',
  // 3-decimal boundary set (exercises TOO_MANY_DECIMALS on 2-decimal currencies too)
  '1.001', '1.010', '1.011', '1.050', '1.099', '1.123', '1.999',
  // extra edge cases already exercised in the dev-time suite
  '0.1', '0.2', '1.005', '0.50', '.5', '123456.7', '  1250000.75 ', '1,250,000.50',
  '١٢٣٤٥٦٫٧٨'
];

function generate(N) {
  const out = [];
  for (const cur of N.CURRENCY_CODES) {
    for (const amt of AMOUNTS) {
      const r = N.convertAmount(amt, cur);
      out.push({
        currency: cur,
        input: amt,
        ok: r.ok,
        code: r.ok ? null : r.code,
        formatted: r.ok ? r.formatted : null,
        formattedWithCode: r.ok ? r.formattedWithCode : null,
        english: r.ok ? r.english : null,
        arabic: r.ok ? r.arabic : null
      });
    }
  }
  // A handful of custom-currency cases too, since normalizeCustom is part of the public surface.
  const custom = N.convertAmount('2', 'CUSTOM', {
    code: 'xyz', nameEnglish: 'Widget', nameEnglishPlural: 'Widgets',
    arabicSingular: 'قطعة', arabicDual: 'قطعتان', arabicPlural: 'قطع',
    arabicAccusative: 'قطعةً', gender: 'f'
  });
  out.push({
    currency: 'CUSTOM:Widget', input: '2', ok: custom.ok, code: null,
    formatted: custom.formatted, formattedWithCode: custom.formattedWithCode,
    english: custom.english, arabic: custom.arabic
  });
  return out;
}

if (require.main === module) {
  const N = loadShippedCore(SHIPPED_HTML_PATH);
  const fixture = generate(N);
  const outPath = path.join(__dirname, '..', 'fixtures', 'golden-output.json');
  fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2) + '\n');
  console.log('Wrote ' + fixture.length + ' fixture cases to ' + outPath);
}

module.exports = { generate, AMOUNTS };
