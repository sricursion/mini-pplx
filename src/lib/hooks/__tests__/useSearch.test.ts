import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../useSearch';
import { SearchService, SearchServiceError } from '../../services/SearchService';
import { EnhancedResult } from '../../../types';

// Mock SearchService
const mockSearchService = {
  performSearch: vi.fn(),
} as unknown as SearchService;

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSearch(mockSearchService));

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.searchId).toBe(null);
    expect(result.current.query).toBe('');
    expect(result.current.timestamp).toBe(null);
  });

  it('should perform successful search', async () => {
    const mockResults: EnhancedResult[] = [
      {
        title: 'Test Result',
        url: 'https://example.com',
        snippet: 'Test snippet',
        aiSummary: 'AI summary',
        relevanceScore: 0.95,
        source: 'exa',
      },
    ];

    const mockResponse = {
      results: mockResults,
      searchId: 'test-id',
      query: 'test query',
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    (mockSearchService.performSearch as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useSearch(mockSearchService));

    await act(async () => {
      await result.current.performSearch('test query');
    });

    expect(result.current.results).toEqual(mockResults);
    expect(result.current.searchId).toBe('test-id');
    expect(result.current.query).toBe('test query');
    expect(result.current.timestamp).toBe('2023-01-01T00:00:00.000Z');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle loading state during search', async () => {
    let resolveSearch: (value: any) => void;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });

    (mockSearchService.performSearch as any).mockReturnValueOnce(searchPromise);

    const { result } = renderHook(() => useSearch(mockSearchService));

    act(() => {
      result.current.performSearch('test query');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.query).toBe('test query');

    await act(async () => {
      resolveSearch!({
        results: [],
        searchId: null,
        query: 'test query',
        timestamp: '2023-01-01T00:00:00.000Z',
      });
      await searchPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle empty query validation', async () => {
    const { result } = renderHook(() => useSearch(mockSearchService));

    await act(async () => {
      await result.current.performSearch('');
    });

    expect(result.current.error).toBe('Please enter a search query');
    expect(result.current.isLoading).toBe(false);
    expect(mockSearchService.performSearch).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.performSearch('   ');
    });

    expect(result.current.error).toBe('Please enter a search query');
  });

  it('should handle SearchServiceError with different status codes', async () => {
    const testCases = [
      {
        error: new SearchServiceError('Invalid query', 400),
        expectedMessage: 'Invalid query',
      },
      {
        error: new SearchServiceError('Rate limited', 429),
        expectedMessage: 'Too many requests. Please wait a moment and try again.',
      },
      {
        error: new SearchServiceError('Service unavailable', 503),
        expectedMessage: 'Service unavailable',
      },
      {
        error: new SearchServiceError('Server error', 500),
        expectedMessage: 'Server error. Please try again later.',
      },
    ];

    for (const testCase of testCases) {
      (mockSearchService.performSearch as any).mockRejectedValueOnce(testCase.error);

      const { result } = renderHook(() => useSearch(mockSearchService));

      await act(async () => {
        await result.current.performSearch('test query');
      });

      expect(result.current.error).toBe(testCase.expectedMessage);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.results).toEqual([]);
      expect(result.current.searchId).toBe(null);
    }
  });

  it('should handle network errors', async () => {
    const networkError = new TypeError('Failed to fetch');
    (mockSearchService.performSearch as any).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useSearch(mockSearchService));

    await act(async () => {
      await result.current.performSearch('test query');
    });

    expect(result.current.error).toBe('Network error. Please check your connection and try again.');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle unknown errors', async () => {
    const unknownError = new Error('Unknown error');
    (mockSearchService.performSearch as any).mockRejectedValueOnce(unknownError);

    const { result } = renderHook(() => useSearch(mockSearchService));

    await act(async () => {
      await result.current.performSearch('test query');
    });

    expect(result.current.error).toBe('An unexpected error occurred');
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear results', async () => {
    const mockResponse = {
      results: [{ title: 'Test', url: 'test', snippet: 'test', source: 'exa' as const }],
      searchId: 'test-id',
      query: 'test query',
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    (mockSearchService.performSearch as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useSearch(mockSearchService));

    // First perform a search to set some state
    await act(async () => {
      await result.current.performSearch('test query');
    });

    // Verify state is set
    expect(result.current.results).toHaveLength(1);
    expect(result.current.searchId).toBe('test-id');

    // Clear results
    act(() => {
      result.current.clearResults();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.searchId).toBe(null);
    expect(result.current.query).toBe('');
    expect(result.current.timestamp).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should clear error', async () => {
    const error = new SearchServiceError('Test error', 400);
    (mockSearchService.performSearch as any).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSearch(mockSearchService));

    // First trigger an error
    await act(async () => {
      await result.current.performSearch('test query');
    });

    expect(result.current.error).toBe('Test error');

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should trim whitespace from query', async () => {
    const mockResponse = {
      results: [],
      searchId: null,
      query: 'test query',
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    (mockSearchService.performSearch as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useSearch(mockSearchService));

    await act(async () => {
      await result.current.performSearch('  test query  ');
    });

    expect(mockSearchService.performSearch).toHaveBeenCalledWith('  test query  ');
    expect(result.current.query).toBe('test query');
  });
});