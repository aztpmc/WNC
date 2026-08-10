'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const N = require('../../src/core/index.js').default;

function fmt(input, cur) { const r = N.convertAmount(input, cur); return r.ok ? r.formatted : 'ERR:' + r.code; }
function code(input, cur) { const r = N.convertAmount(input, cur); return r.ok ? 'OK' : r.code; }

describe('ISO minor-unit metadata: the 3-decimal set is exactly these 7 currencies', () => {
  const threeDecimal = ['KWD', 'BHD', 'OMR', 'JOD', 'TND', 'IQD', 'LYD'];
  const twoDecimal = ['SAR', 'USD', 'EUR', 'AED', 'QAR'];
  for (const c of threeDecimal) it(`${c}.decimals === 3`, () => assert.equal(N.CURRENCIES[c].decimals, 3));
  for (const c of twoDecimal) it(`${c}.decimals === 2`, () => assert.equal(N.CURRENCIES[c].decimals, 2));
});

describe('numeric formatting: progressive digit entry, per-currency precision', () => {
  const cases = [
    ['1', 'KWD', '1.000'], ['1.1', 'KWD', '1.100'], ['1.12', 'KWD', '1.120'], ['1.123', 'KWD', '1.123'],
    ['1', 'SAR', '1.00'], ['1.1', 'SAR', '1.10'], ['1.12', 'SAR', '1.12'],
    ['123456789.123', 'KWD', '123,456,789.123'], ['123456789.12', 'SAR', '123,456,789.12'],
    ['1000', 'KWD', '1,000.000'], ['1000', 'SAR', '1,000.00']
  ];
  for (const [amt, cur, want] of cases) {
    it(`${cur} ${amt} -> "${want}"`, () => assert.equal(fmt(amt, cur), want));
  }
});

describe('decimal-count validation is per-currency, not global', () => {
  it('KWD rejects a 4th decimal digit', () => assert.equal(code('1.1234', 'KWD'), 'TOO_MANY_DECIMALS'));
  it('SAR rejects a 3rd decimal digit', () => assert.equal(code('1.123', 'SAR'), 'TOO_MANY_DECIMALS'));
  it('KWD accepts exactly 3 decimal digits', () => assert.equal(code('1.123', 'KWD'), 'OK'));
});

describe('3-decimal currencies: numeric keeps all 3 digits, words truncate to 2 and never round, never /1000', () => {
  const boundaryVals = ['1.001', '1.010', '1.011', '1.050', '1.099', '1.123', '1.999'];
  const wordsFrac = { '1.001': null, '1.010': '01', '1.011': '01', '1.050': '05', '1.099': '09', '1.123': '12', '1.999': '99' };
  for (const cur of ['KWD', 'BHD', 'OMR', 'JOD', 'TND']) {
    describe(cur, () => {
      for (const v of boundaryVals) {
        const wf = wordsFrac[v];
        it(`${v}: numeric preserves all 3 digits`, () => {
          const r = N.convertAmount(v, cur);
          assert.equal(r.ok, true);
          assert.equal(r.formatted, v);
        });
        it(`${v}: words ${wf ? 'show ' + wf + '/100' : 'show no fraction at all'}`, () => {
          const r = N.convertAmount(v, cur);
          if (wf === null) {
            assert.doesNotMatch(r.english, /\/100/);
          } else {
            assert.match(r.english, new RegExp(wf + '/100'));
          }
        });
        it(`${v}: never introduces /1000 in English or Arabic`, () => {
          const r = N.convertAmount(v, cur);
          assert.doesNotMatch(r.english, /\/1000/);
          assert.doesNotMatch(r.arabic, /\/1000/);
        });
      }
    });
  }
});

describe('currency switching re-derives precision without losing the underlying value', () => {
  it('1000 formats as 1,000.00 in SAR and 1,000.000 in KWD', () => {
    assert.equal(fmt('1000', 'SAR'), '1,000.00');
    assert.equal(fmt('1000', 'KWD'), '1,000.000');
  });
});

describe('custom currencies stay 2-decimal (outside ISO 4217 scope)', () => {
  it('CUSTOM.decimals === 2', () => {
    const c = N.getCurrency('CUSTOM', { code: 'XYZ', nameEnglish: 'Widget', nameEnglishPlural: 'Widgets' });
    assert.equal(c.decimals, 2);
  });
});
