import { NextRequest, NextResponse } from 'next/server';
import SearchHistory from '../../../../models/SearchHistory';
import { connectToDatabase } from '../../../../lib/database';
import { PaginationOptions } from '../../../../types/search';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const query = searchParams.get('query');

    // Build filter object
    const filter: any = {};
    if (sessionId) {
      filter.sessionId = sessionId;
    }
    if (userId) {
      filter.userId = userId;
    }
    if (query) {
      filter.query = { $regex: query, $options: 'i' };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder;

    // Execute queries
    const [searches, total] = await Promise.all([
      SearchHistory.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      SearchHistory.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      searches,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Search history API error:', error);
    
    if (error instanceof Error && error.message.includes('Cast to ObjectId failed')) {
      return NextResponse.json(
        { 
          error: 'Invalid ID format',
          code: 'INVALID_ID_FORMAT'
        },
        { status: 400 }
      );
    }

    // Database connection errors
    if (error instanceof Error && error.message.includes('connection')) {
      return NextResponse.json(
        { 
          error: 'Database connection error. Please try again later.',
          code: 'DATABASE_CONNECTION_ERROR',
          retryable: true
        },
        { status: 503 }
      );
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