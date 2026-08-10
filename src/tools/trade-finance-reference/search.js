/* =========================================================================
   Trade Finance Reference — search engine
   Pure logic, no DOM access — extracted verbatim (behavior-for-behavior)
   from tf_app.js during the Vanilla-JS/ES-modules migration. This is a
   genuine, non-speculative separation: search() is a pure function of the
   merged index and a query, and was already being exercised standalone
   via window.__TF_SEARCH__ in the shipped page.
   ========================================================================= */

import { INCOTERMS } from './data/incoterms.js';
import { UCP600 } from './data/ucp600.js';
import { URDG758 } from './data/urdg758.js';
import { ISBP821 } from './data/isbp821.js';

/* ----------------------------------------------------------------------
   Merge the four data files into one flat, normalized index.
   ---------------------------------------------------------------------- */
export const SOURCES = {
  incoterms: { badge: 'src-incoterms', label: { en: 'Incoterms 2020', ar: 'إنكوترمز 2020' }, order: 0 },
  ucp600: { badge: 'src-ucp600', label: { en: 'UCP 600', ar: 'UCP 600' }, order: 1 },
  urdg758: { badge: 'src-urdg758', label: { en: 'URDG 758', ar: 'URDG 758' }, order: 2 },
  isbp821: { badge: 'src-isbp821', label: { en: 'ISBP 821 (topic index)', ar: 'ISBP 821 (فهرس مواضيع)' }, order: 3 }
};

export const ALL = [];

(INCOTERMS || []).forEach(function (e) {
  ALL.push({
    id: e.id, source: 'incoterms', number: e.number,
    ref: { en: e.ref, ar: e.ref },
    title: e.title, summary: e.summary, group: e.group,
    keywords: e.keywords || { en: [], ar: [] }
  });
});
(UCP600 || []).forEach(function (e) {
  ALL.push({
    id: e.id, source: 'ucp600', number: e.number,
    ref: { en: 'Article ' + e.number, ar: 'المادة ' + e.number },
    title: e.title, summary: e.summary, group: null,
    keywords: { en: ['ucp ' + e.number, 'article ' + e.number], ar: ['المادة ' + e.number] }
  });
});
(URDG758 || []).forEach(function (e) {
  ALL.push({
    id: e.id, source: 'urdg758', number: e.number,
    ref: { en: 'Article ' + e.number, ar: 'المادة ' + e.number },
    title: e.title, summary: e.summary, group: null,
    keywords: { en: ['urdg ' + e.number, 'article ' + e.number], ar: ['المادة ' + e.number] }
  });
});
(ISBP821 || []).forEach(function (e, i) {
  ALL.push({
    id: e.id, source: 'isbp821', number: i + 1,
    ref: e.ref, title: e.title, summary: e.summary, group: null,
    keywords: e.keywords || { en: [], ar: [] }
  });
});

/* ----------------------------------------------------------------------
   Search index: one lowercased, diacritic-stripped haystack per entry,
   built from BOTH languages' title/summary/keywords/ref/source label, so
   a query in either script finds entries regardless of the current UI
   language.
   ---------------------------------------------------------------------- */
export function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')   // Arabic tashkil/tatweel
    .replace(/[أإآا]/g, 'ا')                          // alef variants
    .replace(/[ىي]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

ALL.forEach(function (e) {
  const parts = [
    e.ref.en, e.ref.ar, e.title.en, e.title.ar, e.summary.en, e.summary.ar,
    SOURCES[e.source].label.en, SOURCES[e.source].label.ar,
    (e.keywords.en || []).join(' '), (e.keywords.ar || []).join(' '),
    String(e.number)
  ];
  if (e.group) parts.push(e.group.en, e.group.ar);
  e._hay = normalize(parts.join(' '));
});

/* Literal "<source> <number>" / "article <n>" shorthand gets a scoring
   boost so "UCP 30" or "article 20" jumps straight to that article
   instead of competing on generic token overlap. */
const SOURCE_ALIASES = {
  incoterms: ['incoterms', 'incoterm'],
  ucp600: ['ucp', 'ucp600', 'ucpdc'],
  urdg758: ['urdg', 'urdg758'],
  isbp821: ['isbp', 'isbp821']
};

function parseDirectRef(q) {
  const m = q.match(/\b(ucp|urdg|isbp|incoterms?|article|art)\D{0,4}?(\d{1,3})\b/);
  if (!m) return null;
  const word = m[1], num = parseInt(m[2], 10);
  let sources = [];
  if (word === 'article' || word === 'art') {
    sources = ['ucp600', 'urdg758'];
  } else {
    Object.keys(SOURCE_ALIASES).forEach(function (src) {
      if (SOURCE_ALIASES[src].indexOf(word) !== -1) sources.push(src);
    });
  }
  return { sources: sources, number: num };
}

// Common connector words that would otherwise let a two-word query like
// "article 20" or "who pays" match on the connector alone (every UCP/URDG
// entry's keywords contain the literal word "article") and flood the
// results with irrelevant matches. Stripped before requiring ALL
// remaining words to be present (AND, not OR) — natural-language
// questions still work because their content words survive the strip.
const STOPWORDS = {
  who: 1, what: 1, when: 1, where: 1, why: 1, how: 1, does: 1, is: 1, are: 1, be: 1,
  the: 1, a: 1, an: 1, of: 1, for: 1, to: 1, under: 1, in: 1, on: 1, with: 1, by: 1,
  pays: 1, pay: 1, and: 1, or: 1, can: 1, do: 1, i: 1, it: 1, this: 1,
  'من': 1, 'ما': 1, 'ماذا': 1, 'متى': 1, 'اين': 1, 'لماذا': 1, 'كيف': 1, 'هل': 1,
  'في': 1, 'علي': 1, 'مع': 1, 'و': 1, 'او': 1, 'يدفع': 1, 'يجب': 1, 'عن': 1,
  'الذي': 1, 'التي': 1, 'هذا': 1, 'هذه': 1
};

export function search(query, activeSource) {
  const q = normalize(query);
  const direct = q ? parseDirectRef(q) : null;
  const tokens = q ? q.split(' ').filter(Boolean) : [];
  let meaningful = tokens.filter(function (t) { return !STOPWORDS[t]; });
  if (tokens.length && meaningful.length === 0) meaningful = tokens; // all-stopword query: fall back rather than match nothing

  let results = ALL.filter(function (e) {
    return activeSource === 'all' || e.source === activeSource;
  }).map(function (e) {
    let score = 0;
    const isDirectHit = direct && direct.sources.indexOf(e.source) !== -1 && e.number === direct.number;
    if (isDirectHit) score += 1000;

    if (tokens.length) {
      let hits = 0;
      const refNorm = normalize(e.ref.en);
      meaningful.forEach(function (t) {
        if (e._hay.indexOf(t) !== -1) hits++;
        // Exact rule-code match (e.g. query token "cif" against Incoterms
        // ref "CIF") outranks an incidental mention buried in another
        // entry's explanatory text (e.g. CIP's summary mentions "CIF" in
        // passing when contrasting insurance levels) — checked per token
        // so it still fires inside a multi-word query like "cif insurance".
        if (t === refNorm) score += 800;
      });
      // Require every meaningful word to be present (AND), unless the
      // entry already matched via an explicit "<source> <number>" lookup.
      if (hits < meaningful.length && !isDirectHit) return null;
      score += hits * 10;
      if (e._hay.indexOf(q) !== -1) score += 5; // whole-phrase bonus
    }
    return { entry: e, score: score };
  }).filter(Boolean);

  if (tokens.length === 0) {
    // Browse mode: no query — stable order by source, then number.
    results.sort(function (a, b) {
      return SOURCES[a.entry.source].order - SOURCES[b.entry.source].order || a.entry.number - b.entry.number;
    });
  } else {
    results.sort(function (a, b) {
      return b.score - a.score || SOURCES[a.entry.source].order - SOURCES[b.entry.source].order || a.entry.number - b.entry.number;
    });
  }
  return results.map(function (r) { return r.entry; });
}
