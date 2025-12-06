import Exa from 'exa-js';
import { ExaSearchResult } from '@/types';

// Initialize Exa client with API key from environment
const getExaClient = () => {
  const apiKey = process.env.EXA_API_KEY;
  
  if (!apiKey) {
    throw new Error('EXA_API_KEY environment variable is not set');
  }
  
  return new Exa(apiKey);
};

/**
 * Search the web using Exa API and retrieve content
 * @param query - The search query string
 * @param numResults - Number of results to retrieve (default: 8)
 * @returns Array of search results with content
 */
export async function searchWithExa(
  query: string,
  numResults: number = 8
): Promise<ExaSearchResult[]> {
  try {
    const exa = getExaClient();
    
    // Call Exa's searchAndContents method
    const response = await exa.searchAndContents(query, {
      numResults,
      text: true,
      highlights: true,
    });
    
    // Transform Exa response to our ExaSearchResult interface
    const results: ExaSearchResult[] = response.results.map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      text: result.text || '',
      highlights: result.highlights || [],
      score: result.score || 0,
      publishedDate: result.publishedDate,
      author: result.author,
    }));
    
    return results;
  } catch (error: any) {
    // Handle different error types
    if (error.response?.status === 401) {
      throw new Error('Invalid Exa API key');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Network error. Please check your connection');
    } else {
      throw new Error(`Exa API error: ${error.message || 'Unknown error'}`);
    }
  }
}
