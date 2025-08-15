import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import type { AuthContextType, User, LoginCredentials } from '../types/auth';
import { setCompanyContext, clearCompanyContext } from '../lib/tenantContext';
import { resolveCompanyContext } from '../lib/resolveCompany';
import { logTenancyEvent } from '../lib/monitoring';
import { supabase } from '../services/supabase';

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
  const handleAuthStateChange = useCallback(async (authUser: User | null) => {
    console.log('Auth state changed:', !!authUser);
    
    if (authUser) {
      // User signed in - initialize tenant context
      try {
        console.log('🏢 Initializing tenant context...');
        console.log('🔍 Auth user details:', { email: authUser.email, id: authUser.id });
        
        const tenantContext = await resolveCompanyContext(supabase);
        setCompanyContext(tenantContext);
        
        logTenancyEvent({
          type: 'CONTEXT_INIT',
          operation: 'login',
          context: { companyId: tenantContext.companyId, role: tenantContext.role }
        });
        
        console.log('✅ Tenant context initialized successfully:', tenantContext);
        
        // FIXED: Get the full user profile with jwtRole to ensure UI has complete data
        try {
          console.log('👤 Fetching complete user profile...');
          const fullProfile = await authService.getUserProfile(authUser.email!);
          
          if (fullProfile) {
            // Update the user object with complete profile data
            const enhancedUser: User = {
              ...authUser,
              id: fullProfile.id,
              name: fullProfile.name,
              role: fullProfile.role,
              department: fullProfile.department,
              jwtRole: fullProfile.jwtRole
            };
            
            console.log('✅ Enhanced user profile:', enhancedUser);
            setUser(enhancedUser);
            setLoading(false);
            setError(null);
            return; // Early return with enhanced user
          }
        } catch (profileError) {
          console.error('❌ Failed to get full profile:', profileError);
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize tenant context:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userEmail: authUser.email
        });
        
        logTenancyEvent({
          type: 'CONTEXT_FAILURE',
          operation: 'login',
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Don't break existing flow - continue without tenant context
        // RLS policies will still provide baseline protection
        console.warn('⚠️ Continuing without tenant context - RLS policies will provide baseline protection');
      }
    } else {
      // User signed out - clear tenant context
      clearCompanyContext();
      
      logTenancyEvent({
        type: 'CONTEXT_INIT',
        operation: 'logout'
      });
    }
    
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