import { NextRequest } from 'next/server';
import { GET } from '../route';
import SearchHistory from '../../../../../models/SearchHistory';
import { connectToDatabase } from '../../../../../lib/database';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database and model
vi.mock('../../../../../models/SearchHistory');
vi.mock('../../../../../lib/database');

const mockSearchHistory = SearchHistory as any;
const mockConnectToDatabase = connectToDatabase as any;

describe('/api/search/history GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectToDatabase.mockResolvedValue(undefined);
  });

  it('should return paginated search history', async () => {
    const mockSearches = [
      {
        _id: 'search1',
        query: 'test query 1',
        results: [],
        timestamp: new Date('2024-01-01'),
        sessionId: 'session1'
      },
      {
        _id: 'search2',
        query: 'test query 2',
        results: [],
        timestamp: new Date('2024-01-02'),
        sessionId: 'session1'
      }
    ];

    const mockFind = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockSearches)
    };

    mockSearchHistory.find = vi.fn().mockReturnValue(mockFind);
    mockSearchHistory.countDocuments = vi.fn().mockResolvedValue(2);

    const request = new NextRequest('http://localhost:3000/api/search/history');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.searches).toHaveLength(2);
    expect(data.pagination).toMatchObject({
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    });
  });

  it('should handle pagination parameters', async () => {
    const mockFind = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    };

    mockSearchHistory.find = vi.fn().mockReturnValue(mockFind);
    mockSearchHistory.countDocuments = vi.fn().mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/search/history?page=2&limit=10');
    const response = await GET(request);

    expect(mockFind.skip).toHaveBeenCalledWith(10); // (page - 1) * limit
    expect(mockFind.limit).toHaveBeenCalledWith(10);
  });

  it('should filter by sessionId when provided', async () => {
    const mockFind = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    };

    mockSearchHistory.find = vi.fn().mockReturnValue(mockFind);
    mockSearchHistory.countDocuments = vi.fn().mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/search/history?sessionId=session123');
    await GET(request);

    expect(mockSearchHistory.find).toHaveBeenCalledWith({ sessionId: 'session123' });
  });

  it('should filter by userId when provided', async () => {
    const mockFind = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    };

    mockSearchHistory.find = vi.fn().mockReturnValue(mockFind);
    mockSearchHistory.countDocuments = vi.fn().mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/search/history?userId=user123');
    await GET(request);

    expect(mockSearchHistory.find).toHaveBeenCalledWith({ userId: 'user123' });
  });

  it('should filter by query when provided', async () => {
    const mockFind = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    };

    mockSearchHistory.find = vi.fn().mockReturnValue(mockFind);
    mockSearchHistory.countDocuments = vi.fn().mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/search/history?query=test');
    await GET(request);

    expect(mockSearchHistory.find).toHaveBeenCalledWith({ 
      query: { $regex: 'test', $options: 'i' } 
    });
  });

  it('should handle sorting parameters', async () => {
    const mockFind = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    };

    mockSearchHistory.find = vi.fn().mockReturnValue(mockFind);
    mockSearchHistory.countDocuments = vi.fn().mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/search/history?sortBy=query&sortOrder=asc');
    await GET(request);

    expect(mockFind.sort).toHaveBeenCalledWith({ query: 1 });
  });

  it('should limit page size to maximum of 50', async () => {
    const mockFind = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    };

    mockSearchHistory.find = vi.fn().mockReturnValue(mockFind);
    mockSearchHistory.countDocuments = vi.fn().mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/search/history?limit=100');
    await GET(request);

    expect(mockFind.limit).toHaveBeenCalledWith(50);
  });

  it('should handle database errors', async () => {
    mockSearchHistory.find = vi.fn().mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const request = new NextRequest('http://localhost:3000/api/search/history');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});