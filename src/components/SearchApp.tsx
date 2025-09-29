'use client';

import React, { useState, useCallback } from 'react';
import { SearchInterface } from './SearchInterface';
import { SearchHistory } from './SearchHistory';
import { ResultCard } from './ResultCard';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorDisplay } from './ErrorDisplay';
import { LoadingIndicator } from './LoadingIndicator';
import { useSearch } from '@/lib/hooks/useSearch';
import { useSearchHistory } from '@/lib/hooks/useSearchHistory';
import { SearchService } from '@/lib/services/SearchService';
import { EnhancedResult, SearchHistory as SearchHistoryType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Search as SearchIcon, Sparkles, X } from 'lucide-react';

// Create a singleton search service instance
const searchService = new SearchService();

interface SearchAppProps {
  className?: string;
}

export function SearchApp({ className }: SearchAppProps) {
  // State management using custom hooks
  const {
    results,
    isLoading: isSearching,
    error: searchError,
    searchId,
    query: currentQuery,
    timestamp,
    performSearch,
    clearResults,
    clearError: clearSearchError,
  } = useSearch(searchService);

  const {
    searches: searchHistory,
    isLoading: isLoadingHistory,
    error: historyError,
    selectSearch,
    refresh: refreshHistory,
    clearError: clearHistoryError,
  } = useSearchHistory(searchService);

  // Local state for UI management
  const [selectedHistorySearch, setSelectedHistorySearch] = useState<SearchHistoryType | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Handle new search from SearchInterface
  const handleSearch = useCallback(async (query: string): Promise<EnhancedResult[]> => {
    try {
      await performSearch(query);
      setShowResults(true);
      setSelectedHistorySearch(null);
      
      // Refresh history to include the new search
      setTimeout(() => {
        refreshHistory();
      }, 500);
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }, [performSearch, results, refreshHistory]);

  // Handle search results from SearchInterface
  const handleResults = useCallback((searchResults: EnhancedResult[]) => {
    setShowResults(true);
  }, []);

  // Handle errors from SearchInterface
  const handleSearchInterfaceError = useCallback((error: string) => {
    console.error('Search interface error:', error);
    setShowResults(false);
    
    // Show user-friendly error message
    if (error.includes('network') || error.includes('fetch')) {
      // Network error - show connection issue message
    } else if (error.includes('timeout')) {
      // Timeout error - suggest trying again
    }
  }, []);

  // Handle selecting a search from history
  const handleSelectHistorySearch = useCallback(async (search: SearchHistoryType) => {
    try {
      const fullSearch = await selectSearch(search._id!);
      if (fullSearch) {
        setSelectedHistorySearch(fullSearch);
        setShowResults(true);
        clearResults(); // Clear current search results
      }
    } catch (error) {
      console.error('Failed to load search from history:', error);
    }
  }, [selectSearch, clearResults]);

  // Clear all errors
  const handleClearAllErrors = useCallback(() => {
    clearSearchError();
    clearHistoryError();
  }, [clearSearchError, clearHistoryError]);

  // Get the results to display (either current search or selected history)
  const displayResults = selectedHistorySearch ? selectedHistorySearch.results : results;
  const displayQuery = selectedHistorySearch ? selectedHistorySearch.query : currentQuery;
  const displayTimestamp = selectedHistorySearch ? selectedHistorySearch.timestamp : timestamp;

  // Determine if we have any errors to show
  const hasErrors = Boolean(searchError || historyError);
  const errorMessage = searchError || historyError;

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-background ${className || ''}`}>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">AI Search Engine</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover information with AI-enhanced search results. Get intelligent summaries and insights from across the web.
            </p>
          </div>

          {/* Error Display */}
          {hasErrors && (
            <div className="mb-6">
              <ErrorDisplay
                error={errorMessage || 'An error occurred'}
                onRetry={() => {
                  handleClearAllErrors();
                  refreshHistory();
                }}
                onDismiss={handleClearAllErrors}
                variant="alert"
                showDetails={process.env.NODE_ENV === 'development'}
              />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Search Interface - Full width on mobile, spans 3 columns on desktop */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search Input */}
              <SearchInterface
                onSearch={handleSearch}
                onResults={handleResults}
                onError={handleSearchInterfaceError}
              />

              {/* Search Results */}
              {showResults && displayResults.length > 0 && (
                <Card data-testid="search-results">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SearchIcon className="h-5 w-5" />
                      Search Results
                      {displayQuery && (
                        <span className="text-base font-normal text-muted-foreground">
                          for "{displayQuery}"
                        </span>
                      )}
                    </CardTitle>
                    {displayTimestamp && (
                      <p className="text-sm text-muted-foreground">
                        {selectedHistorySearch ? 'From history • ' : ''}
                        {new Date(displayTimestamp).toLocaleString()}
                        {displayResults.length > 0 && (
                          <span className="ml-2">
                            • {displayResults.length} result{displayResults.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {displayResults.map((result, index) => (
                        <ResultCard
                          key={`${result.url}-${index}`}
                          result={result}
                          data-testid="result-card"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Results Message */}
              {showResults && displayResults.length === 0 && !isSearching && (
                <Card>
                  <CardContent className="text-center py-12">
                    <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search query or check your spelling.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {isSearching && (
                <LoadingIndicator
                  variant="search"
                  message="Searching and enhancing results..."
                  size="md"
                />
              )}
            </div>

            {/* Search History Sidebar */}
            <div className="lg:col-span-1">
              <SearchHistory
                searches={searchHistory}
                onSelectSearch={handleSelectHistorySearch}
                isLoading={isLoadingHistory}
                className="sticky top-6"
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>
              Powered by{' '}
              <span className="font-semibold">Exa AI</span> search and{' '}
              <span className="font-semibold">Mistral AI</span> enhancement
            </p>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default SearchApp;