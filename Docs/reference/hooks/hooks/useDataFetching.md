# useDataFetching

Simple data fetching utility hook for basic async operations with loading and error states.

## Purpose

`useDataFetching` is a lightweight alternative to `useDataFetch` for simple data fetching scenarios. It provides basic loading and error handling without the advanced features like caching, retries, or performance monitoring. Use this hook for straightforward API calls where simplicity is preferred over advanced functionality.

## Signature

```typescript
function useDataFetching<T>(
  fetchFunction: () => Promise<T>,
  options: UseDataFetchingOptions = {}
): UseDataFetchingState<T>
```

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `fetchFunction` | `() => Promise<T>` | Yes | Async function that returns the data to fetch |
| `options` | `UseDataFetchingOptions` | No | Configuration options for the hook behavior |

### UseDataFetchingOptions

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `immediate` | `boolean` | No | `true` | Whether to execute fetch function immediately on mount |
| `onSuccess` | `(data: any) => void` | No | `undefined` | Callback fired when fetch succeeds |
| `onError` | `(error: string) => void` | No | `undefined` | Callback fired when fetch fails |

## Returns

| Name | Type | Description |
|------|------|-------------|
| `data` | `T \| null` | The fetched data, null if not yet loaded or error occurred |
| `loading` | `boolean` | Whether a fetch operation is currently in progress |
| `error` | `string \| null` | Error message if fetch failed, null otherwise |
| `refetch` | `() => Promise<void>` | Function to manually trigger a refetch |

## Usage Example

```typescript
// Basic usage with immediate fetch
const { data, loading, error, refetch } = useDataFetching(
  () => fetch('/api/users').then(res => res.json()),
  {
    onSuccess: (users) => console.log('Loaded users:', users.length),
    onError: (error) => console.error('Failed to load users:', error)
  }
);

// Manual fetch (immediate: false)
const { data, loading, error, refetch } = useDataFetching(
  () => fetch('/api/employees').then(res => res.json()),
  { 
    immediate: false,
    onSuccess: (data) => setEmployees(data)
  }
);

// Trigger manual fetch
const handleLoadEmployees = () => {
  refetch();
};

// Simple conditional rendering
if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;
if (!data) return <div>No data available</div>;

return (
  <div>
    <button onClick={refetch}>Refresh</button>
    <DataList items={data} />
  </div>
);
```

## Side Effects

### Network Operations
- **HTTP Requests**: Executes the provided `fetchFunction` which typically makes API calls
- **Immediate Execution**: Automatically triggers fetch on component mount when `immediate: true`

### Callback Execution
- **Success Callbacks**: Calls `onSuccess` when fetch completes successfully
- **Error Callbacks**: Calls `onError` when fetch fails with error message

## Dependencies

### Core React Hooks
- `React.useState` - Managing data, loading, and error state
- `React.useEffect` - Handling automatic fetch on mount
- `React.useCallback` - Memoizing the refetch function

### No External Dependencies
- Does not depend on any caching systems
- No performance monitoring integration
- No retry logic or advanced error handling

## Error Handling & Retries

### Simple Error Handling
```typescript
try {
  setLoading(true);
  setError(null);
  
  const result = await fetchFunction();
  setData(result);
  
  if (onSuccess) {
    onSuccess(result);
  }
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'An error occurred';
  setError(errorMessage);
  
  if (onError) {
    onError(errorMessage);
  }
  
  console.error('Data fetching error:', err);
}
```

### No Retry Logic
- Fails immediately on first error
- User must manually call `refetch()` to retry
- Simple error propagation without advanced handling

## Performance Notes

### Minimal Overhead
- Very lightweight implementation
- No caching or performance monitoring
- Single fetch per invocation

### Memoization
```typescript
const fetchData = useCallback(async () => {
  // Fetch logic
}, [fetchFunction, onSuccess, onError]);
```

### Memory Management
- No cleanup required as no subscriptions or timers are used
- State is automatically garbage collected when component unmounts

## Comparison with useDataFetch

| Feature | useDataFetching | useDataFetch |
|---------|----------------|---------------|
| **Simplicity** | ✅ Minimal API | ❌ Complex options |
| **Caching** | ❌ None | ✅ TTL-based |
| **Retries** | ❌ Manual only | ✅ Automatic with backoff |
| **Performance Monitoring** | ❌ None | ✅ Integrated |
| **Request Cancellation** | ❌ None | ✅ AbortController |
| **Optimistic Updates** | ❌ None | ✅ Built-in |
| **Bundle Size** | ✅ Smaller | ❌ Larger |
| **Use Case** | Simple API calls | Complex data operations |

## When to Use

### Choose useDataFetching for:
- Simple API calls without complex requirements
- Prototype development
- One-off data fetching operations
- Components with minimal data needs
- When bundle size is critical

### Choose useDataFetch for:
- Production applications with caching needs
- Operations requiring retry logic
- Performance-critical components
- Complex data dependencies
- When advanced error handling is needed

---

## useAsyncOperation

A specialized hook exported alongside `useDataFetching` for managing async operations with loading states:

```typescript
function useAsyncOperation(): {
  loading: boolean;
  error: string | null;
  execute: <T>(operation: () => Promise<T>, options?: AsyncOptions) => Promise<T | null>;
  clearError: () => void;
}
```

### Purpose
Provides a generic way to execute async operations with loading and error state management, useful for actions like form submissions or one-time operations.

### Usage Example
```typescript
const { loading, error, execute, clearError } = useAsyncOperation();

const handleSubmit = async (formData) => {
  const result = await execute(
    () => saveEmployee(formData),
    {
      onSuccess: (data) => navigate('/employees'),
      onError: (error) => showNotification('Save failed: ' + error)
    }
  );
  
  if (result) {
    console.log('Employee saved:', result);
  }
};

return (
  <form onSubmit={handleSubmit}>
    {error && <ErrorMessage message={error} onClose={clearError} />}
    <button type="submit" disabled={loading}>
      {loading ? 'Saving...' : 'Save Employee'}
    </button>
  </form>
);
```

### Returns
| Name | Type | Description |
|------|------|-------------|
| `loading` | `boolean` | Whether an async operation is in progress |
| `error` | `string \| null` | Error from last operation, null if successful |
| `execute` | `Function` | Execute an async operation with automatic state management |
| `clearError` | `() => void` | Manually clear the current error state |

---

**📁 File Location:** `a-player-dashboard/src/utils/useDataFetching.ts`  
**🔗 Related:** [useDataFetch](./useDataFetch.md), [API Integration Guide](../INTEGRATIONS.md)


