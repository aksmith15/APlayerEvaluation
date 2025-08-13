import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import type { AuthContextType, User, LoginCredentials } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// React 18 StrictMode compatibility achieved through ref-based state management

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProviderReady, setIsProviderReady] = useState(false);
  


  // Memoized function to avoid recreating on every render
  const handleAuthStateChange = useCallback((authUser: User | null) => {
    console.log('Auth state changed:', !!authUser);
    setUser(authUser);
    setLoading(false);
    setError(null);
  }, []);

  // Initialize auth state - React 18 StrictMode friendly approach
  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      console.log('🚀 Starting authentication check...');
      
      try {
        setLoading(true);
        setError(null);

        // Try to get current user - this call is now fast and cached
        const currentUser = await authService.getCurrentUser();
        
        if (mounted) {
          console.log('✅ Auth check result:', !!currentUser);
          setUser(currentUser);
          setError(null);
          setIsProviderReady(true);
        }
      } catch (err) {
        console.warn('⚠️ Auth check failed (will retry via listener):', err instanceof Error ? err.message : 'Unknown error');
        if (mounted) {
          // Don't set error state - let the auth listener handle this
          setUser(null);
          setIsProviderReady(true); // Still mark ready so app doesn't hang
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('✅ Auth check complete');
        }
      }
    };

    // Set up auth state listener - this handles the real authentication
    const setupAuthListener = () => {
      try {
        const { data: { subscription } } = authService.onAuthStateChange((user) => {
          if (mounted) {
            console.log('🔄 Auth state change detected:', !!user);
            handleAuthStateChange(user);
          }
        });
        authSubscription = subscription;
      } catch (err) {
        console.error('Failed to set up auth state listener:', err);
      }
    };

    // Run both - let them race, the faster one wins
    initializeAuth().catch(() => {
      // Silently ignore initialization errors - auth listener will handle auth
      console.log('🔄 Initial auth check failed, relying on auth state listener...');
    });
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

  // Don't render children until provider is ready (prevents HMR issues)
  if (!isProviderReady && import.meta.env.DEV) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Initializing authentication...</p>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During HMR, context might temporarily be undefined
    // Return a default state to prevent crashes during development
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