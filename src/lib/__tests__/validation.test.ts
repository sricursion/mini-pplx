import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  isValidUrl,
  validateEnhancedResult,
  validateSearchQuery,
  validateCreateSearchHistoryInput,
  sanitizeSearchQuery,
  sanitizeEnhancedResult
} from '../validation';
import { EnhancedResult } from '../../types/search';

describe('Validation Utilities', () => {
  describe('ValidationError', () => {
    it('should create validation error with message and field', () => {
      const error = new ValidationError('Test error', 'testField');
      expect(error.message).toBe('Test error');
      expect(error.field).toBe('testField');
      expect(error.name).toBe('ValidationError');
    });

    it('should create validation error without field', () => {
      const error = new ValidationError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.field).toBeUndefined();
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
      expect(isValidUrl('ftp://example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
    });
  });

  describe('validateEnhancedResult', () => {
    const validResult: EnhancedResult = {
      title: 'Test Title',
      url: 'https://example.com',
      snippet: 'Test snippet content',
      aiSummary: 'AI generated summary',
      relevanceScore: 0.85,
      source: 'exa'
    };

    it('should validate correct enhanced result', () => {
      expect(() => validateEnhancedResult(validResult)).not.toThrow();
      expect(validateEnhancedResult(validResult)).toBe(true);
    });

    it('should validate minimal enhanced result', () => {
      const minimalResult = {
        title: 'Test Title',
        url: 'https://example.com',
        snippet: 'Test snippet',
        source: 'exa'
      };
      expect(() => validateEnhancedResult(minimalResult)).not.toThrow();
    });

    it('should reject non-object input', () => {
      expect(() => validateEnhancedResult(null)).toThrow('Result must be an object');
      expect(() => validateEnhancedResult('string')).toThrow('Result must be an object');
      expect(() => validateEnhancedResult(123)).toThrow('Result must be an object');
    });

    it('should reject missing required fields', () => {
      const withoutTitle = { ...validResult };
      delete (withoutTitle as any).title;
      expect(() => validateEnhancedResult(withoutTitle)).toThrow('Title is required');

      const withoutUrl = { ...validResult };
      delete (withoutUrl as any).url;
      expect(() => validateEnhancedResult(withoutUrl)).toThrow('URL is required');

      const withoutSnippet = { ...validResult };
      delete (withoutSnippet as any).snippet;
      expect(() => validateEnhancedResult(withoutSnippet)).toThrow('Snippet is required');
    });

    it('should reject empty title', () => {
      const emptyTitle = { ...validResult, title: '' };
      expect(() => validateEnhancedResult(emptyTitle)).toThrow('Title is required');
    });

    it('should reject title longer than 500 characters', () => {
      const longTitle = { ...validResult, title: 'a'.repeat(501) };
      expect(() => validateEnhancedResult(longTitle)).toThrow('Title must be 500 characters or less');
    });

    it('should reject invalid URLs', () => {
      const invalidUrl = { ...validResult, url: 'not-a-url' };
      expect(() => validateEnhancedResult(invalidUrl)).toThrow('URL must be a valid URL format');
    });

    it('should reject snippet longer than 2000 characters', () => {
      const longSnippet = { ...validResult, snippet: 'a'.repeat(2001) };
      expect(() => validateEnhancedResult(longSnippet)).toThrow('Snippet must be 2000 characters or less');
    });

    it('should validate optional aiSummary', () => {
      const withoutSummary = { ...validResult };
      delete withoutSummary.aiSummary;
      expect(() => validateEnhancedResult(withoutSummary)).not.toThrow();

      const longSummary = { ...validResult, aiSummary: 'a'.repeat(1001) };
      expect(() => validateEnhancedResult(longSummary)).toThrow('AI summary must be 1000 characters or less');

      const invalidSummary = { ...validResult, aiSummary: 123 as any };
      expect(() => validateEnhancedResult(invalidSummary)).toThrow('AI summary must be a string');
    });

    it('should validate optional relevanceScore', () => {
      const withoutScore = { ...validResult };
      delete withoutScore.relevanceScore;
      expect(() => validateEnhancedResult(withoutScore)).not.toThrow();

      const invalidScore1 = { ...validResult, relevanceScore: -0.1 };
      expect(() => validateEnhancedResult(invalidScore1)).toThrow('Relevance score must be a number between 0 and 1');

      const invalidScore2 = { ...validResult, relevanceScore: 1.1 };
      expect(() => validateEnhancedResult(invalidScore2)).toThrow('Relevance score must be a number between 0 and 1');

      const invalidScore3 = { ...validResult, relevanceScore: 'invalid' as any };
      expect(() => validateEnhancedResult(invalidScore3)).toThrow('Relevance score must be a number between 0 and 1');
    });

    it('should validate source field', () => {
      const invalidSource = { ...validResult, source: 'invalid' as any };
      expect(() => validateEnhancedResult(invalidSource)).toThrow('Source must be "exa"');
    });
  });

  describe('validateSearchQuery', () => {
    it('should validate correct search query', () => {
      const validQuery = { query: 'test search' };
      expect(() => validateSearchQuery(validQuery)).not.toThrow();
      expect(validateSearchQuery(validQuery)).toBe(true);
    });

    it('should reject non-object input', () => {
      expect(() => validateSearchQuery(null)).toThrow('Input must be an object');
      expect(() => validateSearchQuery('string')).toThrow('Input must be an object');
    });

    it('should reject missing query', () => {
      expect(() => validateSearchQuery({})).toThrow('Query is required');
    });

    it('should reject non-string query', () => {
      expect(() => validateSearchQuery({ query: 123 })).toThrow('Query is required and must be a string');
    });

    it('should reject empty query', () => {
      expect(() => validateSearchQuery({ query: '' })).toThrow('Query cannot be empty');
      expect(() => validateSearchQuery({ query: '   ' })).toThrow('Query cannot be empty');
    });

    it('should reject query longer than 500 characters', () => {
      const longQuery = 'a'.repeat(501);
      expect(() => validateSearchQuery({ query: longQuery })).toThrow('Query must be 500 characters or less');
    });
  });

  describe('validateCreateSearchHistoryInput', () => {
    const validInput = {
      query: 'test query',
      results: [{
        title: 'Test Title',
        url: 'https://example.com',
        snippet: 'Test snippet',
        source: 'exa' as const
      }],
      sessionId: 'session-123',
      userId: 'user-456'
    };

    it('should validate correct input', () => {
      expect(() => validateCreateSearchHistoryInput(validInput)).not.toThrow();
      expect(validateCreateSearchHistoryInput(validInput)).toBe(true);
    });

    it('should validate minimal input', () => {
      const minimalInput = {
        query: 'test query',
        results: [{
          title: 'Test Title',
          url: 'https://example.com',
          snippet: 'Test snippet',
          source: 'exa' as const
        }]
      };
      expect(() => validateCreateSearchHistoryInput(minimalInput)).not.toThrow();
    });

    it('should reject non-object input', () => {
      expect(() => validateCreateSearchHistoryInput(null)).toThrow('Input must be an object');
    });

    it('should reject invalid query', () => {
      const invalidInput = { ...validInput, query: '' };
      expect(() => validateCreateSearchHistoryInput(invalidInput)).toThrow('Query cannot be empty');
    });

    it('should reject non-array results', () => {
      const invalidInput = { ...validInput, results: 'not-array' };
      expect(() => validateCreateSearchHistoryInput(invalidInput)).toThrow('Results must be an array');
    });

    it('should reject invalid results', () => {
      const invalidInput = {
        ...validInput,
        results: [{
          title: '',
          url: 'invalid-url',
          snippet: 'Test snippet',
          source: 'exa'
        }]
      };
      expect(() => validateCreateSearchHistoryInput(invalidInput)).toThrow('Result at index 0');
    });

    it('should validate optional sessionId', () => {
      const invalidSessionId = { ...validInput, sessionId: 'a'.repeat(101) };
      expect(() => validateCreateSearchHistoryInput(invalidSessionId)).toThrow('Session ID must be a string of 100 characters or less');
    });

    it('should validate optional userId', () => {
      const invalidUserId = { ...validInput, userId: 'a'.repeat(101) };
      expect(() => validateCreateSearchHistoryInput(invalidUserId)).toThrow('User ID must be a string of 100 characters or less');
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should trim whitespace', () => {
      expect(sanitizeSearchQuery('  test query  ')).toBe('test query');
    });

    it('should normalize multiple spaces', () => {
      expect(sanitizeSearchQuery('test    multiple   spaces')).toBe('test multiple spaces');
    });

    it('should handle mixed whitespace', () => {
      expect(sanitizeSearchQuery('  test\t\n  query  ')).toBe('test query');
    });
  });

  describe('sanitizeEnhancedResult', () => {
    it('should trim all string fields', () => {
      const result: EnhancedResult = {
        title: '  Test Title  ',
        url: '  https://example.com  ',
        snippet: '  Test snippet  ',
        aiSummary: '  AI summary  ',
        relevanceScore: 0.85,
        source: 'exa'
      };

      const sanitized = sanitizeEnhancedResult(result);
      expect(sanitized.title).toBe('Test Title');
      expect(sanitized.url).toBe('https://example.com');
      expect(sanitized.snippet).toBe('Test snippet');
      expect(sanitized.aiSummary).toBe('AI summary');
      expect(sanitized.relevanceScore).toBe(0.85);
      expect(sanitized.source).toBe('exa');
    });

    it('should handle undefined aiSummary', () => {
      const result: EnhancedResult = {
        title: 'Test Title',
        url: 'https://example.com',
        snippet: 'Test snippet',
        source: 'exa'
      };

      const sanitized = sanitizeEnhancedResult(result);
      expect(sanitized.aiSummary).toBeUndefined();
    });

    it('should set default source', () => {
      const result = {
        title: 'Test Title',
        url: 'https://example.com',
        snippet: 'Test snippet'
      } as EnhancedResult;

      const sanitized = sanitizeEnhancedResult(result);
      expect(sanitized.source).toBe('exa');
    });
  });
});