import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock the dependencies
vi.mock('../../../../lib/services/ExaAIService');
vi.mock('../../../../lib/services/MistralService');
vi.mock('../../../../models/SearchHistory');
vi.mock('../../../../lib/database');
vi.mock('../../../../lib/validation');

const mockExaAIService = vi.hoisted(() => ({
  search: vi.fn(),
}));

const mockMistralService = vi.hoisted(() => ({
  enhanceMultipleResults: vi.fn(),
}));

const mockSearchHistory = vi.hoisted(() => ({
  save: vi.fn(),
}));

const mockValidation = vi.hoisted(() => ({
  validateSearchQuery: vi.fn(),
  sanitizeSearchQuery: vi.fn(),
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

const mockDatabase = vi.hoisted(() => ({
  connectToDatabase: vi.fn(),
}));

vi.mocked(vi.importActual('../../../../lib/services/ExaAIService')).ExaAIService = vi.fn(() => mockExaAIService);
vi.mocked(vi.importActual('../../../../lib/services/MistralService')).MistralService = vi.fn(() => mockMistralService);
vi.mocked(vi.importActual('../../../../models/SearchHistory')).default = vi.fn(() => mockSearchHistory);
vi.mocked(vi.importActual('../../../../lib/validation')).validateSearchQuery = mockValidation.validateSearchQuery;
vi.mocked(vi.importActual('../../../../lib/validation')).sanitizeSearchQuery = mockValidation.sanitizeSearchQuery;
vi.mocked(vi.importActual('../../../../lib/validation')).ValidationError = mockValidation.ValidationError;
vi.mocked(vi.importActual('../../../../lib/database')).connectToDatabase = mockDatabase.connectToDatabase;

describe('Search API Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful mocks
    mockValidation.validateSearchQuery.mockImplementation(() => {});
    mockValidation.sanitizeSearchQuery.mockImplementation((query) => query);
    mockDatabase.connectToDatabase.mockResolvedValue(undefined);
    mockSearchHistory.save.mockResolvedValue({ _id: 'test-id' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  describe('Request validation errors', () => {
    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
      });
    });

    it('should handle validation errors', async () => {
      mockValidation.validateSearchQuery.mockImplementation(() => {
        throw new mockValidation.ValidationError('Query is required');
      });

      const request = createRequest({ query: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: 'Query is required',
      });
    });
  });

  describe('Service initialization errors', () => {
    it('should handle service initialization failure', async () => {
      vi.mocked(vi.importActual('../../../../lib/services/ExaAIService')).ExaAIService = vi.fn(() => {
        throw new Error('Service initialization failed');
      });

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toMatchObject({
        error: 'Search services are not properly configured',
      });
    });
  });

  describe('Exa AI service errors', () => {
    it('should handle Exa AI service failure', async () => {
      mockExaAIService.search.mockRejectedValue(new Error('Exa AI service unavailable'));

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toMatchObject({
        error: 'Search service is temporarily unavailable. Please try again later.',
      });
    });

    it('should handle empty search results', async () => {
      mockExaAIService.search.mockResolvedValue([]);

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        results: [],
        searchId: null,
        message: 'No results found for your query',
      });
    });
  });

  describe('Mistral AI service errors', () => {
    it('should fallback when Mistral AI fails', async () => {
      const mockResults = [
        {
          title: 'Test Result',
          url: 'https://example.com',
          text: 'Test content',
          score: 0.9,
        },
      ];

      mockExaAIService.search.mockResolvedValue(mockResults);
      mockMistralService.enhanceMultipleResults.mockRejectedValue(
        new Error('Mistral AI unavailable')
      );

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0]).toMatchObject({
        title: 'Test Result',
        url: 'https://example.com',
        snippet: 'Test content',
        relevanceScore: 0.9,
        source: 'exa',
      });
      // Should not have aiSummary when Mistral fails
      expect(data.results[0].aiSummary).toBeUndefined();
    });
  });

  describe('Database errors', () => {
    it('should continue without saving when database fails', async () => {
      const mockResults = [
        {
          title: 'Test Result',
          url: 'https://example.com',
          text: 'Test content',
          score: 0.9,
        },
      ];

      mockExaAIService.search.mockResolvedValue(mockResults);
      mockMistralService.enhanceMultipleResults.mockResolvedValue(['AI Summary']);
      mockDatabase.connectToDatabase.mockRejectedValue(new Error('Database unavailable'));

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.searchId).toBeNull(); // Should be null when database save fails
    });

    it('should continue when search history save fails', async () => {
      const mockResults = [
        {
          title: 'Test Result',
          url: 'https://example.com',
          text: 'Test content',
          score: 0.9,
        },
      ];

      mockExaAIService.search.mockResolvedValue(mockResults);
      mockMistralService.enhanceMultipleResults.mockResolvedValue(['AI Summary']);
      mockSearchHistory.save.mockRejectedValue(new Error('Save failed'));

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.searchId).toBeNull(); // Should be null when save fails
    });
  });

  describe('Network and timeout errors', () => {
    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockExaAIService.search.mockRejectedValue(timeoutError);

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toMatchObject({
        error: 'Search service is temporarily unavailable. Please try again later.',
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('fetch failed');
      mockExaAIService.search.mockRejectedValue(networkError);

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toMatchObject({
        error: 'Search service is temporarily unavailable. Please try again later.',
      });
    });
  });

  describe('Unexpected errors', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockExaAIService.search.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({
        error: 'Internal server error. Please try again later.',
        code: 'INTERNAL_ERROR',
        retryable: true,
      });
    });

    it('should include error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockExaAIService.search.mockImplementation(() => {
        throw new Error('Detailed error message');
      });

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details).toBe('Detailed error message');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include error details in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockExaAIService.search.mockImplementation(() => {
        throw new Error('Detailed error message');
      });

      const request = createRequest({ query: 'test query' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});