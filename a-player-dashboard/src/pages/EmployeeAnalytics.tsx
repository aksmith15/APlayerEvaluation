import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchEmployeeData, fetchQuarters } from '../services/dataFetching';
import { ROUTES } from '../constants/config';
import type { Person } from '../types/database';
import type { Quarter } from '../types/evaluation';

export const EmployeeAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId');

  const [employee, setEmployee] = useState<Person | null>(null);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) {
      navigate(ROUTES.EMPLOYEE_SELECTION);
      return;
    }
    loadData();
  }, [employeeId, navigate]);

  const loadData = async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const [employeeData, quartersData] = await Promise.all([
        fetchEmployeeData(employeeId),
        fetchQuarters()
      ]);

      setEmployee(employeeData);
      setQuarters(quartersData);
      
      // Set the most recent quarter as default
      if (quartersData.length > 0) {
        setSelectedQuarter(quartersData[0].id);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load employee data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSelection = () => {
    navigate(ROUTES.EMPLOYEE_SELECTION);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-secondary-800 mb-2">
            Unable to load employee data
          </h3>
          <p className="text-secondary-600 mb-4">{error}</p>
          <button onClick={handleBackToSelection} className="btn-primary">
            Back to Employee Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToSelection}
                className="btn-secondary"
              >
                ← Back to Employees
              </button>
              <div>
                <h1 className="text-2xl font-bold text-secondary-800">
                  Employee Analytics
                </h1>
                <p className="text-secondary-600">Quarterly evaluation dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Quarter Filter */}
              <div>
                <label htmlFor="quarter-select" className="block text-sm font-medium text-secondary-700 mb-1">
                  Quarter
                </label>
                <select
                  id="quarter-select"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="input-field min-w-[200px]"
                >
                  {quarters.map((quarter) => (
                    <option key={quarter.id} value={quarter.id}>
                      {quarter.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Employee Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Employee Info */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-800 mb-4">Employee Profile</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-2xl font-bold text-secondary-800">{employee.name}</h3>
              </div>
              <div>
                <span className="text-lg text-primary-600 font-medium">{employee.role}</span>
              </div>
              <div>
                <span className="text-secondary-600">{employee.department}</span>
              </div>
              <div>
                <span className="text-secondary-500 text-sm">{employee.email}</span>
              </div>
            </div>
          </div>

          {/* Radar Chart Placeholder */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-800 mb-4">Performance Overview</h2>
            <div className="flex items-center justify-center h-64 bg-secondary-50 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-secondary-600">Radar Chart</p>
                <p className="text-sm text-secondary-500">Coming in Stage 2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Quarter Bar Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-800 mb-4">Current Quarter Breakdown</h2>
            <div className="flex items-center justify-center h-64 bg-secondary-50 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-chart-manager rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <p className="text-secondary-600">Clustered Bar Chart</p>
                <p className="text-sm text-secondary-500">Coming in Stage 2</p>
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-800 mb-4">Performance Trend</h2>
            <div className="flex items-center justify-center h-64 bg-secondary-50 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-info rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-secondary-600">Trend Line Chart</p>
                <p className="text-sm text-secondary-500">Coming in Stage 2</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-secondary-800">AI Meta-Analysis</h2>
            <button className="btn-primary" disabled>
              Generate Meta-Analysis
            </button>
          </div>
          <div className="flex items-center justify-center h-48 bg-secondary-50 rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-secondary-600">PDF Viewer & AI Analysis</p>
              <p className="text-sm text-secondary-500">Coming in Stage 2</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}; 