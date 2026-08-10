/* =========================================================================
   Numbers to Words Converter — English & Arabic number-to-words generation
   Pure logic. No DOM access. Safe for financial use (string / BigInt based).
   Extracted verbatim (behavior-for-behavior) from numbers-to-words.html's
   inline __NTW_CORE_A__ during the Vanilla-JS/ES-modules migration.

   Arabic grammar notes (Modern Standard Arabic, financial register):

   * Reverse gender agreement (التمييز المعدود) for 3-10: the numeral takes
     the OPPOSITE gender of the counted noun, so a masculine noun such as
     "ريال" is counted with "ثلاثة", a feminine noun such as "ليرة" with "ثلاث".
   * 1 and 2 agree normally, and are expressed by the noun itself
     (singular / dual) rather than by a numeral.
   * Form of the counted noun, decided by r = n mod 100:
       r = 0        -> singular, genitive  (مئة ريالٍ / ألف ريالٍ)
       r = 1 or 2   -> singular
       r = 3 .. 10  -> plural, genitive    (خمسة ريالاتٍ)
       r = 11 .. 99 -> singular, accusative(خمسون ريالاً)
   * Idafa (إضافة): a dual immediately preceding the noun it counts drops
     its final nun — مئتان + ريال => "مئتا ريال", ألفان + ريال => "ألفا ريال".
   ========================================================================= */

const FATHATAN = 'ً'; // Arabic tanwin fath ( ً )

/* ---- English ---- */

const EN_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
  'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty',
  'Seventy', 'Eighty', 'Ninety'];

// Short scale. Index = group position (0 = units).
const EN_SCALES = ['', 'Thousand', 'Million', 'Billion', 'Trillion',
  'Quadrillion', 'Quintillion', 'Sextillion', 'Septillion', 'Octillion',
  'Nonillion', 'Decillion'];

function enUnder1000(n) {
  const parts = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h) parts.push(EN_ONES[h] + ' Hundred');
  if (r) {
    if (r < 20) {
      parts.push(EN_ONES[r]);
    } else {
      const t = Math.floor(r / 10), u = r % 10;
      parts.push(u ? EN_TENS[t] + '-' + EN_ONES[u] : EN_TENS[t]);
    }
  }
  return parts.join(' ');
}

/** Split a digit string into 3-digit groups, most significant first. */
function splitGroups(digits) {
  const groups = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(parseInt(digits.slice(Math.max(0, end - 3), end), 10));
  }
  return groups;
}

/** numberToEnglishWords(BigInt) -> "One Hundred Twenty-Three Thousand ..." */
export function numberToEnglishWords(value) {
  const digits = value.toString();
  if (digits === '0') return 'Zero';
  const groups = splitGroups(digits);
  const top = groups.length - 1; // scale index of first group
  const out = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g === 0) continue;
    const scale = EN_SCALES[top - i];
    out.push(enUnder1000(g) + (scale ? ' ' + scale : ''));
  }
  return out.join(' ');
}

/* ---- Arabic ---- */

const AR_ONES_M = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة',
  'سبعة', 'ثمانية', 'تسعة', 'عشرة'];

const AR_ONES_F = ['', 'واحدة', 'اثنتان', 'ثلاث', 'أربع', 'خمس', 'ست',
  'سبع', 'ثمان', 'تسع', 'عشر'];

// index 1..9 -> 11..19
const AR_TEENS_M = ['', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر',
  'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

const AR_TEENS_F = ['', 'إحدى عشرة', 'اثنتا عشرة', 'ثلاث عشرة', 'أربع عشرة',
  'خمس عشرة', 'ست عشرة', 'سبع عشرة', 'ثمان عشرة', 'تسع عشرة'];

const AR_TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون',
  'سبعون', 'ثمانون', 'تسعون'];

const AR_HUNDREDS = ['', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة',
  'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة'];

const AR_ZERO = 'صفر';
export const AR_ONLY = 'فقط لا غير'; // Saudi cheque/banking closing convention
export const AR_AND = ' و'; // wa- prefix: joined to the following word

/**
 * Scale words. Each carries the four grammatical forms required by the
 * tamyiz rules above, plus the construct (nun-dropped) dual.
 */
function scale(sing, plural) {
  return {
    s: sing,
    d: sing + 'ان',           // ألفان
    dc: sing + 'ا',           // ألفا  (construct / idafa)
    p: plural,
    a: sing + 'ا' + FATHATAN  // ألفاً
  };
}

const AR_SCALES = [
  null,
  scale('ألف', 'آلاف'),           // ألف / آلاف
  scale('مليون', 'ملايين'),        // مليون / ملايين
  scale('مليار', 'مليارات'),       // مليار
  scale('تريليون', 'تريليونات'),
  scale('كوادريليون', 'كوادريليونات'),
  scale('كوينتليون', 'كوينتليونات'),
  scale('سكستليون', 'سكستليونات'),
  scale('سبتليون', 'سبتليونات'),
  scale('أوكتليون', 'أوكتليونات'),
  scale('نونيليون', 'نونيليونات'),
  scale('ديسيليون', 'ديسيليونات')
];

/**
 * Endings rewritten when the word is the LAST one before a noun annexed to
 * it (idafa). Two transformations are needed:
 *   - a dual drops its final nun:     ألفان ريال  -> ألفا ريال
 *   - an accusative tamyiz drops its  خمسون ألفاً ريال -> خمسون ألف ريال
 *     tanwin, because an annexed noun cannot carry one.
 * Deliberately excludes اثنان: that numeral is never in idafa here.
 */
const AR_CONSTRUCT_PAIRS = (function () {
  const pairs = [['مئتان', 'مئتا']]; // مئتان -> مئتا
  for (let i = 1; i < AR_SCALES.length; i++) {
    pairs.push([AR_SCALES[i].d, AR_SCALES[i].dc]); // ألفان -> ألفا
    pairs.push([AR_SCALES[i].a, AR_SCALES[i].s]);  // ألفاً  -> ألف
  }
  return pairs;
})();

export function applyConstructState(text) {
  for (let i = 0; i < AR_CONSTRUCT_PAIRS.length; i++) {
    const dual = AR_CONSTRUCT_PAIRS[i][0];
    if (text.length >= dual.length && text.slice(-dual.length) === dual) {
      return text.slice(0, text.length - dual.length) + AR_CONSTRUCT_PAIRS[i][1];
    }
  }
  return text;
}

/**
 * 1..999 in Arabic, agreeing with the gender of the counted noun.
 * `omitFinalOneOrTwo`: when the group's own last two digits are exactly
 * 01 or 02, leave that final "one"/"two" out of the digit-spelling
 * entirely. Compound amounts ending in 1 or 2 (101, 1001, 2002, ...) do
 * not say "[number] وواحد [noun]" — MSA numeral-noun agreement instead
 * places the noun immediately after the higher digits and lets "واحد"/
 * the dual noun carry the agreement afterward: "مائة وريال واحد", never
 * "مئة وواحد ريال" (verified against Arabic grammar references on
 * numeral-counted-noun agreement for 1 and 2, since these two numbers
 * are the ones that follow rather than precede their counted noun).
 * The caller is responsible for appending that agreeing noun form.
 */
export function arUnder1000(n, gender, omitFinalOneOrTwo) {
  const ones = (gender === 'f') ? AR_ONES_F : AR_ONES_M;
  const teens = (gender === 'f') ? AR_TEENS_F : AR_TEENS_M;
  const parts = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h) parts.push(AR_HUNDREDS[h]);
  if (r) {
    if (omitFinalOneOrTwo && (r === 1 || r === 2)) {
      // handled by the caller via noun agreement — nothing to add here
    } else if (r <= 10) {
      parts.push(ones[r]);
    } else if (r < 20) {
      parts.push(teens[r - 10]);
    } else {
      const t = Math.floor(r / 10), u = r % 10;
      parts.push(u ? ones[u] + AR_AND + AR_TENS[t] : AR_TENS[t]);
    }
  }
  return parts.join(AR_AND);
}

/**
 * One scale group (thousands, millions, ...). The scale word is itself the
 * counted noun, and it is always masculine, so the numeral uses masculine
 * agreement.
 */
export function arScaleGroup(count, sc) {
  if (count === 1) return sc.s;    // ألف
  if (count === 2) return sc.d;    // ألفان
  const r = count % 100;
  const num = arUnder1000(count, 'm');
  if (r >= 3 && r <= 10) return num + ' ' + sc.p; // ثلاثة آلاف
  if (r >= 11) return num + ' ' + sc.a;           // ثلاثة وعشرون ألفاً
  return applyConstructState(num) + ' ' + sc.s;   // مئتا ألف / مئة ألف
}

/**
 * numberToArabicWords(BigInt, gender of the counted noun, omitFinalOneOrTwo)
 * omitFinalOneOrTwo only ever applies to the units group (idx === 0),
 * since r = value % 100 — the condition this whole file's r-based
 * grammar dispatch keys off — is entirely determined by that group.
 */
export function numberToArabicWords(value, gender, omitFinalOneOrTwo) {
  const digits = value.toString();
  if (digits === '0') return AR_ZERO;
  const groups = splitGroups(digits);
  const top = groups.length - 1;
  const parts = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g === 0) continue;
    const idx = top - i;
    if (idx === 0) {
      const piece = arUnder1000(g, gender, omitFinalOneOrTwo);
      if (piece) parts.push(piece);
    } else {
      parts.push(arScaleGroup(g, AR_SCALES[idx]));
    }
  }
  return parts.join(AR_AND);
}
