/* =========================================================================
   Numbers to Words Converter — Amount assembly
   Joins the number words to the currency, applying the /100 financial rule.
   Extracted verbatim (behavior-for-behavior) from numbers-to-words.html's
   inline core_c.js (root.NumbersToWords) during the Vanilla-JS/ES-modules
   migration.
   ========================================================================= */

import { parseAmount, formatAmount } from './parser.js';
import { numberToEnglishWords, numberToArabicWords, applyConstructState, AR_ONLY, AR_AND } from './number-to-words.js';
import { CURRENCIES, CURRENCY_CODES } from './currency.js';
import { buildEnglishStandard, buildArabicStandard, buildEnglishCheck } from './formats.js';

/** getCurrency(code, customConfig) -> currency object (never null). */
export function getCurrency(code, custom) {
  if (code === 'CUSTOM') {
    return normalizeCustom(custom);
  }
  return CURRENCIES[code] || CURRENCIES.USD;
}

/** Turn raw user-entered custom-currency fields into a currency object. */
export function normalizeCustom(c) {
  c = c || {};
  const sing = (c.nameEnglish || '').trim() || 'Unit';
  const plur = (c.nameEnglishPlural || '').trim() || sing + 's';
  const arS = (c.arabicSingular || '').trim() || sing;
  const arD = (c.arabicDual || '').trim() || arS;
  const arP = (c.arabicPlural || '').trim() || arS;
  const arA = (c.arabicAccusative || '').trim() || arS;
  return {
    code: ((c.code || '').trim() || 'CUR').toUpperCase(),
    nameEnglish: sing,
    nameEnglishPlural: plur,
    decimals: 2,
    isoMinorUnit: 2, // custom currencies are outside ISO 4217; not applicable
    custom: true,
    arabic: { s: arS, d: arD, p: arP, a: arA, g: (c.gender === 'f' ? 'f' : 'm') }
  };
}

/* ----------------------------------------------------------------------
   English
   ---------------------------------------------------------------------- */

/** formatCurrency(currency, 'en', whole) -> "US Dollars" */
export function formatCurrencyEnglish(currency, whole) {
  return (whole === 1n) ? currency.nameEnglish : currency.nameEnglishPlural;
}

/** `fraction` here is always exactly two digits (the words-fraction —
 *  see convertAmount) regardless of the currency's numeric precision. */
export function buildEnglish(whole, fraction, currency) {
  const words = numberToEnglishWords(whole);
  const name = formatCurrencyEnglish(currency, whole);
  let out = words + ' ' + name;
  if (fraction !== '00') out += ' and ' + fraction + '/100';
  return out + ' Only';
}

/* ----------------------------------------------------------------------
   Arabic
   ----------------------------------------------------------------------
   Selects the grammatical form of the currency noun from r = n mod 100,
   then joins. When the noun stands in annexation (r = 0) a preceding
   dual drops its nun: "ألفان" + "ريال" => "ألفا ريال".
   ---------------------------------------------------------------------- */

/** formatCurrency(currency, 'ar', whole) -> the declined form for r>=3.
 *  r===1 and r===2 are handled entirely inside buildArabic(), because
 *  they need a different sentence shape (noun before the agreeing
 *  numeral), not just a different noun form — this covers only the
 *  cases where the number precedes the noun as an ordinary tamyiz. */
export function formatCurrencyArabic(currency, whole) {
  const ar = currency.arabic;
  if (whole === 1n) return ar.s;
  if (whole === 2n) return ar.d;
  const r = Number(whole % 100n);
  if (r >= 3 && r <= 10) return ar.p;   // plural genitive
  if (r >= 11) return ar.a;             // accusative singular
  return ar.s;                          // annexed singular
}

/** `fraction` here is always exactly two digits (the words-fraction —
 *  see convertAmount) regardless of the currency's numeric precision. */
export function buildArabic(whole, fraction, currency) {
  const ar = currency.arabic;
  let phrase;

  if (whole === 1n) {
    // The noun itself expresses "one"; the numeral follows and agrees.
    phrase = ar.s + ' ' + (ar.g === 'f' ? 'واحدة' : 'واحد');
  } else if (whole === 2n) {
    phrase = ar.d; // dual noun, no numeral needed
  } else {
    const r = Number(whole % 100n);

    if (r === 1 || r === 2) {
      // Compound amounts ending in 1 or 2 (101, 1001, 2002, ...) do not
      // say "[number] وواحد [noun]" — 1 and 2 follow their counted noun
      // and agree with it, the same as the standalone whole===1n/2n
      // cases above, so the noun is inserted before the agreeing 1/2
      // rather than appended after the full number the way r=0/3-10/11+
      // do. The higher-order prefix (everything except this final
      // group's 1/2) is joined to the noun with وَ — a coordinating
      // conjunction, not annexation — so, unlike the r===0 case, no
      // construct-state conversion applies here: a dual prefix keeps its
      // nun ("ألفان وريال سعودي واحد", not "ألفا وريال سعودي واحد"),
      // exactly as it already does before any other conjoined word
      // (compare "ألفان وخمسون ريالاً سعودياً" for 2050).
      const prefix = numberToArabicWords(whole, ar.g, true);
      const agreeing = (r === 1) ? (ar.s + ' ' + (ar.g === 'f' ? 'واحدة' : 'واحد')) : ar.d;
      phrase = prefix + AR_AND + agreeing;
    } else {
      let words = numberToArabicWords(whole, ar.g);
      if (r === 0) words = applyConstructState(words); // annexation
      phrase = words + ' ' + formatCurrencyArabic(currency, whole);
    }
  }

  if (fraction !== '00') phrase += AR_AND + fraction + '/100';
  return phrase + ' ' + AR_ONLY;
}

/* ----------------------------------------------------------------------
   Public conversion entry point
   ---------------------------------------------------------------------- */

/**
 * convertAmount(rawInput, currencyCode, customConfig, options)
 *  -> { ok:true, formatted, formattedWithCode, english, arabic, format,
 *       formats: { standard, financial, check? }, ... }
 *  -> { ok:false, code }
 *
 * The currency must be resolved before parsing, because its `decimals`
 * (2 for almost everything, 3 for the ISO 3-decimal group) determines how
 * many fraction digits the raw input is even allowed to carry.
 *
 * options.format selects which style `english`/`arabic` are built in:
 * 'financial' (default — identical to this function's behavior before
 * output formats existed, so every pre-existing caller that never passes
 * options keeps getting exactly what it always got), 'standard' (bare
 * number words, no currency, no fraction), or 'check' (English only —
 * see formats.js for why). All three (or two, for Arabic) are always
 * available together on the `formats` field regardless of which one
 * `english`/`arabic` reflect, so a format-switcher UI can preview every
 * option from a single convertAmount() call instead of re-parsing per
 * format.
 */
export function convertAmount(rawInput, currencyCode, custom, options) {
  const currency = getCurrency(currencyCode, custom);
  const parsed = parseAmount(rawInput, currency.decimals);
  if (!parsed.ok) return parsed;

  const formatted = formatAmount(parsed.integer, parsed.fraction);

  // The amount-in-words /100 convention is unconditionally two digits,
  // regardless of the currency's own display precision — per this
  // application's explicit financial-document specification, a
  // 3-decimal currency's numeric value keeps its 3rd digit in full
  // (parsed.fraction, and thus `formatted`/`formattedWithCode`, is
  // never touched), but the WORDS sentence only ever states the first
  // two, truncated rather than rounded, and never grows a "/1000" of
  // its own. Explicit product decision — see currency.js for the fuller
  // rationale on why these stay two separate concepts.
  const wordsFraction = parsed.fraction.slice(0, 2);

  const financialEn = buildEnglish(parsed.whole, wordsFraction, currency);
  const financialAr = buildArabic(parsed.whole, wordsFraction, currency);

  const formats = {
    standard: {
      en: buildEnglishStandard(parsed.whole),
      ar: buildArabicStandard(parsed.whole)
    },
    financial: { en: financialEn, ar: financialAr },
    // Deliberately no `ar` key — see formats.js for why "check" is
    // English-only. Absence, not an invented/guessed Arabic value.
    check: { en: buildEnglishCheck(parsed.whole, wordsFraction, currency) }
  };

  const requestedFormat = (options && options.format) || 'financial';
  const selected = formats[requestedFormat] || formats.financial;

  return {
    ok: true,
    currency: currency,
    integer: parsed.integer,
    fraction: parsed.fraction,
    wordsFraction: wordsFraction,
    whole: parsed.whole,
    formatted: formatted,
    formattedWithCode: formatted + ' ' + currency.code,
    format: requestedFormat,
    formats: formats,
    english: selected.en,
    // A caller requesting 'check' for Arabic (which has no check style)
    // falls back to the financial Arabic wording rather than emitting
    // undefined — the same "don't guess, don't break, fall back to the
    // verified default" posture used everywhere else in this codebase.
    arabic: selected.ar !== undefined ? selected.ar : financialAr
  };
}

/* ----------------------------------------------------------------------
   Bulk conversion
   ----------------------------------------------------------------------
   Thin batch wrapper around convertAmount -- one amount per line, same
   currency/custom/options for the whole batch. Deliberately reuses
   convertAmount() for every line rather than re-implementing any
   parsing/formatting/wording logic, so bulk results are byte-for-byte
   identical to converting each line one at a time (same code path the
   golden fixture already exhaustively covers -- no new arithmetic to
   regress). Blank lines are skipped; every non-blank line keeps its
   original 1-based line number for error reporting even when earlier
   blank lines were skipped.
   ---------------------------------------------------------------------- */

/** Hard cap on lines processed per batch, protecting the UI from a
 *  pathologically large paste. Not a "real" limit -- amounts above this
 *  are almost certainly a mistaken paste (e.g. a whole spreadsheet column
 *  by accident), and the caller is told exactly how many were dropped. */
export const MAX_BULK_LINES = 2000;

/**
 * convertBulkAmounts(rawText, currencyCode, custom, options)
 *  -> { rows: [{ line, raw, ok, ...convertAmount() result }], truncated }
 *
 * `rows` has one entry per non-blank input line, each shaped exactly like
 * a single convertAmount() call's return value (plus `line`/`raw`), so a
 * failed row carries { ok:false, code } the same way a single bad amount
 * does -- no separate bulk-only error vocabulary to keep in sync.
 */
export function convertBulkAmounts(rawText, currencyCode, custom, options) {
  const allLines = String(rawText || '').split(/\r\n|\r|\n/);

  const nonBlank = [];
  allLines.forEach(function (text, i) {
    const raw = text.trim();
    if (raw !== '') nonBlank.push({ line: i + 1, raw: raw });
  });

  const truncated = nonBlank.length > MAX_BULK_LINES;
  const toProcess = truncated ? nonBlank.slice(0, MAX_BULK_LINES) : nonBlank;

  const rows = toProcess.map(function (item) {
    const result = convertAmount(item.raw, currencyCode, custom, options);
    return Object.assign({ line: item.line, raw: item.raw }, result);
  });

  return { rows: rows, truncated: truncated, totalLines: nonBlank.length };
}

export { CURRENCIES, CURRENCY_CODES };
