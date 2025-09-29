import { describe, it, expect, beforeEach } from 'vitest';
import SearchHistory from '../SearchHistory';
import { EnhancedResult } from '../../types/search';

describe('SearchHistory Model', () => {
  const validEnhancedResult: EnhancedResult = {
    title: 'Test Article',
    url: 'https://example.com/article',
    snippet: 'This is a test snippet for the article',
    aiSummary: 'AI generated summary',
    relevanceScore: 0.85,
    source: 'exa'
  };

  const validSearchHistoryData = {
    query: 'test search query',
    results: [validEnhancedResult],
    sessionId: 'test-session-123',
    userId: 'test-user-456'
  };

  beforeEach(async () => {
    // Clear the collection before each test
    await SearchHistory.deleteMany({});
  });

  describe('Model Creation', () => {
    it('should create a valid search history document', async () => {
      const searchHistory = new SearchHistory(validSearchHistoryData);
      const savedHistory = await searchHistory.save();

      expect(savedHistory._id).toBeDefined();
      expect(savedHistory.query).toBe(validSearchHistoryData.query);
      expect(savedHistory.results).toHaveLength(1);
      expect(savedHistory.results[0].title).toBe(validEnhancedResult.title);
      expect(savedHistory.timestamp).toBeInstanceOf(Date);
      expect(savedHistory.sessionId).toBe(validSearchHistoryData.sessionId);
      expect(savedHistory.userId).toBe(validSearchHistoryData.userId);
    });

    it('should create a search history with minimal required fields', async () => {
      const minimalData = {
        query: 'minimal query',
        results: [{
          title: 'Minimal Title',
          url: 'https://example.com',
          snippet: 'Minimal snippet',
          source: 'exa' as const
        }]
      };

      const searchHistory = new SearchHistory(minimalData);
      const savedHistory = await searchHistory.save();

      expect(savedHistory.query).toBe(minimalData.query);
      expect(savedHistory.results).toHaveLength(1);
      expect(savedHistory.sessionId).toBeUndefined();
      expect(savedHistory.userId).toBeUndefined();
    });

    it('should auto-generate timestamp if not provided', async () => {
      const searchHistory = new SearchHistory(validSearchHistoryData);
      const savedHistory = await searchHistory.save();

      expect(savedHistory.timestamp).toBeInstanceOf(Date);
      expect(savedHistory.createdAt).toBeInstanceOf(Date);
      expect(savedHistory.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Validation', () => {
    it('should require query field', async () => {
      const invalidData = { ...validSearchHistoryData };
      delete (invalidData as any).query;

      const searchHistory = new SearchHistory(invalidData);
      
      await expect(searchHistory.save()).rejects.toThrow();
    });

    it('should set empty array for results if not provided', async () => {
      const dataWithoutResults = { ...validSearchHistoryData };
      delete (dataWithoutResults as any).results;

      const searchHistory = new SearchHistory(dataWithoutResults);
      const savedHistory = await searchHistory.save();
      
      expect(savedHistory.results).toEqual([]);
    });

    it('should allow empty results array', async () => {
      const dataWithEmptyResults = { ...validSearchHistoryData, results: [] };
      const searchHistory = new SearchHistory(dataWithEmptyResults);
      
      const savedHistory = await searchHistory.save();
      expect(savedHistory.results).toHaveLength(0);
    });

    it('should reject empty query', async () => {
      const invalidData = { ...validSearchHistoryData, query: '' };
      const searchHistory = new SearchHistory(invalidData);
      
      await expect(searchHistory.save()).rejects.toThrow();
    });

    it('should reject query longer than 500 characters', async () => {
      const longQuery = 'a'.repeat(501);
      const invalidData = { ...validSearchHistoryData, query: longQuery };
      const searchHistory = new SearchHistory(invalidData);
      
      await expect(searchHistory.save()).rejects.toThrow();
    });

    it('should validate enhanced result fields', async () => {
      const invalidResult = {
        title: '', // Empty title should fail
        url: 'invalid-url', // Invalid URL should fail
        snippet: 'Valid snippet',
        source: 'exa'
      };

      const invalidData = { ...validSearchHistoryData, results: [invalidResult] };
      const searchHistory = new SearchHistory(invalidData);
      
      await expect(searchHistory.save()).rejects.toThrow();
    });

    it('should validate URL format in results', async () => {
      const invalidResult = {
        title: 'Valid Title',
        url: 'not-a-valid-url',
        snippet: 'Valid snippet',
        source: 'exa'
      };

      const invalidData = { ...validSearchHistoryData, results: [invalidResult] };
      const searchHistory = new SearchHistory(invalidData);
      
      await expect(searchHistory.save()).rejects.toThrow();
    });

    it('should validate relevance score range', async () => {
      const invalidResult = {
        ...validEnhancedResult,
        relevanceScore: 1.5 // Should be between 0 and 1
      };

      const invalidData = { ...validSearchHistoryData, results: [invalidResult] };
      const searchHistory = new SearchHistory(invalidData);
      
      await expect(searchHistory.save()).rejects.toThrow();
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test data
      await SearchHistory.create([
        {
          query: 'javascript tutorial',
          results: [validEnhancedResult],
          sessionId: 'session-1'
        },
        {
          query: 'react hooks',
          results: [validEnhancedResult],
          sessionId: 'session-1'
        },
        {
          query: 'node.js guide',
          results: [validEnhancedResult],
          sessionId: 'session-2',
          userId: 'user-1'
        }
      ]);
    });

    it('should find searches by query', async () => {
      const results = await SearchHistory.findByQuery('javascript');
      expect(results).toHaveLength(1);
      expect(results[0].query).toBe('javascript tutorial');
    });

    it('should find searches by session ID', async () => {
      const results = await SearchHistory.findBySessionId('session-1');
      expect(results).toHaveLength(2);
    });

    it('should find searches by user ID', async () => {
      const results = await SearchHistory.findByUserId('user-1');
      expect(results).toHaveLength(1);
      expect(results[0].query).toBe('node.js guide');
    });

    it('should get recent searches', async () => {
      const results = await SearchHistory.getRecentSearches(2);
      expect(results).toHaveLength(2);
      // Should be sorted by timestamp descending
      expect(results[0].timestamp.getTime()).toBeGreaterThanOrEqual(results[1].timestamp.getTime());
    });

    it('should limit results correctly', async () => {
      const results = await SearchHistory.getRecentSearches(1);
      expect(results).toHaveLength(1);
    });
  });

  describe('Instance Methods', () => {
    it('should convert to JSON properly', async () => {
      const searchHistory = new SearchHistory(validSearchHistoryData);
      const savedHistory = await searchHistory.save();
      
      const json = savedHistory.toJSON();
      expect(json.query).toBe(validSearchHistoryData.query);
      expect(json.results).toHaveLength(1);
      expect(json._id).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should create proper indexes', async () => {
      const indexes = await SearchHistory.collection.getIndexes();
      
      // Check that required indexes exist
      const indexNames = Object.keys(indexes);
      expect(indexNames).toContain('query_1');
      expect(indexNames).toContain('timestamp_-1');
      expect(indexNames).toContain('sessionId_1_timestamp_-1');
    });
  });
});