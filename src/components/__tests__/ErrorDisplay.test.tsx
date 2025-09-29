import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorDisplay, parseError, SuccessFeedback } from '../ErrorDisplay';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  Wifi: () => <div data-testid="wifi-icon">Wifi</div>,
  Server: () => <div data-testid="server-icon">Server</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  RefreshCw: () => <div data-testid="refresh-icon">RefreshCw</div>,
  X: () => <div data-testid="x-icon">X</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
}));

describe('ErrorDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseError function', () => {
    it('parses string errors', () => {
      const result = parseError('Test error message');
      expect(result).toEqual({
        type: 'unknown',
        message: 'Test error message',
        retryable: true
      });
    });

    it('parses network errors', () => {
      const error = new Error('fetch failed');
      const result = parseError(error);
      expect(result).toEqual({
        type: 'network',
        message: 'fetch failed',
        retryable: true
      });
    });

    it('parses timeout errors', () => {
      const error = new Error('Request timeout');
      const result = parseError(error);
      expect(result).toEqual({
        type: 'timeout',
        message: 'Request timeout',
        retryable: true
      });
    });

    it('parses API errors with status codes', () => {
      const error = new Error('API Error') as any;
      error.status = 429;
      error.code = 'RATE_LIMIT';
      
      const result = parseError(error);
      expect(result).toEqual({
        type: 'api',
        message: 'API Error',
        status: 429,
        retryable: true,
        code: 'RATE_LIMIT'
      });
    });

    it('parses validation errors', () => {
      const error = new Error('Validation failed') as any;
      error.status = 400;
      
      const result = parseError(error);
      expect(result).toEqual({
        type: 'validation',
        message: 'Validation failed',
        status: 400,
        retryable: false,
        code: undefined
      });
    });

    it('parses server errors', () => {
      const error = new Error('Internal server error') as any;
      error.status = 500;
      
      const result = parseError(error);
      expect(result).toEqual({
        type: 'server',
        message: 'Internal server error',
        status: 500,
        retryable: true,
        code: undefined
      });
    });
  });

  describe('ErrorDisplay component', () => {
    it('renders nothing when no error', () => {
      const { container } = render(<ErrorDisplay error={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders string error', () => {
      render(<ErrorDisplay error="Test error message" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('renders network error with appropriate icon and message', () => {
      const error = {
        type: 'network' as const,
        message: 'fetch failed', // Use a message that triggers user-friendly message
        retryable: true
      };
      
      render(<ErrorDisplay error={error} />);
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to the server. Please check your internet connection and try again.')).toBeInTheDocument();
      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
    });

    it('renders server error with appropriate message', () => {
      const error = {
        type: 'server' as const,
        message: 'Internal server error', // Use generic message to trigger user-friendly message
        status: 500,
        retryable: true
      };
      
      render(<ErrorDisplay error={error} />);
      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(screen.getByText('The server encountered an error. Please try again in a few moments.')).toBeInTheDocument();
      expect(screen.getByTestId('server-icon')).toBeInTheDocument();
    });

    it('shows retry button for retryable errors', () => {
      const mockOnRetry = vi.fn();
      const error = {
        type: 'network' as const,
        message: 'Network failed',
        retryable: true
      };
      
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('does not show retry button for non-retryable errors', () => {
      const error = {
        type: 'validation' as const,
        message: 'Validation failed',
        retryable: false
      };
      
      render(<ErrorDisplay error={error} />);
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('shows dismiss button when onDismiss provided', () => {
      const mockOnDismiss = vi.fn();
      
      render(<ErrorDisplay error="Test error" onDismiss={mockOnDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).toBeInTheDocument();
      
      fireEvent.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('shows technical details in development mode', () => {
      const error = {
        type: 'server' as const,
        message: 'Server error',
        retryable: true,
        details: 'Stack trace here'
      };
      
      render(<ErrorDisplay error={error} showDetails={true} />);
      
      const detailsElement = screen.getByText('Technical Details');
      expect(detailsElement).toBeInTheDocument();
      
      fireEvent.click(detailsElement);
      expect(screen.getByText('Stack trace here')).toBeInTheDocument();
    });

    it('shows error code when available', () => {
      const error = {
        type: 'api' as const,
        message: 'API error',
        code: 'RATE_LIMIT_EXCEEDED',
        retryable: true
      };
      
      render(<ErrorDisplay error={error} showDetails={true} />);
      expect(screen.getByText('Error Code: RATE_LIMIT_EXCEEDED')).toBeInTheDocument();
    });

    it('renders as card variant', () => {
      render(<ErrorDisplay error="Test error" variant="card" />);
      // Check that it renders within a card structure
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('renders as inline variant', () => {
      const mockOnRetry = vi.fn();
      render(<ErrorDisplay error="Test error" variant="inline" onRetry={mockOnRetry} />);
      
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('handles rate limiting error message', () => {
      const error = {
        type: 'api' as const,
        message: 'Rate limit exceeded', // Use generic message to trigger user-friendly message
        status: 429,
        retryable: true
      };
      
      render(<ErrorDisplay error={error} />);
      expect(screen.getByText('Too many requests. Please wait a moment before trying again.')).toBeInTheDocument();
    });

    it('handles authentication error message', () => {
      const error = {
        type: 'api' as const,
        message: 'Authentication failed', // Use generic message to trigger user-friendly message
        status: 401,
        retryable: false
      };
      
      render(<ErrorDisplay error={error} />);
      expect(screen.getByText('Authentication required. Please refresh the page and try again.')).toBeInTheDocument();
    });
  });

  describe('SuccessFeedback component', () => {
    it('renders success message', () => {
      render(<SuccessFeedback message="Operation successful" />);
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button clicked', () => {
      const mockOnDismiss = vi.fn();
      render(<SuccessFeedback message="Success" onDismiss={mockOnDismiss} />);
      
      const dismissButton = screen.getByRole('button');
      fireEvent.click(dismissButton);
      
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('auto-hides after specified duration', async () => {
      const mockOnDismiss = vi.fn();
      render(
        <SuccessFeedback 
          message="Success" 
          onDismiss={mockOnDismiss} 
          autoHide={true} 
          duration={100}
        />
      );
      
      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });

    it('does not auto-hide when autoHide is false', async () => {
      const mockOnDismiss = vi.fn();
      render(
        <SuccessFeedback 
          message="Success" 
          onDismiss={mockOnDismiss} 
          autoHide={false} 
          duration={100}
        />
      );
      
      // Wait longer than the duration
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });
});