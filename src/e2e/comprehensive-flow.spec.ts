import { test, expect } from '@playwright/test';
import { SearchPageHelpers, mockApiResponses } from './utils/test-helpers';

test.describe('Comprehensive End-to-End Flow', () => {
  let searchHelpers: SearchPageHelpers;

  test.beforeEach(async ({ page }) => {
    searchHelpers = new SearchPageHelpers(page);
    await searchHelpers.navigateToHome();
  });

  test('should complete full user journey from search to history interaction', async ({ page }) => {
    // Mock successful search API
    await page.route('**/api/search', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.successfulSearch),
      });
    });

    // Mock search history API with updated history after search
    let searchCount = 0;
    await page.route('**/api/search/history', async (route) => {
      searchCount++;
      if (searchCount > 1) {
        // After search, return updated history
        const updatedHistory = {
          searches: [
            {
              _id: 'new-search-123',
              query: 'artificial intelligence',
              results: mockApiResponses.successfulSearch.results,
              timestamp: new Date(),
            },
            ...mockApiResponses.searchHistory.searches,
          ],
          total: 2,
          page: 1,
          limit: 10,
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

    // Step 1: Verify initial page load
    // Requirement 5.1: Responsive design that works on desktop and mobile
    await expect(page.getByText('AI Search Engine')).toBeVisible();
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    
    // Verify search history is loaded
    await expect(page.locator('[data-testid="search-history"]')).toBeVisible();
    const initialHistoryItems = await searchHelpers.getSearchHistoryItems();
    await expect(initialHistoryItems).toHaveCount(1);

    // Step 2: Perform a new search
    // Requirements 1.1, 1.2, 1.3: Search input, validation, loading
    const searchQuery = 'artificial intelligence';
    await searchHelpers.searchFor(searchQuery);

    // Verify loading state
    await searchHelpers.expectLoadingVisible();
    
    // Wait for results
    await searchHelpers.waitForLoadingToComplete();
    await searchHelpers.expectSearchResultsVisible();

    // Step 3: Verify search results
    // Requirement 1.4: Display results in clean format
    // Requirement 2.3: Display enhanced results with summaries
    const results = await searchHelpers.getSearchResults();
    await expect(results).toHaveCount(2);
    
    // Verify AI enhancement is displayed
    await expect(results.first()).toContainText('AI-enhanced summary');
    await expect(page.getByText(/ai summary/i)).toBeVisible();
    
    // Verify search metadata
    await expect(page.getByText(`for "${searchQuery}"`)).toBeVisible();
    await expect(page.getByText(/2 results/)).toBeVisible();

    // Step 4: Test search history interaction
    // Requirement 3.3: Display cached results when clicking previous search
    const historyItems = await searchHelpers.getSearchHistoryItems();
    
    // Click on previous search from history
    await searchHelpers.clickHistoryItem(0);
    
    // Should display cached results
    await searchHelpers.expectSearchResultsVisible();
    await expect(page.getByText(/from history/i)).toBeVisible();
    await expect(page.getByText('for "previous search"')).toBeVisible();
    
    // Verify it shows the historical result
    const historicalResults = await searchHelpers.getSearchResults();
    await expect(historicalResults).toHaveCount(1);
    await expect(historicalResults.first()).toContainText('Previous Result');

    // Step 5: Test responsive behavior
    // Requirement 5.1: Responsive design
    await searchHelpers.setMobileViewport();
    
    // Verify components are still visible and functional on mobile
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-history"]')).toBeVisible();
    
    // Switch back to desktop
    await searchHelpers.setDesktopViewport();
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('should handle complete error recovery flow', async ({ page }) => {
    let requestCount = 0;
    
    // Mock initial failure then success
    await page.route('**/api/search', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify(mockApiResponses.apiError),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockApiResponses.successfulSearch),
        });
      }
    });

    await page.route('**/api/search/history', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.searchHistory),
      });
    });

    // Perform search that will fail initially
    await searchHelpers.searchFor('error recovery test');
    
    // Should show error
    await searchHelpers.expectErrorVisible();
    
    // Verify error message content
    // Requirement 4.2: Display appropriate error message
    await expect(page.getByText(/temporarily unavailable/i)).toBeVisible();
    
    // Retry the search
    const retryButton = page.getByRole('button', { name: /retry|try again/i });
    await expect(retryButton).toBeVisible();
    await retryButton.click();
    
    // Should show loading then success
    await searchHelpers.waitForLoadingToComplete();
    await searchHelpers.expectSearchResultsVisible();
    
    // Verify successful results
    const results = await searchHelpers.getSearchResults();
    await expect(results).toHaveCount(2);
  });

  test('should handle AI enhancement failure gracefully', async ({ page }) => {
    // Mock search success but without AI enhancement
    const responseWithoutAI = {
      results: mockApiResponses.successfulSearch.results.map(result => ({
        ...result,
        aiSummary: undefined, // No AI summary due to service failure
      })),
      searchId: 'no-ai-search-id',
    };

    await page.route('**/api/search', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseWithoutAI),
      });
    });

    await page.route('**/api/search/history', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.searchHistory),
      });
    });

    // Requirement 2.4: Fall back to original results when AI processing fails
    await searchHelpers.searchFor('ai failure test');
    await searchHelpers.waitForLoadingToComplete();

    // Should still show results without AI enhancement
    await searchHelpers.expectSearchResultsVisible();
    const results = await searchHelpers.getSearchResults();
    await expect(results).toHaveCount(2);
    
    // Should show original snippets instead of AI summaries
    await expect(results.first()).toContainText('This is a test result snippet');
    
    // Should not show AI summary indicators
    await expect(page.getByText(/ai summary/i)).not.toBeVisible();
  });

  test('should maintain functionality across different viewport sizes', async ({ page }) => {
    // Mock APIs
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

    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Test core functionality at each viewport
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
      await expect(page.locator('[data-testid="search-history"]')).toBeVisible();
      
      // Perform search
      await searchHelpers.searchFor(`${viewport.name.toLowerCase()} test`);
      await searchHelpers.waitForLoadingToComplete();
      await searchHelpers.expectSearchResultsVisible();
      
      // Verify results are properly displayed
      const results = await searchHelpers.getSearchResults();
      await expect(results).toHaveCount(2);
      
      // Clear for next iteration
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle keyboard navigation and accessibility', async ({ page }) => {
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

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder(/search/i)).toBeFocused();
    
    // Type search query
    await page.keyboard.type('keyboard navigation test');
    
    // Tab to search button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /search/i })).toBeFocused();
    
    // Submit with Enter
    await page.keyboard.press('Enter');
    
    // Wait for results
    await searchHelpers.waitForLoadingToComplete();
    await searchHelpers.expectSearchResultsVisible();
    
    // Verify results are accessible
    const results = await searchHelpers.getSearchResults();
    await expect(results).toHaveCount(2);
  });
});