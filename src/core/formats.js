/* =========================================================================
   Output-format architecture (Phase 1 of Product Expansion).
   Three styles for an amount's word rendering:

   - "financial" (the ORIGINAL, only, unnamed default before this phase):
     <words> <currency> and <XX>/100 Only. Omits "and XX/100" entirely
     when the fraction is exactly zero. This is what buildEnglish/
     buildArabic in amount.js have always produced -- unchanged, still
     the default when no format is requested, still what every existing
     test and the golden fixture assert against.

   - "standard": bare number words, no currency name, no fraction at all.
     Genuinely a different, simpler product: "how do I spell this integer
     out," not "how do I write this amount on a financial document."

   - "check" (ENGLISH ONLY -- see below): Western/US cheque-writing
     convention, e.g. "One Hundred Twenty-Five Thousand Four Hundred
     Fifty and 75/100 Dollars Only" -- the fraction moves BEFORE the
     currency name, and unlike "financial," a real cheque's fraction line
     is conventionally printed even at 00/100 (it exists specifically so
     nothing can be inserted after it -- omitting it defeats that
     purpose), so this format never suppresses it.

   Why "check" is English-only: this reordering is a specifically
   English/Western banking-document convention. Arabic financial
   documents (LCs, guarantees, cheques) use the same word order
   regardless of document type -- there is no verified authoritative
   source for a distinct Arabic "cheque style" reordering, and inventing
   one would be exactly the kind of unverified assumption this project
   has avoided everywhere else. Rather than guess, "check" simply is not
   offered for Arabic; "standard" and "financial" are available in both
   languages.
   ========================================================================= */

import { numberToEnglishWords, numberToArabicWords } from './number-to-words.js';

// Deliberately NOT imported from amount.js: amount.js will import this
// module to assemble its `formats` object, so importing back would create
// a circular dependency. The English currency-name selection is a trivial
// one-line ternary -- duplicating it here is safer than a circular import.
function currencyNameEnglish(currency, whole) {
  return (whole === 1n) ? currency.nameEnglish : currency.nameEnglishPlural;
}

export const FORMATS_EN = ['standard', 'financial', 'check'];
export const FORMATS_AR = ['standard', 'financial'];

/** Which format ids are valid for a given language. */
export function availableFormats(lang) {
  return lang === 'ar' ? FORMATS_AR.slice() : FORMATS_EN.slice();
}

/* ---- standard: bare number words, no currency, no fraction ---- */

export function buildEnglishStandard(whole) {
  return numberToEnglishWords(whole);
}

/**
 * Arabic cardinal numbers agree in gender with the noun they count. With
 * no currency noun in play (that's the whole point of "standard"), there
 * is nothing to agree with -- masculine is the conventional default form
 * used when reciting/spelling a number in isolation (e.g. counting
 * "واحد، اثنان، ثلاثة..."), so that's what this always uses, regardless
 * of the selected currency's own grammatical gender.
 */
export function buildArabicStandard(whole) {
  return numberToArabicWords(whole, 'm');
}

/* ---- check: US/Western cheque convention, English only ---- */

export function buildEnglishCheck(whole, fraction, currency) {
  const words = numberToEnglishWords(whole);
  const name = currencyNameEnglish(currency, whole);
  return words + ' and ' + fraction + '/100 ' + name + ' Only';
}
