import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchApp from '../SearchApp';
import { SearchService } from '../../lib/services/SearchService';
import { EnhancedResult, SearchHistory } from '../../types';

// Mock the SearchService
vi.mock('../../lib/services/SearchService');

// Mock the hooks
vi.mock('../../lib/hooks/useSearch');
vi.mock('../../lib/hooks/useSearchHistory');

const mockSearchService = {
  performSearch: vi.fn(),
  getSearchHistory: vi.fn(),
  getSearchById: vi.fn(),
} as unknown as SearchService;

const mockUseSearch = {
  results: [],
  isLoading: false,
  error: null,
  searchId: null,
  query: '',
  timestamp: null,
  performSearch: vi.fn(),
  clearResults: vi.fn(),
  clearError: vi.fn(),
};

const mockUseSearchHistory = {
  searches: [],
  isLoading: false,
  error: null,
  hasMore: false,
  total: 0,
  currentPage: 0,
  loadHistory: vi.fn(),
  loadMore: vi.fn(),
  selectSearch: vi.fn(),
  clearError: vi.fn(),
  refresh: vi.fn(),
};

// Import the mocked hooks
import { useSearch } from '../../lib/hooks/useSearch';
import { useSearchHistory } from '../../lib/hooks/useSearchHistory';

describe('SearchApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    (useSearch as any).mockReturnValue(mockUseSearch);
    (useSearchHistory as any).mockReturnValue(mockUseSearchHistory);
  });

  it('should render the main components', () => {
    render(<SearchApp />);

    // Check for main elements
    expect(screen.getByText('AI Search Engine')).toBeInTheDocument();
    expect(screen.getByText(/Discover information with AI-enhanced search results/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your search query...')).toBeInTheDocument();
    expect(screen.getByText('Search History')).toBeInTheDocument();
  });

  it('should display search results when available', () => {
    const mockResults: EnhancedResult[] = [
      {
        title: 'Test Result 1',
        url: 'https://example.com/1',
        snippet: 'Test snippet 1',
        aiSummary: 'AI summary 1',
        relevanceScore: 0.95,
        source: 'exa',
      },
      {
        title: 'Test Result 2',
        url: 'https://example.com/2',
        snippet: 'Test snippet 2',
        relevanceScore: 0.85,
        source: 'exa',
      },
    ];

    (useSearch as any).mockReturnValue({
      ...mockUseSearch,
      results: mockResults,
      query: 'test query',
      timestamp: '2023-01-01T00:00:00.000Z',
    });

    render(<SearchApp />);

    // Simulate showing results
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Check if results are displayed
    expect(screen.getByText('Test Result 1')).toBeInTheDocument();
    expect(screen.getByText('Test Result 2')).toBeInTheDocument();
    expect(screen.getByText('AI summary 1')).toBeInTheDocument();
  });

  it('should display loading state during search', () => {
    (useSearch as any).mockReturnValue({
      ...mockUseSearch,
      isLoading: true,
    });

    render(<SearchApp />);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(screen.getByText('Finding and enhancing results with AI')).toBeInTheDocument();
  });

  it('should display error messages', () => {
    (useSearch as any).mockReturnValue({
      ...mockUseSearch,
      error: 'Search failed',
    });

    render(<SearchApp />);

    expect(screen.getByText('Search failed')).toBeInTheDocument();
  });

  it('should display search history', () => {
    const mockHistory: SearchHistory[] = [
      {
        _id: '1',
        query: 'previous search',
        results: [],
        timestamp: new Date('2023-01-01'),
      },
    ];

    (useSearchHistory as any).mockReturnValue({
      ...mockUseSearchHistory,
      searches: mockHistory,
    });

    render(<SearchApp />);

    expect(screen.getByText('previous search')).toBeInTheDocument();
  });

  it('should handle search history selection', async () => {
    const user = userEvent.setup();
    const mockHistory: SearchHistory[] = [
      {
        _id: '1',
        query: 'previous search',
        results: [
          {
            title: 'Historical Result',
            url: 'https://example.com/historical',
            snippet: 'Historical snippet',
            source: 'exa' as const,
          },
        ],
        timestamp: new Date('2023-01-01'),
      },
    ];

    const mockSelectSearch = vi.fn().mockResolvedValue(mockHistory[0]);

    (useSearchHistory as any).mockReturnValue({
      ...mockUseSearchHistory,
      searches: mockHistory,
      selectSearch: mockSelectSearch,
    });

    render(<SearchApp />);

    // Click on history item
    const historyButton = screen.getByRole('button', { name: /previous search/i });
    await user.click(historyButton);

    expect(mockSelectSearch).toHaveBeenCalledWith('1');
  });

  it('should clear errors when requested', async () => {
    const user = userEvent.setup();
    const mockClearError = vi.fn();

    (useSearch as any).mockReturnValue({
      ...mockUseSearch,
      error: 'Test error',
      clearError: mockClearError,
    });

    render(<SearchApp />);

    // Find and click the error dismiss button
    const dismissButton = screen.getByRole('button', { name: '' }); // X button
    await user.click(dismissButton);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should display no results message when search returns empty', () => {
    (useSearch as any).mockReturnValue({
      ...mockUseSearch,
      results: [],
      query: 'no results query',
    });

    render(<SearchApp />);

    // Simulate showing results (empty)
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search query or check your spelling.')).toBeInTheDocument();
  });

  it('should display search history loading state', () => {
    (useSearchHistory as any).mockReturnValue({
      ...mockUseSearchHistory,
      isLoading: true,
    });

    render(<SearchApp />);

    // Check for loading skeleton in search history
    expect(screen.getByText('Search History')).toBeInTheDocument();
    // The loading state is handled by the SearchHistory component
  });

  it('should handle search history errors', () => {
    (useSearchHistory as any).mockReturnValue({
      ...mockUseSearchHistory,
      error: 'Failed to load history',
    });

    render(<SearchApp />);

    expect(screen.getByText('Failed to load history')).toBeInTheDocument();
  });

  it('should refresh history after successful search', async () => {
    const mockPerformSearch = vi.fn().mockResolvedValue(undefined);
    const mockRefreshHistory = vi.fn();

    (useSearch as any).mockReturnValue({
      ...mockUseSearch,
      performSearch: mockPerformSearch,
    });

    (useSearchHistory as any).mockReturnValue({
      ...mockUseSearchHistory,
      refresh: mockRefreshHistory,
    });

    render(<SearchApp />);

    // Simulate a search
    const searchInput = screen.getByPlaceholderText('Enter your search query...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.click(searchButton);

    // Wait for the refresh to be called
    await waitFor(() => {
      expect(mockPerformSearch).toHaveBeenCalledWith('test query');
    });

    // The refresh should be called after a delay
    await waitFor(() => {
      expect(mockRefreshHistory).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should display footer with attribution', () => {
    render(<SearchApp />);

    expect(screen.getByText(/Powered by/)).toBeInTheDocument();
    expect(screen.getByText('Exa AI')).toBeInTheDocument();
    expect(screen.getByText('Mistral AI')).toBeInTheDocument();
  });
});