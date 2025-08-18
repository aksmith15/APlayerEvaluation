# useDataFetch

Advanced data fetching hook with integrated caching, retries, and performance monitoring.

## Purpose

`useDataFetch` is a comprehensive data fetching solution that consolidates common patterns for API calls in React applications. It provides automatic retry logic, performance tracking, caching support (currently disabled), and optimistic updates. This hook is designed to replace multiple useState/useEffect combinations with a single, declarative interface.

## Signature

```typescript
function useDataFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: UseDataFetchOptions<T> = {}
): UseDataFetchResult<T>
```

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `fetchFn` | `() => Promise<T>` | Yes | Async function that returns the data to fetch |
| `dependencies` | `React.DependencyList` | No | Array of dependencies that trigger refetch when changed |
| `options` | `UseDataFetchOptions<T>` | No | Configuration options for the hook behavior |

### UseDataFetchOptions<T>

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `enabled` | `boolean` | No | `true` | Whether the hook should execute the fetch function |
| `cacheKey` | `string` | No | `undefined` | Key for caching the result (caching currently disabled) |
| `cacheTTL` | `number` | No | `undefined` | Time-to-live for cached data in milliseconds |
| `retryCount` | `number` | No | `3` | Number of retry attempts on failure |
| `retryDelay` | `number` | No | `1000` | Base delay between retries in milliseconds |
| `onSuccess` | `(data: T) => void` | No | `undefined` | Callback fired on successful fetch |
| `onError` | `(error: Error) => void` | No | `undefined` | Callback fired on fetch error |
| `refetchOnMount` | `boolean` | No | `true` | Whether to fetch data when component mounts |
| `refetchOnWindowFocus` | `boolean` | No | `false` | Whether to refetch when window regains focus |

## Returns

| Name | Type | Description |
|------|------|-------------|
| `data` | `T \| null` | The fetched data, null if not yet loaded or error occurred |
| `loading` | `boolean` | Whether a fetch operation is currently in progress |
| `error` | `string \| null` | Error message if fetch failed, null otherwise |
| `refetch` | `() => Promise<void>` | Function to manually trigger a refetch |
| `mutate` | `(newData: T) => void` | Function to optimistically update data |
| `lastFetched` | `number \| null` | Timestamp of last successful fetch |

## Usage Example

```typescript
// Basic usage
const { data, loading, error, refetch } = useDataFetch(
  () => fetchEmployeeData(employeeId),
  [employeeId],
  {
    enabled: !!employeeId,
    cacheKey: `employee-${employeeId}`,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    retryCount: 3,
    onSuccess: (data) => console.log('Employee data loaded:', data),
    onError: (error) => console.error('Failed to load employee:', error)
  }
);

// Optimistic updates
const handleUpdateEmployee = (newData) => {
  mutate(newData); // Immediate UI update
  updateEmployeeAPI(newData).catch(() => {
    refetch(); // Revert on API failure
  });
};

// Conditional rendering
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} onRetry={refetch} />;
if (!data) return <EmptyState />;

return <EmployeeProfile data={data} />;
```

## Side Effects

### Network Operations
- **HTTP Requests**: Executes the provided `fetchFn` which typically makes network calls
- **Request Cancellation**: Uses AbortController to cancel in-flight requests when dependencies change or component unmounts
- **Retry Logic**: Automatically retries failed requests with exponential backoff

### Storage Operations
- **Caching**: Will cache results using `dataCacheManager` when caching is re-enabled
- **Performance Tracking**: Integrates with performance monitoring system

### Event Listeners
- **Window Focus**: Optionally listens to window focus events for refetching stale data

### Timers
- **Retry Delays**: Creates timeouts for retry logic with exponential backoff
- **Cleanup**: Automatically clears all timers on unmount

## Dependencies

### Direct Dependencies
- `React.useState` - Managing component state
- `React.useEffect` - Handling side effects and lifecycle
- `React.useCallback` - Memoizing functions
- `React.useRef` - Storing mutable references

### Service Dependencies
- **`useComponentPerformance`** (from `../contexts/PerformanceContext`)
  - Used for measuring fetch operation performance
  - Tracks timing and success/failure metrics
- **`dataCacheManager`** (from `../services/dataCacheManager`) - **Currently Disabled**
  - Would handle caching logic when re-enabled
  - TTL-based cache invalidation

## Error Handling & Retries

### Retry Strategy
- **Exponential Backoff**: Retry delay increases with each attempt (`retryDelay * attempt`)
- **Maximum Attempts**: Configurable via `retryCount` option (default: 3)
- **Abort Handling**: Properly handles request cancellation during retries

### Error Propagation
1. **Network Errors**: Caught and converted to user-friendly error messages
2. **Callback Notification**: Calls `onError` callback if provided
3. **State Updates**: Sets error state for UI handling
4. **Console Logging**: Logs detailed error information for debugging

### Request Cancellation
```typescript
// Automatic cleanup prevents memory leaks and race conditions
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  };
}, []);
```

## Performance Notes

### Memoization
- **`executeRequest`**: Memoized with proper dependency array to prevent unnecessary re-creation
- **`refetch` and `mutate`**: Stable function references prevent child component re-renders

### Performance Monitoring
- **Automatic Tracking**: All fetch operations are automatically measured via `measureDataFetch`
- **Metrics Collected**: Response time, success/failure rates, retry counts
- **Context**: Includes operation metadata (attempt number, cache key, enabled state)

### Memory Management
- **AbortController**: Prevents memory leaks from cancelled requests
- **Timer Cleanup**: All setTimeout calls are properly cleared
- **Reference Management**: Uses `useRef` for mutable values that shouldn't trigger re-renders

### Cache Considerations (Future Implementation)
```typescript
// Cache pattern when re-enabled
if (cacheKey) {
  dataCacheManager.set(cacheKey, result, cacheTTL);
}
```

## Specialized Hooks

The file also exports three specialized hooks built on top of `useDataFetch`:

### useEmployeeData
```typescript
export function useEmployeeData(employeeId: string | null)
```
Pre-configured for fetching employee data with 5-minute cache TTL.

### useQuarterData  
```typescript
export function useQuarterData()
```
Pre-configured for fetching quarter data with 30-minute cache TTL and window focus refetch.

### useEvaluationData
```typescript
export function useEvaluationData(employeeId: string | null, quarterId: string | null)
```
Pre-configured for fetching evaluation data requiring both employee and quarter IDs.

---

**📁 File Location:** `a-player-dashboard/src/hooks/useDataFetch.ts`  
**🔗 Related:** [useDataFetching](./useDataFetching.md), [usePerformanceMonitoring](./usePerformanceMonitoring.md)


