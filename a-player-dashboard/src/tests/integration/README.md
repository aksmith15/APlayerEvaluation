# Integration Tests

This directory contains integration tests that test complete user workflows and component interactions with mocked dependencies.

## Test Structure

### 1. Authentication Flow Tests (`auth-flow.test.tsx`)
- Login → Dashboard navigation
- Role-based access (Manager vs Peer)
- Session management and persistence
- Authentication error handling

### 2. Employee Selection Flow Tests (`employee-selection.test.tsx`)
- Search functionality with real-time filtering
- Employee selection → Analytics navigation
- Employee data loading and display
- Search error states and empty results

### 3. Data Fetching Integration Tests (`data-fetching.test.tsx`)
- Supabase API integration with mocked responses
- Chart data transformation and rendering
- Real-time updates and polling
- Error handling for API failures

### 4. Analytics Workflow Tests (`analytics-workflow.test.tsx`)
- Complete analytics page functionality
- Quarter filtering and data updates
- Chart interactions and state management
- AI analysis generation and PDF display

## Mocking Strategy

### External Dependencies
- **Supabase Client**: Mocked with realistic response data
- **Router Navigation**: Mocked React Router for route testing
- **Chart Libraries**: Mocked for performance, test data visualization logic
- **PDF Viewer**: Mocked PDF display and download functionality

### Test Data
- Realistic employee evaluation data
- Multiple quarters of historical data
- Various analysis states (pending, completed, error)
- Different user roles and permissions

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npm run test -- auth-flow.test.tsx

# Run with coverage for integration tests
npm run test:integration:coverage
```

## Test Environment

Integration tests use the same test utilities as unit tests but with additional:
- Extended mock data sets
- Multi-component rendering
- Route-based testing
- Asynchronous workflow validation 