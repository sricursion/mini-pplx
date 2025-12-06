import { ExaSearchResult, MistralMessage } from '@/types';

/**
 * Approximate token count for a string
 * Uses a simple heuristic: ~4 characters per token (OpenAI's rule of thumb)
 * This is an approximation and may not be exact for Mistral's tokenizer
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to approximately fit within a token limit
 * @param text - The text to truncate
 * @param maxTokens - Maximum number of tokens
 * @returns Truncated text
 */
function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokenCount(text);
  
  if (estimatedTokens <= maxTokens) {
    return text;
  }
  
  // Calculate approximate character limit
  const maxChars = maxTokens * 4;
  
  // Truncate and add ellipsis
  return text.substring(0, maxChars - 3) + '...';
}

/**
 * Format a single source for inclusion in the prompt
 * @param result - Exa search result
 * @param index - Source number (1-indexed)
 * @param maxTokens - Maximum tokens per source (default: 500)
 * @returns Formatted source string
 */
function formatSource(
  result: ExaSearchResult,
  index: number,
  maxTokens: number = 500
): string {
  // Prefer highlights over full text when available
  const content = result.highlights && result.highlights.length > 0
    ? result.highlights.join('\n')
    : result.text;
  
  // Truncate content to token limit
  const truncatedContent = truncateToTokenLimit(content, maxTokens);
  
  return `[${index}] ${result.title}
URL: ${result.url}
Content: ${truncatedContent}`;
}

/**
 * Format Exa search results into a structured prompt for Mistral API
 * @param query - The original user query
 * @param results - Array of Exa search results
 * @param maxSources - Maximum number of sources to include (default: 10)
 * @param tokensPerSource - Maximum tokens per source (default: 500)
 * @returns Array of Mistral messages (system + user)
 */
export function formatPromptForMistral(
  query: string,
  results: ExaSearchResult[],
  maxSources: number = 10,
  tokensPerSource: number = 500
): MistralMessage[] {
  // Sort results by relevance score (highest first)
  const sortedResults = [...results].sort((a, b) => b.score - a.score);
  
  // Take top N sources
  const topResults = sortedResults.slice(0, maxSources);
  
  // Format each source
  const formattedSources = topResults
    .map((result, index) => formatSource(result, index + 1, tokensPerSource))
    .join('\n\n');
  
  // Construct system message
  const systemMessage: MistralMessage = {
    role: 'system',
    content: `You are a helpful AI assistant that answers questions based on provided search results. 
Provide accurate, well-structured answers and cite sources using [1], [2], etc. 
Keep answers concise but comprehensive.`
  };
  
  // Construct user message with query and search results
  const userMessage: MistralMessage = {
    role: 'user',
    content: `Question: ${query}

Search Results:
${formattedSources}

Based on these search results, please answer the question. Use citations like [1], [2] to reference sources.`
  };
  
  return [systemMessage, userMessage];
}

/**
 * Extract sources from Exa results for display in the UI
 * @param results - Array of Exa search results
 * @param maxSources - Maximum number of sources to return
 * @returns Array of Source objects for UI display
 */
export function extractSourcesForDisplay(
  results: ExaSearchResult[],
  maxSources: number = 10
) {
  // Sort by relevance and take top N
  const sortedResults = [...results].sort((a, b) => b.score - a.score);
  const topResults = sortedResults.slice(0, maxSources);
  
  return topResults.map((result, index) => ({
    id: `source-${index + 1}`,
    title: result.title,
    url: result.url,
    snippet: result.highlights && result.highlights.length > 0
      ? result.highlights[0]
      : result.text.substring(0, 200) + '...'
  }));
}
