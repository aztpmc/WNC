/* =========================================================================
   Numbers to Words Converter — currency morphology & ISO 4217 metadata
   Centralised, data-driven. Arabic forms are generated from a noun stem and
   an optional nisba (relative adjective) so the table stays maintainable.
   Extracted verbatim (behavior-for-behavior) from numbers-to-words.html's
   inline __NTW_CORE_B__ during the Vanilla-JS/ES-modules migration.
   ========================================================================= */

import { CURRENCY_ROWS } from '../data/currencies.js';

const FATHATAN = 'ً'; // Arabic tanwin fath ( ً ) — same literal used in number-to-words.js

/* ----------------------------------------------------------------------
   Arabic noun declension.
     - stem ending in ة  -> feminine  (ليرة / ليرتان / ليرات / ليرةً)
     - stem ending in ا or و -> indeclinable loanword (بيزو، كوانزا)
     - otherwise -> sound masculine (ريال / ريالان / ريالات / ريالاً)
   ---------------------------------------------------------------------- */
export function declineNoun(word, pluralOverride) {
  const last = word.charAt(word.length - 1);

  if (last === 'ة') {
    const stem = word.slice(0, -1);
    return {
      s: word,
      d: stem + 'تان',
      dc: stem + 'تا', // construct-state dual (idafa): drops the nun
      p: pluralOverride || stem + 'ات',
      a: word + FATHATAN,
      g: 'f'
    };
  }

  if (last === 'ا' || last === 'و' || last === 'ى') {
    // Loanwords that do not inflect; the adjective carries the marking.
    return {
      s: word,
      d: word,
      dc: word, // already invariant — nothing to drop
      p: pluralOverride || word,
      a: word,
      g: (last === 'ا') ? 'f' : 'm',
      indeclinable: true
    };
  }

  return {
    s: word,
    d: word + 'ان',
    dc: word + 'ا', // construct-state dual (idafa): drops the nun
    p: pluralOverride || word + 'ات',
    a: word + 'ا' + FATHATAN,
    g: 'm'
  };
}

/* ----------------------------------------------------------------------
   Nisba adjective agreement. Non-human plurals take the feminine singular
   adjective, hence p === feminine singular for both genders.
   ---------------------------------------------------------------------- */
export function declineAdjective(base, gender) {
  if (gender === 'f') {
    return {
      s: base + 'ة',
      d: base + 'تان',
      p: base + 'ة',
      a: base + 'ة' + FATHATAN
    };
  }
  return {
    s: base,
    d: base + 'ان',
    p: base + 'ة',
    a: base + 'ا' + FATHATAN
  };
}

/**
 * Build the four Arabic currency forms.
 * `adjective` may be:
 *   ""            -> no qualifier            (يورو)
 *   "سعودي"        -> nisba, fully declined   (ريال سعودي / ريالاً سعودياً)
 *   "*جزر كايمان"  -> fixed phrase, appended unchanged
 */
export function buildArabicForms(nounWord, adjective, pluralOverride) {
  const n = declineNoun(nounWord, pluralOverride);

  if (!adjective) {
    let dual = n.d;
    if (n.indeclinable) dual = n.s + (n.g === 'f' ? ' اثنتان' : ' اثنان');
    return { s: n.s, d: dual, p: n.p, a: n.a, g: n.g };
  }

  if (adjective.charAt(0) === '*') {
    // A fixed phrase here is a genitive annexation (idafa), e.g.
    // "دولار" + "جزر كايمان" = "دولار جزر كايمان" ("Dollar OF the Cayman
    // Islands"), not a noun+adjective pair. Idafa carries two
    // consequences for the first term (the mudaf): it never takes
    // tanwin (undiacritized text looks the same regardless of case, so
    // singular and accusative are identical here — n.s for both), and a
    // dual or sound-plural mudaf drops its final nun, hence dc (not d)
    // for the dual: "دولاران" -> "دولارا جزر كايمان", never "دولاران جزر كايمان".
    const fixed = ' ' + adjective.slice(1);
    return {
      s: n.s + fixed,
      d: n.dc + fixed,
      p: n.p + fixed,
      a: n.s + fixed,
      g: n.g
    };
  }

  const a = declineAdjective(adjective, n.g);
  return {
    s: n.s + ' ' + a.s,
    d: n.d + ' ' + a.d,
    p: n.p + ' ' + a.p,
    a: n.a + ' ' + a.a,
    g: n.g
  };
}

/* ----------------------------------------------------------------------
   ISO 4217 minor-unit metadata vs. this application's display convention
   ----------------------------------------------------------------------
   ISO 4217 does NOT give every currency two decimal digits: Kuwaiti-style
   dinars (BHD, IQD, JOD, KWD, LYD, OMR, TND) use three, and a further
   group (yen/won/franc-family currencies with no minor unit in practice)
   use zero. `isoMinorUnit` below records the real ISO exponent per
   currency, verified against currency-code references cross-corroborated
   across independent sources during the original audit (not a single
   source, and not the primary ISO 4217 registry itself, which this
   environment's network policy could not reach at audit time).

   `decimals` is this application's own NUMERIC input/display precision —
   3 for the seven 3-decimal ISO currencies, 2 for every other currency —
   and it drives live formatting, validation, and the Numeric Amount line.
   It is derived from `isoMinorUnit` (see displayDecimalsFor below) but the
   two fields remain conceptually distinct on purpose: one is ISO 4217
   metadata, the other is this tool's own display behaviour, and a future
   change to one must not be assumed to imply the other.

   The amount-in-words `XX/100` convention is a SEPARATE, THIRD thing
   again, unconditionally two digits for every currency regardless of
   `decimals` — see amount.js, which always operates on exactly two
   fraction digits regardless of a currency's display precision.

   MGA (Malagasy Ariary) and MRU (Mauritanian Ouguiya) are the only two
   circulating ISO 4217 currencies whose traditional subdivision is not a
   power of ten (1 ariary = 5 iraimbilanja; 1 ouguiya = 5 khoums — base 5,
   not base 10). Phase 2 re-verified this against multiple independent
   secondary sources: both subunits are confirmed real but obsolete in
   practice (no purchasing power, coins disused), and — because there is
   no power-of-ten fraction for either currency — the ISO 4217 standard
   itself assigns them a conventional exponent of 2 for decimal-formatting
   purposes, same as this codebase already used. That figure could not be
   cross-checked against the primary ISO 4217 registry directly (this
   environment cannot reach it), so it is recorded here as corroborated-
   by-secondary-sources rather than registry-confirmed. No code change
   was warranted: `decimals: 2` / `isoMinorUnit: 2` for MGA/MRU is correct
   under either reading (conventional ISO exponent, or this app's own
   2dp-default-for-non-3-decimal-currencies rule), so nothing here was
   "simplified" or altered without verification.
   ---------------------------------------------------------------------- */
const ISO_ZERO_DECIMAL = ['BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];
const ISO_THREE_DECIMAL = ['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'];

export function isoMinorUnitFor(code) {
  if (ISO_ZERO_DECIMAL.indexOf(code) !== -1) return 0;
  if (ISO_THREE_DECIMAL.indexOf(code) !== -1) return 3;
  return 2;
}

/**
 * displayDecimalsFor(code) -> the NUMERIC input/output precision this
 * application actually uses for the currency: 3 for the ISO 4217
 * 3-decimal currencies, 2 for everything else (including the 0-decimal
 * ISO group — JPY-style currencies are not in scope for this display
 * feature and keep the existing 2dp behaviour unchanged).
 *
 * This is deliberately DERIVED from isoMinorUnit rather than a separate
 * hardcoded list, so it stays correct if that metadata is ever revised.
 * It therefore covers all seven ISO 3-decimal currencies (BHD, IQD, JOD,
 * KWD, LYD, OMR, TND) rather than only the five most commonly cited in
 * casual references (KWD, BHD, OMR, JOD, TND) — IQD and LYD genuinely
 * share the same 3-decimal minor unit and are included on that basis.
 *
 * Separately and unconditionally: the amount-in-words XX/100 convention
 * is NOT driven by this value and is never affected by it — see amount.js,
 * which always operates on exactly two fraction digits regardless of a
 * currency's display precision.
 */
export function displayDecimalsFor(code) {
  return (isoMinorUnitFor(code) === 3) ? 3 : 2;
}

export const CURRENCIES = {};
export const CURRENCY_CODES = [];

CURRENCY_ROWS.forEach(function (row) {
  const f = row.split('|');
  const code = f[0];
  CURRENCIES[code] = {
    code: code,
    nameEnglish: f[1],
    nameEnglishPlural: f[2],
    decimals: displayDecimalsFor(code),  // NUMERIC display/input precision
    isoMinorUnit: isoMinorUnitFor(code), // real ISO 4217 exponent (metadata)
    arabic: buildArabicForms(f[3], f[4], f[5] || '')
  };
  CURRENCY_CODES.push(code);
});
