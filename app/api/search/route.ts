import { NextRequest, NextResponse } from 'next/server';
import { searchWithExa } from '@/lib/exa-client';
import { streamChatCompletion } from '@/lib/mistral-client';
import { formatPromptForMistral, extractSourcesForDisplay } from '@/lib/prompt-formatter';
import { sanitizeInput, isInputSafe } from '@/lib/input-sanitizer';
import { SearchRequest, ErrorResponse } from '@/types';

/**
 * Validate the search query
 * @param query - The query string to validate
 * @returns Error message if invalid, null if valid
 */
function validateQuery(query: string): string | null {
  if (!query || typeof query !== 'string') {
    return 'Please enter a valid question';
  }
  
  // Check if query is only whitespace
  if (query.trim().length === 0) {
    return 'Please enter a valid question';
  }
  
  // Check for suspicious patterns (XSS prevention)
  if (!isInputSafe(query)) {
    return 'Invalid characters detected in query';
  }
  
  return null;
}

/**
 * Create a user-friendly error response
 * @param error - The error object
 * @returns ErrorResponse object
 */
function createErrorResponse(error: any): ErrorResponse {
  let message = 'Service temporarily unavailable. Please try again';
  let retryable = true;
  
  if (error.message) {
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('api key') || errorMsg.includes('authentication')) {
      message = 'Service configuration error. Please contact support';
      retryable = false;
    } else if (errorMsg.includes('rate limit')) {
      message = 'Too many requests. Please wait a moment and try again';
      retryable = true;
    } else if (errorMsg.includes('network')) {
      message = 'Network error. Please check your connection';
      retryable = true;
    } else if (errorMsg.includes('token limit')) {
      message = 'Query too complex. Please try a simpler question';
      retryable = true;
    } else {
      message = 'Service temporarily unavailable. Please try again';
      retryable = true;
    }
  }
  
  return {
    error: 'API_ERROR',
    message,
    retryable
  };
}

/**
 * OPTIONS /api/search
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * POST /api/search
 * Main search endpoint that orchestrates Exa search and Mistral answer generation
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SearchRequest = await request.json();
    const { query } = body;
    
    // Validate query
    const validationError = validateQuery(query);
    if (validationError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: validationError,
          retryable: false
        } as ErrorResponse,
        { status: 400 }
      );
    }
    
    // Sanitize input to prevent XSS
    const sanitizedQuery = sanitizeInput(query);
    
    // Step 1: Search with Exa
    let searchResults;
    try {
      searchResults = await searchWithExa(sanitizedQuery);
    } catch (error: any) {
      console.error('Exa API error:', error);
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    // Check if we got any results
    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json(
        {
          error: 'NO_RESULTS',
          message: 'No search results found. Please try a different question',
          retryable: true
        } as ErrorResponse,
        { status: 404 }
      );
    }
    
    // Step 2: Format context for Mistral
    const messages = formatPromptForMistral(sanitizedQuery, searchResults);
    
    // Step 3: Extract sources for display
    const sources = extractSourcesForDisplay(searchResults);
    
    // Step 4: Stream response from Mistral
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send sources first
          const sourcesChunk = JSON.stringify({
            type: 'sources',
            content: sources
          }) + '\n';
          controller.enqueue(encoder.encode(sourcesChunk));
          
          // Stream answer chunks
          await streamChatCompletion(messages, (content) => {
            const answerChunk = JSON.stringify({
              type: 'answer',
              content
            }) + '\n';
            controller.enqueue(encoder.encode(answerChunk));
          });
          
          // Send done signal
          const doneChunk = JSON.stringify({ type: 'done' }) + '\n';
          controller.enqueue(encoder.encode(doneChunk));
          
          controller.close();
        } catch (error: any) {
          console.error('Mistral API error:', error);
          
          // Send error through stream
          const errorResponse = createErrorResponse(error);
          const errorChunk = JSON.stringify({
            type: 'error',
            content: errorResponse.message
          }) + '\n';
          controller.enqueue(encoder.encode(errorChunk));
          
          controller.close();
        }
      }
    });
    
    // Return streaming response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error: any) {
    console.error('API route error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Invalid request format',
          retryable: false
        } as ErrorResponse,
        { status: 400 }
      );
    }
    
    // Generic error handler
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
