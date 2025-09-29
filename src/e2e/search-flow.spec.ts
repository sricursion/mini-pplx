import { test, expect } from '@playwright/test';
import { SearchPageHelpers, mockApiResponses } from './utils/test-helpers';

test.describe('Complete Search Flow', () => {
  let searchHelpers: SearchPageHelpers;

  test.beforeEach(async ({ page }) => {
    searchHelpers = new SearchPageHelpers(page);
    
    // Mock successful API responses
    await page.route('**/api/search', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.successfulSearch),
      });
    });

    await page.route('**/api/search/history', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.searchHistory),
      });
    });

    await searchHelpers.navigateToHome();
  });

  test('should complete full search flow from query to results', async ({ page }) => {
    // Requirement 1.1: Display search input field
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /search/i })).toBeVisible();

    // Requirement 1.2: Validate and submit search query
    const searchQuery = 'artificial intelligence';
    await searchHelpers.searchFor(searchQuery);

    // Requirement 1.3: Show loading indicator
    await searchHelpers.expectLoadingVisible();

    // Wait for search to complete
    await searchHelpers.waitForLoadingToComplete();

    // Requirement 1.4: Display results in clean format
    await searchHelpers.expectSearchResultsVisible();
    
    const results = await searchHelpers.getSearchResults();
    await expect(results).toHaveCount(2);

    // Verify result content
    await expect(results.first()).toContainText('Test Result 1');
    await expect(results.first()).toContainText('AI-enhanced summary');
    await expect(results.nth(1)).toContainText('Test Result 2');

    // Verify search query is displayed
    await expect(page.getByText(`for "${searchQuery}"`)).toBeVisible();

    // Verify timestamp is shown
    await expect(page.locator('text=/\\d{1,2}\/\\d{1,2}\/\\d{4}/')).toBeVisible();
  });

  test('should handle empty search query validation', async ({ page }) => {
    // Requirement 1.2: Validate query is not empty
    const searchButton = page.getByRole('button', { name: /search/i });
    
    // Try to search with empty query
    await searchButton.click();
    
    // Should show validation error or prevent submission
    await expect(page.getByPlaceholder(/search/i)).toBeFocused();
  });

  test('should display AI-enhanced summaries when available', async ({ page }) => {
    // Requirement 2.3: Display enhanced results with summaries
    await searchHelpers.searchFor('machine learning');
    await searchHelpers.waitForLoadingToComplete();

    const results = await searchHelpers.getSearchResults();
    
    // Check for AI summary content
    await expect(results.first()).toContainText('AI-enhanced summary');
    await expect(page.getByText(/ai summary/i)).toBeVisible();
  });

  test('should show search results count and metadata', async ({ page }) => {
    await searchHelpers.searchFor('test query');
    await searchHelpers.waitForLoadingToComplete();

    // Verify results count is displayed
    await expect(page.getByText(/2 results/)).toBeVisible();
    
    // Verify timestamp is shown
    await expect(page.locator('text=/\\d{1,2}\/\\d{1,2}\/\\d{4}/')).toBeVisible();
  });
});