/* =========================================================================
   Service worker registration -- shared by every tool page. One function,
   not duplicated per tool, since the registration call is identical
   regardless of which page loads it.
   ========================================================================= */

/**
 * registerServiceWorker(swPath) -- registers public/sw.js (copied
 * verbatim to the build root by Vite) using a path relative to the
 * CALLING page, not an absolute "/sw.js" -- this project deploys under
 * an arbitrary subpath (vite.config.js uses base:'./' for exactly that
 * reason), so a hardcoded root-absolute path would silently 404 under a
 * subpath deployment. `swPath` is required, not assumed, because callers
 * live at different depths: the tool pages sit under pages/ ('../sw.js'),
 * while the root landing page sits at the build root itself ('sw.js') --
 * one hardcoded relative path can't be correct for both.
 * No-ops outside browsers that support the API, and never throws --
 * offline support is an enhancement, not something a page's own
 * functionality should ever depend on. Also no-ops under `vite dev`
 * (import.meta.env.PROD is false there): caching the dev server's
 * unbundled, frequently-changing module responses would fight normal
 * development rather than help it. Production builds only.
 */
export function registerServiceWorker(swPath) {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swPath).catch(() => { /* offline support unavailable -- page still works */ });
  });
}
