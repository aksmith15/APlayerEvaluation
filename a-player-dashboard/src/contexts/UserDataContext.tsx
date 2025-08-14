/**
 * User Data Context
 * Manages user profile data separately from authentication state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { useAuthStatus } from './AuthStateContext';
import type { User } from '../types/auth';

interface UserDataContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

interface UserDataProviderProps {
  children: React.ReactNode;
}

export const UserDataProvider: React.FC<UserDataProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated } = useAuthStatus();

  // Fetch user data when authentication status changes
  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUserData();
    } else if (!isAuthenticated) {
      setUser(null);
      setError(null);
    }
  }, [isAuthenticated, user]);

  const fetchUserData = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
      setError(errorMessage);
      console.error('User data fetch error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refreshUser = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(current => current ? { ...current, ...updates } : null);
  }, []);

  const value: UserDataContextType = {
    user,
    loading,
    error,
    refreshUser,
    updateUser
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = (): UserDataContextType => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

// Convenience hook for just user info
export const useUser = () => {
  const { user } = useUserData();
  return user;
};

// Hook for user permissions/role
export const useUserPermissions = () => {
  const { user } = useUserData();
  return {
    role: user?.role,
    department: user?.department,
    jwtRole: user?.jwtRole,
    isAdmin: user?.jwtRole === 'hr_admin' || user?.jwtRole === 'super_admin',
    isSuperAdmin: user?.jwtRole === 'super_admin'
  };
};


