/* =========================================================================
   Trade Finance Reference — User interface
   Extracted verbatim (behavior-for-behavior) from tf_app.js during the
   Vanilla-JS/ES-modules migration. Rendering/wiring stays one cohesive
   module (unlike search.js) because it's all tightly coupled through
   mutable UI state (lang, activeSource, highlightedRule) — splitting it
   further would be an artificial separation, not a real one.
   ========================================================================= */

import { SOURCES, ALL, search } from './search.js';
import { OBLIGATIONS, MATRIX, TRANSFER_OF_RISK, FREIGHT_TERMS, NOTES } from './data/matrix.js';
import { en } from '../../i18n/en.js';
import { ar } from '../../i18n/ar.js';
import { registerServiceWorker } from '../../pwa.js';

registerServiceWorker('../sw.js');

const I18N = { en: en.tradeFinanceReference, ar: ar.tradeFinanceReference };
const MX = { OBLIGATIONS, MATRIX, TRANSFER_OF_RISK, FREIGHT_TERMS, NOTES };

let lang = 'en';

function $(id) { return document.getElementById(id); }

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

/* ----------------------------------------------------------------------
   Chips
   ---------------------------------------------------------------------- */
let activeSource = 'all';
const chipOrder = ['all', 'incoterms', 'ucp600', 'urdg758', 'isbp821'];

function chipLabel(key) {
  if (key === 'all') return I18N[lang].chipAll;
  return SOURCES[key].label[lang];
}

function chipCount(key) {
  if (key === 'all') return ALL.length;
  return ALL.filter(function (e) { return e.source === key; }).length;
}

function renderChips() {
  const box = $('chips');
  box.textContent = '';
  chipOrder.forEach(function (key) {
    const btn = el('button', 'chip', chipLabel(key) + ' ');
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String(key === activeSource));
    const countSpan = el('span', 'count', '(' + chipCount(key) + ')');
    btn.appendChild(countSpan);
    btn.addEventListener('click', function () {
      activeSource = key;
      renderChips();
      renderResults();
    });
    box.appendChild(btn);
  });
}

/* ----------------------------------------------------------------------
   Results
   ---------------------------------------------------------------------- */
function renderResults() {
  const query = $('q').value;
  const results = search(query, activeSource);
  const list = $('resultList');
  list.textContent = '';

  $('resultCount').textContent = I18N[lang].resultCount(results.length);
  $('emptyState').hidden = results.length !== 0;

  results.forEach(function (e) {
    const li = el('li', 'result');
    const head = el('div', 'result-head');
    const badge = el('span', 'badge ' + SOURCES[e.source].badge, SOURCES[e.source].label[lang]);
    const ref = el('span', 'result-ref', e.ref[lang]);
    head.appendChild(badge);
    head.appendChild(ref);
    li.appendChild(head);
    if (e.group) li.appendChild(el('div', 'result-group', e.group[lang]));
    li.appendChild(el('div', 'result-title', e.title[lang]));
    const summary = el('div', 'result-summary' + (lang === 'ar' ? ' ar' : ''), e.summary[lang]);
    summary.dir = lang === 'ar' ? 'rtl' : 'ltr';
    li.appendChild(summary);
    list.appendChild(li);
  });
}

/* ----------------------------------------------------------------------
   Incoterms 2020 responsibility matrix
   ---------------------------------------------------------------------- */
const RULE_ORDER = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
let highlightedRule = null;

function cellInfo(v) {
  if (v && typeof v === 'object') return { cls: 'cell-' + v.v, label: v.v, note: v.note };
  return { cls: 'cell-' + v, label: v, note: null };
}

const CELL_LABEL = {
  en: { buyer: 'Buyer', seller: 'Seller', negotiable: 'Negotiable' },
  ar: { buyer: 'المشتري', seller: 'البائع', negotiable: 'قابل للتفاوض' }
};

function renderMatrixChips() {
  const box = $('matrixChips');
  box.textContent = '';
  RULE_ORDER.forEach(function (code) {
    const btn = el('button', 'chip', code);
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String(code === highlightedRule));
    btn.addEventListener('click', function () {
      highlightedRule = highlightedRule === code ? null : code;
      renderMatrixChips();
      renderMatrixTable();
    });
    box.appendChild(btn);
  });
}

function renderMatrixTable() {
  if (!MX) return;
  const table = $('matrixTable');
  table.textContent = '';

  const thead = el('thead');
  const headRow = el('tr');
  headRow.appendChild(el('th', null, I18N[lang].matrixRuleHeader));
  RULE_ORDER.forEach(function (code) {
    const th = el('th', null, code);
    th.setAttribute('aria-pressed', String(code === highlightedRule));
    th.tabIndex = 0;
    th.addEventListener('click', function () {
      highlightedRule = highlightedRule === code ? null : code;
      renderMatrixChips();
      renderMatrixTable();
    });
    th.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); th.click(); }
    });
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = el('tbody');

  // Transfer of risk + freight terms rows first — quick-scan context above the cost grid.
  const riskRow = el('tr');
  riskRow.appendChild(el('th', null, I18N[lang].matrixTransferOfRisk));
  RULE_ORDER.forEach(function (code) {
    const td = el('td', null, MX.TRANSFER_OF_RISK[code][lang]);
    if (code === highlightedRule) td.className = 'hl';
    riskRow.appendChild(td);
  });
  tbody.appendChild(riskRow);

  const freightRow = el('tr');
  freightRow.appendChild(el('th', null, I18N[lang].matrixFreightTerms));
  RULE_ORDER.forEach(function (code) {
    const key = MX.FREIGHT_TERMS[code] === 'prepaid' ? 'freightPrepaid' : 'freightCollect';
    const td = el('td', null, I18N[lang][key]);
    if (code === highlightedRule) td.className = 'hl';
    freightRow.appendChild(td);
  });
  tbody.appendChild(freightRow);

  const notesUsed = {};
  MX.OBLIGATIONS.forEach(function (ob, i) {
    const tr = el('tr');
    tr.appendChild(el('th', null, ob[lang]));
    RULE_ORDER.forEach(function (code) {
      const raw = MX.MATRIX[code][i];
      const info = cellInfo(raw);
      let text = CELL_LABEL[lang][info.label];
      if (info.note) { text += '*'; notesUsed[info.note] = true; }
      const td = el('td', 'cell-' + info.label, text);
      if (code === highlightedRule) td.className += ' hl';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  const legendParts = [I18N[lang].matrixLegend];
  Object.keys(notesUsed).forEach(function (key) {
    legendParts.push('* ' + MX.NOTES[key][lang]);
  });
  const legend = $('matrixLegend');
  legend.textContent = '';
  legendParts.forEach(function (p, i) {
    if (i > 0) legend.appendChild(el('br'));
    legend.appendChild(document.createTextNode(p));
  });
}

/* ----------------------------------------------------------------------
   Language switching
   ---------------------------------------------------------------------- */
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(function (node) {
    const key = node.getAttribute('data-i18n');
    if (key === 'aboutBody') return; // handled separately (multi-paragraph)
    const val = I18N[lang][key];
    if (typeof val === 'function') return;
    if (val !== undefined) node.textContent = val;
  });
  const about = $('aboutBody');
  about.textContent = '';
  I18N[lang].aboutBody.forEach(function (p) { about.appendChild(el('p', null, p)); });
}

function setLanguage(next) {
  lang = next;
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  $('langEn').setAttribute('aria-pressed', String(lang === 'en'));
  $('langAr').setAttribute('aria-pressed', String(lang === 'ar'));
  try { localStorage.setItem('tf-language', lang); } catch (e) { /* private mode: ignore */ }
  applyI18n();
  renderChips();
  renderResults();
  renderMatrixChips();
  renderMatrixTable();
}

$('langEn').addEventListener('click', function () { setLanguage('en'); });
$('langAr').addEventListener('click', function () { setLanguage('ar'); });
$('q').addEventListener('input', renderResults);

let stored = null;
try { stored = localStorage.getItem('tf-language'); } catch (e) { /* ignore */ }
setLanguage(stored === 'ar' || stored === 'en' ? stored : (navigator.language || '').slice(0, 2) === 'ar' ? 'ar' : 'en');

window.__TF_SEARCH__ = search; // exposed for the automated test harness only
