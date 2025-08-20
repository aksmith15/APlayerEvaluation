import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useKeyboardNavigation } from '../contexts/NavigationContext';
import { CompanyProvider, useCompany } from '../contexts/CompanyContext';
import { supabase } from '../services/supabase';
import { LoadingSpinner, ErrorMessage, SearchInput, Card, EmployeeCardSkeleton, NoEmployeesFound, KeyboardShortcuts } from '../components/ui';
import { Page } from '../components/layout';

import type { Employee } from '../types/evaluation';
import { batchCheckCurrentQuarterDataAvailability, formatQuarterDataStatus, type QuarterDataStatus } from '../services/evaluationDataService';



const EmployeeSelectionContent: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { navigateToEmployee, updateNavigationState } = useNavigation();
  const { selectedCompanyId, loading: companyLoading } = useCompany();
  
  // Enable keyboard navigation shortcuts
  useKeyboardNavigation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quarterDataStatuses, setQuarterDataStatuses] = useState<Record<string, QuarterDataStatus | null>>({});



  // Get unique departments for filtering
  const departments = ['all', ...Array.from(new Set(employees.map(emp => emp.department)))];

  useEffect(() => {
    // Wait for company context to be ready before loading employees
    if (!companyLoading && selectedCompanyId) {
      loadEmployees();
    }
    
    // Restore filters from navigation state if returning from analytics
    const state = location.state as { searchFilters?: { searchTerm: string; department: string } } | null;
    if (state?.searchFilters) {
      setSearchTerm(state.searchFilters.searchTerm);
      setSelectedDepartment(state.searchFilters.department);
    }
  }, [location.state, companyLoading, selectedCompanyId]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!selectedCompanyId) {
        console.log('No company selected, skipping employee loading');
        setEmployees([]);
        setFilteredEmployees([]);
        setLoading(false);
        return;
      }

      console.log(`Loading employees for company: ${selectedCompanyId}`);
      
      // Use direct Supabase query with explicit company filtering
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      if (peopleError) {
        console.error('Error fetching employees:', peopleError);
        throw peopleError;
      }

      if (!people || people.length === 0) {
        console.log(`No employees found for company ${selectedCompanyId}`);
        setEmployees([]);
        setFilteredEmployees([]);
        setQuarterDataStatuses({});
        setLoading(false);
        return;
      }

      console.log(`✅ Found ${people.length} employees for company ${selectedCompanyId}`);

      // Convert to Employee format (simplified from fetchEmployees)
      const employeeData: Employee[] = people.map((person) => ({
        ...person,
        role: person.role || 'Unknown',
        hire_date: person.hire_date || new Date().toISOString().split('T')[0], // Default to today if not set
        department: person.department || 'Unknown',
        email: person.email || '',
        overallScore: undefined, // Will be calculated if needed
        latestQuarter: undefined // Will be loaded if needed
      }));

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
    <Page>
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-6 md:space-y-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-800 mb-2">
            Employee Selection
          </h1>
          <p className="text-secondary-600">
            Welcome, {user?.name || user?.email} • Select an employee to view their evaluation analytics
          </p>
        </div>
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

        {/* No Company Selected State */}
        {!companyLoading && !selectedCompanyId ? (
          <Card className="p-8 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Select a Company
              </h3>
              <p className="text-gray-600 mb-4">
                Please select a company using the selector in the header to view employees.
              </p>
            </div>
          </Card>
        ) : (
          <>
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
          </>
        )}
        
        {/* Keyboard Shortcuts Helper */}
        <KeyboardShortcuts />
      </div>
    </Page>
  );
};

// Main component with Company Provider wrapper
export const EmployeeSelection: React.FC = () => {
  return (
    <CompanyProvider>
      <EmployeeSelectionContent />
    </CompanyProvider>
  );
}; 