/* =========================================================================
   Landing page — chooses between the two tools.
   Deliberately minimal: a language toggle and static text swap, the same
   pattern (data-i18n attributes, localStorage-persisted language choice,
   html lang/dir toggling) already used by both tool pages, reused rather
   than invented fresh. No search, no form, no conversion logic here.
   ========================================================================= */

import { en } from '../../i18n/en.js';
import { ar } from '../../i18n/ar.js';
import { registerServiceWorker } from '../../pwa.js';

registerServiceWorker('sw.js');

const $ = (id) => document.getElementById(id);
const I18N = { en: en.landing, ar: ar.landing };

const LANG_STORAGE_KEY = 'landing-language';
function readStoredLanguage() {
  try {
    const v = window.localStorage.getItem(LANG_STORAGE_KEY);
    return (v === 'ar' || v === 'en') ? v : null;
  } catch (e) { return null; }
}
function storeLanguage(v) {
  try { window.localStorage.setItem(LANG_STORAGE_KEY, v); } catch (e) { /* storage unavailable — ignore */ }
}

let lang = 'en';

function setLanguage(next) {
  lang = next;
  const html = document.documentElement;
  html.lang = lang;
  html.dir = (lang === 'ar') ? 'rtl' : 'ltr';
  storeLanguage(lang);

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    const val = I18N[lang][key];
    if (val !== undefined) node.textContent = val;
  });

  $('langEn').setAttribute('aria-pressed', String(lang === 'en'));
  $('langAr').setAttribute('aria-pressed', String(lang === 'ar'));
}

$('langEn').addEventListener('click', () => { setLanguage('en'); });
$('langAr').addEventListener('click', () => { setLanguage('ar'); });

setLanguage(readStoredLanguage() || 'en');
