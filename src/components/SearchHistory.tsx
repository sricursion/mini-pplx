'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Search, FileText } from 'lucide-react';
import { SearchHistory as SearchHistoryType } from '@/types';

interface SearchHistoryProps {
  searches: SearchHistoryType[];
  onSelectSearch?: (search: SearchHistoryType) => void;
  isLoading?: boolean;
  className?: string;
}

export function SearchHistory({ 
  searches, 
  onSelectSearch, 
  isLoading = false, 
  className 
}: SearchHistoryProps) {
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  const handleSearchClick = (search: SearchHistoryType) => {
    onSelectSearch?.(search);
  };

  if (isLoading) {
    return (
      <Card className={className} data-testid="search-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Search History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (searches.length === 0) {
    return (
      <Card className={className} data-testid="search-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Search History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No previous searches</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your previous searches will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="search-history">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Search History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {searches.map((search) => (
            <Button
              key={search._id}
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-left hover:bg-muted/50"
              onClick={() => handleSearchClick(search)}
              data-testid="history-item"
            >
              <div className="flex items-start gap-3 w-full">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {search.query}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTimestamp(search.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>
                      {search.results.length} result{search.results.length !== 1 ? 's' : ''}
                    </span>
                    {search.results.some(result => result.aiSummary) && (
                      <>
                        <span>•</span>
                        <span>AI enhanced</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}