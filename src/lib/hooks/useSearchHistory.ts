import { useState, useCallback, useEffect } from 'react';
import { SearchService, SearchServiceError } from '../services/SearchService';
import { SearchHistory } from '../../types';

export interface UseSearchHistoryState {
  searches: SearchHistory[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  currentPage: number;
}

export interface UseSearchHistoryActions {
  loadHistory: (page?: number, limit?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  selectSearch: (searchId: string) => Promise<SearchHistory | null>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

export interface UseSearchHistoryReturn extends UseSearchHistoryState, UseSearchHistoryActions {}

export function useSearchHistory(
  searchService?: SearchService,
  initialLimit: number = 10
): UseSearchHistoryReturn {
  const service = searchService || new SearchService();

  const [state, setState] = useState<UseSearchHistoryState>({
    searches: [],
    isLoading: false,
    error: null,
    hasMore: true,
    total: 0,
    currentPage: 0,
  });

  const loadHistory = useCallback(async (page: number = 1, limit: number = initialLimit) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await service.getSearchHistory(page, limit);
      
      setState(prev => ({
        ...prev,
        searches: page === 1 ? response.searches : [...prev.searches, ...response.searches],
        total: response.total,
        currentPage: page,
        hasMore: response.searches.length === limit && (page * limit) < response.total,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      let errorMessage = 'Failed to load search history';
      
      if (error instanceof SearchServiceError) {
        switch (error.status) {
          case 404:
            errorMessage = 'No search history found';
            break;
          case 500:
            errorMessage = 'Server error while loading history';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [service, initialLimit]);

  const loadMore = useCallback(async () => {
    if (state.isLoading || !state.hasMore) {
      return;
    }

    await loadHistory(state.currentPage + 1, initialLimit);
  }, [loadHistory, state.isLoading, state.hasMore, state.currentPage, initialLimit]);

  const selectSearch = useCallback(async (searchId: string): Promise<SearchHistory | null> => {
    try {
      const response = await service.getSearchById(searchId);
      return response.search;
    } catch (error) {
      let errorMessage = 'Failed to load search details';
      
      if (error instanceof SearchServiceError) {
        switch (error.status) {
          case 404:
            errorMessage = 'Search not found';
            break;
          case 500:
            errorMessage = 'Server error while loading search';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      
      return null;
    }
  }, [service]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const refresh = useCallback(async () => {
    setState(prev => ({
      ...prev,
      searches: [],
      currentPage: 0,
      hasMore: true,
      total: 0,
    }));
    
    await loadHistory(1, initialLimit);
  }, [loadHistory, initialLimit]);

  // Load initial history on mount
  useEffect(() => {
    loadHistory(1, initialLimit);
  }, [loadHistory, initialLimit]);

  return {
    ...state,
    loadHistory,
    loadMore,
    selectSearch,
    clearError,
    refresh,
  };
}