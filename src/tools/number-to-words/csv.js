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
 * extractAmountsFromCsv(text, amountHeaderAliases) -> newline-separated
 * amounts string
 *
 * One amount per output line, ready to drop straight into the Bulk
 * Conversion textarea. If the first row looks like a header (its first
 * cell isn't a bare number), it's skipped; a column whose header exactly
 * matches (case-insensitive) one of `amountHeaderAliases` is used if
 * present, otherwise the first column. Blank rows are dropped.
 *
 * `amountHeaderAliases` defaults to just the English "amount" so this
 * function stays usable standalone, but the real fix for recognizing the
 * app's own localized exports (e.g. Arabic "المبلغ") is for the CALLER to
 * pass every language's actual translated header text -- see main.js,
 * which builds that list directly from the same en.js/ar.js dictionaries
 * buildResultsCsv() uses to WRITE the header in the first place. That
 * keeps the importer's recognized aliases and the exporter's actual
 * output permanently in sync without a second, hand-maintained copy of
 * the translated strings living in this file.
 *
 * Matching is deliberately exact (after trim + lowercase), never a
 * substring/fuzzy match: a header like "Total Amount" or "Amount Due"
 * does NOT match "Amount" and falls through to the first-column default,
 * the same well-understood, already-documented behavior as any other
 * unrecognized header -- broadening the match would risk guessing wrong
 * on a real user's spreadsheet column silently.
 */
export function extractAmountsFromCsv(text, amountHeaderAliases) {
  const aliases = (amountHeaderAliases && amountHeaderAliases.length ? amountHeaderAliases : ['amount'])
    .map((a) => String(a).trim().toLowerCase());

  const rows = parseCsvRows(text).filter((r) => r.some((cell) => cell.trim() !== ''));
  if (rows.length === 0) return '';

  let col = 0;
  let dataRows = rows;
  const firstCell = (rows[0][0] || '').trim();
  const looksLikeHeader = firstCell !== '' && !/^-?[\d.,]+$/.test(firstCell);
  if (looksLikeHeader) {
    const idx = rows[0].findIndex((h) => aliases.indexOf(h.trim().toLowerCase()) !== -1);
    if (idx !== -1) col = idx;
    dataRows = rows.slice(1);
  }

  return dataRows.map((r) => (r[col] || '').trim()).filter((v) => v !== '').join('\n');
}

/**
 * neutralizeFormulaInjection(value) -- CSV/Spreadsheet Formula Injection
 * mitigation (CWE-1236). Bulk Conversion happily accepts and echoes back
 * arbitrary raw text for an INVALID amount (e.g. a rejected line still
 * shows what the user typed) -- if that raw text starts with a character
 * a spreadsheet application treats as the start of a formula (=, +, -,
 * @, or a leading tab/carriage return), opening the exported CSV (or
 * pasting the "Copy Results" clipboard text) in Excel/Sheets/LibreOffice
 * would execute it instead of displaying it as text.
 *
 * The fix is the standard, widely-documented one (OWASP's CSV Injection
 * guidance, and what every major CSV-export library does): prefix the
 * value with a single quote. Every mainstream spreadsheet application
 * treats a leading `'` as an explicit "force text" marker -- the formula
 * never executes, and Excel doesn't even display the quote itself, so a
 * legitimate value is never visually altered by this.
 *
 * Every currently-VALID amount (row.raw for an `ok` row, or any of this
 * app's own generated output like formattedWithCode/words) can never
 * start with one of these characters in the first place -- the parser
 * rejects anything containing them long before a row can become `ok`
 * (see src/core/parser.js: only digits/commas/one period are accepted,
 * and NEGATIVE is its own rejected error code) -- so this only ever
 * touches text that was already going to be shown as an error, never a
 * real financial value.
 */
const DANGEROUS_LEADING_CHAR = /^[=+\-@\t\r]/;

export function neutralizeFormulaInjection(value) {
  const s = String(value === null || value === undefined ? '' : value);
  return DANGEROUS_LEADING_CHAR.test(s) ? "'" + s : s;
}

function csvEscape(value) {
  const s = neutralizeFormulaInjection(value);
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
