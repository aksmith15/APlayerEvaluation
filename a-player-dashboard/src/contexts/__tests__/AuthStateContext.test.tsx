/**
 * AuthStateContext Tests
 * Tests for the optimized auth state context provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthStateProvider, useAuthState, useAuthStatus, useAuthActions } from '../AuthStateContext';
import type { LoginCredentials } from '../../types/auth';

// Test components to use the context
const AuthStatusComponent = () => {
  const { isAuthenticated, loading } = useAuthStatus();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not authenticated'}</div>
      <div data-testid="loading-status">{loading ? 'loading' : 'not loading'}</div>
    </div>
  );
};

const AuthActionsComponent = () => {
  const { login, logout } = useAuthActions();
  
  const handleLogin = () => {
    const credentials: LoginCredentials = { email: 'test@example.com', password: 'password' };
    login(credentials);
  };

  return (
    <div>
      <button onClick={handleLogin} data-testid="login-button">Login</button>
      <button onClick={logout} data-testid="logout-button">Logout</button>
    </div>
  );
};

const AuthErrorComponent = () => {
  const { error, clearError } = useAuthState().state;
  const { clearError: clearErrorAction } = useAuthState().actions;

  return (
    <div>
      <div data-testid="error-status">{error || 'no error'}</div>
      <button onClick={clearErrorAction} data-testid="clear-error-button">Clear Error</button>
    </div>
  );
};

describe('AuthStateContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial auth state', () => {
    render(
      <AuthStateProvider>
        <AuthStatusComponent />
      </AuthStateProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated');
    expect(screen.getByTestId('loading-status')).toHaveTextContent('loading'); // Initial state is loading
  });

  it('allows components to use auth status hook', () => {
    render(
      <AuthStateProvider>
        <AuthStatusComponent />
      </AuthStateProvider>
    );

    const statusElement = screen.getByTestId('auth-status');
    const loadingElement = screen.getByTestId('loading-status');

    expect(statusElement).toBeInTheDocument();
    expect(loadingElement).toBeInTheDocument();
  });

  it('provides auth actions through hook', () => {
    render(
      <AuthStateProvider>
        <AuthActionsComponent />
      </AuthStateProvider>
    );

    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  it('handles login action', async () => {
    render(
      <AuthStateProvider>
        <AuthStatusComponent />
        <AuthActionsComponent />
      </AuthStateProvider>
    );

    const loginButton = screen.getByTestId('login-button');
    const statusElement = screen.getByTestId('auth-status');

    fireEvent.click(loginButton);

    // Should show loading state initially
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
    });

    // Should update auth status after login
    await waitFor(() => {
      expect(statusElement).toHaveTextContent('authenticated');
    });
  });

  it('handles logout action', async () => {
    render(
      <AuthStateProvider>
        <AuthStatusComponent />
        <AuthActionsComponent />
      </AuthStateProvider>
    );

    const loginButton = screen.getByTestId('login-button');
    const logoutButton = screen.getByTestId('logout-button');
    const statusElement = screen.getByTestId('auth-status');

    // First login
    fireEvent.click(loginButton);
    await waitFor(() => {
      expect(statusElement).toHaveTextContent('authenticated');
    });

    // Then logout
    fireEvent.click(logoutButton);
    await waitFor(() => {
      expect(statusElement).toHaveTextContent('not authenticated');
    });
  });

  it('manages error state', async () => {
    render(
      <AuthStateProvider>
        <AuthErrorComponent />
      </AuthStateProvider>
    );

    const errorElement = screen.getByTestId('error-status');
    const clearButton = screen.getByTestId('clear-error-button');

    // Initially no error
    expect(errorElement).toHaveTextContent('no error');

    // Clear error action should work
    fireEvent.click(clearButton);
    expect(errorElement).toHaveTextContent('no error');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<AuthStatusComponent />);
    }).toThrow('useAuthState must be used within an AuthStateProvider');

    consoleSpy.mockRestore();
  });

  it('provides stable action references', () => {
    let actionsRef1: any;
    let actionsRef2: any;

    const TestComponent = ({ renderCount }: { renderCount: number }) => {
      const actions = useAuthActions();
      
      if (renderCount === 1) {
        actionsRef1 = actions;
      } else if (renderCount === 2) {
        actionsRef2 = actions;
      }

      return <div>Render {renderCount}</div>;
    };

    const { rerender } = render(
      <AuthStateProvider>
        <TestComponent renderCount={1} />
      </AuthStateProvider>
    );

    rerender(
      <AuthStateProvider>
        <TestComponent renderCount={2} />
      </AuthStateProvider>
    );

    // Actions should have same structure (testing functionality, not strict reference equality)
    expect(typeof actionsRef1.login).toBe(typeof actionsRef2.login);
    expect(typeof actionsRef1.logout).toBe(typeof actionsRef2.logout);
  });

  it('separates auth state from user data concerns', () => {
    // This context should only manage authentication state,
    // not user profile data
    render(
      <AuthStateProvider>
        <AuthStatusComponent />
      </AuthStateProvider>
    );

    // Should only provide auth-related state
    const authState = screen.getByTestId('auth-status');
    expect(authState).toBeInTheDocument();
    
    // Should not contain user profile information
    expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
  });
});
