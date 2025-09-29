import { EnhancedResult, CreateSearchHistoryInput, SearchQueryInput } from '../types/search';

// Validation error class
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// URL validation helper
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Enhanced Result validation
export function validateEnhancedResult(result: any): result is EnhancedResult {
  if (!result || typeof result !== 'object') {
    throw new ValidationError('Result must be an object');
  }

  if (!result.title || typeof result.title !== 'string' || result.title.trim().length === 0) {
    throw new ValidationError('Title is required and must be a non-empty string', 'title');
  }

  if (result.title.length > 500) {
    throw new ValidationError('Title must be 500 characters or less', 'title');
  }

  if (!result.url || typeof result.url !== 'string') {
    throw new ValidationError('URL is required and must be a string', 'url');
  }

  if (!isValidUrl(result.url)) {
    throw new ValidationError('URL must be a valid URL format', 'url');
  }

  if (!result.snippet || typeof result.snippet !== 'string') {
    throw new ValidationError('Snippet is required and must be a string', 'snippet');
  }

  if (result.snippet.length > 2000) {
    throw new ValidationError('Snippet must be 2000 characters or less', 'snippet');
  }

  if (result.aiSummary !== undefined) {
    if (typeof result.aiSummary !== 'string') {
      throw new ValidationError('AI summary must be a string if provided', 'aiSummary');
    }
    if (result.aiSummary.length > 1000) {
      throw new ValidationError('AI summary must be 1000 characters or less', 'aiSummary');
    }
  }

  if (result.relevanceScore !== undefined) {
    if (typeof result.relevanceScore !== 'number' || 
        result.relevanceScore < 0 || 
        result.relevanceScore > 1) {
      throw new ValidationError('Relevance score must be a number between 0 and 1', 'relevanceScore');
    }
  }

  if (result.source && result.source !== 'exa') {
    throw new ValidationError('Source must be "exa" if provided', 'source');
  }

  return true;
}

// Search query validation
export function validateSearchQuery(input: any): input is SearchQueryInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }

  if (typeof input.query !== 'string') {
    throw new ValidationError('Query is required and must be a string', 'query');
  }

  const trimmedQuery = input.query.trim();
  if (trimmedQuery.length === 0) {
    throw new ValidationError('Query cannot be empty', 'query');
  }

  if (trimmedQuery.length > 500) {
    throw new ValidationError('Query must be 500 characters or less', 'query');
  }

  return true;
}

// Create search history input validation
export function validateCreateSearchHistoryInput(input: any): input is CreateSearchHistoryInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }

  // Validate query
  validateSearchQuery({ query: input.query });

  // Validate results array
  if (!Array.isArray(input.results)) {
    throw new ValidationError('Results must be an array', 'results');
  }

  // Validate each result
  input.results.forEach((result: any, index: number) => {
    try {
      validateEnhancedResult(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`Result at index ${index}: ${error.message}`, `results[${index}].${error.field}`);
      }
      throw error;
    }
  });

  // Validate optional fields
  if (input.sessionId !== undefined) {
    if (typeof input.sessionId !== 'string' || input.sessionId.length > 100) {
      throw new ValidationError('Session ID must be a string of 100 characters or less', 'sessionId');
    }
  }

  if (input.userId !== undefined) {
    if (typeof input.userId !== 'string' || input.userId.length > 100) {
      throw new ValidationError('User ID must be a string of 100 characters or less', 'userId');
    }
  }

  return true;
}

// Sanitize and normalize input data
export function sanitizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

export function sanitizeEnhancedResult(result: EnhancedResult): EnhancedResult {
  return {
    title: result.title.trim(),
    url: result.url.trim(),
    snippet: result.snippet.trim(),
    aiSummary: result.aiSummary?.trim(),
    relevanceScore: result.relevanceScore,
    source: result.source || 'exa'
  };
}