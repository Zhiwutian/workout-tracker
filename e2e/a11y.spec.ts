import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('accessibility sampling (axe)', () => {
  test('sign-in route has no critical axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/sign-in$/);

    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(
      seriousOrCritical,
      seriousOrCritical.map((v) => `${v.id}: ${v.help}`).join('; ') ||
        'no violations',
    ).toHaveLength(0);
  });

  test('guest workouts view — keyboard focus + axe after load', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/sign-in$/);

    const guest = page.getByRole('button', { name: 'Continue as guest' });
    await guest.focus();
    await expect(guest).toBeFocused();

    await guest.click();
    await expect(page.getByRole('heading', { name: 'Workouts' })).toBeVisible({
      timeout: 30_000,
    });

    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(
      seriousOrCritical,
      seriousOrCritical.map((v) => `${v.id}: ${v.help}`).join('; ') ||
        'no violations',
    ).toHaveLength(0);
  });
});
