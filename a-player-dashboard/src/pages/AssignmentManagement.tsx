import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

// import { QuarterRangeSelector } from '../components/ui/QuarterRangeSelector';
import { AssignmentCreationForm } from '../components/ui/AssignmentCreationForm';
import { AssignmentDebugger } from '../components/ui/AssignmentDebugger';
// import { BulkAssignmentUpload } from '../components/ui/BulkAssignmentUpload';
import { AssignmentStatusTable } from '../components/ui/AssignmentStatusTable';
import { CoverageDashboard } from '../components/ui/CoverageDashboard';
// Lazy load heavy components
const LazyAttributeWeightsManager = React.lazy(() => 
  import('../components/ui/AttributeWeightsManager').then(module => ({ default: module.AttributeWeightsManager }))
);
import { 
  fetchAllAssignments, 
  getAssignmentStatistics,
  deleteBulkAssignments 
} from '../services/assignmentService';
import type { 
  EvaluationAssignmentWithDetails, 
  AssignmentStatistics,
  EvaluationType,
  AssignmentStatus 
} from '../types/database';

// Icon components (inline SVG)
const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const BarChartIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
  </svg>
);

const FilterIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
  </svg>
);

const WeightsIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const DebugIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L10 10.586l-1.293-1.293z" clipRule="evenodd" />
  </svg>
);

interface AssignmentFilters {
  quarter_id?: string;
  evaluation_type?: EvaluationType;
  status?: AssignmentStatus;
  search?: string;
}

const AssignmentManagement: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [assignments, setAssignments] = useState<EvaluationAssignmentWithDetails[]>([]);
  const [statistics, setStatistics] = useState<AssignmentStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'upload' | 'manage' | 'coverage' | 'weights' | 'debug'>('overview');
  const [filters, setFilters] = useState<AssignmentFilters>({});
  const [refreshing, setRefreshing] = useState(false);

  // Check admin permissions
  const isAdmin = user?.jwtRole === 'super_admin' || user?.jwtRole === 'hr_admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    console.log('🔄 useEffect triggered - loading data with filters:', filters);
    loadData();
  }, [isAdmin, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Fetching assignments with filters:', filters);
      const [assignmentsData, statisticsData] = await Promise.all([
        fetchAllAssignments(filters),
        getAssignmentStatistics() // Remove selectedQuarters for now
      ]);

      console.log('✅ Data loaded:', {
        assignmentsCount: assignmentsData.length,
        filtersApplied: Object.keys(filters).length > 0 ? filters : 'none'
      });

      setAssignments(assignmentsData);
      setStatistics(statisticsData);
    } catch (err) {
      console.error('Error loading assignment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBulkDelete = async () => {
    if (selectedAssignments.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedAssignments.length} assignment(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const result = await deleteBulkAssignments(selectedAssignments);
      
      if (result.success) {
        setSelectedAssignments([]);
        await loadData();
        alert(`Successfully deleted ${result.deletedCount} assignment(s)`);
      } else {
        throw new Error(result.errors.join(', '));
      }
    } catch (err) {
      console.error('Error deleting assignments:', err);
      alert(`Failed to delete assignments: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentCreated = () => {
    loadData();
    setActiveTab('manage');
  };

  const handleFilterChange = (newFilters: AssignmentFilters) => {
    console.log('📊 Filter change in parent:', {
      newFilters,
      previousFilters: filters
    });
    
    setFilters(newFilters);
    setSelectedAssignments([]);
    
    // Force immediate data reload with new filters
    console.log('🔄 Triggering data reload with new filters...');
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'overview':
        return statistics.reduce((sum, stat) => sum + stat.total_assignments, 0);
      case 'manage':
        return assignments.length;
      default:
        return null;
    }
  };

  // Access control check
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <UsersIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You need admin privileges to access assignment management.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            setError(null);
            loadData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-6 h-6 text-primary-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Assignment Management
                </h1>
              </div>
              {refreshing && <LoadingSpinner size="sm" />}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Navigation Links */}
              <button
                onClick={() => window.location.href = '/employees'}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>Employee Selection</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/assignments/my'}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                <span>My Assignments</span>
              </button>

              {/* QuarterRangeSelector integration pending */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: BarChartIcon },
              { id: 'create', name: 'Create Assignments', icon: PlusIcon },
              { id: 'upload', name: 'Bulk Upload', icon: UploadIcon },
              { id: 'manage', name: 'Manage Assignments', icon: FilterIcon },
              { id: 'coverage', name: 'Coverage Tracking', icon: UsersIcon },
              { id: 'weights', name: 'Attribute Weights', icon: WeightsIcon },
              { id: 'debug', name: 'Debug', icon: DebugIcon }
            ].map((tab) => {
              const count = getTabCount(tab.id);
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className={`
                    -ml-0.5 mr-2 h-5 w-5 transition-colors
                    ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {tab.name}
                  {count !== null && (
                    <span className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                      ${isActive 
                        ? 'bg-primary-100 text-primary-600' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Assignment Management Dashboard</h2>
              <p className="text-gray-600 mt-2">Manage evaluation assignments and track completion progress</p>
            </div>

            {/* Completion Tracking Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 border-l-4 border-l-green-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignments.length > 0 ? Math.round((assignments.filter(a => a.status === 'completed').length / assignments.length) * 100) : 0}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {assignments.filter(a => a.status === 'completed').length}/{assignments.length} evaluations
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Self Evaluations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignments.filter(a => a.evaluation_type === 'self' && a.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-500">
                      of {assignments.filter(a => a.evaluation_type === 'self').length} assigned
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Manager Evaluations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignments.filter(a => a.evaluation_type === 'manager' && a.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-500">
                      of {assignments.filter(a => a.evaluation_type === 'manager').length} assigned
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Peer Evaluations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignments.filter(a => a.evaluation_type === 'peer' && a.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-500">
                      of {assignments.filter(a => a.evaluation_type === 'peer').length} assigned
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Completion Progress Bar */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Overall Completion Progress</h3>
                <span className="text-sm text-gray-500">
                  {assignments.filter(a => a.status === 'completed').length} of {assignments.length} evaluations completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${assignments.length > 0 ? Math.round((assignments.filter(a => a.status === 'completed').length / assignments.length) * 100) : 0}%` 
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>0%</span>
                <span>100% Complete</span>
              </div>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Total Assignments</h3>
                <p className="text-3xl font-bold text-blue-600">{assignments.length}</p>
              </Card>
              
              <Card className="p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">In Progress</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {assignments.filter(a => a.status === 'in_progress').length}
                </p>
              </Card>
              
              <Card className="p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pending</h3>
                <p className="text-3xl font-bold text-red-600">
                  {assignments.filter(a => a.status === 'pending').length}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Create Assignments Tab */}
        {activeTab === 'create' && (
          <div className="max-w-4xl mx-auto">
            <AssignmentCreationForm onAssignmentCreated={handleAssignmentCreated} />
          </div>
        )}

        {/* Bulk Upload Tab */}
        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Bulk Upload</h2>
              <p className="text-gray-600">Bulk assignment upload will be available here.</p>
              {/* <BulkAssignmentUpload onUploadComplete={handleAssignmentCreated} /> */}
            </div>
          </div>
        )}

        {/* Manage Assignments Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-medium text-gray-900">
                  All Assignments ({assignments.length})
                </h2>
                {selectedAssignments.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedAssignments.length} selected
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {selectedAssignments.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Delete Selected</span>
                  </Button>
                )}
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {/* Export functionality to be implemented */}}
                  className="flex items-center space-x-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>

            {/* Assignment Table */}
            <AssignmentStatusTable
              assignments={assignments}
              selectedAssignments={selectedAssignments}
              onSelectionChange={setSelectedAssignments}
              filters={filters}
              onFilterChange={handleFilterChange}
              onAssignmentUpdate={loadData}
              loading={loading}
            />
          </div>
        )}

        {/* Coverage Tracking Tab */}
        {activeTab === 'coverage' && (
          <div className="space-y-6">
            <CoverageDashboard onCreateAssignment={handleAssignmentCreated} />
          </div>
        )}

        {/* Attribute Weights Tab */}
        {activeTab === 'weights' && (
          <div className="space-y-6">
            <Suspense fallback={<LoadingSpinner message="Loading attribute weights manager..." />}>
              <LazyAttributeWeightsManager 
                onWeightsUpdated={() => {
                  // Optionally reload data or show success message
                  console.log('Attribute weights updated successfully');
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <AssignmentDebugger />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentManagement; 