import { useState, useCallback } from 'react';
import { SearchService, SearchServiceError, SearchResponse } from '../services/SearchService';
import { EnhancedResult } from '../../types';

export interface UseSearchState {
  results: EnhancedResult[];
  isLoading: boolean;
  error: string | null;
  searchId: string | null;
  query: string;
  timestamp: string | null;
}

export interface UseSearchActions {
  performSearch: (query: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export interface UseSearchReturn extends UseSearchState, UseSearchActions {}

export function useSearch(searchService?: SearchService): UseSearchReturn {
  const service = searchService || new SearchService();

  const [state, setState] = useState<UseSearchState>({
    results: [],
    isLoading: false,
    error: null,
    searchId: null,
    query: '',
    timestamp: null,
  });

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setState(prev => ({
        ...prev,
        error: 'Please enter a search query',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      query: query.trim(),
    }));

    try {
      const response: SearchResponse = await service.performSearch(query);
      
      setState(prev => ({
        ...prev,
        results: response.results,
        searchId: response.searchId,
        timestamp: response.timestamp,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof SearchServiceError) {
        switch (error.status) {
          case 400:
            errorMessage = error.message || 'Invalid search query';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 503:
            errorMessage = error.message || 'Search service is temporarily unavailable. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        results: [],
        searchId: null,
        timestamp: null,
      }));
    }
  }, [service]);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: [],
      searchId: null,
      query: '',
      timestamp: null,
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    performSearch,
    clearResults,
    clearError,
  };
}