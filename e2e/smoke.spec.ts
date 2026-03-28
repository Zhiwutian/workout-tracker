import { expect, test } from '@playwright/test';

test.describe('workout tracker smoke', () => {
  test('sign up and land on workouts', async ({ page }) => {
    const name = `e2e-${Date.now()}`;
    await page.goto('/');

    await expect(page).toHaveURL(/\/sign-in$/);

    await page.getByLabel('Display name').fill(name);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByTestId('workouts-page-heading')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(`Signed in as ${name}`)).toBeVisible();

    await page.getByRole('button', { name: 'Start workout' }).click();
    await expect(page.getByRole('link', { name: 'Open' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('continue as guest and land on workouts', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/sign-in$/);

    await page.getByRole('button', { name: 'Continue as guest' }).click();

    await expect(page.getByTestId('workouts-page-heading')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Guest session — workouts save/)).toBeVisible();

    await page.getByRole('button', { name: 'Start workout' }).click();
    await expect(page.getByRole('link', { name: 'Open' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('cardio workout shows only cardio exercises in log-a-set picker', async ({
    page,
  }) => {
    const name = `e2e-cardio-${Date.now()}`;
    await page.goto('/');

    await expect(page).toHaveURL(/\/sign-in$/);

    await page.getByLabel('Display name').fill(name);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByTestId('workouts-page-heading')).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel('Workout type').selectOption('cardio');
    await page.getByRole('button', { name: 'Start workout' }).click();
    await expect(page.getByRole('link', { name: 'Open' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'Open' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.locator('header').getByText('Cardio', { exact: true }),
    ).toBeVisible();

    const exerciseSelect = page.getByLabel('Exercise');
    const optionCount = await exerciseSelect.locator('option').count();
    if (optionCount === 0) {
      test.skip(
        true,
        'No global cardio/flexibility exercises in DB — run database/seed-global-exercises-append.sql or reset and db:seed',
      );
    }
    const labels = await exerciseSelect.locator('option').allInnerTexts();
    expect(labels.some((t) => t.trim().length > 0)).toBe(true);
    expect(labels.some((t) => /Bench press/i.test(t))).toBe(false);
  });
});
