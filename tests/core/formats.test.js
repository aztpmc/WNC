'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const N = require('../../src/core/index.js').default;

describe('backward compatibility: no options = exactly the pre-existing (financial) behavior', () => {
  const cases = [
    ['125450.75', 'USD', 'One Hundred Twenty-Five Thousand Four Hundred Fifty US Dollars and 75/100 Only'],
    ['1000.00', 'SAR', 'One Thousand Saudi Riyals Only'],
    ['1.123', 'KWD', 'One Kuwaiti Dinar and 12/100 Only']
  ];
  for (const [amt, cur, want] of cases) {
    it(`convertAmount(${amt}, ${cur}) with no options -> unchanged`, () => {
      const r = N.convertAmount(amt, cur);
      assert.equal(r.english, want);
      assert.equal(r.format, 'financial');
    });
  }

  it('explicit format:"financial" produces identical output to no options at all', () => {
    const a = N.convertAmount('123456.78', 'USD');
    const b = N.convertAmount('123456.78', 'USD', null, { format: 'financial' });
    assert.equal(a.english, b.english);
    assert.equal(a.arabic, b.arabic);
  });
});

describe('format: standard (bare number words, no currency, no fraction)', () => {
  it('English: 125450.75 USD -> just the integer spelled out, no currency, no cents', () => {
    const r = N.convertAmount('125450.75', 'USD', null, { format: 'standard' });
    assert.equal(r.english, 'One Hundred Twenty-Five Thousand Four Hundred Fifty');
  });
  it('Arabic: uses masculine default, no currency noun, no fraction', () => {
    const r = N.convertAmount('1000', 'SAR', null, { format: 'standard' });
    assert.equal(r.arabic, 'ألف');
  });
  it('Arabic standard ignores the currency\'s own feminine gender (SYP)', () => {
    const r = N.convertAmount('3', 'SYP', null, { format: 'standard' });
    // Feminine currency would normally give "ثلاث" (reverse agreement) --
    // standard has no noun to agree with, so it uses the masculine
    // citation form "ثلاثة" instead, same as any other currency.
    assert.equal(r.arabic, 'ثلاثة');
  });
  it('zero', () => {
    const r = N.convertAmount('0', 'USD', null, { format: 'standard' });
    assert.equal(r.english, 'Zero');
  });
  it('fraction is present in formatted/formattedWithCode but never in standard words', () => {
    const r = N.convertAmount('100.75', 'USD', null, { format: 'standard' });
    assert.equal(r.formatted, '100.75');
    assert.doesNotMatch(r.english, /\/100/);
  });
});

describe('format: check (English-only cheque convention)', () => {
  it('fraction moves before the currency name', () => {
    const r = N.convertAmount('125450.75', 'USD', null, { format: 'check' });
    assert.equal(r.english, 'One Hundred Twenty-Five Thousand Four Hundred Fifty and 75/100 US Dollars Only');
  });
  it('financial omits and 00/100 for a whole-dollar amount', () => {
    const r = N.convertAmount('1000.00', 'USD', null, { format: 'financial' });
    assert.equal(r.english, 'One Thousand US Dollars Only');
  });
  it('check keeps and 00/100 for the same whole-dollar amount', () => {
    const r = N.convertAmount('1000.00', 'USD', null, { format: 'check' });
    assert.equal(r.english, 'One Thousand and 00/100 US Dollars Only');
  });
  it('3-decimal currency: check still only ever shows the 2-digit words-fraction, truncated, never /1000', () => {
    const r = N.convertAmount('1.123', 'KWD', null, { format: 'check' });
    assert.equal(r.english, 'One and 12/100 Kuwaiti Dinar Only');
    assert.doesNotMatch(r.english, /\/1000/);
  });
  it('requesting check for Arabic falls back to the financial Arabic wording, not undefined', () => {
    const r = N.convertAmount('1000', 'SAR', null, { format: 'check' });
    assert.equal(r.arabic, N.convertAmount('1000', 'SAR', null, { format: 'financial' }).arabic);
  });
});

describe('formats field: all applicable variants available from a single convertAmount() call', () => {
  it('English currency exposes standard + financial + check', () => {
    const r = N.convertAmount('1000.50', 'USD');
    assert.ok(r.formats.standard);
    assert.ok(r.formats.financial);
    assert.ok(r.formats.check);
    assert.equal(typeof r.formats.standard.en, 'string');
    assert.equal(typeof r.formats.standard.ar, 'string');
    assert.equal(typeof r.formats.financial.en, 'string');
    assert.equal(typeof r.formats.check.en, 'string');
  });
  it('check has no `ar` key at all (absence, not an invented value)', () => {
    const r = N.convertAmount('1000.50', 'SAR');
    assert.equal(r.formats.check.ar, undefined);
    assert.ok(!('ar' in r.formats.check));
  });
});

describe('availableFormats(lang)', () => {
  it('English: standard, financial, check', () => {
    assert.deepEqual(N.availableFormats('en'), ['standard', 'financial', 'check']);
  });
  it('Arabic: standard, financial only (no check)', () => {
    assert.deepEqual(N.availableFormats('ar'), ['standard', 'financial']);
  });
});
