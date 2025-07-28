import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useKeyboardNavigation } from '../contexts/NavigationContext';
import { fetchEmployees } from '../services/dataFetching';
import { LoadingSpinner, ErrorMessage, SearchInput, Card, EmployeeCardSkeleton, NoEmployeesFound, KeyboardShortcuts } from '../components/ui';
import { ROUTES, APP_CONFIG } from '../constants/config';
import type { Employee } from '../types/evaluation';
import { batchCheckCurrentQuarterDataAvailability, formatQuarterDataStatus, type QuarterDataStatus } from '../services/evaluationDataService';

// Icon components for navigation
const ClipboardIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);

export const EmployeeSelection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { navigateToEmployee, updateNavigationState } = useNavigation();
  
  // Enable keyboard navigation shortcuts
  useKeyboardNavigation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quarterDataStatuses, setQuarterDataStatuses] = useState<Record<string, QuarterDataStatus | null>>({});

  // Check if user is admin
  const isAdmin = user?.jwtRole === 'super_admin' || user?.jwtRole === 'hr_admin';

  // Get unique departments for filtering
  const departments = ['all', ...Array.from(new Set(employees.map(emp => emp.department)))];

  useEffect(() => {
    loadEmployees();
    
    // Restore filters from navigation state if returning from analytics
    const state = location.state as { searchFilters?: { searchTerm: string; department: string } } | null;
    if (state?.searchFilters) {
      setSearchTerm(state.searchFilters.searchTerm);
      setSelectedDepartment(state.searchFilters.department);
    }
  }, [location.state]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const employeeData = await fetchEmployees();
      setEmployees(employeeData);
      setFilteredEmployees(employeeData);
      
      // Load quarter data statuses for all employees
      const employeeIds = employeeData.map(emp => emp.id);
      const quarterStatuses = await batchCheckCurrentQuarterDataAvailability(employeeIds);
      setQuarterDataStatuses(quarterStatuses);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    // Store current search state for navigation context
    updateNavigationState({
      searchFilters: {
        searchTerm,
        department: selectedDepartment
      }
    });
    
    navigateToEmployee(employee.id, employee.name);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Filter employees based on search and department
  useEffect(() => {
    let filtered = employees;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchLower) ||
        emp.department.toLowerCase().includes(searchLower) ||
        emp.role.toLowerCase().includes(searchLower)
      );
    }

    // Apply department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, selectedDepartment]);

  const getOverallScoreClass = (score?: number) => {
    if (!score) return 'bg-secondary-100 text-secondary-600';
    if (score >= 4.0) return 'bg-green-100 text-green-700';
    if (score >= 3.0) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading employees..." />;
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-secondary-800">
                {APP_CONFIG.TITLE}
              </h1>
              <p className="text-secondary-600">
                Welcome, {user?.name || user?.email} • Select an employee to view their evaluation analytics
              </p>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              {/* My Assignments - Available to all users */}
              <button
                onClick={() => navigate(ROUTES.MY_ASSIGNMENTS)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ClipboardIcon className="w-4 h-4" />
                <span>My Assignments</span>
              </button>

              {/* Assignment Management - Admin only */}
              {isAdmin && (
                <button
                  onClick={() => navigate(ROUTES.ASSIGNMENT_MANAGEMENT)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-lg transition-colors"
                >
                  <UsersIcon className="w-4 h-4" />
                  <span>Assignment Management</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters Section */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-end md:gap-6">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              label="Search Employees"
              placeholder="Search by name, department, or role..."
              className="max-w-md"
            />
          </div>
          
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Filter by Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-secondary-600">
            Showing {filteredEmployees.length} of {employees.length} employees
            {selectedDepartment !== 'all' && ` in ${selectedDepartment}`}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={loadEmployees}
            retryText="Reload Employees"
          />
        )}

        {/* Employee Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <EmployeeCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map((employee) => (
              <Card
                key={employee.id}
                hoverable
                onClick={() => handleEmployeeSelect(employee)}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    {employee.profile_picture_url ? (
                      <img
                        src={employee.profile_picture_url}
                        alt={`${employee.name}'s profile`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={`text-primary-600 font-semibold text-lg ${employee.profile_picture_url ? 'hidden' : ''}`}>
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-1">
                    {employee.name}
                  </h3>
                  <p className="text-primary-600 font-medium mb-1">
                    {employee.role}
                  </p>
                  <p className="text-secondary-600 text-sm mb-3">
                    {employee.department}
                  </p>
                  <p className="text-secondary-500 text-xs">
                    {employee.email}
                  </p>
                  
                  {/* Overall Score Section */}
                  {employee.overallScore ? (
                    <div className="mt-4 pt-4 border-t border-secondary-200">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOverallScoreClass(employee.overallScore)}`}>
                          {employee.overallScore.toFixed(1)}
                        </span>
                        <span className="text-xs text-secondary-500">Overall Score</span>
                      </div>
                      {employee.latestQuarter && (
                        <p className="text-xs text-secondary-500">
                          {employee.latestQuarter}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-secondary-200">
                      <span className="text-xs text-secondary-500">
                        {formatQuarterDataStatus(quarterDataStatuses[employee.id])}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <NoEmployeesFound 
            onReset={searchTerm || selectedDepartment !== 'all' ? () => { setSearchTerm(''); setSelectedDepartment('all'); } : undefined}
          />
        )}
      </main>
      
      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcuts />
    </div>
  );
}; 