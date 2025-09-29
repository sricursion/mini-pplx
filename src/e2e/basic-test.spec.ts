import { test, expect } from '@playwright/test';

test.describe('Basic E2E Test', () => {
  test('should be able to navigate to the page', async ({ page }) => {
    // Simple test to verify Playwright is working
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
  });
});