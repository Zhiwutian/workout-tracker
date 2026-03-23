import { defineConfig, devices } from '@playwright/test';

/**
 * E2E against Vite + API (pnpm run dev). CI provides DATABASE_URL for the API.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    /** Dedicated port so `pnpm run dev` on 5173 does not collide with E2E. */
    baseURL: 'http://127.0.0.1:5188',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm run dev:e2e',
    url: 'http://127.0.0.1:5188',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
