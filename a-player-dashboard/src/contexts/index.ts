/**
 * Context Providers Export Index
 * Centralized exports for all optimized context providers
 */

// Optimized Auth Contexts
export { AuthStateProvider, useAuthState, useAuthStatus, useAuthError, useAuthActions } from './AuthStateContext';
export { UserDataProvider, useUserData, useUser, useUserPermissions } from './UserDataContext';

// Performance Context
export { PerformanceProvider, usePerformance, useComponentPerformance } from './PerformanceContext';

// Survey Context
export { SurveyProvider, useSurveyContext, useSurveyNavigationState, useSurveyData, useSurveySession } from './SurveyContext';

// Original Contexts (preserved for backward compatibility)
export { AuthProvider, useAuth } from './AuthContext';
export { NavigationProvider, useNavigation, useKeyboardNavigation } from './NavigationContext';
