/**
 * Auth Contexts - Barrel Export
 * Centralized exports for authentication context providers
 */

// Re-export from shared contexts (temporary during migration)
export { 
  AuthProvider, 
  useAuth 
} from '../../../contexts/AuthContext';

export { 
  AuthStateProvider, 
  useAuthState, 
  useAuthStatus, 
  useAuthError, 
  useAuthActions 
} from '../../../contexts/AuthStateContext';

export { 
  UserDataProvider, 
  useUserData, 
  useUser, 
  useUserPermissions 
} from '../../../contexts/UserDataContext';
