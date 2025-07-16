import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { EmployeeSelection } from './pages/EmployeeSelection';
import { EmployeeAnalytics } from './pages/EmployeeAnalytics';
import { ROUTES } from './constants/config';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.EMPLOYEE_SELECTION} element={<EmployeeSelection />} />
          <Route path={ROUTES.EMPLOYEE_ANALYTICS} element={<EmployeeAnalytics />} />
          {/* Redirect any unknown routes to login */}
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
