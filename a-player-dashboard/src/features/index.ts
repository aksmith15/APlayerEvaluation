/**
 * Features - Main Barrel Export
 * Centralized exports for all feature domains
 */

// Feature domains
export * as Auth from './auth';
export * as Survey from './survey';
export * as Assignments from './assignments';
export * as Analytics from './analytics';

// Re-export specific commonly used items for convenience
export { 
  // Auth
  useAuth, 
  useAuthState, 
  useUser,
  authService
} from './auth';

export {
  // Survey
  EvaluationSurvey,
  SurveyProvider,
  useSurveyContext
} from './survey';

export {
  // Assignments
  AssignmentCreationForm,
  CoverageDashboard,
  AttributeWeightsManager
} from './assignments';

export {
  // Analytics
  RadarChart,
  ClusteredBarChart,
  PerformanceDashboard,
  EmployeeProfile
} from './analytics';


