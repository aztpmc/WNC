const { defineConfig, devices } = require('@playwright/test');

/**
 * Browser/UI layer — separate from node:test (tests/core), which stays
 * fast and deterministic for pure-function core logic. Playwright is used
 * for: existing-vs-migrated interaction parity during this migration,
 * EN/AR + RTL verification, responsive breakpoints, and later, ongoing
 * critical-workflow regression in CI. Uses this environment's pre-installed
 * Chromium (PLAYWRIGHT_BROWSERS_PATH) when present; falls back to a
 * normal Playwright-managed install elsewhere.
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // This sandbox pre-installs Chromium outside Playwright's own
        // managed download path (see PLAYWRIGHT_BROWSERS_PATH); point at
        // it directly rather than triggering a fresh download. Elsewhere
        // (a normal dev machine / CI), this path won't exist and this
        // override should be removed or made conditional.
        launchOptions: process.env.PLAYWRIGHT_LOCAL_CHROMIUM
          ? { executablePath: process.env.PLAYWRIGHT_LOCAL_CHROMIUM }
          : {}
      }
    }
  ]
});
