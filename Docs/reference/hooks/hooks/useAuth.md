# useAuth

React hook providing access to authentication state and actions through the Auth Context.

## Purpose

`useAuth` provides centralized access to the authentication system throughout the React application. It exposes the current user state, authentication status, and methods for login/logout operations while ensuring components have access to authentication context.

## Signature

```typescript
function useAuth(): AuthContextType
```

## Parameters

This hook takes no parameters.

## Returns

| Name | Type | Description |
|------|------|-------------|
| `user` | `User \| null` | Current authenticated user object, null if not authenticated |
| `loading` | `boolean` | Whether authentication state is being determined |
| `error` | `string \| null` | Authentication error message, null if no error |
| `login` | `(credentials: LoginCredentials) => Promise<void>` | Function to authenticate user |
| `logout` | `() => Promise<void>` | Function to sign out current user |
| `clearError` | `() => void` | Function to clear current authentication error |

### User Object Structure
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  department?: string;
  jwtRole?: string;
}
```

## Usage Example

```typescript
// Basic authentication check
const { user, loading, error, login, logout } = useAuth();

// Conditional rendering based on auth state
if (loading) {
  return <LoadingSpinner message="Checking authentication..." />;
}

if (error) {
  return <ErrorMessage message={error} />;
}

if (!user) {
  return <LoginForm onLogin={login} />;
}

// Authenticated user interface
return (
  <div>
    <header>
      <span>Welcome, {user.name || user.email}</span>
      <button onClick={logout}>Sign Out</button>
    </header>
    <main>
      <DashboardContent user={user} />
    </main>
  </div>
);

// Login form integration
const handleLogin = async (email: string, password: string) => {
  try {
    await login({ email, password });
    navigate('/dashboard');
  } catch (err) {
    // Error is automatically set in context
    console.error('Login failed:', err);
  }
};

// Role-based access control
const canAccessAdminFeatures = user?.jwtRole === 'hr_admin' || user?.jwtRole === 'super_admin';

return (
  <div>
    <UserContent />
    {canAccessAdminFeatures && <AdminPanel />}
  </div>
);
```

## Side Effects

### Context Validation
- **Provider Check**: Ensures hook is used within an AuthProvider
- **HMR Compatibility**: Provides graceful fallback during Hot Module Replacement in development

### Authentication Flow
- **Session Management**: Integrates with Supabase authentication
- **Token Refresh**: Handles automatic token refresh
- **Tenant Context**: Initializes company/tenant context on successful authentication

## Dependencies

### React Context
- **`AuthContext`** (from `../contexts/AuthContext`)
  - Provides authentication state and methods
  - Must be used within AuthProvider

### Authentication Services
- **Supabase Auth** (via AuthContext)
  - Handles actual authentication operations
  - Session management and token refresh
- **Tenant Resolution** (via AuthContext)
  - Multi-tenant company context initialization

## Error Handling & Retries

### Provider Validation
```typescript
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During HMR, context might temporarily be undefined
    if (import.meta.env.DEV) {
      console.warn('useAuth called before AuthProvider is ready - returning default state for HMR stability');
      return {
        user: null,
        loading: true,
        error: null,
        login: async () => { throw new Error('AuthProvider not ready'); },
        logout: async () => { throw new Error('AuthProvider not ready'); },
        clearError: () => { throw new Error('AuthProvider not ready'); },
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Development Mode Safeguards
- **HMR Support**: Provides fallback state during development hot reloads
- **Error Prevention**: Prevents crashes when provider is temporarily unavailable
- **Debug Information**: Logs warnings in development mode for debugging

### Production Error Handling
- **Strict Validation**: Throws error if used outside provider in production
- **Context Integrity**: Ensures authentication context is properly established

## Performance Notes

### Context Optimization
- **Minimal Re-renders**: Context value is memoized in AuthProvider
- **Stable References**: Functions are memoized to prevent unnecessary re-renders
- **Efficient Updates**: Only components using auth context re-render on auth changes

### Memory Management
- **No Additional State**: Hook doesn't maintain its own state
- **Context Cleanup**: AuthProvider handles cleanup of timers and subscriptions

## Authentication Flow Integration

### Login Process
1. User calls `login(credentials)`
2. AuthProvider handles Supabase authentication
3. On success, user profile is enriched with company data
4. Tenant context is initialized
5. Hook consumers receive updated user state

### Logout Process
1. User calls `logout()`
2. AuthProvider clears Supabase session
3. Tenant context is cleared
4. Hook consumers receive null user state

### Session Persistence
- **Automatic Refresh**: Supabase handles token refresh automatically
- **Storage Key**: Uses custom storage key `'ape.auth'`
- **Health Checks**: Includes session health validation

## Usage Patterns

### Route Protection
```typescript
// ProtectedRoute component using useAuth
const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (requireAuth && !user) {
    return <Navigate to="/login" />;
  }
  
  if (!requireAuth && user) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};
```

### Conditional Features
```typescript
// Feature access based on user role
const AdminPanel = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.jwtRole === 'hr_admin' || user?.jwtRole === 'super_admin';
  
  if (!isAdmin) {
    return <AccessDenied />;
  }
  
  return <AdminInterface />;
};
```

### Navigation Integration
```typescript
// Navigation component with auth state
const Navigation = () => {
  const { user, logout } = useAuth();
  
  return (
    <nav>
      {user ? (
        <>
          <UserMenu user={user} />
          <LogoutButton onClick={logout} />
        </>
      ) : (
        <LoginButton />
      )}
    </nav>
  );
};
```

---

**📁 File Location:** `a-player-dashboard/src/contexts/AuthContext.tsx` (lines 238-257)  
**🔗 Related:** [AuthProvider](../contexts/AuthContext.md), [ProtectedRoute](../components/ProtectedRoute.md)
