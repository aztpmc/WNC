const { resolve } = require('path');

/**
 * Minimal multi-page vanilla config — no framework plugin, no TypeScript.
 * Both tools now point at their rebuilt thin pages/*.html entries,
 * importing src/ modules. The original root-level HTML files
 * (numbers-to-words.html, trade-finance-reference.html) are left in
 * place, unchanged, as the pre-migration artifacts -- a separate,
 * newly-added root index.html (production-hardening pass: a landing page
 * so a bare deployed domain root doesn't 404) does not touch or collide
 * with either of them.
 */
module.exports = {
  root: __dirname,
  base: './',
  // This site has zero client-side routing -- three genuinely independent
  // static pages. Vite's default appType:'spa' silently serves index.html
  // (200) for any unmatched request instead of a real 404, which only
  // became observable once a root index.html existed to fall back to.
  // That default is for single-page apps with a router; it doesn't match
  // this project and would mask real static-hosting 404 behavior (and the
  // service worker's own handling of it) in `vite dev`/`vite preview`.
  appType: 'mpa',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        'index': resolve(__dirname, 'index.html'),
        'numbers-to-words': resolve(__dirname, 'pages/numbers-to-words.html'),
        'trade-finance-reference': resolve(__dirname, 'pages/trade-finance-reference.html')
      }
    }
  }
};
