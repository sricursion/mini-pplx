import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchHistory } from '../SearchHistory';
import { SearchHistory as SearchHistoryType } from '@/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon">Clock Icon</div>,
  Search: () => <div data-testid="search-icon">Search Icon</div>,
  FileText: () => <div data-testid="file-text-icon">FileText Icon</div>,
}));

describe('SearchHistory', () => {
  const mockSearches: SearchHistoryType[] = [
    {
      _id: '1',
      query: 'React testing',
      results: [
        {
          title: 'React Testing Guide',
          url: 'https://example.com/react-testing',
          snippet: 'Learn how to test React components',
          source: 'exa'
        }
      ],
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      _id: '2',
      query: 'JavaScript best practices',
      results: [
        {
          title: 'JS Best Practices',
          url: 'https://example.com/js-practices',
          snippet: 'Modern JavaScript practices',
          aiSummary: 'AI-enhanced summary of JS practices',
          source: 'exa'
        },
        {
          title: 'Clean Code JS',
          url: 'https://example.com/clean-code',
          snippet: 'Writing clean JavaScript code',
          source: 'exa'
        }
      ],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      _id: '3',
      query: 'TypeScript tutorial',
      results: [],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search history title with icon', () => {
    render(<SearchHistory searches={mockSearches} />);
    
    expect(screen.getByText('Search History')).toBeInTheDocument();
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('displays all search items', () => {
    render(<SearchHistory searches={mockSearches} />);
    
    expect(screen.getByText('React testing')).toBeInTheDocument();
    expect(screen.getByText('JavaScript best practices')).toBeInTheDocument();
    expect(screen.getByText('TypeScript tutorial')).toBeInTheDocument();
  });

  it('shows result count for each search', () => {
    render(<SearchHistory searches={mockSearches} />);
    
    expect(screen.getByText('1 result')).toBeInTheDocument();
    expect(screen.getByText('2 results')).toBeInTheDocument();
    expect(screen.getByText('0 results')).toBeInTheDocument();
  });

  it('indicates AI enhancement when available', () => {
    render(<SearchHistory searches={mockSearches} />);
    
    // Only the second search has AI enhancement
    const aiEnhancedElements = screen.getAllByText('AI enhanced');
    expect(aiEnhancedElements).toHaveLength(1);
  });

  it('formats timestamps correctly', () => {
    render(<SearchHistory searches={mockSearches} />);
    
    expect(screen.getByText('30m ago')).toBeInTheDocument();
    expect(screen.getByText('2h ago')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('calls onSelectSearch when search item is clicked', () => {
    const mockOnSelectSearch = vi.fn();
    render(<SearchHistory searches={mockSearches} onSelectSearch={mockOnSelectSearch} />);
    
    const firstSearchButton = screen.getByRole('button', { name: /react testing/i });
    fireEvent.click(firstSearchButton);
    
    expect(mockOnSelectSearch).toHaveBeenCalledWith(mockSearches[0]);
  });

  it('renders loading state', () => {
    const { container } = render(<SearchHistory searches={[]} isLoading={true} />);
    
    expect(screen.getByText('Search History')).toBeInTheDocument();
    
    // Should show skeleton loaders
    const skeletonElements = container.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders empty state when no searches', () => {
    render(<SearchHistory searches={[]} />);
    
    expect(screen.getByText('No search history yet')).toBeInTheDocument();
    expect(screen.getByText('Your previous searches will appear here')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SearchHistory searches={mockSearches} className="custom-class" />
    );
    
    const cardElement = container.querySelector('[data-slot="card"]');
    expect(cardElement).toHaveClass('custom-class');
  });

  it('handles searches without onSelectSearch callback', () => {
    render(<SearchHistory searches={mockSearches} />);
    
    const firstSearchButton = screen.getByRole('button', { name: /react testing/i });
    
    // Should not throw error when clicked without callback
    expect(() => fireEvent.click(firstSearchButton)).not.toThrow();
  });

  it('displays file text icons for each search item', () => {
    render(<SearchHistory searches={mockSearches} />);
    
    const fileTextIcons = screen.getAllByTestId('file-text-icon');
    expect(fileTextIcons).toHaveLength(mockSearches.length);
  });

  it('truncates long search queries', () => {
    const longQuerySearch: SearchHistoryType = {
      _id: '4',
      query: 'This is a very long search query that should be truncated to maintain good layout and readability in the search history component',
      results: [],
      timestamp: new Date(),
    };

    render(<SearchHistory searches={[longQuerySearch]} />);
    
    const queryElement = screen.getByText(longQuerySearch.query);
    expect(queryElement).toHaveClass('truncate');
  });

  it('handles edge case timestamps', () => {
    const edgeCaseSearches: SearchHistoryType[] = [
      {
        _id: '1',
        query: 'Just now search',
        results: [],
        timestamp: new Date(), // Right now
      },
      {
        _id: '2',
        query: 'One minute ago',
        results: [],
        timestamp: new Date(Date.now() - 1000 * 60), // 1 minute ago
      },
      {
        _id: '3',
        query: 'One week ago',
        results: [],
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
      }
    ];

    render(<SearchHistory searches={edgeCaseSearches} />);
    
    expect(screen.getByText('Just now')).toBeInTheDocument();
    expect(screen.getByText('1m ago')).toBeInTheDocument();
    
    // For dates older than a week, should show actual date
    const weekOldElement = screen.getByText(edgeCaseSearches[2].timestamp.toLocaleDateString());
    expect(weekOldElement).toBeInTheDocument();
  });

  it('handles searches with mixed AI enhancement', () => {
    const mixedSearches: SearchHistoryType[] = [
      {
        _id: '1',
        query: 'Mixed results search',
        results: [
          {
            title: 'Regular result',
            url: 'https://example.com/regular',
            snippet: 'Regular snippet',
            source: 'exa'
          },
          {
            title: 'AI enhanced result',
            url: 'https://example.com/ai',
            snippet: 'Original snippet',
            aiSummary: 'AI summary',
            source: 'exa'
          }
        ],
        timestamp: new Date(),
      }
    ];

    render(<SearchHistory searches={mixedSearches} />);
    
    expect(screen.getByText('AI enhanced')).toBeInTheDocument();
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('maintains proper button styling and hover states', () => {
    render(<SearchHistory searches={mockSearches} />);
    
    const searchButtons = screen.getAllByRole('button');
    
    searchButtons.forEach(button => {
      expect(button).toHaveClass('hover:bg-muted/50');
      expect(button).toHaveClass('justify-start');
      expect(button).toHaveClass('text-left');
    });
  });

  it('handles searches with no results gracefully', () => {
    const noResultsSearch: SearchHistoryType[] = [
      {
        _id: '1',
        query: 'No results query',
        results: [],
        timestamp: new Date(),
      }
    ];

    render(<SearchHistory searches={noResultsSearch} />);
    
    expect(screen.getByText('0 results')).toBeInTheDocument();
    expect(screen.queryByText('AI enhanced')).not.toBeInTheDocument();
  });
});