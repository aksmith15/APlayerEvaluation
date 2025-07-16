import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { fetchEmployeeData, fetchQuarters, fetchEvaluationScores } from '../services/dataFetching';
import { LoadingSpinner, ErrorMessage, Card, RadarChart, ChartSkeleton, NoEvaluationData, Breadcrumb, useBreadcrumbs, KeyboardShortcuts } from '../components/ui';
import { useNavigation, useKeyboardNavigation } from '../contexts/NavigationContext';
import { ROUTES } from '../constants/config';
import type { Person, WeightedEvaluationScore } from '../types/database';
import type { Quarter } from '../types/evaluation';

export const EmployeeAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId');
  const { navigateToEmployeeSelection, updateNavigationState } = useNavigation();
  const { generateBreadcrumbs } = useBreadcrumbs();
  
  // Enable keyboard navigation shortcuts
  useKeyboardNavigation();

  const [employee, setEmployee] = useState<Person | null>(null);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [evaluationScores, setEvaluationScores] = useState<WeightedEvaluationScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) {
      navigate(ROUTES.EMPLOYEE_SELECTION);
      return;
    }
    loadInitialData();
  }, [employeeId, navigate]);

  useEffect(() => {
    if (selectedQuarter && employeeId) {
      loadEvaluationData();
    }
  }, [selectedQuarter, employeeId]);

  const loadInitialData = async () => {
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

  const loadEvaluationData = async () => {
    if (!employeeId || !selectedQuarter) return;

    try {
      setDataLoading(true);
      const scores = await fetchEvaluationScores(employeeId, selectedQuarter);
      setEvaluationScores(scores);
    } catch (err) {
      console.error('Error loading evaluation scores:', err);
      // Don't set error state for evaluation data, just log it
    } finally {
      setDataLoading(false);
    }
  };

  const handleBackToSelection = () => {
    navigateToEmployeeSelection(true);
  };

  const handleQuarterChange = (quarterId: string) => {
    setSelectedQuarter(quarterId);
    updateNavigationState({ lastVisitedQuarter: quarterId });
  };

  // Calculate overall score for selected quarter
  const calculateOverallScore = () => {
    if (evaluationScores.length === 0) return null;
    const totalScore = evaluationScores.reduce((sum, score) => sum + score.weighted_final_score, 0);
    return totalScore / evaluationScores.length;
  };

  // Get performance attributes data for charts
  const getAttributesData = () => {
    return evaluationScores.map(score => ({
      attribute: score.attribute_name,
      manager: score.manager_score,
      peer: score.peer_score,
      self: score.self_score,
      weighted: score.weighted_final_score,
      hasManager: score.has_manager_eval,
      hasPeer: score.has_peer_eval,
      hasSelf: score.has_self_eval,
      completion: score.completion_percentage
    }));
  };

  // Get selected quarter info
  const selectedQuarterInfo = quarters.find(q => q.id === selectedQuarter);
  const overallScore = calculateOverallScore();
  const attributesData = getAttributesData();

  // Generate breadcrumbs
  const breadcrumbs = generateBreadcrumbs(location.pathname, employee?.name);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading analytics..." />;
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ErrorMessage 
            message={error || 'Employee not found'} 
            onRetry={loadInitialData}
            retryText="Try Again"
          />
          <button onClick={handleBackToSelection} className="btn-secondary mt-4">
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
          {/* Breadcrumb Navigation */}
          <div className="mb-4">
            <Breadcrumb items={breadcrumbs} />
          </div>
          
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
                <p className="text-secondary-600">
                  {selectedQuarterInfo ? `${selectedQuarterInfo.name} • ` : ''}
                  {evaluationScores.length} attributes
                  {overallScore && ` • Overall Score: ${overallScore.toFixed(1)}`}
                </p>
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
                  onChange={(e) => handleQuarterChange(e.target.value)}
                  className="input-field min-w-[200px]"
                  disabled={dataLoading}
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
        <div className="mb-8">
          <Card>
            <h2 className="text-xl font-semibold text-secondary-800 mb-4">Employee Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-secondary-800">{employee.name}</h3>
                <span className="text-lg text-primary-600 font-medium">{employee.role}</span>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-secondary-700">Department</span>
                <p className="text-secondary-600">{employee.department}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-secondary-700">Email</span>
                <p className="text-secondary-500 text-sm">{employee.email}</p>
              </div>
              {employee.hire_date && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-secondary-700">Hire Date</span>
                  <p className="text-secondary-500 text-sm">
                    {new Date(employee.hire_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Performance Overview (Radar Chart) - Full Width */}
        <div className="mb-8">
          <Card>
            {dataLoading && (
              <div className="flex justify-end mb-4">
                <LoadingSpinner size="sm" />
              </div>
            )}
            
            {dataLoading ? (
              <ChartSkeleton height="h-96" />
            ) : attributesData.length > 0 ? (
              <RadarChart 
                data={attributesData}
                height={500}
              />
            ) : (
              <NoEvaluationData quarterName={selectedQuarterInfo?.name} />
            )}
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Quarter Bar Chart */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary-800">
                {selectedQuarterInfo?.name || 'Quarter'} Breakdown
              </h2>
              {dataLoading && <LoadingSpinner size="sm" />}
            </div>
            
            {dataLoading ? (
              <ChartSkeleton height="h-64" />
            ) : attributesData.length > 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-chart-manager rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <p className="text-secondary-600">Clustered Bar Chart</p>
                  <p className="text-sm text-secondary-500">
                    Ready for {attributesData.length} attributes
                  </p>
                </div>
              </div>
            ) : (
              <NoEvaluationData quarterName={selectedQuarterInfo?.name} />
            )}
          </Card>

          {/* Trend Analysis */}
          <Card>
            <h2 className="text-xl font-semibold text-secondary-800 mb-4">Performance Trend</h2>
            <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-info rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-secondary-600">Trend Line Chart</p>
                <p className="text-sm text-secondary-500">Historical analysis</p>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Analysis Section */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-secondary-800">AI Meta-Analysis</h2>
            <button 
              className="btn-primary" 
              disabled={!attributesData.length || dataLoading}
            >
              Generate Meta-Analysis
            </button>
          </div>
          
          {attributesData.length > 0 ? (
            <div className="h-48 flex items-center justify-center bg-secondary-50 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-secondary-600">PDF Viewer & AI Analysis</p>
                <p className="text-sm text-secondary-500">
                  Ready to generate analysis for {selectedQuarterInfo?.name}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-secondary-50 rounded-lg">
              <div className="text-center">
                <p className="text-secondary-600">No data available for analysis</p>
                <p className="text-sm text-secondary-500">
                  Select a quarter with evaluation data to generate AI analysis
                </p>
              </div>
            </div>
          )}
        </Card>
      </main>
      
      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcuts />
    </div>
  );
}; 