/* =========================================================================
   Bulk Conversion -- CSV import/export
   -------------------------------------------------------------------------
   Minimal RFC4180-ish CSV parsing/writing, hand-rolled rather than pulling
   in a library -- consistent with this project's offline-first, zero
   runtime-dependency architecture (see package.json: no runtime deps at
   all). "Excel" support means files Excel opens natively (CSV with a
   UTF-8 BOM so Arabic text renders correctly), not a binary .xlsx parser.

   Pure string-in/string-out functions, no DOM -- import produces the same
   newline-separated text the Bulk Conversion textarea already accepts, so
   it goes through the existing convertBulkAmounts() path unchanged rather
   than inventing a second amount-batch code path.
   ========================================================================= */

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const s = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/**
 * extractAmountsFromCsv(text) -> newline-separated amounts string
 *
 * One amount per output line, ready to drop straight into the Bulk
 * Conversion textarea. If the first row looks like a header (its first
 * cell isn't a bare number), it's skipped; a column literally named
 * "amount" (case-insensitive) is used if present, otherwise the first
 * column. Blank rows are dropped.
 */
export function extractAmountsFromCsv(text) {
  const rows = parseCsvRows(text).filter((r) => r.some((cell) => cell.trim() !== ''));
  if (rows.length === 0) return '';

  let col = 0;
  let dataRows = rows;
  const firstCell = (rows[0][0] || '').trim();
  const looksLikeHeader = firstCell !== '' && !/^-?[\d.,]+$/.test(firstCell);
  if (looksLikeHeader) {
    const idx = rows[0].findIndex((h) => h.trim().toLowerCase() === 'amount');
    if (idx !== -1) col = idx;
    dataRows = rows.slice(1);
  }

  return dataRows.map((r) => (r[col] || '').trim()).filter((v) => v !== '').join('\n');
}

function csvEscape(value) {
  const s = String(value === null || value === undefined ? '' : value);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * buildResultsCsv(headers, rows) -> CSV text, UTF-8 BOM-prefixed so Excel
 * renders Arabic (and other non-ASCII) text correctly instead of mangling
 * it as Latin-1. `rows` is an array of arrays of plain strings, already in
 * display order -- this function only escapes and joins them.
 */
const UTF8_BOM = String.fromCharCode(0xfeff);

export function buildResultsCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  rows.forEach((cells) => { lines.push(cells.map(csvEscape).join(',')); });
  return UTF8_BOM + lines.join('\r\n') + '\r\n';
}
