import { NextRequest } from 'next/server';
import { POST } from '../route';
import { ExaAIService } from '../../../../lib/services/ExaAIService';
import { MistralService } from '../../../../lib/services/MistralService';
import SearchHistory from '../../../../models/SearchHistory';
import { connectToDatabase } from '../../../../lib/database';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the services and database
vi.mock('../../../../lib/services/ExaAIService');
vi.mock('../../../../lib/services/MistralService');
vi.mock('../../../../models/SearchHistory');
vi.mock('../../../../lib/database');

const mockExaAIService = ExaAIService as any;
const mockMistralService = MistralService as any;
const mockSearchHistory = SearchHistory as any;
const mockConnectToDatabase = connectToDatabase as any;

describe('/api/search POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful database connection
    mockConnectToDatabase.mockResolvedValue(undefined);
    
    // Mock successful search history save
    const mockSave = vi.fn().mockResolvedValue({
      _id: 'mock-search-id',
      query: 'test query',
      results: [],
      timestamp: new Date()
    });
    mockSearchHistory.mockImplementation(() => ({
      save: mockSave
    }));
  });

  it('should successfully perform search and return enhanced results', async () => {
    // Mock Exa AI service
    const mockExaSearch = vi.fn().mockResolvedValue([
      {
        title: 'Test Result',
        url: 'https://example.com',
        text: 'This is a test result content',
        score: 0.9,
        publishedDate: '2024-01-01'
      }
    ]);
    mockExaAIService.mockImplementation(() => ({
      search: mockExaSearch
    }));

    // Mock Mistral AI service
    const mockEnhanceResults = vi.fn().mockResolvedValue([
      'Enhanced summary of the test result'
    ]);
    mockMistralService.mockImplementation(() => ({
      enhanceMultipleResults: mockEnhanceResults
    }));

    // Create request
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test query' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Execute request
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.results[0]).toMatchObject({
      title: 'Test Result',
      url: 'https://example.com',
      snippet: 'This is a test result content',
      aiSummary: 'Enhanced summary of the test result',
      relevanceScore: 0.9,
      source: 'exa'
    });
    expect(data.searchId).toBe('mock-search-id');
    expect(mockExaSearch).toHaveBeenCalledWith('test query', { numResults: 10 });
    expect(mockEnhanceResults).toHaveBeenCalledWith([
      {
        title: 'Test Result',
        url: 'https://example.com',
        text: 'This is a test result content',
        score: 0.9,
        publishedDate: '2024-01-01'
      }
    ]);
  });

  it('should return 400 for empty query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: '' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Query cannot be empty');
  });

  it('should return 400 for missing query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Query is required');
  });

  it('should return 503 when Exa AI service fails', async () => {
    // Mock service initialization success
    mockExaAIService.mockImplementation(() => ({
      search: vi.fn().mockRejectedValue(new Error('Exa AI service unavailable'))
    }));
    mockMistralService.mockImplementation(() => ({}));

    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test query' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain('Search service is temporarily unavailable');
  });

  it('should fallback to unenhanced results when Mistral AI fails', async () => {
    // Mock Exa AI service success
    const mockExaSearch = vi.fn().mockResolvedValue([
      {
        title: 'Test Result',
        url: 'https://example.com',
        text: 'This is a test result content',
        score: 0.9
      }
    ]);
    mockExaAIService.mockImplementation(() => ({
      search: mockExaSearch
    }));

    // Mock Mistral AI service failure
    const mockEnhanceResults = vi.fn().mockRejectedValue(new Error('Mistral AI unavailable'));
    mockMistralService.mockImplementation(() => ({
      enhanceMultipleResults: mockEnhanceResults
    }));

    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test query' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.results[0]).toMatchObject({
      title: 'Test Result',
      url: 'https://example.com',
      snippet: 'This is a test result content',
      relevanceScore: 0.9,
      source: 'exa'
    });
    expect(data.results[0].aiSummary).toBeUndefined();
  });

  it('should continue without saving when database fails', async () => {
    // Mock services success
    mockExaAIService.mockImplementation(() => ({
      search: vi.fn().mockResolvedValue([
        {
          title: 'Test Result',
          url: 'https://example.com',
          text: 'This is a test result content',
          score: 0.9
        }
      ])
    }));
    mockMistralService.mockImplementation(() => ({
      enhanceMultipleResults: vi.fn().mockResolvedValue(['Enhanced summary'])
    }));

    // Mock database save failure
    const mockSave = vi.fn().mockRejectedValue(new Error('Database unavailable'));
    mockSearchHistory.mockImplementation(() => ({
      save: mockSave
    }));

    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test query' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.searchId).toBeNull();
  });

  it('should return empty results when no search results found', async () => {
    // Mock Exa AI service returning empty results
    mockExaAIService.mockImplementation(() => ({
      search: vi.fn().mockResolvedValue([])
    }));
    mockMistralService.mockImplementation(() => ({}));

    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'nonexistent query' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(0);
    expect(data.searchId).toBeNull();
    expect(data.message).toContain('No results found');
  });

  it('should handle invalid JSON in request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid JSON');
  });
});