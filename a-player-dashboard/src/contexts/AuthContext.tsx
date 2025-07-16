import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import type { AuthContextType, User, LoginCredentials } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized function to avoid recreating on every render
  const handleAuthStateChange = useCallback((authUser: User | null) => {
    console.log('Auth state changed:', !!authUser);
    setUser(authUser);
    setLoading(false);
    setError(null);
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      console.log('Initializing authentication...');
      
      try {
        setLoading(true);
        setError(null);

        // Get current user with a single timeout
        const currentUser = await authService.getCurrentUser();
        
        if (mounted) {
          console.log('Auth initialization result:', !!currentUser);
          setUser(currentUser);
          setError(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize authentication';
          setError(errorMessage);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('Auth initialization complete');
        }
      }
    };

    // Set up auth state listener (simplified to avoid loops)
    const setupAuthListener = () => {
      try {
        const { data: { subscription } } = authService.onAuthStateChange(handleAuthStateChange);
        authSubscription = subscription;
      } catch (err) {
        console.error('Failed to set up auth state listener:', err);
        if (mounted) {
          setError('Failed to set up authentication monitoring');
          setLoading(false);
        }
      }
    };

    // Initialize auth and set up listener
    initializeAuth();
    setupAuthListener();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array is correct here

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await authService.signIn(credentials);
      setUser(user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.signOut();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 