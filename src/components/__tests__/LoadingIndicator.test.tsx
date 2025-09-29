import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingIndicator, InlineLoading, Skeleton } from '../LoadingIndicator';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader2-icon">Loader2</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
}));

describe('LoadingIndicator', () => {
  it('renders default loading indicator', () => {
    render(<LoadingIndicator />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we process your request')).toBeInTheDocument();
    expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
  });

  it('renders search variant', () => {
    render(<LoadingIndicator variant="search" />);
    
    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(screen.getByText('Finding relevant results across the web')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('renders enhancement variant', () => {
    render(<LoadingIndicator variant="enhancement" />);
    
    expect(screen.getByText('Enhancing Results...')).toBeInTheDocument();
    expect(screen.getByText('AI is analyzing and summarizing content')).toBeInTheDocument();
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('renders history variant', () => {
    render(<LoadingIndicator variant="history" />);
    
    expect(screen.getByText('Loading History...')).toBeInTheDocument();
    expect(screen.getByText('Retrieving your previous searches')).toBeInTheDocument();
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingIndicator message="Custom loading message" />);
    
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<LoadingIndicator size="sm" />);
    expect(screen.getByText('Loading...')).toHaveClass('text-sm');
    
    rerender(<LoadingIndicator size="lg" />);
    expect(screen.getByText('Loading...')).toHaveClass('text-xl');
  });

  it('shows progress bar when enabled', () => {
    render(<LoadingIndicator showProgress={true} progress={50} />);
    
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    // Find the progress bar by its style attribute
    const progressBar = document.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('clamps progress values', () => {
    const { rerender } = render(<LoadingIndicator showProgress={true} progress={150} />);
    
    let progressBar = document.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
    
    rerender(<LoadingIndicator showProgress={true} progress={-10} />);
    progressBar = document.querySelector('[style*="width: 0%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows bouncing dots for search variant', () => {
    render(<LoadingIndicator variant="search" />);
    
    const dots = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-bounce')
    );
    expect(dots).toHaveLength(3);
  });
});

describe('InlineLoading', () => {
  it('renders default inline loading', () => {
    render(<InlineLoading />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<InlineLoading message="Processing..." />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<InlineLoading size="xs" />);
    expect(screen.getByText('Loading...')).toHaveClass('text-xs');
    
    rerender(<InlineLoading size="md" />);
    expect(screen.getByText('Loading...')).toHaveClass('text-base');
  });

  it('applies custom className', () => {
    render(<InlineLoading className="custom-class" />);
    
    const container = screen.getByText('Loading...').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});

describe('Skeleton', () => {
  it('renders default text skeleton', () => {
    const { container } = render(<Skeleton />);
    
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('animate-pulse', 'bg-muted', 'rounded', 'h-4');
  });

  it('renders card variant', () => {
    render(<Skeleton variant="card" />);
    
    // Should render multiple skeleton elements for card structure
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(1);
  });

  it('renders result variant', () => {
    render(<Skeleton variant="result" />);
    
    // Should render multiple skeleton elements for result structure
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(3);
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);
    
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('custom-skeleton');
  });
});