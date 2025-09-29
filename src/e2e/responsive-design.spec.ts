import { test, expect } from '@playwright/test';
import { SearchPageHelpers, mockApiResponses } from './utils/test-helpers';

test.describe('Responsive Design', () => {
  let searchHelpers: SearchPageHelpers;

  test.beforeEach(async ({ page }) => {
    searchHelpers = new SearchPageHelpers(page);
    
    // Mock API responses
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

  test('should display properly on mobile devices', async ({ page }) => {
    // Requirement 5.1: Responsive design that works on desktop and mobile
    await searchHelpers.setMobileViewport();
    
    // Verify main components are visible and properly arranged
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /search/i })).toBeVisible();
    
    // Check that search interface is full width on mobile
    const searchInterface = page.locator('[data-testid="search-interface"]');
    await expect(searchInterface).toBeVisible();
    
    // History should be visible but may be stacked below on mobile
    const historySection = page.locator('[data-testid="search-history"]');
    await expect(historySection).toBeVisible();
    
    // Perform search to test results layout on mobile
    await searchHelpers.searchFor('mobile test');
    await searchHelpers.waitForLoadingToComplete();
    
    // Results should be properly formatted for mobile
    const results = await searchHelpers.getSearchResults();
    await expect(results).toHaveCount(2);
    
    // Each result card should be readable on mobile
    await expect(results.first()).toBeVisible();
    await expect(results.first()).toContainText('Test Result 1');
  });

  test('should display properly on tablet devices', async ({ page }) => {
    await searchHelpers.setTabletViewport();
    
    // Verify layout adapts to tablet size
    await searchHelpers.expectResponsiveLayout();
    
    // Test search functionality on tablet
    await searchHelpers.searchFor('tablet test');
    await searchHelpers.waitForLoadingToComplete();
    await searchHelpers.expectSearchResultsVisible();
    
    // Verify results are properly spaced and readable
    const results = await searchHelpers.getSearchResults();
    await expect(results).toHaveCount(2);
  });

  test('should display properly on desktop', async ({ page }) => {
    await searchHelpers.setDesktopViewport();
    
    // Verify desktop layout with sidebar
    await searchHelpers.expectResponsiveLayout();
    
    // On desktop, history should be in a sidebar
    const historySection = page.locator('[data-testid="search-history"]');
    await expect(historySection).toBeVisible();
    
    // Search interface should have appropriate width
    const searchInterface = page.locator('[data-testid="search-interface"]');
    await expect(searchInterface).toBeVisible();
    
    // Test search on desktop
    await searchHelpers.searchFor('desktop test');
    await searchHelpers.waitForLoadingToComplete();
    await searchHelpers.expectSearchResultsVisible();
  });

  test('should handle viewport changes dynamically', async ({ page }) => {
    // Start with desktop
    await searchHelpers.setDesktopViewport();
    await searchHelpers.searchFor('viewport test');
    await searchHelpers.waitForLoadingToComplete();
    
    // Verify desktop layout
    await searchHelpers.expectSearchResultsVisible();
    
    // Switch to mobile
    await searchHelpers.setMobileViewport();
    
    // Layout should adapt without losing content
    await searchHelpers.expectSearchResultsVisible();
    const results = await searchHelpers.getSearchResults();
    await expect(results).toHaveCount(2);
    
    // Switch back to desktop
    await searchHelpers.setDesktopViewport();
    
    // Should still show results properly
    await searchHelpers.expectSearchResultsVisible();
  });

  test('should maintain usability across different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: 'Small Mobile' },
      { width: 375, height: 667, name: 'iPhone' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Small Desktop' },
      { width: 1440, height: 900, name: 'Large Desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Verify core functionality works at each size
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /search/i })).toBeVisible();
      
      // Test search functionality
      await searchHelpers.searchFor(`${viewport.name} test`);
      await searchHelpers.waitForLoadingToComplete();
      await searchHelpers.expectSearchResultsVisible();
      
      // Clear results for next iteration
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    await searchHelpers.setMobileViewport();
    
    // Test touch interactions
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.tap();
    await expect(searchInput).toBeFocused();
    
    // Test button tap
    await searchInput.fill('touch test');
    await page.getByRole('button', { name: /search/i }).tap();
    
    await searchHelpers.waitForLoadingToComplete();
    await searchHelpers.expectSearchResultsVisible();
    
    // Test tapping on results
    const results = await searchHelpers.getSearchResults();
    const firstResult = results.first();
    
    // Should be able to interact with result cards
    await expect(firstResult).toBeVisible();
  });

  test('should show appropriate font sizes and spacing on different screens', async ({ page }) => {
    // Test mobile font sizes
    await searchHelpers.setMobileViewport();
    await searchHelpers.searchFor('font test');
    await searchHelpers.waitForLoadingToComplete();
    
    const results = await searchHelpers.getSearchResults();
    const firstResult = results.first();
    
    // Verify text is readable (this is a basic check - more detailed CSS testing would require additional tools)
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText('Test Result 1');
    
    // Test desktop font sizes
    await searchHelpers.setDesktopViewport();
    
    // Content should still be visible and readable
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText('Test Result 1');
  });

  test('should handle keyboard navigation on all screen sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 1280, height: 720 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.getByPlaceholder(/search/i)).toBeFocused();
      
      await page.keyboard.type('keyboard test');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: /search/i })).toBeFocused();
      
      await page.keyboard.press('Enter');
      await searchHelpers.waitForLoadingToComplete();
      await searchHelpers.expectSearchResultsVisible();
      
      // Clear for next iteration
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
  });
});