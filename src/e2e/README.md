# End-to-End Tests for AI Search Engine

This directory contains comprehensive end-to-end tests for the AI Search Engine application using Playwright.

## Test Coverage

### 1. Complete Search Flow (`search-flow.spec.ts`)
Tests the core search functionality from query input to results display:

- **Requirements Covered**: 1.1, 1.2, 1.3, 1.4, 2.3
- **Test Cases**:
  - Complete search flow from query to results
  - Search input validation for empty queries
  - AI-enhanced summary display
  - Search results count and metadata display

### 2. Error Scenarios (`error-scenarios.spec.ts`)
Tests error handling and recovery mechanisms:

- **Requirements Covered**: 2.4, 4.2, 4.3, 4.4
- **Test Cases**:
  - API service unavailable errors
  - Network connection failures
  - Timeout error handling
  - AI enhancement service failures with graceful fallback
  - Empty search results handling
  - Database unavailability scenarios
  - Error dismissal and retry functionality
  - Malformed API response handling

### 3. Search History Functionality (`search-history.spec.ts`)
Tests search history features and persistence:

- **Requirements Covered**: 3.1, 3.2, 3.3, 3.4
- **Test Cases**:
  - Display search history on page load
  - Click on previous searches to view cached results
  - Save new searches to history
  - Display search timestamps correctly
  - Handle empty search history
  - Handle history loading errors gracefully
  - Loading states for history fetching
  - Handle non-existent history items

### 4. Responsive Design (`responsive-design.spec.ts`)
Tests responsive behavior across different screen sizes:

- **Requirements Covered**: 5.1
- **Test Cases**:
  - Mobile device display (375px width)
  - Tablet device display (768px width)
  - Desktop display (1280px width)
  - Dynamic viewport changes
  - Usability across different screen sizes
  - Touch interactions on mobile
  - Font sizes and spacing adaptation
  - Keyboard navigation on all screen sizes

### 5. Comprehensive Flow (`comprehensive-flow.spec.ts`)
Tests complete user journeys and integration scenarios:

- **Requirements Covered**: All requirements (1.1-5.1)
- **Test Cases**:
  - Full user journey from search to history interaction
  - Complete error recovery flow
  - AI enhancement failure with graceful degradation
  - Functionality across different viewport sizes
  - Keyboard navigation and accessibility

## Test Utilities

### `test-helpers.ts`
Provides reusable helper functions and mock data:

- **SearchPageHelpers class**: Common page interactions
- **Mock API responses**: Predefined test data
- **Viewport management**: Screen size testing utilities
- **Error simulation**: Various error scenarios

## Running the Tests

### Prerequisites
1. Install dependencies: `npm install`
2. Install Playwright browsers: `npx playwright install`

### Commands
```bash
# Run all e2e tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test src/e2e/search-flow.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium
```

### Test Configuration
- **Base URL**: http://localhost:3000
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 on CI, 0 locally
- **Timeout**: 30 seconds per test
- **Trace**: Collected on first retry

## Mock API Strategy

The tests use Playwright's route interception to mock API responses:

1. **Successful Scenarios**: Mock successful search and history responses
2. **Error Scenarios**: Mock various HTTP error codes and network failures
3. **Edge Cases**: Mock empty results, malformed responses, timeouts

## Test Data Attributes

Components include `data-testid` attributes for reliable element selection:

- `search-interface`: Main search input area
- `search-input`: Search text input field
- `search-button`: Search submit button
- `search-results`: Results container
- `result-card`: Individual result items
- `search-history`: History sidebar
- `history-item`: Individual history entries
- `loading-indicator`: Loading state display
- `error-display`: Error message display

## Accessibility Testing

Tests include basic accessibility checks:

- Keyboard navigation support
- Focus management
- Screen reader compatibility (via semantic HTML)
- ARIA attributes validation

## Performance Considerations

Tests verify performance requirements:

- Search completion within reasonable timeouts
- Responsive layout rendering
- Smooth viewport transitions
- Efficient error recovery

## Continuous Integration

Tests are configured for CI environments:

- Headless browser execution
- Parallel test execution
- Retry mechanisms for flaky tests
- HTML report generation
- Screenshot capture on failures

## Maintenance

To maintain test reliability:

1. Keep test data attributes stable
2. Update mock responses when API changes
3. Review timeout values periodically
4. Monitor test execution times
5. Update browser versions regularly

## Troubleshooting

Common issues and solutions:

1. **Timeout errors**: Increase timeout values or optimize page load
2. **Element not found**: Verify data-testid attributes exist
3. **Flaky tests**: Add proper wait conditions
4. **Mock failures**: Check route patterns and response formats
5. **Viewport issues**: Ensure responsive design works correctly