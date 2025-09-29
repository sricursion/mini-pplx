import { NextRequest, NextResponse } from 'next/server';
import { ExaAIService } from '../../../lib/services/ExaAIService';
import { MistralService } from '../../../lib/services/MistralService';
import SearchHistory from '../../../models/SearchHistory';
import { connectToDatabase } from '../../../lib/database';
import { validateSearchQuery, sanitizeSearchQuery, ValidationError } from '../../../lib/validation';
import { EnhancedResult, ExaSearchResult } from '../../../types';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    
    try {
      validateSearchQuery(body);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }

    const sanitizedQuery = sanitizeSearchQuery(body.query);

    // Initialize services
    let exaService: ExaAIService;
    let mistralService: MistralService;

    try {
      exaService = new ExaAIService();
      mistralService = new MistralService();
    } catch (error) {
      console.error('Service initialization error:', error);
      return NextResponse.json(
        { error: 'Search services are not properly configured' },
        { status: 503 }
      );
    }

    // Perform search with Exa AI
    let searchResults: ExaSearchResult[];
    try {
      searchResults = await exaService.search(sanitizedQuery, { numResults: 10 });
    } catch (error) {
      console.error('Exa AI search error:', error);
      return NextResponse.json(
        { error: 'Search service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({
        results: [],
        searchId: null,
        message: 'No results found for your query'
      });
    }

    // Enhance results with Mistral AI
    let enhancedResults: EnhancedResult[];
    try {
      const aiSummaries = await mistralService.enhanceMultipleResults(searchResults);
      
      enhancedResults = searchResults.map((result, index) => ({
        title: result.title,
        url: result.url,
        snippet: result.text.substring(0, 500), // Truncate for snippet
        aiSummary: aiSummaries[index],
        relevanceScore: result.score,
        source: 'exa' as const
      }));
    } catch (error) {
      console.warn('Mistral AI enhancement failed, using original results:', error);
      
      // Fallback to unenhanced results
      enhancedResults = searchResults.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.text.substring(0, 500),
        relevanceScore: result.score,
        source: 'exa' as const
      }));
    }

    // Save search to MongoDB
    let searchId: string | null = null;
    try {
      await connectToDatabase();
      
      const searchHistory = new SearchHistory({
        query: sanitizedQuery,
        results: enhancedResults,
        sessionId: request.headers.get('x-session-id') || undefined,
        userId: request.headers.get('x-user-id') || undefined
      });

      const savedSearch = await searchHistory.save();
      searchId = savedSearch._id.toString();
    } catch (error) {
      console.error('Database save error:', error);
      // Continue without saving - don't fail the search
    }

    return NextResponse.json({
      results: enhancedResults,
      searchId,
      query: sanitizedQuery,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 400 }
      );
    }

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Request timeout. Please try again.',
            code: 'TIMEOUT_ERROR',
            retryable: true
          },
          { status: 408 }
        );
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        return NextResponse.json(
          { 
            error: 'Network error. Please check your connection and try again.',
            code: 'NETWORK_ERROR',
            retryable: true
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error. Please try again later.',
        code: 'INTERNAL_ERROR',
        retryable: true,
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}