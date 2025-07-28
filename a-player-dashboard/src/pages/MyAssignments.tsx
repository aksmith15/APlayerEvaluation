import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { 
  Card,
  Button,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  AssignmentCard
} from '../components/ui';
import { 
  fetchUserAssignments,
  getSurveyProgress 
} from '../services/assignmentService';
import type { 
  EvaluationAssignmentWithDetails,
  AssignmentStatus,
  EvaluationType 
} from '../types/database';

// Icon components
const ClipboardIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
  </svg>
);

const FilterIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
  </svg>
);

interface AssignmentFilters {
  status?: AssignmentStatus;
  evaluation_type?: EvaluationType;
  quarter_id?: string;
}

const MyAssignments: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const navigate = useNavigate();

  // State management
  const [assignments, setAssignments] = useState<EvaluationAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<AssignmentFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAssignments();
    }
  }, [user?.id, filters]);

  const loadAssignments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const assignmentsData = await fetchUserAssignments(user.id);
      
      // Apply local filters
      let filteredAssignments = assignmentsData;
      
      if (filters.status) {
        filteredAssignments = filteredAssignments.filter(a => a.status === filters.status);
      }
      if (filters.evaluation_type) {
        filteredAssignments = filteredAssignments.filter(a => a.evaluation_type === filters.evaluation_type);
      }
      if (filters.quarter_id) {
        filteredAssignments = filteredAssignments.filter(a => a.quarter_id === filters.quarter_id);
      }

      setAssignments(filteredAssignments);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAssignments();
    setRefreshing(false);
  };

  const handleStartEvaluation = (assignmentId: string, surveyToken: string) => {
    // Navigate to survey page
    navigate(`/survey/${surveyToken}`);
  };

  const handleFilterChange = (newFilters: AssignmentFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  // Calculate summary statistics
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    in_progress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    self_evaluations: assignments.filter(a => a.evaluation_type === 'self').length,
    peer_evaluations: assignments.filter(a => a.evaluation_type === 'peer').length,
    manager_evaluations: assignments.filter(a => a.evaluation_type === 'manager').length
  };

  // Group assignments by status for better organization
  const groupedAssignments = {
    pending: assignments.filter(a => a.status === 'pending'),
    in_progress: assignments.filter(a => a.status === 'in_progress'),
    completed: assignments.filter(a => a.status === 'completed')
  };

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
            loadAssignments();
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
                <ClipboardIcon className="w-6 h-6 text-primary-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  My Assignments
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

              {/* Assignment Management - Admin only */}
              {user?.jwtRole === 'super_admin' || user?.jwtRole === 'hr_admin' ? (
                <button
                  onClick={() => window.location.href = '/assignments/manage'}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>Assignment Management</span>
                </button>
              ) : null}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <FilterIcon className="w-4 h-4" />
                <span>Filters</span>
                {Object.keys(filters).length > 0 && (
                  <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                    {Object.keys(filters).length}
                  </span>
                )}
              </Button>
              
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange({ 
                    ...filters, 
                    status: e.target.value as AssignmentStatus || undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Evaluation Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evaluation Type
                </label>
                <select
                  value={filters.evaluation_type || ''}
                  onChange={(e) => handleFilterChange({ 
                    ...filters, 
                    evaluation_type: e.target.value as EvaluationType || undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="self">Self Evaluation</option>
                  <option value="peer">Peer Evaluation</option>
                  <option value="manager">Manager Evaluation</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-end space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearFilters}
                  className="flex-1"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Assignments</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </Card>
        </div>

        {/* Assignment Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Assignments Column */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h2 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              Pending ({groupedAssignments.pending.length})
            </h2>
            <div className="space-y-4">
              {groupedAssignments.pending.length > 0 ? (
                groupedAssignments.pending.map(assignment => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onStartEvaluation={handleStartEvaluation}
                    onRefresh={loadAssignments}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-orange-600 text-sm">
                  No pending assignments
                </div>
              )}
            </div>
          </div>

          {/* In Progress Assignments Column */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              In Progress ({groupedAssignments.in_progress.length})
            </h2>
            <div className="space-y-4">
              {groupedAssignments.in_progress.length > 0 ? (
                groupedAssignments.in_progress.map(assignment => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onStartEvaluation={handleStartEvaluation}
                    onRefresh={loadAssignments}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-blue-600 text-sm">
                  No assignments in progress
                </div>
              )}
            </div>
          </div>

          {/* Completed Assignments Column */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              Completed ({groupedAssignments.completed.length})
            </h2>
            <div className="space-y-4">
              {groupedAssignments.completed.length > 0 ? (
                groupedAssignments.completed.map(assignment => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onStartEvaluation={handleStartEvaluation}
                    onRefresh={loadAssignments}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-green-600 text-sm">
                  No completed assignments
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {assignments.length === 0 && (
          <EmptyState
            icon={<ClipboardIcon className="w-16 h-16 text-gray-300" />}
            title="No Assignments Found"
            message={
              Object.keys(filters).length > 0
                ? "No assignments match your current filters. Try adjusting your search criteria."
                : "You don't have any evaluation assignments at the moment. Check back later or contact your administrator."
            }
            action={
              Object.keys(filters).length > 0 
                ? {
                    label: "Clear Filters",
                    onClick: clearFilters
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
};

export default MyAssignments; 