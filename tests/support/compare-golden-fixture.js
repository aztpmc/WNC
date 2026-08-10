'use strict';
/**
 * Regenerates the golden-output matrix from whatever core module is passed
 * in and diffs it against the committed fixture. Used after every
 * extraction step during the migration — required result is 0 diffs.
 *
 * Usage: node tests/support/compare-golden-fixture.js <path-to-core-entry>
 *   <path-to-core-entry> must be a CommonJS module exporting the same
 *   shape as window.NumbersToWords (or export it as `module.exports`).
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { generate } = require('./generate-golden-fixture');

// Dynamic import() loads both CommonJS (shipped-core-entry.js) and real ES
// modules (src/core/index.js) transparently — for a CJS module, Node
// exposes its `module.exports` as the namespace's `default`.
async function loadCore(entryPath) {
  const ns = await import(pathToFileURL(path.resolve(entryPath)).href);
  return ns.default || ns.NumbersToWords || ns;
}

function compare(N) {
  const fixturePath = path.join(__dirname, '..', 'fixtures', 'golden-output.json');
  const golden = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const current = generate(N);

  if (golden.length !== current.length) {
    return { diffs: [{ reason: 'CASE COUNT MISMATCH', golden: golden.length, current: current.length }], total: golden.length };
  }

  const diffs = [];
  for (let i = 0; i < golden.length; i++) {
    const g = golden[i], c = current[i];
    const fields = ['ok', 'code', 'formatted', 'formattedWithCode', 'english', 'arabic'];
    for (const f of fields) {
      if (g[f] !== c[f]) {
        diffs.push({ currency: g.currency, input: g.input, field: f, golden: g[f], current: c[f] });
      }
    }
  }
  return { diffs, total: golden.length };
}

if (require.main === module) {
  (async () => {
    const entryPath = process.argv[2];
    if (!entryPath) {
      console.error('Usage: node compare-golden-fixture.js <path-to-core-entry>');
      process.exit(2);
    }
    const N = await loadCore(entryPath);
    const { diffs, total } = compare(N);
    console.log('Compared ' + total + ' fixture cases against ' + entryPath);
    if (diffs.length === 0) {
      console.log('Diffs: 0');
      process.exit(0);
    }
    console.log('Diffs: ' + diffs.length);
    diffs.slice(0, 30).forEach(d => console.log('  ' + JSON.stringify(d)));
    if (diffs.length > 30) console.log('  ... and ' + (diffs.length - 30) + ' more');
    process.exit(1);
  })();
}

module.exports = { compare };
