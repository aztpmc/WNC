/* =========================================================================
   Numbers to Words Converter — input parsing & validation
   Pure logic. No DOM access. Safe for financial use (string / BigInt based).
   Extracted verbatim (behavior-for-behavior) from numbers-to-words.html's
   inline __NTW_CORE_A__ during the Vanilla-JS/ES-modules migration.
   ========================================================================= */

export const MAX_INT_DIGITS = 36; // up to 999...999 (36 digits) = < 10^36

// \s plus NBSP, narrow-no-break-space, and the General Punctuation space
// block (EN QUAD..ZERO WIDTH SPACE) -- named + escaped explicitly so the
// pattern is unambiguous in source rather than relying on invisible
// literal whitespace characters inside a character class.
export const WHITESPACE_RE = /[\s\u00A0\u202F\u2000-\u200B]/g;

// Arabic-Indic and Eastern Arabic-Indic digits -> ASCII
const DIGIT_MAP = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٫': '.', // Arabic decimal separator
  '٬': ','  // Arabic thousands separator
};

function normalizeDigits(raw) {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charAt(i);
    out += (DIGIT_MAP[ch] !== undefined) ? DIGIT_MAP[ch] : ch;
  }
  return out;
}

/**
 * validateInput(raw, maxDecimals)
 * Returns { ok:true, integer:"123456", fraction:"78" }
 *      or { ok:false, code:"ERROR_CODE" }
 * Never rounds, never silently repairs a malformed amount.
 * maxDecimals is the selected currency's own minor-unit precision (2 for
 * almost every currency, 3 for KWD/BHD/OMR/JOD/TND) -- defaults to 2 so
 * any caller that predates currency-aware precision keeps working
 * unchanged. This is purely how many fraction digits the NUMERIC value
 * may carry; it has no bearing on the separate amount-in-words /100
 * convention, which always operates on exactly two digits regardless.
 */
export function validateInput(raw, maxDecimals) {
  if (maxDecimals !== 2 && maxDecimals !== 3) maxDecimals = 2;
  if (raw === null || raw === undefined) return { ok: false, code: 'EMPTY' };

  let s = normalizeDigits(String(raw));
  s = s.replace(WHITESPACE_RE, ''); // all whitespace incl. NBSP / thin space

  if (s === '') return { ok: false, code: 'EMPTY' };

  if (s.charAt(0) === '+') s = s.slice(1);
  if (s.indexOf('-') !== -1 || s.indexOf('−') !== -1) {
    return { ok: false, code: 'NEGATIVE' };
  }
  if (s === '') return { ok: false, code: 'EMPTY' };

  if (!/^[0-9.,]+$/.test(s)) return { ok: false, code: 'INVALID_CHARS' };

  const dots = s.split('.').length - 1;
  if (dots > 1) return { ok: false, code: 'MULTIPLE_DECIMALS' };

  let intPart, fracPart;
  if (dots === 1) {
    const pieces = s.split('.');
    intPart = pieces[0];
    fracPart = pieces[1];
  } else {
    intPart = s;
    fracPart = '';
  }

  // Fraction: digits only, at most the selected currency's precision.
  // Never round or truncate a digit the user actually entered.
  if (fracPart.indexOf(',') !== -1) return { ok: false, code: 'INVALID_CHARS' };
  if (fracPart.length > maxDecimals) return { ok: false, code: 'TOO_MANY_DECIMALS' };

  // Integer part: either plain digits, or correctly grouped in threes.
  if (intPart === '') {
    if (fracPart === '') return { ok: false, code: 'NO_DIGITS' };
    intPart = '0'; // ".50" -> "0.50"
  } else if (intPart.indexOf(',') !== -1) {
    if (!/^\d{1,3}(,\d{3})+$/.test(intPart)) return { ok: false, code: 'BAD_COMMAS' };
    intPart = intPart.replace(/,/g, '');
  } else if (!/^\d+$/.test(intPart)) {
    return { ok: false, code: 'INVALID_CHARS' };
  }

  // Strip leading zeros (keep at least one digit).
  intPart = intPart.replace(/^0+(?=\d)/, '');
  if (intPart.length > MAX_INT_DIGITS) return { ok: false, code: 'TOO_LARGE' };

  // Pad the fraction to the currency's exact precision: "7" -> "70" (2dp)
  // or "700" (3dp); "" -> "00"/"000".
  while (fracPart.length < maxDecimals) fracPart += '0';

  return { ok: true, integer: intPart, fraction: fracPart };
}

/**
 * parseAmount(raw, maxDecimals) -> { ok, whole:BigInt, integer:String, fraction:String }
 */
export function parseAmount(raw, maxDecimals) {
  const v = validateInput(raw, maxDecimals);
  if (!v.ok) return v;
  return {
    ok: true,
    integer: v.integer,
    fraction: v.fraction,
    whole: BigInt(v.integer)
  };
}

/* ---- Numeric formatting — always 1,234,567.89 ---- */

export function groupThousands(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** formatAmount("123456","78") -> "123,456.78" */
export function formatAmount(integer, fraction) {
  return groupThousands(integer) + '.' + fraction;
}
