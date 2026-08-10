'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const N = require('../../src/core/index.js').default;

function en(input, cur) { const r = N.convertAmount(input, cur); return r.ok ? r.english : 'ERR:' + r.code; }

describe('numberToEnglishWords — core number grammar', () => {
  const cases = [
    ['1', 'One'], ['2', 'Two'], ['10', 'Ten'], ['11', 'Eleven'], ['12', 'Twelve'],
    ['19', 'Nineteen'], ['20', 'Twenty'], ['21', 'Twenty-One'], ['99', 'Ninety-Nine'],
    ['100', 'One Hundred'], ['101', 'One Hundred One'], ['110', 'One Hundred Ten'],
    ['111', 'One Hundred Eleven'], ['200', 'Two Hundred'], ['999', 'Nine Hundred Ninety-Nine'],
    ['1000', 'One Thousand'], ['1001', 'One Thousand One'], ['1010', 'One Thousand Ten'],
    ['1100', 'One Thousand One Hundred'], ['1999', 'One Thousand Nine Hundred Ninety-Nine'],
    ['10000', 'Ten Thousand'], ['100000', 'One Hundred Thousand'],
    ['999999', 'Nine Hundred Ninety-Nine Thousand Nine Hundred Ninety-Nine'],
    ['1000000', 'One Million'], ['1000001', 'One Million One'],
    ['1250000', 'One Million Two Hundred Fifty Thousand'],
    ['999999999', 'Nine Hundred Ninety-Nine Million Nine Hundred Ninety-Nine Thousand Nine Hundred Ninety-Nine'],
    ['1000000000', 'One Billion']
  ];
  for (const [n, want] of cases) {
    it(`${n} -> "${want}"`, () => assert.equal(N.numberToEnglishWords(BigInt(n)), want));
  }
});

describe('English amount-in-words, with currency + the /100 rule', () => {
  const cases = [
    ['0', 'USD', 'Zero US Dollars Only'],
    ['1', 'USD', 'One US Dollar Only'],
    ['10', 'USD', 'Ten US Dollars Only'],
    ['11', 'USD', 'Eleven US Dollars Only'],
    ['21', 'USD', 'Twenty-One US Dollars Only'],
    ['100', 'USD', 'One Hundred US Dollars Only'],
    ['101', 'USD', 'One Hundred One US Dollars Only'],
    ['110', 'USD', 'One Hundred Ten US Dollars Only'],
    ['125', 'USD', 'One Hundred Twenty-Five US Dollars Only'],
    ['1001', 'USD', 'One Thousand One US Dollars Only'],
    ['1100', 'USD', 'One Thousand One Hundred US Dollars Only'],
    ['999999999999.99', 'USD',
      'Nine Hundred Ninety-Nine Billion Nine Hundred Ninety-Nine Million Nine Hundred Ninety-Nine Thousand Nine Hundred Ninety-Nine US Dollars and 99/100 Only'],
    ['123456.78', 'USD', 'One Hundred Twenty-Three Thousand Four Hundred Fifty-Six US Dollars and 78/100 Only'],
    ['1250.50', 'SAR', 'One Thousand Two Hundred Fifty Saudi Riyals and 50/100 Only'],
    ['100.05', 'SAR', 'One Hundred Saudi Riyals and 05/100 Only'],
    ['100.01', 'USD', 'One Hundred US Dollars and 01/100 Only'],
    ['1000.00', 'SAR', 'One Thousand Saudi Riyals Only'],
    ['1250.00', 'SAR', 'One Thousand Two Hundred Fifty Saudi Riyals Only'],
    ['1000000.00', 'USD', 'One Million US Dollars Only'],
    ['1000000.00', 'EUR', 'One Million Euros Only'],
    ['123456.10', 'USD', 'One Hundred Twenty-Three Thousand Four Hundred Fifty-Six US Dollars and 10/100 Only']
  ];
  for (const [amt, cur, want] of cases) {
    it(`${cur} ${amt} -> "${want}"`, () => assert.equal(en(amt, cur), want));
  }
});
