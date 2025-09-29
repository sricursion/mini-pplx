import { ExaSearchResult } from '../../types';
import { config } from '../config';

export interface SearchOptions {
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startCrawlDate?: string;
  endCrawlDate?: string;
  useAutoprompt?: boolean;
}

export interface ExaAPIResponse {
  results: Array<{
    title: string;
    url: string;
    text: string;
    score: number;
    publishedDate?: string;
  }>;
  autopromptString?: string;
}

export class ExaAIService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.exa.ai';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.apis.exaApiKey;
    
    if (!this.apiKey) {
      throw new Error('Exa AI API key is required');
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<ExaSearchResult[]> {
    if (!query.trim()) {
      throw new Error('Search query cannot be empty');
    }

    const searchPayload = {
      query: query.trim(),
      numResults: options.numResults || 10,
      includeDomains: options.includeDomains,
      excludeDomains: options.excludeDomains,
      startCrawlDate: options.startCrawlDate,
      endCrawlDate: options.endCrawlDate,
      useAutoprompt: options.useAutoprompt || false,
      contents: {
        text: true,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(searchPayload),
      });

      if (!response.ok) {
        await this.handleAPIError(response);
      }

      const data: ExaAPIResponse = await response.json();
      
      return this.transformResults(data.results);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to perform search with Exa AI');
    }
  }

  private async handleAPIError(response: Response): Promise<never> {
    const errorText = await response.text();
    
    switch (response.status) {
      case 400:
        throw new Error(`Invalid request: ${errorText}`);
      case 401:
        throw new Error('Invalid API key for Exa AI');
      case 429:
        throw new Error('Rate limit exceeded for Exa AI. Please try again later.');
      case 500:
        throw new Error('Exa AI service is temporarily unavailable');
      default:
        throw new Error(`Exa AI API error (${response.status}): ${errorText}`);
    }
  }

  private transformResults(results: ExaAPIResponse['results']): ExaSearchResult[] {
    return results.map(result => ({
      title: result.title || 'Untitled',
      url: result.url,
      text: result.text || '',
      score: result.score || 0,
      publishedDate: result.publishedDate,
    }));
  }

  // Health check method for service availability
  async isServiceAvailable(): Promise<boolean> {
    try {
      // Perform a minimal search to check service availability
      await this.search('test', { numResults: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export a factory function to create instances
export const createExaAIService = (apiKey?: string) => new ExaAIService(apiKey);

// Export a default instance only if API key is available
export const exaAIService = config.apis.exaApiKey ? new ExaAIService() : null;