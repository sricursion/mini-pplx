import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchInterface } from '../SearchInterface';
import { EnhancedResult } from '@/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search Icon</div>,
  Loader2: () => <div data-testid="loader-icon">Loader Icon</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
}));

// Mock the ErrorDisplay component
vi.mock('../ErrorDisplay', () => ({
  ErrorDisplay: ({ error, onRetry, onDismiss }: any) => (
    <div data-testid="error-display">
      <span>{error}</span>
      {onRetry && <button onClick={onRetry} data-testid="error-retry">Retry</button>}
      {onDismiss && <button onClick={onDismiss} data-testid="error-dismiss">Dismiss</button>}
    </div>
  ),
  SuccessFeedback: ({ message, onDismiss }: any) => (
    <div data-testid="success-feedback">
      <span>{message}</span>
      {onDismiss && <button onClick={onDismiss} data-testid="success-dismiss">Dismiss</button>}
    </div>
  ),
  parseError: (error: any) => ({ type: 'unknown', message: error.message || error, retryable: true }),
}));

// Mock the useToast hook
vi.mock('@/lib/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('SearchInterface', () => {
  const mockResults: EnhancedResult[] = [
    {
      title: 'Test Result',
      url: 'https://example.com',
      snippet: 'Test snippet',
      aiSummary: 'Test AI summary',
      relevanceScore: 0.9,
      source: 'exa'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and button', () => {
    render(<SearchInterface />);
    
    expect(screen.getByPlaceholderText('Enter your search query...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('disables submit button when input is empty', () => {
    render(<SearchInterface />);
    
    const submitButton = screen.getByRole('button', { name: /search/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when input has text', async () => {
    render(<SearchInterface />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(input, { target: { value: 'test query' } });
    
    expect(submitButton).not.toBeDisabled();
  });

  it('validates empty query on submit', async () => {
    const mockOnError = vi.fn();
    render(<SearchInterface onError={mockOnError} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const form = input.closest('form')!;
    
    // Add a space to enable the button but still fail validation
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('Search query cannot be empty')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith('Search query cannot be empty');
    });
  });

  it('validates query length', async () => {
    const mockOnError = vi.fn();
    render(<SearchInterface onError={mockOnError} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const form = input.closest('form')!;
    
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('Search query must be at least 2 characters long')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith('Search query must be at least 2 characters long');
    });
  });

  it('clears error when user starts typing', async () => {
    const mockOnError = vi.fn();
    render(<SearchInterface onError={mockOnError} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const form = input.closest('form')!;
    
    // Trigger validation error
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('Search query must be at least 2 characters long')).toBeInTheDocument();
    });
    
    // Start typing to clear error
    fireEvent.change(input, { target: { value: 'ab' } });
    
    expect(screen.queryByText('Search query must be at least 2 characters long')).not.toBeInTheDocument();
  });

  it('shows loading state during search', async () => {
    const mockOnSearch = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockResults), 100))
    );
    
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
    
    // Wait for search to complete
    await waitFor(() => {
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    });
  });

  it('calls onSearch with trimmed query', async () => {
    const mockOnSearch = vi.fn().mockResolvedValue(mockResults);
    const mockOnResults = vi.fn();
    
    render(<SearchInterface onSearch={mockOnSearch} onResults={mockOnResults} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const form = input.closest('form')!;
    
    fireEvent.change(input, { target: { value: '  test query  ' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test query');
      expect(mockOnResults).toHaveBeenCalledWith(mockResults);
    });
  });

  it('handles search errors', async () => {
    const mockError = new Error('Search failed');
    const mockOnSearch = vi.fn().mockRejectedValue(mockError);
    const mockOnError = vi.fn();
    
    render(<SearchInterface onSearch={mockOnSearch} onError={mockOnError} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const form = input.closest('form')!;
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('Search failed')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith('Search failed');
    });
  });

  it('handles non-Error exceptions', async () => {
    const mockOnSearch = vi.fn().mockRejectedValue('String error');
    const mockOnError = vi.fn();
    
    render(<SearchInterface onSearch={mockOnSearch} onError={mockOnError} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const form = input.closest('form')!;
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('String error')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith('String error');
    });
  });

  it('shows error when onSearch is not provided', async () => {
    const mockOnError = vi.fn();
    render(<SearchInterface onError={mockOnError} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const form = input.closest('form')!;
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('Search functionality not available')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith('Search functionality not available');
    });
  });

  it('applies error styling to input when there is an error', async () => {
    render(<SearchInterface />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const form = input.closest('form')!;
    
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(input).toHaveClass('border-destructive');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('supports keyboard navigation', () => {
    render(<SearchInterface />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Tab to input
    input.focus();
    expect(input).toHaveFocus();
    
    // Add text to enable the button
    fireEvent.change(input, { target: { value: 'test query' } });
    
    // Now the button should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  it('shows retry button when there is a retryable error', async () => {
    const mockOnSearch = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const form = input.closest('form')!;
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByTestId('search-retry-button')).toBeInTheDocument();
    });
  });

  it('handles retry functionality', async () => {
    const mockOnSearch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockResults);
    
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByTestId('search-retry-button')).toBeInTheDocument();
    });
    
    const retryButton = screen.getByTestId('search-retry-button');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(2);
    });
  });

  it('shows character count for long queries', () => {
    render(<SearchInterface />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const longQuery = 'a'.repeat(450);
    
    fireEvent.change(input, { target: { value: longQuery } });
    
    expect(screen.getByText('450/500 characters')).toBeInTheDocument();
  });

  it('validates maximum query length', async () => {
    const mockOnError = vi.fn();
    render(<SearchInterface onError={mockOnError} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const tooLongQuery = 'a'.repeat(501);
    
    fireEvent.change(input, { target: { value: tooLongQuery } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Search query is too long (maximum 500 characters)');
    });
  });

  it('shows success feedback after successful search', async () => {
    const mockOnSearch = vi.fn().mockResolvedValue(mockResults);
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByTestId('success-feedback')).toBeInTheDocument();
      expect(screen.getByText('Successfully searched for "test query"')).toBeInTheDocument();
    });
  });

  it('shows error display component for errors', async () => {
    const mockOnSearch = vi.fn().mockRejectedValue(new Error('Search failed'));
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
  });

  it('clears error when dismissing', async () => {
    const mockOnSearch = vi.fn().mockRejectedValue(new Error('Search failed'));
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
    
    const dismissButton = screen.getByTestId('error-dismiss');
    fireEvent.click(dismissButton);
    
    expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
  });

  it('shows visual indicators for error and success states', async () => {
    const mockOnSearch = vi.fn()
      .mockRejectedValueOnce(new Error('Search failed'))
      .mockResolvedValueOnce(mockResults);
    
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    
    // Test error state
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });
    
    // Use the retry button to test success state
    const retryButton = screen.getByTestId('search-retry-button');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });
  });

  it('handles disabled state', () => {
    render(<SearchInterface disabled={true} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows keyboard shortcuts hint', () => {
    render(<SearchInterface />);
    
    expect(screen.getByText(/press enter to search/i)).toBeInTheDocument();
  });

  it('tracks retry attempts', async () => {
    const mockOnSearch = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Enter your search query...');
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByTestId('search-retry-button')).toBeInTheDocument();
    });
    
    const retryButton = screen.getByTestId('search-retry-button');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText(/retry attempt: 1/i)).toBeInTheDocument();
    });
  });}
);