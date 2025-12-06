import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnswerDisplay from './AnswerDisplay';

describe('AnswerDisplay', () => {
  it('should render nothing when answer is empty and not streaming', () => {
    const { container } = render(
      <AnswerDisplay answer="" isStreaming={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render answer text with markdown', () => {
    const answer = '# Hello\n\nThis is a **bold** answer.';
    render(<AnswerDisplay answer={answer} isStreaming={false} />);
    
    expect(screen.getByText('Answer')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/bold/)).toBeInTheDocument();
  });

  it('should show streaming indicator when isStreaming is true', () => {
    const answer = 'Partial answer...';
    render(<AnswerDisplay answer={answer} isStreaming={true} />);
    
    // Check for the "Generating..." text indicator
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('should not show streaming indicator when isStreaming is false', () => {
    const answer = 'Complete answer.';
    render(<AnswerDisplay answer={answer} isStreaming={false} />);
    
    // Check that "Generating..." text is not present
    expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
  });

  it('should render markdown links with proper attributes', () => {
    const answer = 'Check out [this link](https://example.com)';
    render(<AnswerDisplay answer={answer} isStreaming={false} />);
    
    const link = screen.getByRole('link', { name: 'this link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render markdown lists', () => {
    const answer = '- Item 1\n- Item 2\n- Item 3';
    render(<AnswerDisplay answer={answer} isStreaming={false} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('should render inline code with proper styling', () => {
    const answer = 'Use the `console.log()` function';
    const { container } = render(
      <AnswerDisplay answer={answer} isStreaming={false} />
    );
    
    const code = container.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code).toHaveTextContent('console.log()');
  });
});
