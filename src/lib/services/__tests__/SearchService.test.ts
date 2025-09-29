import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchService, SearchServiceError } from '../SearchService';
import { EnhancedResult } from '../../../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = new SearchService('/api', 2, 100); // Reduced retry attempts and delay for testing
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('performSearch', () => {
    const mockSearchResponse = {
      results: [
        {
          title: 'Test Result',
          url: 'https://example.com',
          snippet: 'Test snippet',
          aiSummary: 'AI generated summary',
          relevanceScore: 0.95,
          source: 'exa' as const,
        },
      ] as EnhancedResult[],
      searchId: 'test-search-id',
      query: 'test query',
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    it('should perform a successful search', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const result = await searchService.performSearch('test query');

      expect(mockFetch).toHaveBeenCalledWith('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'test query' }),
      });

      expect(result).toEqual(mockSearchResponse);
    });

    it('should throw error for empty query', async () => {
      await expect(searchService.performSearch('')).rejects.toThrow(
        new SearchServiceError('Search query cannot be empty', 400, 'EMPTY_QUERY')
      );

      await expect(searchService.performSearch('   ')).rejects.toThrow(
        new SearchServiceError('Search query cannot be empty', 400, 'EMPTY_QUERY')
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle 400 Bad Request errors', async () => {
      const errorResponse = { error: 'Invalid query format' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => errorResponse,
      });

      await expect(searchService.performSearch('test query')).rejects.toThrow(
        new SearchServiceError('Invalid query format', 400)
      );
    });

    it('should handle 503 Service Unavailable errors', async () => {
      const errorResponse = { error: 'Search service temporarily unavailable' };
      // Mock all retry attempts to fail with the same error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => errorResponse,
      });

      await expect(searchService.performSearch('test query')).rejects.toThrow(
        new SearchServiceError('Search service temporarily unavailable', 503)
      );
    });

    it('should retry on 500 server errors', async () => {
      // First call fails with 500
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const result = await searchService.performSearch('test query');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSearchResponse);
    });

    it('should retry on 429 rate limiting errors', async () => {
      // First call fails with 429
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limited' }),
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const result = await searchService.performSearch('test query');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSearchResponse);
    });

    it('should not retry on 400 client errors (except 429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid query' }),
      });

      await expect(searchService.performSearch('test query')).rejects.toThrow(
        new SearchServiceError('Invalid query', 400)
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors with retry', async () => {
      // First call fails with network error
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const result = await searchService.performSearch('test query');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSearchResponse);
    });

    it('should fail after exhausting retry attempts', async () => {
      const error = new TypeError('Failed to fetch');
      mockFetch.mockRejectedValue(error);

      await expect(searchService.performSearch('test query')).rejects.toThrow(error);

      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('getSearchHistory', () => {
    const mockHistoryResponse = {
      searches: [
        {
          _id: 'search-1',
          query: 'test query 1',
          results: [],
          timestamp: new Date('2023-01-01'),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    };

    it('should get search history successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoryResponse,
      });

      const result = await searchService.getSearchHistory(1, 10);

      expect(mockFetch).toHaveBeenCalledWith('/api/search/history?page=1&limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockHistoryResponse);
    });

    it('should use default pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoryResponse,
      });

      await searchService.getSearchHistory();

      expect(mockFetch).toHaveBeenCalledWith('/api/search/history?page=1&limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'No history found' }),
      });

      await expect(searchService.getSearchHistory()).rejects.toThrow(
        new SearchServiceError('No history found', 404)
      );
    });
  });

  describe('getSearchById', () => {
    const mockSearchByIdResponse = {
      search: {
        _id: 'search-1',
        query: 'test query',
        results: [],
        timestamp: new Date('2023-01-01'),
      },
    };

    it('should get search by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchByIdResponse,
      });

      const result = await searchService.getSearchById('search-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/search/search-1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockSearchByIdResponse);
    });

    it('should throw error for empty search ID', async () => {
      await expect(searchService.getSearchById('')).rejects.toThrow(
        new SearchServiceError('Search ID is required', 400, 'MISSING_SEARCH_ID')
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Search not found' }),
      });

      await expect(searchService.getSearchById('nonexistent')).rejects.toThrow(
        new SearchServiceError('Search not found', 404)
      );
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON responses', async () => {
      // Mock all retry attempts to fail with the same error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      await expect(searchService.performSearch('test query')).rejects.toThrow(
        new SearchServiceError('HTTP 500: Internal Server Error', 500)
      );
    });

    it('should handle responses without error messages', async () => {
      // Mock all retry attempts to fail with the same error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await expect(searchService.performSearch('test query')).rejects.toThrow(
        new SearchServiceError('HTTP 500: Internal Server Error', 500)
      );
    });
  });
});