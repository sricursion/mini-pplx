import { describe, it, expect } from 'vitest';
import { formatPromptForMistral } from './prompt-formatter';
import { ExaSearchResult } from '@/types';

describe('formatPromptForMistral', () => {
  it('should format search results into Mistral messages', () => {
    const query = 'What is TypeScript?';
    const results: ExaSearchResult[] = [
      {
        title: 'TypeScript Documentation',
        url: 'https://www.typescriptlang.org/',
        text: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
        score: 0.9,
      },
      {
        title: 'TypeScript Tutorial',
        url: 'https://example.com/typescript',
        text: 'Learn TypeScript from scratch with this comprehensive guide.',
        score: 0.8,
      },
    ];

    const messages = formatPromptForMistral(query, results);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain(query);
    expect(messages[1].content).toContain('[1]');
    expect(messages[1].content).toContain('[2]');
    expect(messages[1].content).toContain('TypeScript Documentation');
    expect(messages[1].content).toContain('https://www.typescriptlang.org/');
  });

  it('should prioritize sources by relevance score', () => {
    const query = 'Test query';
    const results: ExaSearchResult[] = [
      {
        title: 'Low Score',
        url: 'https://low.com',
        text: 'Low relevance content',
        score: 0.3,
      },
      {
        title: 'High Score',
        url: 'https://high.com',
        text: 'High relevance content',
        score: 0.9,
      },
      {
        title: 'Medium Score',
        url: 'https://medium.com',
        text: 'Medium relevance content',
        score: 0.6,
      },
    ];

    const messages = formatPromptForMistral(query, results);
    const userContent = messages[1].content;

    // High score should be [1], medium [2], low [3]
    const highIndex = userContent.indexOf('[1] High Score');
    const mediumIndex = userContent.indexOf('[2] Medium Score');
    const lowIndex = userContent.indexOf('[3] Low Score');

    expect(highIndex).toBeGreaterThan(-1);
    expect(mediumIndex).toBeGreaterThan(highIndex);
    expect(lowIndex).toBeGreaterThan(mediumIndex);
  });

  it('should use highlights when available', () => {
    const query = 'Test query';
    const results: ExaSearchResult[] = [
      {
        title: 'With Highlights',
        url: 'https://example.com',
        text: 'This is a very long text that should not appear because we have highlights available.',
        highlights: ['Important highlight 1', 'Important highlight 2'],
        score: 0.9,
      },
    ];

    const messages = formatPromptForMistral(query, results);
    const userContent = messages[1].content;

    expect(userContent).toContain('Important highlight 1');
    expect(userContent).toContain('Important highlight 2');
    expect(userContent).not.toContain('very long text that should not appear');
  });

  it('should truncate long content to approximately 500 tokens', () => {
    const query = 'Test query';
    // Create a very long text (approximately 3000 tokens)
    const longText = 'word '.repeat(3000);
    const results: ExaSearchResult[] = [
      {
        title: 'Long Content',
        url: 'https://example.com',
        text: longText,
        score: 0.9,
      },
    ];

    const messages = formatPromptForMistral(query, results);
    const userContent = messages[1].content;

    // Content should be truncated and end with ellipsis
    expect(userContent).toContain('...');
    // The truncated content should be much shorter than the original
    expect(userContent.length).toBeLessThan(longText.length);
  });

  it('should limit to top 10 sources', () => {
    const query = 'Test query';
    const results: ExaSearchResult[] = Array.from({ length: 15 }, (_, i) => ({
      title: `Source ${i + 1}`,
      url: `https://example${i + 1}.com`,
      text: `Content ${i + 1}`,
      score: 0.9 - i * 0.05,
    }));

    const messages = formatPromptForMistral(query, results);
    const userContent = messages[1].content;

    // Should have sources [1] through [10]
    expect(userContent).toContain('[1]');
    expect(userContent).toContain('[10]');
    // Should not have [11] or beyond
    expect(userContent).not.toContain('[11]');
  });

  it('should handle empty results array', () => {
    const query = 'Test query';
    const results: ExaSearchResult[] = [];

    const messages = formatPromptForMistral(query, results);

    expect(messages).toHaveLength(2);
    expect(messages[1].content).toContain(query);
    expect(messages[1].content).toContain('Search Results:');
  });
});
