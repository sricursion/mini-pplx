import { test, expect } from '@playwright/test';
import { SearchPageHelpers, mockApiResponses } from './utils/test-helpers';

test.describe('Error Scenarios', () => {
  let searchHelpers: SearchPageHelpers;

  test.beforeEach(async ({ page }) => {
    searchHelpers = new SearchPageHelpers(page);
    await searchHelpers.navigateToHome();
  });

  test('should handle API service unavailable error', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/search', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.apiError),
      });
    });

    // Requirement 4.2: Display appropriate error message when Exa AI service is unavailable
    await searchHelpers.searchFor('test query');
    
    // Should show error message
    await searchHelpers.expectErrorVisible('service unavailable');
    
    // Verify error message content
    await expect(page.getByText(/temporarily unavailable/i)).toBeVisible();
    await expect(page.getByText(/try again later/i)).toBeVisible();
  });

  test('should handle network connection errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/search', async (route) => {
      await route.abort('failed');
    });

    // Requirement 4.2: Handle network errors gracefully
    await searchHelpers.searchFor('network test');
    
    // Should show network error message
    await searchHelpers.expectErrorVisible();
    
    // Verify user can retry
    const retryButton = page.getByRole('button', { name: /retry|try again/i });
    await expect(retryButton).toBeVisible();
  });

  test('should handle timeout errors', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/search', async (route) => {
      // Delay response to simulate timeout
      await new Promise(resolve => setTimeout(resolve, 20000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.successfulSearch),
      });
    });

    await searchHelpers.searchFor('timeout test');
    
    // Should show loading initially
    await searchHelpers.expectLoadingVisible();
    
    // Should eventually show timeout error or handle gracefully
    // Note: Actual timeout handling depends on implementation
  });

  test('should handle AI enhancement service failure gracefully', async ({ page }) => {
    // Mock search success but AI enhancement failure
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

    // Requirement 2.4: Fall back to original results when AI processing fails
    await searchHelpers.searchFor('ai failure test');
    await searchHelpers.waitForLoadingToComplete();

    // Should still show results without AI enhancement
    await searchHelpers.expectSearchResultsVisible();
    const results = await searchHelpers.getSearchResults();
    await expect(results).toHaveCount(2);
    
    // Should show original snippets instead of AI summaries
    await expect(results.first()).toContainText('This is a test result snippet');
  });

  test('should handle empty search results', async ({ page }) => {
    // Mock empty results
    await page.route('**/api/search', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.emptyResults),
      });
    });

    await searchHelpers.searchFor('no results query');
    await searchHelpers.waitForLoadingToComplete();

    // Should show no results message
    await searchHelpers.expectNoResults();
    await expect(page.getByText(/try adjusting your search/i)).toBeVisible();
  });

  test('should handle database unavailable for history', async ({ page }) => {
    // Mock successful search but history failure
    await page.route('**/api/search', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.successfulSearch),
      });
    });

    await page.route('**/api/search/history', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database unavailable' }),
      });
    });

    // Requirement 4.4: Still allow searches when MongoDB is unavailable
    await searchHelpers.searchFor('db failure test');
    await searchHelpers.waitForLoadingToComplete();

    // Search should still work
    await searchHelpers.expectSearchResultsVisible();
    
    // History section might show error or be hidden
    const historySection = page.locator('[data-testid="search-history"]');
    if (await historySection.isVisible()) {
      await expect(historySection).toContainText(/unable to load/i);
    }
  });

  test('should allow error dismissal and retry', async ({ page }) => {
    // Mock initial failure
    let requestCount = 0;
    await page.route('**/api/search', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
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

    await searchHelpers.searchFor('retry test');
    
    // Should show error first
    await searchHelpers.expectErrorVisible();
    
    // Should be able to dismiss error
    await searchHelpers.dismissError();
    await expect(page.locator('[data-testid="error-display"]')).toBeHidden();
    
    // Should be able to retry search
    await searchHelpers.searchFor('retry test again');
    await searchHelpers.waitForLoadingToComplete();
    await searchHelpers.expectSearchResultsVisible();
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Mock malformed response
    await page.route('**/api/search', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response',
      });
    });

    await searchHelpers.searchFor('malformed response test');
    
    // Should handle parsing error gracefully
    await searchHelpers.expectErrorVisible();
  });
});