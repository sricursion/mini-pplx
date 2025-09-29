import { NextRequest } from 'next/server';
import { GET } from '../route';
import { connectToDatabase } from '../../../../../lib/database';
import mongoose from 'mongoose';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database and mongoose
vi.mock('../../../../../lib/database');
vi.mock('mongoose');

// Mock SearchHistory with proper structure
vi.mock('../../../../../models/SearchHistory', () => ({
  default: {
    findById: vi.fn()
  }
}));

// Import the mocked modules
import SearchHistory from '../../../../../models/SearchHistory';

const mockSearchHistory = SearchHistory as any;
const mockConnectToDatabase = connectToDatabase as any;
const mockMongoose = mongoose as any;

describe('/api/search/[searchId] GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectToDatabase.mockResolvedValue(undefined);
  });

  it('should return search by valid ID', async () => {
    const mockSearch = {
      _id: '507f1f77bcf86cd799439011',
      query: 'test query',
      results: [
        {
          title: 'Test Result',
          url: 'https://example.com',
          snippet: 'Test snippet',
          aiSummary: 'Test summary',
          source: 'exa'
        }
      ],
      timestamp: '2024-01-01T00:00:00.000Z',
      sessionId: 'session123'
    };

    mockMongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);
    mockSearchHistory.findById = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockSearch)
    });

    const request = new NextRequest('http://localhost:3000/api/search/507f1f77bcf86cd799439011');
    const response = await GET(request, { params: { searchId: '507f1f77bcf86cd799439011' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.search).toEqual(mockSearch);
    expect(mockSearchHistory.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('should return 400 for invalid ObjectId format', async () => {
    mockMongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/search/invalid-id');
    const response = await GET(request, { params: { searchId: 'invalid-id' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid search ID format');
  });

  it('should return 404 when search not found', async () => {
    mockMongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);
    mockSearchHistory.findById = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    });

    const request = new NextRequest('http://localhost:3000/api/search/507f1f77bcf86cd799439011');
    const response = await GET(request, { params: { searchId: '507f1f77bcf86cd799439011' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Search not found');
  });

  it('should handle database errors', async () => {
    mockMongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);
    mockSearchHistory.findById = vi.fn().mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const request = new NextRequest('http://localhost:3000/api/search/507f1f77bcf86cd799439011');
    const response = await GET(request, { params: { searchId: '507f1f77bcf86cd799439011' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle ObjectId cast errors', async () => {
    mockMongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);
    mockSearchHistory.findById = vi.fn().mockImplementation(() => {
      const error = new Error('Cast to ObjectId failed');
      throw error;
    });

    const request = new NextRequest('http://localhost:3000/api/search/507f1f77bcf86cd799439011');
    const response = await GET(request, { params: { searchId: '507f1f77bcf86cd799439011' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid search ID format');
  });
});