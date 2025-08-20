import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/debugTenant');
  import('./utils/clearAuthStorage');
}
import { NavigationProvider } from './contexts/NavigationContext';
import { ErrorBoundary, LoadingSpinner } from './components/ui';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ROUTES } from './constants/config';
import { initializePerformanceMonitoring } from './services/performanceMonitor';

// Lazy load components for better code splitting
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const EmployeeSelection = React.lazy(() => import('./pages/EmployeeSelection').then(module => ({ default: module.EmployeeSelection })));
const EmployeeAnalytics = React.lazy(() => import('./pages/EmployeeAnalytics').then(module => ({ default: module.EmployeeAnalytics })));
const AssignmentManagement = React.lazy(() => import('./pages/AssignmentManagement'));
const MyAssignments = React.lazy(() => import('./pages/MyAssignments'));
const EvaluationSurvey = React.lazy(() => import('./components/ui').then(module => ({ default: module.EvaluationSurvey })));
const AcceptInvite = React.lazy(() => import('./pages/AcceptInvite'));
const RegisterFromInvite = React.lazy(() => import('./pages/RegisterFromInvite'));
const ProfileEditor = React.lazy(() => import('./pages/ProfileEditor'));

// Dev-only React-PDF live preview
const DevPdfPreview = React.lazy(() => import('./pages/react-pdf/DevPdfPreview'));

const App: React.FC = () => {
  // Initialize performance monitoring on app startup
  useEffect(() => {
    initializePerformanceMonitoring({
      enableCoreWebVitals: true,
      enableCustomMetrics: true,
      sampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1, // 100% in dev, 10% in prod
      debugMode: process.env.NODE_ENV === 'development'
    });
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <NavigationProvider>
            <div className="App">
              <Suspense fallback={<LoadingSpinner fullScreen message="Loading application..." />}>
                <Routes>
                  {/* Public routes - redirects to dashboard if already authenticated */}
                  <Route 
                    path={ROUTES.LOGIN} 
                    element={
                      <ProtectedRoute requireAuth={false}>
                        <Login />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Accept invitation route - public access for invited users */}
                  <Route 
                    path="/accept-invite" 
                    element={<AcceptInvite />} 
                  />
                  <Route 
                    path="/register-from-invite" 
                    element={<RegisterFromInvite />} 
                  />
                  
                  {/* Protected routes - require authentication */}
                  <Route 
                    path={ROUTES.EMPLOYEE_SELECTION} 
                    element={
                      <ProtectedRoute>
                        <EmployeeSelection />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.EMPLOYEE_ANALYTICS} 
                    element={
                      <ProtectedRoute>
                        <EmployeeAnalytics />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* User assignment routes - require authentication */}
                  <Route 
                    path={ROUTES.MY_ASSIGNMENTS} 
                    element={
                      <ProtectedRoute>
                        <MyAssignments />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Survey route - requires authentication and valid token */}
                  <Route 
                    path="/survey/:token" 
                    element={
                      <ProtectedRoute>
                        <EvaluationSurvey />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Profile management route - require authentication */}
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ProfileEditor />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Admin routes - require authentication + admin role (validated in component) */}
                  <Route 
                    path={ROUTES.ASSIGNMENT_MANAGEMENT} 
                    element={
                      <ProtectedRoute>
                        <AssignmentManagement />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Dev-only: React-PDF live preview with HMR (guarded by NODE_ENV) */}
                  {import.meta && import.meta.env && import.meta.env.DEV ? (
                    <Route 
                      path="/dev/pdf-preview" 
                      element={
                        <ProtectedRoute>
                          <DevPdfPreview />
                        </ProtectedRoute>
                      } 
                    />
                  ) : null}
                  
                  {/* Default route - redirect to employee selection */}
                  <Route path="/dashboard" element={<Navigate to={ROUTES.EMPLOYEE_SELECTION} replace />} />
                  
                  {/* Redirect any unknown routes to login */}
                  <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
                </Routes>
              </Suspense>
            </div>
          </NavigationProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
