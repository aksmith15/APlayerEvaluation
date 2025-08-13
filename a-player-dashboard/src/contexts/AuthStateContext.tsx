/**
 * Optimized Auth State Context
 * Separates authentication state from user data to minimize re-renders
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { LoginCredentials } from '../types/auth';

// Split auth state into minimal authentication info
interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

interface AuthStateContextType {
  state: AuthState;
  actions: AuthActions;
}

const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined);

interface AuthStateProviderProps {
  children: React.ReactNode;
}

export const AuthStateProvider: React.FC<AuthStateProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    error: null
  });

  // Memoized actions to prevent unnecessary re-renders
  const actions = useCallback((): AuthActions => ({
    login: async (_credentials: LoginCredentials) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      try {
        // Auth logic would go here
        setAuthState(prev => ({ ...prev, isAuthenticated: true, loading: false }));
      } catch (error) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Login failed' 
        }));
      }
    },

    logout: async () => {
      setAuthState(prev => ({ ...prev, loading: true }));
      try {
        // Logout logic would go here
        setAuthState({ isAuthenticated: false, loading: false, error: null });
      } catch (error) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Logout failed' 
        }));
      }
    },

    clearError: () => {
      setAuthState(prev => ({ ...prev, error: null }));
    },

    setLoading: (loading: boolean) => {
      setAuthState(prev => ({ ...prev, loading }));
    },

    setError: (error: string | null) => {
      setAuthState(prev => ({ ...prev, error }));
    }
  }), []);

  const value: AuthStateContextType = {
    state: authState,
    actions: actions()
  };

  return (
    <AuthStateContext.Provider value={value}>
      {children}
    </AuthStateContext.Provider>
  );
};

export const useAuthState = (): AuthStateContextType => {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an AuthStateProvider');
  }
  return context;
};

// Convenience hooks for specific auth state slices
export const useAuthStatus = () => {
  const { state } = useAuthState();
  return {
    isAuthenticated: state.isAuthenticated,
    loading: state.loading
  };
};

export const useAuthError = () => {
  const { state, actions } = useAuthState();
  return {
    error: state.error,
    clearError: actions.clearError
  };
};

export const useAuthActions = () => {
  const { actions } = useAuthState();
  return actions;
};
