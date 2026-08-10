'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const N = require('../../src/core/index.js').default;

describe('convertBulkAmounts: line splitting', () => {
  it('one row per non-blank line, in order', () => {
    const { rows } = N.convertBulkAmounts('100\n200\n300', 'USD');
    assert.equal(rows.length, 3);
    assert.deepEqual(rows.map((r) => r.raw), ['100', '200', '300']);
  });

  it('blank lines are skipped, but surviving lines keep their original 1-based line number', () => {
    const { rows } = N.convertBulkAmounts('100\n\n\n200', 'USD');
    assert.equal(rows.length, 2);
    assert.equal(rows[0].line, 1);
    assert.equal(rows[1].line, 4);
  });

  it('handles CRLF and lone-CR line endings the same as LF', () => {
    const crlf = N.convertBulkAmounts('100\r\n200\r\n300', 'USD');
    const cr = N.convertBulkAmounts('100\r200\r300', 'USD');
    assert.equal(crlf.rows.length, 3);
    assert.equal(cr.rows.length, 3);
  });

  it('leading/trailing whitespace on a line is trimmed before parsing', () => {
    const { rows } = N.convertBulkAmounts('  100  \n\t200\t', 'USD');
    assert.equal(rows[0].raw, '100');
    assert.equal(rows[1].raw, '200');
  });

  it('empty or whitespace-only input yields zero rows, not an error', () => {
    assert.equal(N.convertBulkAmounts('', 'USD').rows.length, 0);
    assert.equal(N.convertBulkAmounts('   \n  \n', 'USD').rows.length, 0);
  });
});

describe('convertBulkAmounts: per-row results mirror convertAmount exactly', () => {
  it('a valid row is byte-for-byte identical to calling convertAmount directly', () => {
    const single = N.convertAmount('1000', 'SAR');
    const { rows } = N.convertBulkAmounts('1000', 'SAR');
    assert.equal(rows[0].ok, true);
    assert.equal(rows[0].english, single.english);
    assert.equal(rows[0].arabic, single.arabic);
    assert.equal(rows[0].formattedWithCode, single.formattedWithCode);
  });

  it('an invalid row reports ok:false with the same error code convertAmount would give', () => {
    const single = N.convertAmount('abc', 'USD');
    const { rows } = N.convertBulkAmounts('abc', 'USD');
    assert.equal(rows[0].ok, false);
    assert.equal(rows[0].code, single.code);
  });

  it('mixed valid/invalid lines: each row is independent, one bad line does not affect others', () => {
    const { rows } = N.convertBulkAmounts('100\nabc\n200', 'USD');
    assert.equal(rows[0].ok, true);
    assert.equal(rows[1].ok, false);
    assert.equal(rows[2].ok, true);
    assert.equal(rows[2].english, N.convertAmount('200', 'USD').english);
  });

  it('respects the currency\'s own decimal precision (3-decimal KWD row rejects a 2-decimal amount fine, accepts 3)', () => {
    const { rows } = N.convertBulkAmounts('1.123\n1.12', 'KWD');
    assert.equal(rows[0].ok, true);
    assert.equal(rows[1].ok, true);
    assert.equal(rows[0].english, N.convertAmount('1.123', 'KWD').english);
  });

  it('a 4-decimal amount on a 3-decimal currency is rejected, not rounded', () => {
    const { rows } = N.convertBulkAmounts('1.1234', 'KWD');
    assert.equal(rows[0].ok, false);
    assert.equal(rows[0].code, 'TOO_MANY_DECIMALS');
  });
});

describe('convertBulkAmounts: format/language options pass through unchanged', () => {
  it('format:"standard" applies to every row', () => {
    const { rows } = N.convertBulkAmounts('1000\n2000', 'USD', null, { format: 'standard' });
    assert.equal(rows[0].english, 'One Thousand');
    assert.equal(rows[1].english, 'Two Thousand');
  });

  it('format:"check" applies to every row (English only)', () => {
    const { rows } = N.convertBulkAmounts('1000.00', 'USD', null, { format: 'check' });
    assert.equal(rows[0].english, 'One Thousand and 00/100 US Dollars Only');
  });
});

describe('convertBulkAmounts: custom currency works the same as single conversion', () => {
  it('CUSTOM currency applies to every row identically', () => {
    const custom = {
      code: 'xyz', nameEnglish: 'Widget', nameEnglishPlural: 'Widgets',
      arabicSingular: 'قطعة', arabicDual: 'قطعتان', arabicPlural: 'قطع', arabicAccusative: 'قطعةً'
    };
    const { rows } = N.convertBulkAmounts('1\n2', 'CUSTOM', custom);
    assert.equal(rows[0].ok, true);
    assert.equal(rows[0].english, 'One Widget Only');
    assert.equal(rows[1].english, 'Two Widgets Only');
  });
});

describe('convertBulkAmounts: batch size cap', () => {
  it('processes up to MAX_BULK_LINES and reports truncation beyond that', () => {
    const lines = [];
    for (let i = 0; i < N.MAX_BULK_LINES + 50; i++) lines.push('1');
    const { rows, truncated, totalLines } = N.convertBulkAmounts(lines.join('\n'), 'USD');
    assert.equal(totalLines, N.MAX_BULK_LINES + 50);
    assert.equal(rows.length, N.MAX_BULK_LINES);
    assert.equal(truncated, true);
  });

  it('a batch at or under the cap is not marked truncated', () => {
    const lines = [];
    for (let i = 0; i < 5; i++) lines.push('1');
    const { rows, truncated } = N.convertBulkAmounts(lines.join('\n'), 'USD');
    assert.equal(rows.length, 5);
    assert.equal(truncated, false);
  });
});

describe('convertBulkAmounts: full 156-currency sanity sweep', () => {
  it('every currency converts a representative amount successfully in bulk exactly as it does standalone', () => {
    const amounts = ['0', '1', '2', '11', '100', '1234.56'];
    const text = amounts.join('\n');
    for (const code of N.CURRENCY_CODES) {
      const decimals = N.CURRENCIES[code].decimals;
      const adjusted = amounts.map((a) => {
        const [w, f] = a.split('.');
        if (!f) return a;
        return w + '.' + f.slice(0, decimals);
      }).filter((a) => !a.endsWith('.'));
      const { rows } = N.convertBulkAmounts(adjusted.join('\n'), code);
      rows.forEach((row, i) => {
        const single = N.convertAmount(adjusted[i], code);
        assert.equal(row.ok, single.ok, `${code} line ${i + 1}`);
        if (row.ok) assert.equal(row.english, single.english, `${code} line ${i + 1}`);
      });
    }
  });
});
