'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { extractAmountsFromCsv, buildResultsCsv, neutralizeFormulaInjection } = require('../../src/tools/number-to-words/csv.js');
const { en } = require('../../src/i18n/en.js');
const { ar } = require('../../src/i18n/ar.js');

// The exact alias list main.js actually passes in production -- sourced
// from the real i18n dictionaries, not hand-duplicated literals, so these
// tests exercise the real data-driven fix, not a stand-in for it.
const AMOUNT_HEADER_ALIASES = [en.numbersToWords.bulkColAmount, ar.numbersToWords.bulkColAmount];

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

describe('extractAmountsFromCsv: localized header aliases (regression -- Arabic round-trip)', () => {
  it('recognizes the Arabic "المبلغ" header when the alias list includes it', () => {
    const csv = 'السطر,المبلغ,رقماً,المبلغ كتابةً\n1,1000,"1,000.00 SAR",ألف ريال سعودي فقط لا غير\n2,2500,"2,500.00 SAR",ألفان وخمسمئة ريال سعودي فقط لا غير';
    assert.equal(extractAmountsFromCsv(csv, AMOUNT_HEADER_ALIASES), '1000\n2500');
  });

  it('still recognizes the English "Amount" header from the same alias list', () => {
    const csv = 'Line,Amount,Numeric,Amount in Words\n1,1000,"1,000.00 SAR",One Thousand Saudi Riyals Only';
    assert.equal(extractAmountsFromCsv(csv, AMOUNT_HEADER_ALIASES), '1000');
  });

  it('REGRESSION: an Arabic export re-imports to the exact same amounts as the English export of the same data', () => {
    const enCsv = buildResultsCsv(
      [en.numbersToWords.bulkColLine, en.numbersToWords.bulkColAmount, en.numbersToWords.bulkColNumeric, en.numbersToWords.bulkColWords],
      [['1', '1000', '1,000.00 SAR', 'One Thousand Saudi Riyals Only'], ['2', '2500', '2,500.00 SAR', 'Two Thousand Five Hundred Saudi Riyals Only']]
    );
    const arCsv = buildResultsCsv(
      [ar.numbersToWords.bulkColLine, ar.numbersToWords.bulkColAmount, ar.numbersToWords.bulkColNumeric, ar.numbersToWords.bulkColWords],
      [['1', '1000', '1,000.00 SAR', 'ألف ريال سعودي فقط لا غير'], ['2', '2500', '2,500.00 SAR', 'ألفان وخمسمئة ريال سعودي فقط لا غير']]
    );
    const fromEn = extractAmountsFromCsv(enCsv, AMOUNT_HEADER_ALIASES);
    const fromAr = extractAmountsFromCsv(arCsv, AMOUNT_HEADER_ALIASES);
    assert.equal(fromEn, '1000\n2500');
    assert.equal(fromAr, '1000\n2500');
    assert.equal(fromEn, fromAr); // same amounts, regardless of which language exported them
  });

  it('without the alias list (default), the Arabic header is NOT recognized -- proves the fix is the alias list, not a hidden bypass', () => {
    const csv = 'السطر,المبلغ\n1,1000';
    // No amountHeaderAliases passed -> defaults to English-only 'amount' ->
    // falls back to column 0 (Line), same as any other unrecognized header.
    assert.equal(extractAmountsFromCsv(csv), '1');
  });
});

describe('extractAmountsFromCsv: unknown/malformed headers cannot silently select the wrong column', () => {
  it('a header matching neither alias falls back to column 0, deterministically', () => {
    const csv = 'Foo,Bar\n1000,2000';
    assert.equal(extractAmountsFromCsv(csv, AMOUNT_HEADER_ALIASES), '1000');
  });

  it('a near-miss header ("Amount Due", not exactly "Amount") does not fuzzy-match', () => {
    const csv = 'Amount Due,Currency\n1000,USD';
    assert.equal(extractAmountsFromCsv(csv, AMOUNT_HEADER_ALIASES), '1000'); // falls back to column 0, not a partial match on column 0 itself
  });

  it('duplicate matching headers deterministically pick the first occurrence', () => {
    const csv = 'Amount,Amount\n1000,2000';
    assert.equal(extractAmountsFromCsv(csv, AMOUNT_HEADER_ALIASES), '1000');
  });

  it('an entirely blank header row falls back to column 0', () => {
    const csv = ' , \n1000,2000';
    // A blank first cell is NOT treated as "looks like a header" (empty
    // string never matches the header heuristic), so this is actually
    // treated as a data row -- both cells kept is out of scope here;
    // column 0 ("1000" then the blank line) is what matters.
    assert.equal(extractAmountsFromCsv(csv, AMOUNT_HEADER_ALIASES), '1000');
  });

  it('an empty alias list behaves like the all-defaults case (falls back to column 0)', () => {
    const csv = 'Amount\n1000';
    assert.equal(extractAmountsFromCsv(csv, []), '1000');
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

describe('neutralizeFormulaInjection: CSV/Spreadsheet Formula Injection mitigation (CWE-1236)', () => {
  const dangerousPrefixes = ['=1+1', '+1+1', '-1+1', '@SUM(A1:A10)', '\tSUM(A1)', '\rSUM(A1)'];
  for (const value of dangerousPrefixes) {
    it(`prefixes a leading-quote to neutralize ${JSON.stringify(value)}`, () => {
      assert.equal(neutralizeFormulaInjection(value), "'" + value);
    });
  }

  it('a real-world DDE/formula injection payload is neutralized', () => {
    const payload = '=cmd|\'/C calc\'!A1';
    assert.equal(neutralizeFormulaInjection(payload), "'" + payload);
  });

  it('leaves ordinary values completely unchanged', () => {
    for (const safe of ['1000', '2,500.50', '999999.99', 'abc', 'One Thousand Saudi Riyals Only', 'ألف ريال سعودي فقط لا غير', '']) {
      assert.equal(neutralizeFormulaInjection(safe), safe);
    }
  });

  it('only checks the leading character -- a dangerous character elsewhere in the value is left alone', () => {
    assert.equal(neutralizeFormulaInjection('1+1=2'), '1+1=2');
    assert.equal(neutralizeFormulaInjection('total: =SUM()'), 'total: =SUM()');
  });

  it('null/undefined behave like empty string, matching the rest of this module', () => {
    assert.equal(neutralizeFormulaInjection(null), '');
    assert.equal(neutralizeFormulaInjection(undefined), '');
  });
});

describe('buildResultsCsv: formula injection is neutralized end-to-end in real CSV output', () => {
  it('a dangerous raw "amount" cell for an invalid row is neutralized in the exported CSV', () => {
    const csv = buildResultsCsv(
      ['Line', 'Amount', 'Numeric', 'Amount in Words'],
      [['1', '=1+1', '', 'Invalid characters...'], ['2', '@SUM(A1:A10)', '', 'Invalid characters...']]
    );
    const body = csv.slice(1);
    assert.match(body, /^Line,Amount,Numeric,Amount in Words\r\n1,'=1\+1,,/);
    assert.match(body, /2,'@SUM\(A1:A10\),,/);
    // A spreadsheet reading a leading-quoted cell displays "=1+1" as
    // literal text -- it does not execute it as a formula.
  });

  it('legitimate numeric amounts and normal words pass through completely unaffected', () => {
    const csv = buildResultsCsv(
      ['Line', 'Amount', 'Numeric', 'Amount in Words'],
      [['1', '1000', '1,000.00 SAR', 'One Thousand Saudi Riyals Only']]
    );
    const body = csv.slice(1);
    assert.equal(body, 'Line,Amount,Numeric,Amount in Words\r\n1,1000,"1,000.00 SAR",One Thousand Saudi Riyals Only\r\n');
  });

  it('a dangerous value that also contains a comma is both neutralized AND correctly quoted', () => {
    const csv = buildResultsCsv(['Amount'], [['=1+1,2+2']]);
    const body = csv.slice(1);
    assert.equal(body, 'Amount\r\n"\'=1+1,2+2"\r\n');
  });
});
