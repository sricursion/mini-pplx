\# Implementation Plan

- [x] 1. Set up Next.js project with TypeScript and Tailwind CSS



  - Initialize Next.js 14+ project with TypeScript
  - Configure Tailwind CSS for styling
  - Set up project structure (components, lib, pages/api directories)
  - Create .env.local file template for API keys
  - Install dependencies: exa-js, @mistralai/mistralai, fast-check, vitest
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 2. Define TypeScript interfaces and data models



  - Create types.ts with Source, ExaSearchResult, MistralMessage, MistralStreamChunk interfaces
  - Define SearchRequest, SearchResponse, and ErrorResponse types
  - _Requirements: 2.2, 3.3, 4.2_

- [x] 3. Implement Exa API client



  - Create lib/exa-client.ts using exa-js SDK
  - Implement searchAndContents() wrapper function
  - Configure API with credentials from environment variables
  - Add error handling for network errors, rate limiting, and authentication failures
  - _Requirements: 2.1, 2.2, 2.3, 7.1, 7.4_

- [ ]* 3.1 Write property test for Exa API invocation
  - **Property 3: Exa API invocation**
  - **Validates: Requirements 2.1**

- [ ]* 3.2 Write property test for search result extraction
  - **Property 4: Search result extraction**
  - **Validates: Requirements 2.2**

- [ ]* 3.3 Write property test for API authentication
  - **Property 14: API authentication**
  - **Validates: Requirements 7.4**

- [x] 4. Implement Mistral API client





  - Create lib/mistral-client.ts using @mistralai/mistralai SDK
  - Implement streaming chat completion function
  - Configure with model selection and streaming parameters
  - Add error handling for API failures and token limits
  - _Requirements: 3.2, 3.3, 3.4, 7.2, 7.4_

- [ ]* 4.1 Write property test for Mistral API invocation
  - **Property 6: Mistral API invocation**
  - **Validates: Requirements 3.2**

- [ ]* 4.2 Write property test for answer extraction from streaming response
  - **Property 7: Answer extraction from Mistral response**
  - **Validates: Requirements 3.3**
- [x] 5. Implement prompt formatting utility









- [ ] 5. Implement prompt formatting utility

  - Create lib/prompt-formatter.ts
  - Implement function to format Exa results into Mistral prompt
  - Add token counting and truncation logic (~500 tokens per source)
  - Prioritize sources by relevance score
  - Use highlights when available
  - _Requirements: 3.1, 3.5_

- [ ]* 5.1 Write property test for context formatting
  - **Property 5: Context formatting for Mistral**
  - **Validates: Requirements 3.1**

- [x] 6. Create backend API route for search




  - Create pages/api/search.ts (or app/api/search/route.ts for App Router)
  - Implement POST handler with query validation
  - Orchestrate Exa search → format context → Mistral generation flow
  - Implement streaming response to frontend
  - Add comprehensive error handling with user-friendly messages
  - _Requirements: 1.4, 2.1, 2.3, 3.1, 3.2, 3.4, 8.1, 8.4, 9.1_

- [ ]* 6.1 Write property test for empty query rejection
  - **Property 2: Empty query rejection**
  - **Validates: Requirements 1.4**

- [ ]* 6.2 Write property test for error message display
  - **Property 15: Error message display**
  - **Validates: Requirements 8.1, 8.4**

- [x] 7. Build SearchInput component





  - Create components/SearchInput.tsx
  - Implement controlled input with onChange handler
  - Add Enter key and button click submission
  - Implement empty query prevention
  - Add disabled state during processing
  - Style with Tailwind CSS for modern appearance
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.5_

- [ ]* 7.1 Write property test for input acceptance
  - **Property 1: Input acceptance for arbitrary length queries**
  - **Validates: Requirements 1.2**

- [ ]* 7.2 Write property test for input disabled during processing
  - **Property 10: Input disabled during processing**
  - **Validates: Requirements 5.5**

- [x] 8. Build LoadingIndicator component





  - Create components/LoadingIndicator.tsx
  - Implement animated spinner or skeleton UI
  - Add conditional rendering based on isVisible prop
  - Style with Tailwind CSS animations
  - _Requirements: 5.1, 5.4_

- [x] 9. Build AnswerDisplay component





  - Create components/AnswerDisplay.tsx
  - Implement markdown rendering for answer text
  - Add progressive loading animation for streaming
  - Handle empty state gracefully
  - Style with Tailwind CSS for readability
  - _Requirements: 3.3, 9.2_

- [ ]* 9.1 Write property test for streaming response handling
  - **Property 17: Streaming response handling**
  - **Validates: Requirements 9.2**

- [ ]* 9.2 Write property test for graceful stream interruption
  - **Property 18: Graceful stream interruption**
  - **Validates: Requirements 9.5**

- [x] 10. Build SourcesList component




  - Create components/SourcesList.tsx
  - Render list of sources with title and URL
  - Add target="_blank" and rel="noopener noreferrer" to links
  - Style with Tailwind CSS for clear organization
  - Add external link indicators
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ]* 10.1 Write property test for source display completeness
  - **Property 8: Source display completeness**
  - **Validates: Requirements 4.1, 4.2, 4.5**

- [x] 11. Build ErrorMessage component





  - Create components/ErrorMessage.tsx
  - Display user-friendly error messages
  - Add retry button with onRetry callback
  - Style with Tailwind CSS for visibility
  - _Requirements: 8.1, 8.5_

- [ ]* 11.1 Write property test for error recovery
  - **Property 16: Error recovery**
  - **Validates: Requirements 8.5**

- [x] 12. Build main SearchInterface component





  - Create components/SearchInterface.tsx or pages/index.tsx
  - Integrate all child components (SearchInput, LoadingIndicator, AnswerDisplay, SourcesList, ErrorMessage)
  - Implement state management for query, isLoading, answer, sources, error
  - Implement handleSubmit to call /api/search endpoint
  - Implement handleStreamResponse to process streaming chunks
  - Implement resetState for new queries
  - Add stateless query processing (clear previous results)
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 6.1, 6.2, 6.4, 6.5_

- [ ]* 12.1 Write property test for loading state transitions
  - **Property 9: Loading state transitions**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ]* 12.2 Write property test for stateless query processing
  - **Property 11: Stateless query processing**
  - **Validates: Requirements 6.2, 6.3, 6.5**

- [ ]* 12.3 Write property test for result replacement
  - **Property 12: Result replacement**
  - **Validates: Requirements 6.4**

- [x] 13. Implement security measures





  - Verify API keys are only in server-side code
  - Add input sanitization to prevent XSS
  - Configure CORS if needed
  - Ensure no credentials in client bundle
  - _Requirements: 7.3_

- [ ]* 13.1 Write property test for API credential security
  - **Property 13: API credential security**
  - **Validates: Requirements 7.3**

- [x] 14. Add global styling and layout





  - Configure Tailwind CSS theme for modern, clean design
  - Create layout component with centered content
  - Add responsive design for mobile and desktop
  - Implement simple, minimalist color scheme
  - _Requirements: 1.5_

- [x] 15. Create environment configuration documentation





  - Create .env.example file with required variables
  - Add README.md with setup instructions
  - Document API key acquisition process
  - Add deployment instructions
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 16. Final checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.