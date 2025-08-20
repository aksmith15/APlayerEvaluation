import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CompanyProvider, useCompany } from '../contexts/CompanyContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Page } from '../components/layout';
import { ManagerDashboardNav } from '../components/ui/ManagerDashboardNav';

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
const LazyInviteManager = React.lazy(() => 
  import('../components/ui/InviteManager').then(module => ({ default: module.InviteManager }))
);
const LazyDebugInviteTest = React.lazy(() => 
  import('../components/ui/DebugInviteTest').then(module => ({ default: module.DebugInviteTest }))
);

import { 
  fetchAllAssignments, 
  deleteBulkAssignments 
} from '../services/assignmentService';
import type { 
  EvaluationAssignmentWithDetails, 
  EvaluationType,
  AssignmentStatus 
} from '../types/database';

// Icon components (inline SVG)
const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
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
  company_id?: string;
}

const AssignmentManagementContent: React.FC = () => {
  const { user } = useAuth();
  const { selectedCompanyId, companies, loading: companyLoading } = useCompany();

  // State management
  const [assignments, setAssignments] = useState<EvaluationAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'upload' | 'manage' | 'coverage' | 'weights' | 'invitations' | 'debug'>('overview');
  const [filters, setFilters] = useState<AssignmentFilters>({});


  // Check admin permissions
  const isAdmin = user?.jwtRole === 'super_admin' || user?.jwtRole === 'hr_admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    // Only load data if we have a company selected (or company loading is complete)
    if (!companyLoading && selectedCompanyId) {
      console.log('🔄 useEffect triggered - loading data with filters:', filters, 'for company:', selectedCompanyId);
      loadData();
    }
  }, [isAdmin, filters, selectedCompanyId, companyLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Fetching assignments with filters:', filters, 'for company:', selectedCompanyId);
      const filtersWithCompany = { ...filters, company_id: selectedCompanyId || undefined };
      const assignmentsData = await fetchAllAssignments(filtersWithCompany);

      console.log('✅ Data loaded:', {
        assignmentsCount: assignmentsData.length,
        filtersApplied: Object.keys(filters).length > 0 ? filters : 'none'
      });

      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Error loading assignment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignment data');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
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

  // Show company selection required message
  if (!companyLoading && !selectedCompanyId) {
    return (
      <Page>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Company to Manage Assignments</h2>
            <p className="text-gray-600 mb-6">
              Choose a company from the header dropdown to view and manage assignments, invitations, and settings.
            </p>
            <div className="text-sm text-gray-500">
              {companies.length > 0 ? (
                <p>Available companies: {companies.map((c: any) => c.name).join(', ')}</p>
              ) : (
                <p>Loading companies...</p>
              )}
            </div>
          </div>
        </div>
      </Page>
    );
  }

  const subNav = (
    <div className="flex items-center justify-center w-full relative">
      {/* Centered Manager Dashboard Navigation */}
      <div className="flex-1 flex justify-center">
        <ManagerDashboardNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
        />
      </div>
      
      {/* Right: Minimal Company Info */}
      <div className="absolute right-0 flex items-center">
        {selectedCompanyId && (
          <span className="text-xs text-slate-400 hidden lg:inline whitespace-nowrap">
            {companies.find((c: any) => c.id === selectedCompanyId)?.name || 'Company'}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Page subNav={subNav}>
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-6 md:space-y-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
              <p className="text-slate-600 mt-2">Track completion progress and assignment statistics</p>
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

        {/* Company Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-6">
            <Suspense fallback={<LoadingSpinner message="Loading invite manager..." />}>
              <LazyInviteManager />
            </Suspense>
          </div>
        )}

        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <AssignmentDebugger />
            
            {/* Debug Invite Function Test */}
            <Suspense fallback={<LoadingSpinner message="Loading debug test..." />}>
              <LazyDebugInviteTest />
            </Suspense>
          </div>
        )}
      </div>
    </Page>
  );
};

// Wrapper component with CompanyProvider
const AssignmentManagement: React.FC = () => {
  return (
    <CompanyProvider>
      <AssignmentManagementContent />
    </CompanyProvider>
  );
};

export default AssignmentManagement; 