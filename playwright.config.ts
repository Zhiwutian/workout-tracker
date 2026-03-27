import { defineConfig, devices } from '@playwright/test';

const fullBrowsers = process.env.PW_FULL_BROWSERS === '1';

/**
 * E2E against Vite + API (pnpm run dev). CI provides DATABASE_URL for the API.
 *
 * Default projects: **Chromium** + **Mobile Chrome** (viewport). Set **`PW_FULL_BROWSERS=1`** to also
 * run **Firefox** + **WebKit** (requires host deps: `pnpm exec playwright install-deps` on Linux).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    /** Dedicated port so `pnpm run dev` on 5173 does not collide with E2E. */
    baseURL: 'http://127.0.0.1:5188',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    ...(fullBrowsers
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
  webServer: {
    command: 'pnpm run dev:e2e',
    url: 'http://127.0.0.1:5188',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
