import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Gas planner/);
});

test('has Bottom text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Bottom gas/)).toBeVisible();
});
