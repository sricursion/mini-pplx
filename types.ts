// Source citation interface
export interface Source {
  id: string;           // Unique identifier
  title: string;        // Page title
  url: string;          // Source URL
  snippet?: string;     // Optional text excerpt
}

// Exa API response structure
export interface ExaSearchResult {
  title: string;
  url: string;
  text: string;              // Full text content
  highlights?: string[];     // Relevant excerpts from Exa
  score: number;             // Relevance score (0-1)
  publishedDate?: string;    // ISO date string
  author?: string;           // Author if available
}

// Mistral API message format
export interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Mistral API streaming response chunk
export interface MistralStreamChunk {
  choices: [{
    delta: {
      content?: string;
    };
    finishReason?: 'stop' | 'length' | 'error';
  }];
}

// API request/response types
export interface SearchRequest {
  query: string;
}

export interface SearchResponse {
  answer: string;
  sources: Source[];
}

export interface ErrorResponse {
  error: string;
  message: string;
  retryable: boolean;
}
