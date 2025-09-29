'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Sparkles } from 'lucide-react';
import { EnhancedResult } from '@/types';

interface ResultCardProps {
  result: EnhancedResult;
  className?: string;
  'data-testid'?: string;
}

export function ResultCard({ result, className, 'data-testid': testId }: ResultCardProps) {
  const handleLinkClick = (e: React.MouseEvent) => {
    // Allow the default behavior (opening the link)
    // This is just for potential analytics or tracking
    console.log('Result clicked:', result.url);
  };

  const displaySummary = result.aiSummary || result.snippet;
  const hasAiSummary = Boolean(result.aiSummary);

  return (
    <Card className={`hover:shadow-md transition-shadow duration-200 ${className || ''}`} data-testid={testId}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-start justify-between gap-3">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors duration-200 line-clamp-2 flex-1"
          >
            {result.title}
          </a>
          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">{new URL(result.url).hostname}</span>
          {result.relevanceScore && (
            <>
              <span>•</span>
              <span>Score: {(result.relevanceScore * 100).toFixed(0)}%</span>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {hasAiSummary && (
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">AI Summary</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.aiSummary}
                </p>
              </div>
            </div>
          )}
          
          {!hasAiSummary && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.snippet}
              </p>
            </div>
          )}
          
          {hasAiSummary && result.snippet && result.snippet !== result.aiSummary && (
            <details className="group">
              <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors duration-200 list-none">
                <span className="flex items-center gap-1">
                  <span className="transform transition-transform duration-200 group-open:rotate-90">▶</span>
                  Original snippet
                </span>
              </summary>
              <div className="mt-2 pl-4 border-l-2 border-muted">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.snippet}
                </p>
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}