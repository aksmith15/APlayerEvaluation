# UI Components Library

This directory contains reusable UI components that implement the established design system for the A-Player Evaluations Dashboard.

## Components

### Button
```tsx
import { Button } from './components/ui';

// Basic usage
<Button>Click me</Button>

// With variants and loading
<Button variant="secondary" loading={isLoading}>
  Submit
</Button>

// With custom size
<Button size="lg" variant="danger">
  Delete
</Button>
```

### Card
```tsx
import { Card } from './components/ui';

// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>

// Hoverable card with click handler
<Card hoverable onClick={() => navigate('/employee/123')}>
  Employee profile content
</Card>
```

### LoadingSpinner
```tsx
import { LoadingSpinner } from './components/ui';

// Inline spinner
<LoadingSpinner size="sm" message="Loading..." />

// Full screen loading
<LoadingSpinner fullScreen message="Loading employees..." />
```

### ErrorMessage
```tsx
import { ErrorMessage } from './components/ui';

// Inline error
<ErrorMessage 
  message="Failed to load data" 
  onRetry={refetch}
/>

// Full screen error
<ErrorMessage 
  fullScreen
  title="Connection Error"
  message="Unable to connect to the server"
  onRetry={retryConnection}
/>
```

### SearchInput
```tsx
import { SearchInput } from './components/ui';

<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  label="Search Employees"
  placeholder="Search by name, department, or role..."
/>
```

### ErrorBoundary
```tsx
import { ErrorBoundary } from './components/ui';

<ErrorBoundary>
  <YourAppContent />
</ErrorBoundary>
```

## Data Fetching Hooks

### useDataFetching
```tsx
import { useDataFetching } from '../utils/useDataFetching';
import { fetchEmployees } from '../services/dataFetching';

function EmployeeList() {
  const { data: employees, loading, error, refetch } = useDataFetching(
    fetchEmployees,
    {
      onSuccess: (employees) => console.log(`Loaded ${employees.length} employees`),
      onError: (error) => console.error('Failed to load employees:', error)
    }
  );

  if (loading) return <LoadingSpinner message="Loading employees..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  
  return (
    <div>
      {employees?.map(employee => (
        <Card key={employee.id} hoverable>
          {employee.name}
        </Card>
      ))}
    </div>
  );
}
```

### useAsyncOperation
```tsx
import { useAsyncOperation } from '../utils/useDataFetching';

function LoginForm() {
  const { loading, error, execute } = useAsyncOperation();

  const handleSubmit = async (formData) => {
    const result = await execute(
      () => authenticateUser(formData),
      {
        onSuccess: (user) => navigate('/dashboard'),
        onError: (error) => console.error('Login failed:', error)
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage message={error} />}
      <Button loading={loading} type="submit">
        Sign In
      </Button>
    </form>
  );
}
```

## Design System Classes

These CSS utility classes are available in `src/index.css`:

- `.btn-primary` - Primary button styling
- `.btn-secondary` - Secondary button styling  
- `.card` - Card container styling
- `.input-field` - Form input styling
- `.chart-container` - Chart wrapper styling

All components use these classes internally and inherit from the established Tailwind CSS design system. 