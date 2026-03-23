import { expect, test } from '@playwright/test';

test.describe('workout tracker smoke', () => {
  test('sign up and land on workouts', async ({ page }) => {
    const name = `e2e-${Date.now()}`;
    await page.goto('/');

    await expect(page).toHaveURL(/\/sign-in$/);

    await page.getByLabel('Display name').fill(name);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('heading', { name: 'Workouts' })).toBeVisible({
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

    await expect(page.getByRole('heading', { name: 'Workouts' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Guest session — workouts save/)).toBeVisible();

    await page.getByRole('button', { name: 'Start workout' }).click();
    await expect(page.getByRole('link', { name: 'Open' })).toBeVisible({
      timeout: 15_000,
    });
  });
});
