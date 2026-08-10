'use strict';
/**
 * Loads the conversion-core <script> block directly out of the SHIPPED
 * numbers-to-words.html and evaluates it in a sandbox, returning the same
 * `NumbersToWords` object the browser would get on `window.NumbersToWords`.
 *
 * This exists so the baseline test suite (Step 1-3 of the migration) proves
 * out against the actual committed artifact, not against a hand-copied
 * approximation of it. Once the core is extracted into src/core/index.js,
 * the test files are re-pointed there instead — this loader stays only as
 * the tool that produced the original golden-output fixture.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadShippedCore(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script id="conversion-core">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('conversion-core script block not found in ' + htmlPath);
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(m[1], sandbox, { filename: htmlPath });
  if (!sandbox.NumbersToWords) throw new Error('NumbersToWords was not defined by the evaluated script');
  return sandbox.NumbersToWords;
}

const SHIPPED_HTML_PATH = path.join(__dirname, '..', '..', 'numbers-to-words.html');

module.exports = { loadShippedCore, SHIPPED_HTML_PATH };
