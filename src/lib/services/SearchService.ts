import { EnhancedResult, SearchHistory } from '../../types';

export interface SearchResponse {
  results: EnhancedResult[];
  searchId: string | null;
  query: string;
  timestamp: string;
  message?: string;
}

export interface SearchHistoryResponse {
  searches: SearchHistory[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchByIdResponse {
  search: SearchHistory;
}

export interface SearchServiceError {
  message: string;
  status: number;
  code?: string;
}

export class SearchServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'SearchServiceError';
  }
}

export class SearchService {
  private baseUrl: string;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(
    baseUrl: string = '/api',
    retryAttempts: number = 3,
    retryDelay: number = 1000
  ) {
    this.baseUrl = baseUrl;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
  }

  /**
   * Perform a search with retry logic and error handling
   */
  async performSearch(query: string): Promise<SearchResponse> {
    if (!query || query.trim().length === 0) {
      throw new SearchServiceError('Search query cannot be empty', 400, 'EMPTY_QUERY');
    }

    const searchData = { query: query.trim() };

    return this.retryRequest(async () => {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SearchServiceError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
      }

      return response.json();
    });
  }

  /**
   * Get search history with pagination
   */
  async getSearchHistory(
    page: number = 1,
    limit: number = 10
  ): Promise<SearchHistoryResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.retryRequest(async () => {
      const response = await fetch(`${this.baseUrl}/search/history?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SearchServiceError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
      }

      return response.json();
    });
  }

  /**
   * Get a specific search by ID
   */
  async getSearchById(searchId: string): Promise<SearchByIdResponse> {
    if (!searchId) {
      throw new SearchServiceError('Search ID is required', 400, 'MISSING_SEARCH_ID');
    }

    return this.retryRequest(async () => {
      const response = await fetch(`${this.baseUrl}/search/${searchId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SearchServiceError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
      }

      return response.json();
    });
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      // Don't retry client errors (4xx) except for 429 (rate limiting)
      if (error instanceof SearchServiceError) {
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
      }

      // If we've exhausted retry attempts, throw the error
      if (attempt >= this.retryAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const totalDelay = delay + jitter;

      console.warn(`Request failed, retrying in ${totalDelay}ms (attempt ${attempt}/${this.retryAttempts}):`, error);

      await new Promise(resolve => setTimeout(resolve, totalDelay));
      
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  /**
   * Check if an error is a network error that should be retried
   */
  private isRetryableError(error: any): boolean {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // Server errors (5xx) and rate limiting (429)
    if (error instanceof SearchServiceError) {
      return error.status >= 500 || error.status === 429;
    }

    return false;
  }
}

// Export a default instance
export const searchService = new SearchService();