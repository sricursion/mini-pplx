import { Page, expect } from '@playwright/test';

export class SearchPageHelpers {
  constructor(private page: Page) {}

  async navigateToHome() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async searchFor(query: string) {
    const searchInput = this.page.getByPlaceholder(/search/i);
    await searchInput.fill(query);
    await this.page.getByRole('button', { name: /search/i }).click();
  }

  async waitForSearchResults() {
    await this.page.waitForSelector('[data-testid="search-results"]', { timeout: 15000 });
  }

  async waitForLoadingToComplete() {
    await this.page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden', timeout: 15000 });
  }

  async getSearchResults() {
    return this.page.locator('[data-testid="result-card"]');
  }

  async getSearchHistoryItems() {
    return this.page.locator('[data-testid="history-item"]');
  }

  async clickHistoryItem(index: number) {
    const historyItems = await this.getSearchHistoryItems();
    await historyItems.nth(index).click();
  }

  async getErrorMessage() {
    return this.page.locator('[data-testid="error-display"]');
  }

  async dismissError() {
    await this.page.getByRole('button', { name: /dismiss|close/i }).click();
  }

  async expectSearchResultsVisible() {
    await expect(this.page.locator('[data-testid="search-results"]')).toBeVisible();
  }

  async expectNoResults() {
    await expect(this.page.getByText(/no results found/i)).toBeVisible();
  }

  async expectErrorVisible(errorText?: string) {
    const errorElement = await this.getErrorMessage();
    await expect(errorElement).toBeVisible();
    if (errorText) {
      await expect(errorElement).toContainText(errorText);
    }
  }

  async expectLoadingVisible() {
    await expect(this.page.locator('[data-testid="loading-indicator"]')).toBeVisible();
  }

  async expectLoadingHidden() {
    await expect(this.page.locator('[data-testid="loading-indicator"]')).toBeHidden();
  }

  // Responsive design helpers
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async expectResponsiveLayout() {
    // Check that the layout adapts properly
    const searchInterface = this.page.locator('[data-testid="search-interface"]');
    const searchHistory = this.page.locator('[data-testid="search-history"]');
    
    await expect(searchInterface).toBeVisible();
    await expect(searchHistory).toBeVisible();
  }
}

export const mockApiResponses = {
  successfulSearch: {
    results: [
      {
        title: 'Test Result 1',
        url: 'https://example.com/1',
        snippet: 'This is a test result snippet',
        aiSummary: 'AI-enhanced summary of the content',
        relevanceScore: 0.95,
        source: 'exa' as const,
      },
      {
        title: 'Test Result 2',
        url: 'https://example.com/2',
        snippet: 'Another test result snippet',
        aiSummary: 'Another AI-enhanced summary',
        relevanceScore: 0.87,
        source: 'exa' as const,
      },
    ],
    searchId: 'test-search-id-123',
  },

  searchHistory: {
    searches: [
      {
        _id: 'history-1',
        query: 'previous search',
        results: [
          {
            title: 'Previous Result',
            url: 'https://example.com/prev',
            snippet: 'Previous search result',
            aiSummary: 'Previous AI summary',
            relevanceScore: 0.8,
            source: 'exa' as const,
          },
        ],
        timestamp: new Date('2024-01-01T10:00:00Z'),
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
  },

  emptyResults: {
    results: [],
    searchId: 'empty-search-id',
  },

  apiError: {
    error: 'External API service unavailable',
    message: 'The search service is temporarily unavailable. Please try again later.',
  },

  networkError: {
    error: 'Network error',
    message: 'Unable to connect to the search service. Please check your internet connection.',
  },
};