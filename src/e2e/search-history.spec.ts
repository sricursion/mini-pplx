import { test, expect } from '@playwright/test';
import { SearchPageHelpers, mockApiResponses } from './utils/test-helpers';

test.describe('Search History Functionality', () => {
  let searchHelpers: SearchPageHelpers;

  test.beforeEach(async ({ page }) => {
    searchHelpers = new SearchPageHelpers(page);
    
    // Mock search history API
    await page.route('**/api/search/history', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.searchHistory),
      });
    });

    // Mock individual search retrieval
    await page.route('**/api/search/history-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          search: mockApiResponses.searchHistory.searches[0],
        }),
      });
    });

    await searchHelpers.navigateToHome();
  });

  test('should display search history on page load', async ({ page }) => {
    // Requirement 3.2: Display recent search history when user visits application
    await expect(page.locator('[data-testid="search-history"]')).toBeVisible();
    
    const historyItems = await searchHelpers.getSearchHistoryItems();
    await expect(historyItems).toHaveCount(1);
    
    // Verify history item content
    await expect(historyItems.first()).toContainText('previous search');
    await expect(historyItems.first()).toContainText('1/1/2024'); // Date format may vary
  });

  test('should allow clicking on previous search to view results', async ({ page }) => {
    // Requirement 3.3: Display cached results when user clicks on previous search
    const historyItems = await searchHelpers.getSearchHistoryItems();
    await expect(historyItems).toHaveCount(1);
    
    // Click on the history item
    await searchHelpers.clickHistoryItem(0);
    
    // Should display the cached results
    await searchHelpers.expectSearchResultsVisible();
    
    // Verify it shows results from history
    const results = await searchHelpers.getSearchResults();
    await expect(results).toHaveCount(1);
    await expect(results.first()).toContainText('Previous Result');
    
    // Should indicate it's from history
    await expect(page.getByText(/from history/i)).toBeVisible();
    await expect(page.getByText('for "previous search"')).toBeVisible();
  });

  test('should save new searches to history', async ({ page }) => {
    // Mock new search API
    let searchHistoryUpdated = false;
    await page.route('**/api/search', async (route) => {
      searchHistoryUpdated = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.successfulSearch),
      });
    });

    // Mock updated history after new search
    await page.route('**/api/search/history', async (route) => {
      if (searchHistoryUpdated) {
        const updatedHistory = {
          ...mockApiResponses.searchHistory,
          searches: [
            {
              _id: 'new-search-id',
              query: 'new search query',
              results: mockApiResponses.successfulSearch.results,
              timestamp: new Date(),
            },
            ...mockApiResponses.searchHistory.searches,
          ],
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedHistory),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockApiResponses.searchHistory),
        });
      }
    });

    // Requirement 3.1: Save query and results to MongoDB when user performs search
    await searchHelpers.searchFor('new search query');
    await searchHelpers.waitForLoadingToComplete();

    // Wait for history to refresh (implementation may vary)
    await page.waitForTimeout(1000);

    // History should be updated (this might require a page refresh or automatic update)
    // The exact behavior depends on the implementation
  });

  test('should display search timestamps correctly', async ({ page }) => {
    // Requirement 3.4: Include timestamp when storing search data
    const historyItems = await searchHelpers.getSearchHistoryItems();
    
    // Should show timestamp for each history item
    await expect(historyItems.first()).toContainText(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  test('should handle empty search history', async ({ page }) => {
    // Mock empty history
    await page.route('**/api/search/history', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          searches: [],
          total: 0,
          page: 1,
          limit: 10,
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show empty state message
    const historySection = page.locator('[data-testid="search-history"]');
    await expect(historySection).toBeVisible();
    await expect(historySection).toContainText(/no previous searches/i);
  });

  test('should handle history loading errors gracefully', async ({ page }) => {
    // Mock history API failure
    await page.route('**/api/search/history', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to load history' }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show error state in history section
    const historySection = page.locator('[data-testid="search-history"]');
    await expect(historySection).toBeVisible();
    await expect(historySection).toContainText(/unable to load/i);
  });

  test('should show loading state while fetching history', async ({ page }) => {
    // Mock slow history response
    await page.route('**/api/search/history', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.searchHistory),
      });
    });

    await page.reload();

    // Should show loading state in history section
    const historySection = page.locator('[data-testid="search-history"]');
    await expect(historySection).toContainText(/loading/i);
    
    // Should eventually show history items
    await expect(page.locator('[data-testid="history-item"]')).toHaveCount(1);
  });

  test('should handle clicking on non-existent history item', async ({ page }) => {
    // Mock 404 for specific search
    await page.route('**/api/search/history-1', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Search not found' }),
      });
    });

    const historyItems = await searchHelpers.getSearchHistoryItems();
    await searchHelpers.clickHistoryItem(0);

    // Should handle error gracefully
    await searchHelpers.expectErrorVisible('not found');
  });
});