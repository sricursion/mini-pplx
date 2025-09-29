import { Document, ObjectId } from 'mongoose';

// Enhanced Result interface as specified in the design
export interface EnhancedResult {
  title: string;
  url: string;
  snippet: string;
  aiSummary?: string;
  relevanceScore?: number;
  source: 'exa';
}

// Search History interface for MongoDB document
export interface ISearchHistory extends Document {
  _id: ObjectId;
  query: string;
  results: EnhancedResult[];
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}

// Input validation interfaces
export interface SearchQueryInput {
  query: string;
}

export interface CreateSearchHistoryInput {
  query: string;
  results: EnhancedResult[];
  sessionId?: string;
  userId?: string;
}

// API response interfaces
export interface SearchHistoryResponse {
  searches: ISearchHistory[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchByIdResponse {
  search: ISearchHistory;
}

// Pagination interface
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}