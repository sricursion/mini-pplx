import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExaAIService } from '../ExaAIService';
import { ExaSearchResult } from '../../../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ExaAIService', () => {
  let service: ExaAIService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    service = new ExaAIService(mockApiKey);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create service with provided API key', () => {
      const testService = new ExaAIService('custom-key');
      expect(testService).toBeInstanceOf(ExaAIService);
    });

    it('should throw error when no API key is provided', () => {
      // Mock config to return empty API key
      vi.doMock('../../config', () => ({
        config: {
          apis: {
            exaApiKey: '',
          },
        },
      }));

      expect(() => new ExaAIService()).toThrow('Exa AI API key is required');
    });
  });

  describe('search', () => {
    const mockSearchResults = {
      results: [
        {
          title: 'Test Result 1',
          url: 'https://example.com/1',
          text: 'This is test content 1',
          score: 0.95,
          publishedDate: '2024-01-01',
        },
        {
          title: 'Test Result 2',
          url: 'https://example.com/2',
          text: 'This is test content 2',
          score: 0.87,
        },
      ],
    };

    it('should perform successful search', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults,
      });

      const results = await service.search('test query');

      expect(mockFetch).toHaveBeenCalledWith('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': mockApiKey,
        },
        body: JSON.stringify({
          query: 'test query',
          numResults: 10,
          includeDomains: undefined,
          excludeDomains: undefined,
          startCrawlDate: undefined,
          endCrawlDate: undefined,
          useAutoprompt: false,
          contents: {
            text: true,
          },
        }),
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        title: 'Test Result 1',
        url: 'https://example.com/1',
        text: 'This is test content 1',
        score: 0.95,
        publishedDate: '2024-01-01',
      });
    });

    it('should handle search with options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults,
      });

      const options = {
        numResults: 5,
        includeDomains: ['example.com'],
        useAutoprompt: true,
      };

      await service.search('test query', options);

      expect(mockFetch).toHaveBeenCalledWith('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': mockApiKey,
        },
        body: JSON.stringify({
          query: 'test query',
          numResults: 5,
          includeDomains: ['example.com'],
          excludeDomains: undefined,
          startCrawlDate: undefined,
          endCrawlDate: undefined,
          useAutoprompt: true,
          contents: {
            text: true,
          },
        }),
      });
    });

    it('should throw error for empty query', async () => {
      await expect(service.search('')).rejects.toThrow('Search query cannot be empty');
      await expect(service.search('   ')).rejects.toThrow('Search query cannot be empty');
    });

    it('should handle 400 Bad Request error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid query format',
      });

      await expect(service.search('test query')).rejects.toThrow('Invalid request: Invalid query format');
    });

    it('should handle 401 Unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(service.search('test query')).rejects.toThrow('Invalid API key for Exa AI');
    });

    it('should handle 429 Rate Limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      });

      await expect(service.search('test query')).rejects.toThrow('Rate limit exceeded for Exa AI. Please try again later.');
    });

    it('should handle 500 Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      await expect(service.search('test query')).rejects.toThrow('Exa AI service is temporarily unavailable');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.search('test query')).rejects.toThrow('Network error');
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      await expect(service.search('test query')).rejects.toThrow('Failed to perform search with Exa AI');
    });

    it('should transform results with missing fields', async () => {
      const incompleteResults = {
        results: [
          {
            url: 'https://example.com/1',
            // Missing title, text, score
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteResults,
      });

      const results = await service.search('test query');

      expect(results[0]).toEqual({
        title: 'Untitled',
        url: 'https://example.com/1',
        text: '',
        score: 0,
        publishedDate: undefined,
      });
    });
  });

  describe('isServiceAvailable', () => {
    it('should return true when service is available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const isAvailable = await service.isServiceAvailable();
      expect(isAvailable).toBe(true);
    });

    it('should return false when service is unavailable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Service unavailable'));

      const isAvailable = await service.isServiceAvailable();
      expect(isAvailable).toBe(false);
    });
  });
});