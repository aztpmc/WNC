'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const N = require('../../src/core/index.js').default;


describe('custom currency', () => {
  const cst = N.convertAmount('2', 'CUSTOM', {
    code: 'xyz', nameEnglish: 'Widget', nameEnglishPlural: 'Widgets',
    arabicSingular: 'قطعة', arabicDual: 'قطعتان', arabicPlural: 'قطع',
    arabicAccusative: 'قطعةً', gender: 'f'
  });
  it('code is uppercased in the formatted-with-code output', () => assert.equal(cst.formattedWithCode, '2.00 XYZ'));
  it('English uses the user-entered plural form', () => assert.equal(cst.english, 'Two Widgets Only'));
  it('Arabic uses the user-entered dual form', () => assert.equal(cst.arabic, 'قطعتان فقط لا غير'));
});

describe('currency table structural sanity (all 156 shipped currencies)', () => {
  it('CURRENCY_CODES has the expected count', () => {
    assert.equal(N.CURRENCY_CODES.length, 156);
  });

  for (const c of N.CURRENCY_CODES) {
    it(`${c}: has English singular/plural, all 4 Arabic forms, and converts`, () => {
      const x = N.CURRENCIES[c];
      assert.ok(x.nameEnglish, `${c} missing nameEnglish`);
      assert.ok(x.nameEnglishPlural, `${c} missing nameEnglishPlural`);
      for (const k of ['s', 'd', 'p', 'a']) {
        assert.ok(x.arabic[k], `${c} missing arabic.${k}`);
      }
      const r = N.convertAmount('1234.56', c);
      assert.equal(r.ok, true, `${c} failed to convert 1234.56`);
    });
  }
});
