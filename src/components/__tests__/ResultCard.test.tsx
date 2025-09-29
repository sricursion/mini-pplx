import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultCard } from '../ResultCard';
import { EnhancedResult } from '@/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ExternalLink: () => <div data-testid="external-link-icon">External Link Icon</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles Icon</div>,
}));

// Mock console.log to test click tracking
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('ResultCard', () => {
  const baseResult: EnhancedResult = {
    title: 'Test Article Title',
    url: 'https://example.com/article',
    snippet: 'This is a test snippet from the article content.',
    source: 'exa'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic result information', () => {
    render(<ResultCard result={baseResult} />);
    
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('This is a test snippet from the article content.')).toBeInTheDocument();
    expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
  });

  it('renders title as clickable link', () => {
    render(<ResultCard result={baseResult} />);
    
    const titleLink = screen.getByRole('link', { name: /test article title/i });
    expect(titleLink).toHaveAttribute('href', 'https://example.com/article');
    expect(titleLink).toHaveAttribute('target', '_blank');
    expect(titleLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('displays relevance score when provided', () => {
    const resultWithScore: EnhancedResult = {
      ...baseResult,
      relevanceScore: 0.85
    };
    
    render(<ResultCard result={resultWithScore} />);
    
    expect(screen.getByText('Score: 85%')).toBeInTheDocument();
  });

  it('does not display relevance score when not provided', () => {
    render(<ResultCard result={baseResult} />);
    
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
  });

  it('displays AI summary when available', () => {
    const resultWithAI: EnhancedResult = {
      ...baseResult,
      aiSummary: 'This is an AI-generated summary of the article.'
    };
    
    render(<ResultCard result={resultWithAI} />);
    
    expect(screen.getByText('AI Summary')).toBeInTheDocument();
    expect(screen.getByText('This is an AI-generated summary of the article.')).toBeInTheDocument();
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('shows original snippet when AI summary is available', () => {
    const resultWithAI: EnhancedResult = {
      ...baseResult,
      aiSummary: 'AI summary content'
    };
    
    render(<ResultCard result={resultWithAI} />);
    
    // AI summary should be visible
    expect(screen.getByText('AI summary content')).toBeInTheDocument();
    
    // Original snippet should be in collapsible section
    expect(screen.getByText('Original snippet')).toBeInTheDocument();
    
    // Original snippet should not be visible initially (in details element)
    const originalSnippet = screen.getByText('This is a test snippet from the article content.');
    expect(originalSnippet.closest('details')).toBeInTheDocument();
  });

  it('expands original snippet when clicked', () => {
    const resultWithAI: EnhancedResult = {
      ...baseResult,
      aiSummary: 'AI summary content'
    };
    
    render(<ResultCard result={resultWithAI} />);
    
    const originalSnippetToggle = screen.getByText('Original snippet');
    fireEvent.click(originalSnippetToggle);
    
    // After clicking, the details should be open
    const detailsElement = originalSnippetToggle.closest('details');
    expect(detailsElement).toHaveAttribute('open');
  });

  it('does not show original snippet section when snippet matches AI summary', () => {
    const resultWithMatchingContent: EnhancedResult = {
      ...baseResult,
      snippet: 'Same content',
      aiSummary: 'Same content'
    };
    
    render(<ResultCard result={resultWithMatchingContent} />);
    
    expect(screen.queryByText('Original snippet')).not.toBeInTheDocument();
  });

  it('shows only snippet when no AI summary is available', () => {
    render(<ResultCard result={baseResult} />);
    
    expect(screen.queryByText('AI Summary')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sparkles-icon')).not.toBeInTheDocument();
    expect(screen.getByText('This is a test snippet from the article content.')).toBeInTheDocument();
    expect(screen.queryByText('Original snippet')).not.toBeInTheDocument();
  });

  it('handles click tracking on title link', () => {
    render(<ResultCard result={baseResult} />);
    
    const titleLink = screen.getByRole('link', { name: /test article title/i });
    fireEvent.click(titleLink);
    
    expect(mockConsoleLog).toHaveBeenCalledWith('Result clicked:', 'https://example.com/article');
  });

  it('applies custom className when provided', () => {
    const { container } = render(<ResultCard result={baseResult} className="custom-class" />);
    
    const cardElement = container.querySelector('[data-slot="card"]');
    expect(cardElement).toHaveClass('custom-class');
  });

  it('handles URLs with different protocols and paths', () => {
    const resultWithComplexUrl: EnhancedResult = {
      ...baseResult,
      url: 'https://subdomain.example.com/path/to/article?param=value'
    };
    
    render(<ResultCard result={resultWithComplexUrl} />);
    
    expect(screen.getByText('subdomain.example.com')).toBeInTheDocument();
    
    const titleLink = screen.getByRole('link');
    expect(titleLink).toHaveAttribute('href', 'https://subdomain.example.com/path/to/article?param=value');
  });

  it('handles long titles gracefully', () => {
    const resultWithLongTitle: EnhancedResult = {
      ...baseResult,
      title: 'This is a very long title that should be truncated or wrapped appropriately to maintain good layout and readability'
    };
    
    render(<ResultCard result={resultWithLongTitle} />);
    
    const titleElement = screen.getByText(resultWithLongTitle.title);
    expect(titleElement).toHaveClass('line-clamp-2');
  });

  it('handles empty or missing optional fields gracefully', () => {
    const minimalResult: EnhancedResult = {
      title: 'Minimal Result',
      url: 'https://example.com',
      snippet: 'Basic snippet',
      source: 'exa'
    };
    
    render(<ResultCard result={minimalResult} />);
    
    expect(screen.getByText('Minimal Result')).toBeInTheDocument();
    expect(screen.getByText('Basic snippet')).toBeInTheDocument();
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
    expect(screen.queryByText('AI Summary')).not.toBeInTheDocument();
  });

  it('renders with responsive design classes', () => {
    const { container } = render(<ResultCard result={baseResult} />);
    
    const cardElement = container.querySelector('[data-slot="card"]');
    expect(cardElement).toHaveClass('hover:shadow-md', 'transition-shadow', 'duration-200');
  });

  it('handles special characters in content', () => {
    const resultWithSpecialChars: EnhancedResult = {
      ...baseResult,
      title: 'Article with "quotes" & special chars <test>',
      snippet: 'Content with émojis 🚀 and special characters: @#$%^&*()',
      aiSummary: 'AI summary with special chars: <script>alert("test")</script>'
    };
    
    render(<ResultCard result={resultWithSpecialChars} />);
    
    expect(screen.getByText('Article with "quotes" & special chars <test>')).toBeInTheDocument();
    expect(screen.getByText('Content with émojis 🚀 and special characters: @#$%^&*()')).toBeInTheDocument();
    expect(screen.getByText('AI summary with special chars: <script>alert("test")</script>')).toBeInTheDocument();
  });
});