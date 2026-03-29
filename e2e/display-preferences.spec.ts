import { expect, test } from '@playwright/test';

/**
 * Display shell persistence without auth (no DB required).
 * Keys must match `client/src/state/display-storage.ts` and the boot script in `client/index.html`.
 */
test.describe('display preferences', () => {
  test('dark theme from localStorage survives reload (FOUC + React shell)', async ({
    page,
  }) => {
    await page.goto('/about');

    await expect(
      page.getByRole('heading', { name: /Workout Tracker/i }),
    ).toBeVisible();

    await page.evaluate(() => {
      localStorage.setItem('wt-theme-mode', 'dark');
      localStorage.setItem('wt-high-contrast', 'false');
      localStorage.setItem('wt-text-scale', 'sm');
    });

    await page.reload();

    await expect(
      page.getByRole('heading', { name: /Workout Tracker/i }),
    ).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.classList.contains('app-dark-mode'),
        ),
      )
      .toBe(true);
  });

  test('text scale class on html survives reload', async ({ page }) => {
    await page.goto('/about');

    await page.evaluate(() => {
      localStorage.setItem('wt-text-scale', 'xl');
      localStorage.setItem('wt-theme-mode', 'light');
      localStorage.setItem('wt-high-contrast', 'false');
    });

    await page.reload();

    await expect(
      page.getByRole('heading', { name: /Workout Tracker/i }),
    ).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.classList.contains('app-text-scale-xl'),
        ),
      )
      .toBe(true);
  });
});
