import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function expectSignInPage(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page).toHaveURL(/\/sign-in$/);
}

async function signUpWithDemo(page: Page, displayName: string): Promise<void> {
  const input = page.getByLabel('Display name');
  await input.scrollIntoViewIfNeeded();
  await input.fill(displayName);
  const create = page.getByRole('button', { name: 'Create account' });
  await create.scrollIntoViewIfNeeded();
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().includes('/api/auth/sign-up') && r.request().method() === 'POST',
    { timeout: 30_000 },
  );
  await create.click();
  const response = await responsePromise;
  expect(
    response.status(),
    `sign-up failed: ${response.status()} ${await response.text().catch(() => '')}`,
  ).toBe(201);
}

async function continueGuest(page: Page): Promise<void> {
  const guest = page.getByRole('button', { name: 'Continue as guest' });
  await guest.scrollIntoViewIfNeeded();
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().includes('/api/auth/guest') && r.request().method() === 'POST',
    { timeout: 30_000 },
  );
  await guest.click();
  const response = await responsePromise;
  expect(
    response.status(),
    `guest session failed: ${response.status()} ${await response.text().catch(() => '')}`,
  ).toBe(201);
}

async function expectWorkoutsVisible(page: Page): Promise<void> {
  await expect(page.getByTestId('workouts-page-heading')).toBeVisible({
    timeout: 30_000,
  });
}

test.describe('workout tracker smoke', () => {
  test('sign up and land on workouts', async ({ page }) => {
    const name = `e2e-${Date.now()}`;
    await expectSignInPage(page);
    await signUpWithDemo(page, name);
    await expectWorkoutsVisible(page);
    await expect(
      page.getByRole('button', { name: 'Start workout' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Start workout' }).click();
    await expect(
      page.getByRole('link', { name: /^(Continue|Open)$/ }),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test('continue as guest and land on workouts', async ({ page }) => {
    await expectSignInPage(page);
    await continueGuest(page);
    await expectWorkoutsVisible(page);
    await expect(
      page.getByRole('button', { name: 'Start workout' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Start workout' }).click();
    await expect(
      page.getByRole('link', { name: /^(Continue|Open)$/ }),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test('cardio workout shows only cardio exercises in log-a-set picker', async ({
    page,
  }) => {
    await expectSignInPage(page);
    await continueGuest(page);
    await expectWorkoutsVisible(page);

    await page.getByLabel('Workout type').selectOption('cardio');
    await page.getByRole('button', { name: 'Start workout' }).click();
    await expect(
      page.getByRole('link', { name: /^(Continue|Open)$/ }),
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: /^(Continue|Open)$/ }).click();

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

  test('superset flow groups sets and export includes superset_group_id', async ({
    page,
  }) => {
    await expectSignInPage(page);
    await continueGuest(page);
    await expectWorkoutsVisible(page);

    await page.getByRole('button', { name: 'Start workout' }).click();
    await expect(
      page.getByRole('link', { name: /^(Continue|Open)$/ }),
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: /^(Continue|Open)$/ }).click();
    await expect(
      page.getByRole('heading', { name: /Workout #/ }),
    ).toBeVisible();

    await page.getByLabel('Start new superset group with this set').click();
    await page.getByRole('button', { name: 'Save set' }).click();
    await expect(page.getByText(/Superset #\d+/).first()).toBeVisible();

    await page.getByRole('button', { name: 'Stop grouping' }).click();
    await page.getByRole('button', { name: 'Add in superset' }).first().click();
    await expect(page.getByText(/Adding to superset #\d+/)).toBeVisible();

    await page.getByRole('button', { name: 'Save set' }).click();
    await expect(
      page.getByRole('button', { name: 'Add in superset' }),
    ).toHaveCount(2);

    await page.getByRole('link', { name: '← Workouts' }).click();
    await expectWorkoutsVisible(page);

    await page.getByTestId('workouts-filters-open').click();
    const downloadPromise = page.waitForEvent('download');
    await page
      .getByRole('button', {
        name: 'Download workout sets as CSV for the selected date range',
      })
      .click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const csv = await readFile(downloadPath!, 'utf8');
    expect(csv).toContain('superset_group_id');
    const lines = csv.trim().split('\n');
    const [header, ...rows] = lines;
    const colIdx = header.split(',').indexOf('superset_group_id');
    expect(colIdx).toBeGreaterThanOrEqual(0);
    const hasGroupedRow = rows.some((line) => {
      const cols = line.split(',');
      return (cols[colIdx] ?? '').trim() !== '';
    });
    expect(hasGroupedRow).toBe(true);
  });

  test('finish workout from detail', async ({ page }) => {
    await expectSignInPage(page);
    await continueGuest(page);
    await expectWorkoutsVisible(page);

    await page.getByRole('button', { name: 'Start workout' }).click();
    await expect(
      page.getByRole('link', { name: /^(Continue|Open)$/ }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('link', { name: /^(Continue|Open)$/ }).click();

    await expect(
      page.getByRole('button', { name: 'Finish workout' }),
    ).toBeVisible({ timeout: 15_000 });

    const patchPromise = page.waitForResponse(
      (r) =>
        /\/api\/workouts\/\d+$/.test(r.url()) &&
        r.request().method() === 'PATCH',
      { timeout: 15_000 },
    );
    await page.getByRole('button', { name: 'Finish workout' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Confirm finish' })
      .click();
    const patchRes = await patchPromise;
    expect(patchRes.ok()).toBeTruthy();

    await expect(page.getByText('Completed')).toBeVisible({ timeout: 15_000 });

    await page.goto('/');
    await expectWorkoutsVisible(page);
    await expect(
      page
        .getByRole('list', { name: 'Workout list' })
        .getByRole('link', { name: /^(Continue|Open)$/ }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
