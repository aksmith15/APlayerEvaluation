import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { ErrorBoundary, LoadingSpinner } from './components/ui';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ROUTES } from './constants/config';

// Lazy load components for better code splitting
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const EmployeeSelection = React.lazy(() => import('./pages/EmployeeSelection').then(module => ({ default: module.EmployeeSelection })));
const EmployeeAnalytics = React.lazy(() => import('./pages/EmployeeAnalytics').then(module => ({ default: module.EmployeeAnalytics })));

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <NavigationProvider>
            <div className="App">
              <Suspense fallback={<LoadingSpinner fullScreen message="Loading application..." />}>
                <Routes>
                  {/* Public route - redirects to dashboard if already authenticated */}
                  <Route 
                    path={ROUTES.LOGIN} 
                    element={
                      <ProtectedRoute requireAuth={false}>
                        <Login />
                      </ProtectedRoute>
                    } 
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
