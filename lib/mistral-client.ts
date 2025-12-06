import { Mistral } from '@mistralai/mistralai';
import { MistralMessage } from '@/types';

// Initialize Mistral client with API key from environment
const getMistralClient = () => {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is not set');
  }
  
  return new Mistral({ apiKey });
};

/**
 * Generate a streaming chat completion using Mistral API
 * @param messages - Array of messages for the conversation
 * @param onChunk - Callback function to handle each streaming chunk
 * @param model - Mistral model to use (default: 'mistral-large-latest')
 * @returns Promise that resolves when streaming is complete
 */
export async function streamChatCompletion(
  messages: MistralMessage[],
  onChunk: (content: string) => void,
  model: string = 'mistral-large-latest'
): Promise<void> {
  try {
    const mistral = getMistralClient();
    
    // Call Mistral's chat.stream method
    const stream = await mistral.chat.stream({
      model,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    // Process streaming chunks
    for await (const chunk of stream) {
      const content = chunk.data.choices[0]?.delta?.content;
      if (content && typeof content === 'string') {
        onChunk(content);
      }
    }
  } catch (error: any) {
    // Handle different error types
    if (error.response?.status === 401) {
      throw new Error('Invalid Mistral API key');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later');
    } else if (error.response?.status === 400) {
      throw new Error('Token limit exceeded or invalid request');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Network error. Please check your connection');
    } else {
      throw new Error(`Mistral API error: ${error.message || 'Unknown error'}`);
    }
  }
}

/**
 * Generate a complete (non-streaming) chat completion using Mistral API
 * @param messages - Array of messages for the conversation
 * @param model - Mistral model to use (default: 'mistral-large-latest')
 * @returns Promise that resolves with the complete response text
 */
export async function generateChatCompletion(
  messages: MistralMessage[],
  model: string = 'mistral-large-latest'
): Promise<string> {
  try {
    const mistral = getMistralClient();
    
    // Call Mistral's chat.complete method
    const response = await mistral.chat.complete({
      model,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : '';
  } catch (error: any) {
    // Handle different error types
    if (error.response?.status === 401) {
      throw new Error('Invalid Mistral API key');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later');
    } else if (error.response?.status === 400) {
      throw new Error('Token limit exceeded or invalid request');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Network error. Please check your connection');
    } else {
      throw new Error(`Mistral API error: ${error.message || 'Unknown error'}`);
    }
  }
}
