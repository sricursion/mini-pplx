'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, Sparkles, Zap } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
  variant?: 'search' | 'enhancement' | 'history' | 'generic';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

const getLoadingContent = (variant: LoadingIndicatorProps['variant']) => {
  switch (variant) {
    case 'search':
      return {
        icon: <Search className="h-6 w-6 text-primary animate-pulse" />,
        title: 'Searching...',
        description: 'Finding relevant results across the web'
      };
    case 'enhancement':
      return {
        icon: <Sparkles className="h-6 w-6 text-primary animate-pulse" />,
        title: 'Enhancing Results...',
        description: 'AI is analyzing and summarizing content'
      };
    case 'history':
      return {
        icon: <Zap className="h-6 w-6 text-primary animate-pulse" />,
        title: 'Loading History...',
        description: 'Retrieving your previous searches'
      };
    default:
      return {
        icon: <Loader2 className="h-6 w-6 text-primary animate-spin" />,
        title: 'Loading...',
        description: 'Please wait while we process your request'
      };
  }
};

const getSizeClasses = (size: LoadingIndicatorProps['size']) => {
  switch (size) {
    case 'sm':
      return {
        container: 'py-4',
        icon: 'h-4 w-4',
        title: 'text-sm font-medium',
        description: 'text-xs'
      };
    case 'lg':
      return {
        container: 'py-16',
        icon: 'h-8 w-8',
        title: 'text-xl font-semibold',
        description: 'text-base'
      };
    default:
      return {
        container: 'py-8',
        icon: 'h-6 w-6',
        title: 'text-lg font-semibold',
        description: 'text-sm'
      };
  }
};

export function LoadingIndicator({
  message,
  variant = 'generic',
  size = 'md',
  className = '',
  showProgress = false,
  progress = 0
}: LoadingIndicatorProps) {
  const content = getLoadingContent(variant);
  const sizeClasses = getSizeClasses(size);
  
  const displayMessage = message || content.title;
  const displayDescription = content.description;

  return (
    <Card className={className} data-testid="loading-indicator">
      <CardContent className={`text-center ${sizeClasses.container}`}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          {React.cloneElement(content.icon, {
            className: `${sizeClasses.icon} text-primary`
          })}
        </div>
        
        <h3 className={`${sizeClasses.title} mb-2`}>
          {displayMessage}
        </h3>
        
        <p className={`text-muted-foreground ${sizeClasses.description} mb-4`}>
          {displayDescription}
        </p>

        {showProgress && (
          <div className="w-full max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}

        {variant === 'search' && (
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Inline loading spinner for smaller spaces
interface InlineLoadingProps {
  message?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function InlineLoading({ 
  message = 'Loading...', 
  size = 'sm',
  className = '' 
}: InlineLoadingProps) {
  const sizeMap = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };

  const textSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base'
  };

  return (
    <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin`} />
      <span className={textSizeMap[size]}>{message}</span>
    </div>
  );
}

// Skeleton loader for content placeholders
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'result';
}

export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-muted rounded';
  
  if (variant === 'card') {
    return (
      <div className={`${baseClasses} p-4 space-y-3 ${className}`}>
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-muted-foreground/20 rounded"></div>
          <div className="h-3 bg-muted-foreground/20 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (variant === 'result') {
    return (
      <div className={`${baseClasses} p-4 space-y-3 ${className}`}>
        <div className="h-5 bg-muted-foreground/20 rounded w-2/3"></div>
        <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-muted-foreground/20 rounded"></div>
          <div className="h-3 bg-muted-foreground/20 rounded w-4/5"></div>
          <div className="h-3 bg-muted-foreground/20 rounded w-3/5"></div>
        </div>
      </div>
    );
  }

  return <div className={`${baseClasses} h-4 ${className}`}></div>;
}