'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { EnhancedResult } from '@/types';
import { ErrorDisplay, parseError, SuccessFeedback } from './ErrorDisplay';
import { useToast } from '@/lib/hooks/useToast';

interface SearchInterfaceProps {
  onSearch?: (query: string) => Promise<EnhancedResult[]>;
  onResults?: (results: EnhancedResult[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function SearchInterface({ onSearch, onResults, onError, disabled = false }: SearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccessfulQuery, setLastSuccessfulQuery] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const validateQuery = (query: string): string | null => {
    if (!query.trim()) {
      return 'Search query cannot be empty';
    }
    if (query.trim().length < 2) {
      return 'Search query must be at least 2 characters long';
    }
    if (query.trim().length > 500) {
      return 'Search query is too long (maximum 500 characters)';
    }
    return null;
  };

  const performSearch = useCallback(async (query: string, isRetry = false) => {
    // Clear previous error
    setError(null);
    
    // Validate query
    const validationError = validateQuery(query);
    if (validationError) {
      setError(validationError);
      onError?.(validationError);
      return;
    }

    if (!onSearch) {
      const errorMsg = 'Search functionality not available';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    
    try {
      const results = await onSearch(query.trim());
      
      // Success feedback
      setLastSuccessfulQuery(query.trim());
      setRetryCount(0);
      onResults?.(results);
      
      // Show success toast for retries
      if (isRetry) {
        toast({
          title: "Search Successful",
          description: `Found ${results.length} results for "${query.trim()}"`,
          variant: "success",
        });
      }
      
    } catch (err) {
      const parsedError = parseError(err);
      setError(parsedError.message);
      onError?.(parsedError.message);
      
      // Show error toast with retry option
      if (parsedError.retryable) {
        toast({
          title: "Search Failed",
          description: parsedError.message,
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRetry()}
            >
              Retry
            </Button>
          ),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onSearch, onResults, onError, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(searchQuery);
  };

  const handleRetry = useCallback(() => {
    if (searchQuery.trim()) {
      setRetryCount(prev => prev + 1);
      performSearch(searchQuery, true);
    }
  }, [searchQuery, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleClearError = () => {
    setError(null);
  };

  const isDisabled = isLoading || disabled;
  const hasError = !!error;
  const canRetry = hasError && searchQuery.trim().length >= 2;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4" data-testid="search-interface">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your search query..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                    className={hasError ? 'border-destructive pr-10' : ''}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? 'search-error' : undefined}
                    maxLength={500}
                    data-testid="search-input"
                  />
                  {hasError && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                  {lastSuccessfulQuery && !hasError && !isLoading && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                
                {/* Character count for long queries */}
                {searchQuery.length > 400 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery.length}/500 characters
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={isDisabled || !searchQuery.trim()}
                className="px-4 min-w-[100px]"
                data-testid="search-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
              
              {canRetry && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="px-3"
                  data-testid="search-retry-button"
                >
                  Retry
                </Button>
              )}
            </div>

            {/* Keyboard shortcuts hint */}
            <p className="text-xs text-muted-foreground">
              Press Enter to search • {retryCount > 0 && `Retry attempt: ${retryCount}`}
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {hasError && (
        <ErrorDisplay
          error={error}
          onRetry={canRetry ? handleRetry : undefined}
          onDismiss={handleClearError}
          variant="alert"
          showDetails={process.env.NODE_ENV === 'development'}
        />
      )}

      {/* Success feedback for recent searches */}
      {lastSuccessfulQuery && !hasError && !isLoading && searchQuery.trim() === lastSuccessfulQuery && (
        <SuccessFeedback
          message={`Successfully searched for "${lastSuccessfulQuery}"`}
          onDismiss={() => setLastSuccessfulQuery(null)}
          autoHide={true}
          duration={3000}
        />
      )}
    </div>
  );
}