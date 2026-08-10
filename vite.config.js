const { resolve } = require('path');

/**
 * Minimal multi-page vanilla config — no framework plugin, no TypeScript.
 * Both tools now point at their rebuilt thin pages/*.html entries,
 * importing src/ modules. The original root-level HTML files are left in
 * place, unchanged, as the pre-migration artifacts.
 */
module.exports = {
  root: __dirname,
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        'numbers-to-words': resolve(__dirname, 'pages/numbers-to-words.html'),
        'trade-finance-reference': resolve(__dirname, 'pages/trade-finance-reference.html')
      }
    }
  }
};
