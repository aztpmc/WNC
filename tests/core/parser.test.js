'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const N = require('../../src/core/index.js').default;

function fmt(input, cur) { const r = N.convertAmount(input, cur || 'USD'); return r.ok ? r.formatted : 'ERR:' + r.code; }
function code(input, cur) { const r = N.convertAmount(input, cur || 'USD'); return r.ok ? 'OK' : r.code; }

describe('formatting (2-decimal currency, USD)', () => {
  const cases = [
    ['0', '0.00'], ['1', '1.00'], ['10', '10.00'],
    ['1,000', '1,000.00'], ['1,001', '1,001.00'], ['1,100', '1,100.00'],
    ['1,250.50', '1,250.50'], ['10,000', '10,000.00'], ['100,000', '100,000.00'],
    ['1,000,000', '1,000,000.00'], ['1,250,000.50', '1,250,000.50'],
    ['999,999,999,999.99', '999,999,999,999.99'],
    ['1234567890.5', '1,234,567,890.50'], ['123456.78', '123,456.78'],
    ['  1250000.75 ', '1,250,000.75'], ['0.50', '0.50'], ['.5', '0.50'],
    ['123456.7', '123,456.70'], ['999,999,999,999,999.99', '999,999,999,999,999.99']
  ];
  for (const [input, want] of cases) {
    it(`"${input}" -> "${want}"`, () => assert.equal(fmt(input), want));
  }
});

describe('input validation', () => {
  const cases = [
    ['', 'EMPTY'], ['   ', 'EMPTY'], ['12a3', 'INVALID_CHARS'],
    ['1.2.3', 'MULTIPLE_DECIMALS'], ['12,34', 'BAD_COMMAS'], ['1,2500', 'BAD_COMMAS'],
    ['-5', 'NEGATIVE'], ['123.456', 'TOO_MANY_DECIMALS'],
    ['1'.repeat(37), 'TOO_LARGE'], ['1'.repeat(36), 'OK'], ['123.', 'OK']
  ];
  for (const [input, want] of cases) {
    it(`"${input.length > 20 ? input.slice(0, 20) + '…(' + input.length + ' chars)' : input}" -> ${want}`, () => {
      assert.equal(code(input), want);
    });
  }

  it('Arabic-Indic digits and Arabic decimal separator normalize like Western digits', () => {
    assert.equal(fmt('١٢٣٤٥٦٫٧٨'), '123,456.78');
  });
});

describe('adversarial / non-numeric input never executes, always rejected as INVALID_CHARS', () => {
  const payloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '"><svg onload=alert(1)>',
    'javascript:alert(1)',
    '${alert(1)}',
    "'; alert(1); //",
    '1e10', '1E+10', 'Infinity', 'NaN', '0x10'
  ];
  for (const p of payloads) {
    it(JSON.stringify(p), () => {
      const r = N.convertAmount(p, 'USD');
      assert.equal(r.ok, false);
    });
  }
});

describe('pipeline sanity: no NaN/undefined/scientific-notation across a broad sweep', () => {
  const amounts = [
    '0', '1', '2', '10', '11', '12', '19', '20', '21', '99', '100', '101', '110', '111', '200', '999',
    '1000', '1001', '1010', '1100', '1999', '10000', '100000', '999999', '1000000', '1000001',
    '1250000', '999999999', '1000000000', '123456.01', '123456.05', '123456.10', '123456.50',
    '123456.78', '123456.99', '999999999999999.99'
  ];
  const currencies = ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'KWD'];
  for (const cur of currencies) {
    for (const amt of amounts) {
      it(`${cur} ${amt}`, () => {
        const r = N.convertAmount(amt, cur);
        assert.equal(r.ok, true);
        const decRe = new RegExp('^\\d{1,3}(,\\d{3})*\\.\\d{' + r.currency.decimals + '}$');
        assert.match(r.formatted, decRe);
        assert.doesNotMatch(r.english, /NaN|undefined/);
        assert.doesNotMatch(r.arabic, /NaN|undefined/);
        assert.doesNotMatch(r.formatted, /[eE]\+?\d/);
      });
    }
  }
});

describe('floating-point stress (must stay exact, never drift)', () => {
  it('0.1 formats as exactly 0.10, not 0.1000000000000000055...', () => {
    assert.equal(fmt('0.1'), '0.10');
  });
  it('0.2 formats as exactly 0.20', () => {
    assert.equal(fmt('0.2'), '0.20');
  });
  it('999999999999.99 preserved exactly', () => {
    assert.equal(fmt('999999999999.99'), '999,999,999,999.99');
  });
  it('1.005 (3rd decimal) is rejected for a 2-decimal currency, never silently rounded', () => {
    assert.equal(code('1.005'), 'TOO_MANY_DECIMALS');
  });
  it('123456789012345.67 preserved exactly at scale', () => {
    assert.equal(fmt('123456789012345.67'), '123,456,789,012,345.67');
  });
});
