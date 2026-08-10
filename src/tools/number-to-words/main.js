/* =========================================================================
   Numbers to Words Converter — User interface
   Presentation only; every conversion goes through NumbersToWords (core).
   Extracted verbatim (behavior-for-behavior) from numbers-to-words.html's
   inline `interface` script during the Vanilla-JS/ES-modules migration.
   The only deliberate change: the embedded developer self-test array and
   window.__ntwSelfTest() are REMOVED here -- they are now the committed,
   CI-runnable tests/core/*.test.js suite instead of an unwired in-browser
   dev tool, so keeping both would just be duplicated dead weight.
   ========================================================================= */

import { NumbersToWords as NTW } from '../../core/index.js';
import { en } from '../../i18n/en.js';
import { ar } from '../../i18n/ar.js';

const $ = (id) => document.getElementById(id);

/* ----------------------------------------------------------------------
   Interface strings
   ---------------------------------------------------------------------- */
const I18N = { en: en.numbersToWords, ar: ar.numbersToWords };

let lang = 'en';
const t = () => I18N[lang];

/**
 * Remember the interface language across visits — nothing financial is
 * ever written to storage, only the two-letter language code.
 */
const LANG_STORAGE_KEY = 'ntw-language';
function readStoredLanguage() {
  try {
    const v = window.localStorage.getItem(LANG_STORAGE_KEY);
    return (v === 'ar' || v === 'en') ? v : null;
  } catch (e) { return null; }
}
function storeLanguage(v) {
  try { window.localStorage.setItem(LANG_STORAGE_KEY, v); } catch (e) { /* storage unavailable — ignore */ }
}

/* ----------------------------------------------------------------------
   Currency selection
   ----------------------------------------------------------------------
   Two controls, two clearly separated jobs:
     #currency        — a native <select>. Its value IS selectedCurrency,
                         so there is no text field that could ever end up
                         holding a stale label for new typing to land on
                         top of.
     #currencyFilter  — a pure, ephemeral search query. It is blanked the
                         moment it's done being used — on pick, and on
                         blur — so the next time the user clicks in there
                         is no leftover text to accidentally append to.
   selectedCurrency is the one authoritative piece of state; the filter
   text is never a source of truth for it, and filtering alone (without
   an explicit pick) never changes it.
   ---------------------------------------------------------------------- */
const currencySelect = $('currency');
const currencyFilter = $('currencyFilter');
const formatSelect = $('format');

// Default currency follows the interface language the page is about to
// start in: USD for English, SAR for Arabic.
let selectedCurrency = (readStoredLanguage() === 'ar') ? 'SAR' : 'USD';

// Output style: 'standard' | 'financial' | 'check'. 'check' only exists
// for English (see src/core/formats.js) -- populateFormatSelect() below
// keeps this in sync whenever the language changes.
let selectedFormat = 'financial';

const FORMAT_LABEL_KEY = { standard: 'formatStandard', financial: 'formatFinancial', check: 'formatCheck' };

/** Rebuild the format <select>'s options for the current language, and
 *  fall back to 'financial' if the previously-selected format (e.g.
 *  'check') doesn't exist in the language just switched to. */
function populateFormatSelect() {
  const available = NTW.availableFormats(lang);
  if (available.indexOf(selectedFormat) === -1) selectedFormat = 'financial';

  formatSelect.innerHTML = '';
  available.forEach((id) => {
    const o = document.createElement('option');
    o.value = id;
    o.textContent = t()[FORMAT_LABEL_KEY[id]];
    formatSelect.appendChild(o);
  });
  formatSelect.value = selectedFormat;
}

function currencyLabel(code) {
  if (code === 'CUSTOM') return t().customOption;
  const c = NTW.CURRENCIES[code];
  return code + ' — ' + (lang === 'ar' ? c.arabic.s : c.nameEnglish);
}

function currencyMatches(code, q) {
  if (!q) return true;
  if (code === 'CUSTOM') return t().customOption.toLowerCase().indexOf(q) !== -1;
  const c = NTW.CURRENCIES[code];
  return code.toLowerCase().indexOf(q) !== -1 ||
    c.nameEnglish.toLowerCase().indexOf(q) !== -1 ||
    c.nameEnglishPlural.toLowerCase().indexOf(q) !== -1 ||
    c.arabic.s.indexOf(q) !== -1;
}

/** Rebuild the <select>'s options from the given filter query. Filtering
 *  never touches selectedCurrency — only what is visible to pick from. */
function populateCurrencySelect(query) {
  const q = (query || '').trim().toLowerCase();
  const codes = NTW.CURRENCY_CODES.filter((code) => currencyMatches(code, q));
  codes.push('CUSTOM');

  currencySelect.innerHTML = '';
  codes.forEach((code) => {
    const o = document.createElement('option');
    o.value = code;
    o.textContent = currencyLabel(code);
    currencySelect.appendChild(o);
  });

  if (codes.indexOf(selectedCurrency) !== -1) currencySelect.value = selectedCurrency;
}

/** Re-render the <select>'s options (e.g. after the interface language
 *  changes, since labels are localized) without ever touching what the
 *  user has typed into the Find-currency box — applying or refreshing a
 *  currency selection must never erase their search text. */
function refreshCurrencySelect() {
  populateCurrencySelect(currencyFilter.value);
  if (NTW.CURRENCY_CODES.indexOf(selectedCurrency) !== -1 || selectedCurrency === 'CUSTOM') {
    currencySelect.value = selectedCurrency;
  }
}

/* ----------------------------------------------------------------------
   Language
   ---------------------------------------------------------------------- */
function setLanguage(next) {
  lang = (next === 'ar') ? 'ar' : 'en';
  storeLanguage(lang);
  const d = document.documentElement;
  d.lang = lang;
  d.dir = (lang === 'ar') ? 'rtl' : 'ltr';

  const dict = t();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    // hintAmount is a function (currency-decimal-aware), not a plain
    // string — handled separately by updateAmountHint below.
    if (dict[key] === undefined || key === 'hintAmount') return;
    el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
  });
  $('langEn').setAttribute('aria-pressed', String(lang === 'en'));
  $('langAr').setAttribute('aria-pressed', String(lang === 'ar'));

  refreshCurrencySelect();
  populateFormatSelect();
  updateAmountHint();
  if ($('error').classList.contains('show')) showError(lastErrorCode);
  convert(false);
  renderBulkResults();
}

/** Keeps the "maximum N decimal places" hint in sync with whichever
 *  currency is currently selected, since KWD/BHD/OMR/JOD/TND/IQD/LYD
 *  need 3 and every other currency needs 2. */
function updateAmountHint() {
  const decimals = NTW.getCurrency(selectedCurrency, readCustom()).decimals;
  $('amountHint').textContent = t().hintAmount(decimals);
}

/* ----------------------------------------------------------------------
   Errors
   ---------------------------------------------------------------------- */
let lastErrorCode = null;

function showError(code) {
  lastErrorCode = code;
  const box = $('error');
  let msg = t().err[code] || t().err.NO_DIGITS;
  if (typeof msg === 'function') {
    msg = msg(NTW.getCurrency(selectedCurrency, readCustom()).decimals);
  }
  box.textContent = msg;
  box.classList.add('show');
}
function clearError() {
  lastErrorCode = null;
  $('error').classList.remove('show');
  $('error').textContent = '';
}

/* ----------------------------------------------------------------------
   Conversion
   ---------------------------------------------------------------------- */
function readCustom() {
  return {
    code: $('cCode').value,
    nameEnglish: $('cEnS').value,
    nameEnglishPlural: $('cEnP').value,
    arabicSingular: $('cArS').value,
    arabicDual: $('cArD').value,
    arabicPlural: $('cArP').value,
    arabicAccusative: $('cArA').value,
    gender: $('cGender').value
  };
}

// Whether the result fields currently hold a real conversion (as opposed
// to being blank because nothing valid has been entered yet). The
// Conversion Result section itself is always visible; this only governs
// whether the Copy buttons have anything to act on.
let hasResult = false;

function clearResultFields() {
  hasResult = false;
  $('outNumeric').textContent = '';
  $('outEnglish').textContent = '';
  $('outArabic').textContent = '';
}

/* ----------------------------------------------------------------------
   Bulk conversion
   ----------------------------------------------------------------------
   One amount per line, sharing the currency/format/custom-currency
   controls above -- no separate picker to keep in sync. Each row from
   NTW.convertBulkAmounts() already carries both `english` and `arabic`
   (convertAmount's normal shape), so switching the interface language
   just re-renders the same stored rows against the other field -- no
   re-parsing, and never stale relative to what was actually converted.
   ---------------------------------------------------------------------- */
const bulkInput = $('bulkInput');
const bulkTableBody = $('bulkTableBody');
const bulkSummary = $('bulkSummary');
let lastBulkResult = null; // { rows, truncated, totalLines } from the last Convert All click

function bulkErrorMessage(row) {
  let msg = t().err[row.code] || t().err.NO_DIGITS;
  if (typeof msg === 'function') {
    msg = msg(NTW.getCurrency(selectedCurrency, readCustom()).decimals);
  }
  return msg;
}

function renderBulkResults() {
  bulkTableBody.innerHTML = '';

  if (!lastBulkResult || lastBulkResult.rows.length === 0) {
    bulkSummary.textContent = t().bulkEmpty;
    bulkSummary.classList.remove('has-errors');
    return;
  }

  let okCount = 0, errCount = 0;

  lastBulkResult.rows.forEach((row) => {
    const tr = document.createElement('tr');

    const tdLine = document.createElement('td');
    tdLine.textContent = String(row.line);
    tr.appendChild(tdLine);

    const tdAmount = document.createElement('td');
    tdAmount.className = 'num';
    tdAmount.textContent = row.raw;
    tr.appendChild(tdAmount);

    if (row.ok) {
      okCount++;
      const tdNumeric = document.createElement('td');
      tdNumeric.className = 'num';
      tdNumeric.textContent = row.formattedWithCode;
      tr.appendChild(tdNumeric);

      const tdWords = document.createElement('td');
      tdWords.dir = (lang === 'ar') ? 'rtl' : 'ltr';
      tdWords.textContent = (lang === 'ar') ? row.arabic : row.english;
      tr.appendChild(tdWords);
    } else {
      errCount++;
      tr.classList.add('row-error');
      const tdErr = document.createElement('td');
      tdErr.className = 'err-msg';
      tdErr.colSpan = 2;
      tdErr.textContent = bulkErrorMessage(row);
      tr.appendChild(tdErr);
    }

    bulkTableBody.appendChild(tr);
  });

  let summary = t().bulkSummary(okCount, errCount);
  if (lastBulkResult.truncated) summary += ' — ' + t().bulkTruncated(NTW.MAX_BULK_LINES);
  bulkSummary.textContent = summary;
  bulkSummary.classList.toggle('has-errors', errCount > 0);
}

function runBulkConvert() {
  const custom = readCustom();
  lastBulkResult = NTW.convertBulkAmounts(bulkInput.value, selectedCurrency, custom, { format: selectedFormat });
  renderBulkResults();
}

function copyBulkResults() {
  if (!lastBulkResult || !lastBulkResult.rows.length) return;
  const lines = lastBulkResult.rows.map((row) => {
    if (!row.ok) return row.line + '\t' + row.raw + '\t' + bulkErrorMessage(row);
    const words = (lang === 'ar') ? row.arabic : row.english;
    return row.line + '\t' + row.formattedWithCode + '\t' + words;
  });
  writeClipboard(lines.join('\n'));
}

/**
 * convert(reportEmpty) — reportEmpty=false keeps the form quiet while the
 * user is still typing; the Convert button passes true.
 */
function convert(reportEmpty) {
  const raw = $('amount').value;
  const code = selectedCurrency;
  const custom = readCustom();

  if (raw.trim() === '') {
    clearResultFields();
    if (reportEmpty) showError('EMPTY'); else clearError();
    return;
  }

  // All four Arabic grammatical forms are required, not just the
  // singular: an amount of exactly 2 relies entirely on the dual noun
  // to convey "two" (real currencies never fall back here — ar.d is
  // always a genuine dual). A blank dual defaulting to the singular
  // silently drops the number 2 from the Arabic wording rather than
  // just reading awkwardly, which is a financial-correctness problem
  // in official documentation, not merely a style one.
  if (code === 'CUSTOM' && (
    !custom.nameEnglish.trim() || !custom.arabicSingular.trim() ||
    !custom.arabicDual.trim() || !custom.arabicPlural.trim() || !custom.arabicAccusative.trim()
  )) {
    clearResultFields();
    showError('CUSTOM_INCOMPLETE');
    return;
  }

  const res = NTW.convertAmount(raw, code, custom, { format: selectedFormat });
  if (!res.ok) {
    clearResultFields();
    showError(res.code);
    return;
  }

  clearError();
  $('outNumeric').textContent = res.formattedWithCode;
  $('outEnglish').textContent = res.english;
  $('outArabic').textContent = res.arabic;
  hasResult = true;
}

/* ----------------------------------------------------------------------
   Copy / clear
   ---------------------------------------------------------------------- */
function writeClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  }
  return Promise.resolve(legacyCopy(text));
}

// file:// pages often have no async clipboard permission — fall back.
function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) { /* nothing else to try */ }
  document.body.removeChild(ta);
}

/**
 * Shows the "Copied" confirmation both visually and to assistive tech.
 * The element is `role="status"` (a live region), which only announces
 * on an actual text change — a CSS-only opacity/visibility toggle is not
 * reliably announced by screen readers, so the text is genuinely written
 * and then cleared, not just shown and hidden.
 */
function flash(id) {
  const el = $(id);
  el.textContent = t().copied;
  el.classList.add('show');
  window.setTimeout(() => {
    el.classList.remove('show');
    el.textContent = '';
  }, 1400);
}

function copyResult(which) {
  if (!hasResult) return;
  if (which === 'en') { writeClipboard($('outEnglish').textContent); flash('copiedEn'); }
  else if (which === 'ar') { writeClipboard($('outArabic').textContent); flash('copiedAr'); }
  else if (which === 'all') {
    const all = $('outNumeric').textContent + '\n' +
      $('outEnglish').textContent + '\n' + $('outArabic').textContent;
    writeClipboard(all); flash('copiedNum');
  } else {
    // Primary copy: the amount in words for the active interface language.
    const isAr = (lang === 'ar');
    writeClipboard(isAr ? $('outArabic').textContent : $('outEnglish').textContent);
    flash(isAr ? 'copiedAr' : 'copiedEn');
  }
}

function clearForm() {
  $('amount').value = '';
  selectedCurrency = (lang === 'ar') ? 'SAR' : 'USD';
  currencyFilter.value = '';
  populateCurrencySelect('');
  currencySelect.value = selectedCurrency;
  selectedFormat = 'financial';
  populateFormatSelect();
  ['cCode', 'cEnS', 'cEnP', 'cArS', 'cArD', 'cArP', 'cArA'].forEach((id) => { $(id).value = ''; });
  $('cGender').value = 'm';
  $('customPanel').hidden = true;
  clearResultFields();
  clearError();
  $('amount').focus();
}

/* ----------------------------------------------------------------------
   Live thousands-separator formatting
   ----------------------------------------------------------------------
   Reformats the amount field on every keystroke/paste while preserving
   the caret position, so the user sees 1,234,567.89 as they type rather
   than only after conversion. The decimal portion is left untouched so
   TOO_MANY_DECIMALS validation can still surface a clear message instead
   of silently truncating a financial amount.
   ---------------------------------------------------------------------- */
function groupIntegerPart(intPart) {
  return (/^\d+$/.test(intPart)) ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : intPart;
}

function reformatAmountField(el) {
  const raw = el.value;
  const selStart = (el.selectionStart === null) ? raw.length : el.selectionStart;
  const beforeCount = raw.slice(0, selStart).replace(/,/g, '').length;

  const cleaned = raw.replace(/,/g, '');
  const dotIdx = cleaned.indexOf('.');
  const intPart = (dotIdx === -1) ? cleaned : cleaned.slice(0, dotIdx);
  const rest = (dotIdx === -1) ? '' : cleaned.slice(dotIdx);
  const formatted = groupIntegerPart(intPart) + rest;

  if (formatted === raw) return;
  el.value = formatted;

  let pos = formatted.length, count = 0;
  if (beforeCount === 0) {
    pos = 0;
  } else {
    for (let i = 0; i < formatted.length; i++) {
      if (formatted.charAt(i) !== ',') count++;
      if (count === beforeCount) { pos = i + 1; break; }
    }
  }
  el.setSelectionRange(pos, pos);
}

/**
 * Adapts an already-valid amount string to a target decimal precision —
 * used both when the selected currency changes precision (e.g. SAR's 2dp
 * to KWD's 3dp, or back) and when the field settles (blur), so the
 * displayed amount always shows the currency's own precision without
 * forcing that padding on every keystroke while the user is still typing
 * (which would fight normal editing — see reformatAmountField above).
 *
 * Growing precision (e.g. 2dp -> 3dp) always pads with zeros: lossless.
 * Shrinking precision only trims trailing digits that are all zero —
 * lossless by definition. If a real (non-zero) digit would have to be
 * dropped to fit the new precision, returns null and changes nothing;
 * normal validation then surfaces a clear TOO_MANY_DECIMALS message
 * instead of silently discarding financial precision the user entered.
 */
function adaptAmountToDecimals(rawValue, targetDecimals) {
  const cleaned = rawValue.replace(/,/g, '');
  const dotIdx = cleaned.indexOf('.');
  const intPart = (dotIdx === -1) ? cleaned : cleaned.slice(0, dotIdx);
  let fracPart = (dotIdx === -1) ? '' : cleaned.slice(dotIdx + 1);
  if (!/^\d*$/.test(intPart) || (intPart === '' && fracPart === '')) return null; // not a plain valid amount

  if (fracPart.length > targetDecimals) {
    const extra = fracPart.slice(targetDecimals);
    if (!/^0*$/.test(extra)) return null; // real precision would be lost
    fracPart = fracPart.slice(0, targetDecimals);
  } else {
    while (fracPart.length < targetDecimals) fracPart += '0';
  }
  return groupIntegerPart(intPart) + (targetDecimals > 0 ? '.' + fracPart : '');
}

/* ----------------------------------------------------------------------
   Wiring
   ---------------------------------------------------------------------- */
populateCurrencySelect('');
currencySelect.value = selectedCurrency;

$('amount').addEventListener('input', function () {
  reformatAmountField(this);
  convert(false);
});
$('amount').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); convert(true); }
});
// On settle (leaving the field), pad a valid amount out to the selected
// currency's full precision — "1" becomes "1.000" for KWD — without
// forcing that on every keystroke, which would fight normal editing.
$('amount').addEventListener('blur', function () {
  if (!hasResult) return;
  const decimals = NTW.getCurrency(selectedCurrency, readCustom()).decimals;
  const adapted = adaptAmountToDecimals(this.value, decimals);
  if (adapted !== null && adapted !== this.value) this.value = adapted;
});

// A pending debounced auto-commit (see below) — any explicit commit path
// cancels it, so a delayed auto-pick can never fire after the user has
// already moved on some other way.
let pendingAutoCommit = null;
function cancelPendingAutoCommit() {
  if (pendingAutoCommit) { window.clearTimeout(pendingAutoCommit); pendingAutoCommit = null; }
}

/** Apply `code` as the selected currency — the one path the select's own
 *  change event, the filter box's Enter, and the exact-match auto-commit
 *  all funnel through, so they behave identically. Never touches the
 *  Find-currency text: applying a currency must never erase what the
 *  user typed to find it. */
function commitCurrencySelection(code) {
  cancelPendingAutoCommit();
  selectedCurrency = code;
  $('customPanel').hidden = (selectedCurrency !== 'CUSTOM');

  // Re-pad/re-trim the amount to the newly selected currency's own
  // precision (e.g. SAR's 2dp <-> KWD's 3dp) so it displays correctly
  // right away, without waiting for the user to touch the field again.
  // adaptAmountToDecimals refuses to drop any real (non-zero) digit, so
  // this never silently changes what the user actually entered.
  const newDecimals = NTW.getCurrency(code, readCustom()).decimals;
  const amountEl = $('amount');
  if (amountEl.value.trim() !== '') {
    const adapted = adaptAmountToDecimals(amountEl.value, newDecimals);
    if (adapted !== null && adapted !== amountEl.value) amountEl.value = adapted;
  }
  updateAmountHint();

  convert(false);
}

// Narrows the select's options live as the user types. Never touches
// selectedCurrency by itself — except when what's been typed is already
// an exact, unambiguous ISO code (or CUSTOM): typing "SAR" in full commits
// it automatically, the same as picking it, with no extra Enter needed.
// The commit is debounced briefly rather than instant, because a
// currency's *name* can transiently pass through its own code as a
// prefix while being typed (e.g. "Eur" en route to "Euro") — waiting a
// beat and re-checking the field still holds that exact code avoids
// locking in a pick before the user has finished typing a longer word.
// Focusing the field (by click or by Tab) selects its existing text, so
// the very next keystroke replaces it instead of appending to it. A
// plain focus-time select() is not enough: the same click that caused
// the focus also fires its own native mouseup, which collapses the
// selection back down to a caret at the click point right afterward.
// So the mousedown that is *about* to focus the (not-yet-focused) field
// is flagged, and only that click's mouseup is suppressed — a later
// click made while the field is already focused (to reposition the
// caret normally) is left alone.
let filterWasUnfocused = false;
currencyFilter.addEventListener('mousedown', function () {
  filterWasUnfocused = (document.activeElement !== this);
});
currencyFilter.addEventListener('focus', function () {
  this.select();
});
currencyFilter.addEventListener('mouseup', (e) => {
  if (filterWasUnfocused) {
    filterWasUnfocused = false;
    e.preventDefault();
  }
});
currencyFilter.addEventListener('input', function () {
  populateCurrencySelect(this.value);
  cancelPendingAutoCommit();
  const exact = this.value.trim().toUpperCase();
  if (exact && (NTW.CURRENCIES[exact] || exact === 'CUSTOM')) {
    const el = this;
    pendingAutoCommit = window.setTimeout(() => {
      pendingAutoCommit = null;
      if (el.value.trim().toUpperCase() === exact) commitCurrencySelection(exact);
    }, 450);
  }
});
currencyFilter.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    cancelPendingAutoCommit();
    this.blur();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    // Commit whatever the filtered list is currently showing as the top/
    // selected match — this is what was missing: Enter used to just move
    // focus into the select without ever actually applying a pick.
    if (currencySelect.options.length) commitCurrencySelection(currencySelect.value);
  }
});
// If the user finished typing an exact code and clicked elsewhere before
// the debounce above fired, that's still a completed, valid pick — apply
// it. Either way, what they typed stays in the box exactly as they left
// it; blurring never clears or rewrites the Find-currency field.
currencyFilter.addEventListener('blur', function () {
  if (!pendingAutoCommit) return;
  const exact = this.value.trim().toUpperCase();
  cancelPendingAutoCommit();
  if (NTW.CURRENCIES[exact] || exact === 'CUSTOM') commitCurrencySelection(exact);
});

currencySelect.addEventListener('change', () => {
  commitCurrencySelection(currencySelect.value);
});

formatSelect.addEventListener('change', () => {
  selectedFormat = formatSelect.value;
  convert(false);
});

['cCode', 'cEnS', 'cEnP', 'cArS', 'cArD', 'cArP', 'cArA'].forEach((id) => {
  $(id).addEventListener('input', () => { convert(false); });
});
$('cGender').addEventListener('change', () => { convert(false); });

$('btnClear').addEventListener('click', clearForm);
$('btnBulkConvert').addEventListener('click', runBulkConvert);
$('btnBulkCopy').addEventListener('click', copyBulkResults);
bulkInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runBulkConvert(); }
});
$('btnCopyEn').addEventListener('click', () => { copyResult('en'); });
$('btnCopyAr').addEventListener('click', () => { copyResult('ar'); });
$('btnCopyResult').addEventListener('click', () => { copyResult('primary'); });
$('btnCopyAll').addEventListener('click', () => { copyResult('all'); });
$('langEn').addEventListener('click', () => { setLanguage('en'); });
$('langAr').addEventListener('click', () => { setLanguage('ar'); });

setLanguage(readStoredLanguage() || 'en');
$('amount').focus();
