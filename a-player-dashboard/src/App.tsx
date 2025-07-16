import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { ErrorBoundary } from './components/ui';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { EmployeeSelection } from './pages/EmployeeSelection';
import { EmployeeAnalytics } from './pages/EmployeeAnalytics';
import { ROUTES } from './constants/config';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <NavigationProvider>
            <div className="App">
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
          </div>
          </NavigationProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
