/* =========================================================================
   Public API compatibility layer.
   Re-exports the exact same shape the original monolithic
   numbers-to-words.html exposed as `window.NumbersToWords`, so nothing
   consuming that surface breaks as a result of the internal module split.
   ========================================================================= */

import { validateInput, parseAmount, formatAmount, MAX_INT_DIGITS } from './parser.js';
import { numberToEnglishWords, numberToArabicWords } from './number-to-words.js';
import {
  getCurrency,
  formatCurrencyEnglish,
  formatCurrencyArabic,
  convertAmount,
  convertBulkAmounts,
  MAX_BULK_LINES,
  CURRENCIES,
  CURRENCY_CODES
} from './amount.js';
import { availableFormats } from './formats.js';

export const NumbersToWords = {
  validateInput,
  parseAmount,
  formatAmount,
  numberToEnglishWords,
  numberToArabicWords,
  getCurrency,
  formatCurrencyEnglish,
  formatCurrencyArabic,
  convertAmount,
  availableFormats, // new in Phase 1 (output formats) — additive, nothing removed
  convertBulkAmounts, // new in Phase 3 (bulk conversion) — additive, nothing removed
  MAX_BULK_LINES,
  CURRENCIES,
  CURRENCY_CODES,
  MAX_INT_DIGITS
};

export default NumbersToWords;
