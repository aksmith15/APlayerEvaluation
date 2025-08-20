import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Card,
  Button,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  AssignmentCard
} from '../components/ui';
import { Page } from '../components/layout';
import { 
  fetchUserAssignments
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
  const navigate = useNavigate();
  const location = useLocation();

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

  // Auto-refresh when page gains focus (user comes back from survey)
  useEffect(() => {
    const handleFocus = () => {
      console.log('📱 MyAssignments page gained focus - refreshing data');
      if (user?.id && !loading) {
        loadAssignments();
      }
    };

    // Add focus listener
    window.addEventListener('focus', handleFocus);
    
    // Add visibility change listener (tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id && !loading) {
        console.log('👁️ MyAssignments tab became visible - refreshing data');
        loadAssignments();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup listeners
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, loading]);

  // Auto-refresh when navigating to this page (from React Router)
  useEffect(() => {
    console.log('🧭 Navigated to MyAssignments - refreshing data');
    if (user?.id && !loading) {
      loadAssignments();
    }
  }, [location.pathname, location.search]); // Trigger when URL path or query params change

  // Special handling for survey completion redirect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('completed') === 'true') {
      console.log('🎉 Survey completed! Force refreshing assignments...');
      if (user?.id) {
        // Wait a brief moment for database to propagate, then refresh
        setTimeout(() => {
          loadAssignments();
        }, 500);
      }
      
      // Clean up URL by removing the completed parameter
      searchParams.delete('completed');
      const newSearch = searchParams.toString();
      const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
      navigate(newUrl, { replace: true });
    }
  }, [location.search, user?.id, navigate, location.pathname]);

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

  const handleStartEvaluation = (_assignmentId: string, surveyToken: string) => {
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

  const subNav = (
    <>
      {/* Left: Page Title and Controls */}
      <span className="text-sm font-medium text-slate-900 whitespace-nowrap">My Assignments</span>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`
          px-2 py-1.5 text-slate-600 hover:text-slate-900 transition-colors text-sm whitespace-nowrap
          ${showFilters ? 'font-medium text-slate-900 underline underline-offset-4' : ''}
        `}
      >
        Filters
        {Object.keys(filters).length > 0 && (
          <span className="ml-1 text-xs bg-slate-200 text-slate-700 px-1 rounded">
            {Object.keys(filters).length}
          </span>
        )}
      </button>
      
      {/* Right: Page Actions */}
      <div className="ml-auto flex items-center gap-2">
        {refreshing && <LoadingSpinner size="sm" />}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8 px-2 text-xs"
          title="Refresh"
        >
          <RefreshIcon className={`w-3.5 h-3.5 mr-1 hidden sm:inline ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </>
  );

  return (
    <Page subNav={subNav}>
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-6">
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
    </Page>
  );
};

export default MyAssignments; 