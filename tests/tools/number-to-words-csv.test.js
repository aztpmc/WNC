'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { extractAmountsFromCsv, buildResultsCsv } = require('../../src/tools/number-to-words/csv.js');

describe('extractAmountsFromCsv: single-column CSV, no header', () => {
  it('one amount per line, in order', () => {
    assert.equal(extractAmountsFromCsv('1000\n2500.50\n10000'), '1000\n2500.50\n10000');
  });

  it('blank rows are dropped', () => {
    assert.equal(extractAmountsFromCsv('1000\n\n\n2000'), '1000\n2000');
  });

  it('CRLF line endings are handled the same as LF', () => {
    assert.equal(extractAmountsFromCsv('1000\r\n2000\r\n3000'), '1000\n2000\n3000');
  });

  it('empty input yields an empty string, not an error', () => {
    assert.equal(extractAmountsFromCsv(''), '');
    assert.equal(extractAmountsFromCsv('\n\n'), '');
  });
});

describe('extractAmountsFromCsv: header row detection', () => {
  it('a non-numeric first cell is treated as a header and skipped', () => {
    assert.equal(extractAmountsFromCsv('Amount\n1000\n2000'), '1000\n2000');
  });

  it('a purely numeric first cell is treated as data, not a header', () => {
    assert.equal(extractAmountsFromCsv('1000\n2000'), '1000\n2000');
  });

  it('a header with a column literally named "amount" (any case) selects that column', () => {
    const csv = 'Description,Amount\nInvoice 1,1000\nInvoice 2,2500.50';
    assert.equal(extractAmountsFromCsv(csv), '1000\n2500.50');
  });

  it('column matching is case-insensitive and tolerates surrounding whitespace', () => {
    const csv = ' Desc , AMOUNT \nInvoice 1,1000';
    assert.equal(extractAmountsFromCsv(csv), '1000');
  });

  it('a header present but no "amount" column falls back to the first column', () => {
    const csv = 'Value,Currency\n1000,USD\n2000,USD';
    assert.equal(extractAmountsFromCsv(csv), '1000\n2000');
  });
});

describe('extractAmountsFromCsv: quoted fields', () => {
  it('preserves thousands separators inside quoted amounts', () => {
    assert.equal(extractAmountsFromCsv('"1,000.00"\n"2,500.50"'), '1,000.00\n2,500.50');
  });

  it('a comma-containing quoted field in a later column does not shift the amount column', () => {
    const csv = 'Amount,Note\n1000,"Client, Inc."\n2000,"Another, note"';
    assert.equal(extractAmountsFromCsv(csv), '1000\n2000');
  });

  it('doubled quotes inside a quoted field unescape to a single quote', () => {
    const csv = 'Amount,Note\n1000,"He said ""hi"""';
    assert.equal(extractAmountsFromCsv(csv), '1000');
  });
});

describe('buildResultsCsv', () => {
  it('starts with a UTF-8 BOM so Excel renders non-ASCII text correctly', () => {
    const csv = buildResultsCsv(['Line', 'Amount'], [['1', '1000']]);
    assert.equal(csv.charCodeAt(0), 0xfeff);
  });

  it('joins headers and rows with CRLF, matching common CSV/Excel convention', () => {
    const csv = buildResultsCsv(['Line', 'Amount'], [['1', '1000'], ['2', '2000']]);
    const body = csv.slice(1); // strip BOM
    assert.equal(body, 'Line,Amount\r\n1,1000\r\n2,2000\r\n');
  });

  it('quotes and escapes fields containing commas, quotes, or newlines', () => {
    const csv = buildResultsCsv(['Words'], [['One, Two "Three"'], ['Line1\nLine2']]);
    const body = csv.slice(1);
    assert.equal(body, 'Words\r\n"One, Two ""Three"""\r\n"Line1\nLine2"\r\n');
  });

  it('round-trips Arabic text unescaped (no special characters to quote)', () => {
    const csv = buildResultsCsv(['Words'], [['ألف ريال سعودي فقط لا غير']]);
    assert.ok(csv.includes('ألف ريال سعودي فقط لا غير'));
  });

  it('an empty rows array still produces a valid header-only CSV', () => {
    const csv = buildResultsCsv(['Line', 'Amount'], []);
    assert.equal(csv.slice(1), 'Line,Amount\r\n');
  });
});
