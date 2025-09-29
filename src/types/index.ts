export interface ExaSearchResult {
  title: string;
  url: string;
  text: string;
  score: number;
  publishedDate?: string;
}

export interface EnhancedResult {
  title: string;
  url: string;
  snippet: string;
  aiSummary?: string;
  relevanceScore?: number;
  source: 'exa';
}

export interface SearchHistory {
  _id?: string;
  query: string;
  results: EnhancedResult[];
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}