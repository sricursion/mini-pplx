import { NextRequest, NextResponse } from 'next/server';
import SearchHistory from '../../../../models/SearchHistory';
import { connectToDatabase } from '../../../../lib/database';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { searchId: string } }
) {
  try {
    // Connect to database
    await connectToDatabase();

    const { searchId } = params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(searchId)) {
      return NextResponse.json(
        { error: 'Invalid search ID format' },
        { status: 400 }
      );
    }

    // Find the search by ID
    const search = await SearchHistory.findById(searchId).lean();

    if (!search) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      search
    });

  } catch (error) {
    console.error('Search by ID API error:', error);
    
    if (error instanceof Error && error.message.includes('Cast to ObjectId failed')) {
      return NextResponse.json(
        { 
          error: 'Invalid search ID format',
          code: 'INVALID_SEARCH_ID'
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