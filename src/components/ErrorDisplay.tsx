'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertCircle, 
  Wifi, 
  Server, 
  Clock, 
  RefreshCw, 
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

export interface ErrorInfo {
  type: 'network' | 'server' | 'timeout' | 'validation' | 'api' | 'unknown';
  message: string;
  code?: string;
  status?: number;
  retryable?: boolean;
  details?: string;
}

interface ErrorDisplayProps {
  error: ErrorInfo | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'alert' | 'card' | 'inline';
  showDetails?: boolean;
}

const getErrorIcon = (type: ErrorInfo['type']) => {
  switch (type) {
    case 'network':
      return <Wifi className="h-4 w-4" />;
    case 'server':
      return <Server className="h-4 w-4" />;
    case 'timeout':
      return <Clock className="h-4 w-4" />;
    case 'validation':
      return <AlertTriangle className="h-4 w-4" />;
    case 'api':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getErrorTitle = (type: ErrorInfo['type']) => {
  switch (type) {
    case 'network':
      return 'Connection Error';
    case 'server':
      return 'Server Error';
    case 'timeout':
      return 'Request Timeout';
    case 'validation':
      return 'Validation Error';
    case 'api':
      return 'API Error';
    default:
      return 'Error';
  }
};

const getUserFriendlyMessage = (error: ErrorInfo): string => {
  // Return custom message if provided and it's already user-friendly
  if (error.message && 
      !error.message.includes('fetch') && 
      !error.message.includes('Internal server error') &&
      !error.message.includes('Rate limit exceeded') &&
      !error.message.includes('Authentication failed') &&
      error.message.length > 50) { // Assume longer messages are already user-friendly
    return error.message;
  }

  // Generate user-friendly messages based on error type and status
  switch (error.type) {
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case 'server':
      if (error.status === 500) {
        return 'The server encountered an error. Please try again in a few moments.';
      }
      if (error.status === 503) {
        return 'The service is temporarily unavailable. Please try again later.';
      }
      return 'A server error occurred. Please try again.';
    case 'timeout':
      return 'The request took too long to complete. Please try again.';
    case 'validation':
      return error.message || 'Please check your input and try again.';
    case 'api':
      if (error.status === 429) {
        return 'Too many requests. Please wait a moment before trying again.';
      }
      if (error.status === 401) {
        return 'Authentication required. Please refresh the page and try again.';
      }
      if (error.status === 403) {
        return 'Access denied. You may not have permission to perform this action.';
      }
      return error.message || 'An API error occurred. Please try again.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

export function parseError(error: unknown): ErrorInfo {
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
      retryable: true
    };
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      return {
        type: 'network',
        message: error.message,
        retryable: true
      };
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return {
        type: 'timeout',
        message: error.message,
        retryable: true
      };
    }

    // API errors with status codes
    if ('status' in error && typeof error.status === 'number') {
      const status = error.status;
      
      if (status >= 400 && status < 500) {
        return {
          type: status === 429 ? 'api' : 'validation',
          message: error.message,
          status,
          retryable: status === 429,
          code: 'code' in error ? String(error.code) : undefined
        };
      }

      if (status >= 500) {
        return {
          type: 'server',
          message: error.message,
          status,
          retryable: true,
          code: 'code' in error ? String(error.code) : undefined
        };
      }
    }

    return {
      type: 'unknown',
      message: error.message,
      retryable: true
    };
  }

  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
    retryable: true
  };
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '',
  variant = 'alert',
  showDetails = false
}: ErrorDisplayProps) {
  if (!error) return null;

  const errorInfo = typeof error === 'string' 
    ? { type: 'unknown' as const, message: error, retryable: true }
    : error;

  const icon = getErrorIcon(errorInfo.type);
  const title = getErrorTitle(errorInfo.type);
  const message = getUserFriendlyMessage(errorInfo);

  const actions = (
    <div className="flex items-center gap-2 mt-2">
      {errorInfo.retryable && onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-8"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Try Again
        </Button>
      )}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-8"
        >
          <X className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
      )}
    </div>
  );

  const content = (
    <>
      <div className="flex items-start gap-2">
        {icon}
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-sm font-medium">{title}</AlertTitle>
          <AlertDescription className="text-sm mt-1">
            {message}
            {showDetails && errorInfo.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Technical Details
                </summary>
                <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                  {errorInfo.details}
                </pre>
              </details>
            )}
            {showDetails && errorInfo.code && (
              <p className="text-xs text-muted-foreground mt-1">
                Error Code: {errorInfo.code}
              </p>
            )}
          </AlertDescription>
          {actions}
        </div>
        {onDismiss && variant === 'alert' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-1 hover:bg-destructive/20 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );

  if (variant === 'card') {
    return (
      <Card className={`border-destructive/50 ${className}`} data-testid="error-display">
        <CardContent className="pt-4">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`text-sm text-destructive ${className}`} data-testid="error-display">
        <div className="flex items-center gap-2">
          {icon}
          <span>{message}</span>
          {errorInfo.retryable && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-auto p-1 text-destructive hover:text-destructive"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Alert variant="destructive" className={className} data-testid="error-display">
      {content}
    </Alert>
  );
}

// Success feedback component
interface SuccessFeedbackProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  autoHide?: boolean;
  duration?: number;
}

export function SuccessFeedback({ 
  message, 
  onDismiss, 
  className = '',
  autoHide = true,
  duration = 3000
}: SuccessFeedbackProps) {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  return (
    <Alert className={`border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-100 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-1 hover:bg-green-200/50 dark:hover:bg-green-800/50"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}