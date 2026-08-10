'use strict';
// Adapter so compare-golden-fixture.js can target the currently shipped
// numbers-to-words.html the same way it will later target src/core/index.js.
const { loadShippedCore, SHIPPED_HTML_PATH } = require('./load-shipped-core');
module.exports = loadShippedCore(SHIPPED_HTML_PATH);
