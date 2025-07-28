import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import type { 
  EvaluationAssignmentWithDetails, 
  EvaluationType,
  AssignmentStatus 
} from '../../types/database';

// Icon components
const FilterIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
  </svg>
);

interface AssignmentFilters {
  quarter_id?: string;
  evaluation_type?: EvaluationType;
  status?: AssignmentStatus;
  search?: string;
}

interface AssignmentStatusTableProps {
  assignments: EvaluationAssignmentWithDetails[];
  selectedAssignments: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  filters: AssignmentFilters; // Pass current filters down from parent
  onFilterChange: (filters: AssignmentFilters) => void;
  onAssignmentUpdate: () => void;
  loading?: boolean;
}

export const AssignmentStatusTable: React.FC<AssignmentStatusTableProps> = ({
  assignments,
  selectedAssignments,
  onSelectionChange,
  filters, // Use filters from parent - single source of truth
  onFilterChange,
  onAssignmentUpdate,
  loading = false
}) => {
  const [sortField, setSortField] = useState<keyof EvaluationAssignmentWithDetails>('assigned_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get unique filter options from assignments
  const quarters = Array.from(new Set(assignments.map(a => ({ id: a.quarter_id, name: a.quarter_name }))))
    .filter((q, index, self) => self.findIndex(quarter => quarter.id === q.id) === index);
  
  const evaluationTypes: EvaluationType[] = ['peer', 'manager', 'self'];
  const statuses: AssignmentStatus[] = ['pending', 'in_progress', 'completed'];

  // Apply filters and sorting
  const filteredAndSortedAssignments = React.useMemo(() => {
    let filtered = assignments;

    // Apply filters
    if (filters.quarter_id) {
      filtered = filtered.filter(a => a.quarter_id === filters.quarter_id);
    }
    if (filters.evaluation_type) {
      filtered = filtered.filter(a => a.evaluation_type === filters.evaluation_type);
    }
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(a => 
        a.evaluator_name.toLowerCase().includes(searchTerm) ||
        a.evaluatee_name.toLowerCase().includes(searchTerm) ||
        a.evaluator_email.toLowerCase().includes(searchTerm) ||
        a.evaluatee_email.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

      // Handle date fields
      if (sortField === 'assigned_at' || sortField === 'completed_at') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [assignments, filters, sortField, sortDirection]);

  const handleFilterChange = (newFilters: Partial<AssignmentFilters>) => {
    const updatedFilters = { ...filters };
    
    // Update filters, removing any that are set to undefined or empty string
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        delete updatedFilters[key as keyof AssignmentFilters];
      } else {
        updatedFilters[key as keyof AssignmentFilters] = value as any;
      }
    });
    
    console.log('🔄 Filter change in table:', {
      newFilters,
      updatedFilters,
      previousFilters: filters
    });
    
    // Let parent handle the state - single source of truth
    onFilterChange(updatedFilters);
  };

  const handleSort = (field: keyof EvaluationAssignmentWithDetails) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedAssignments.length === filteredAndSortedAssignments.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredAndSortedAssignments.map(a => a.id));
    }
  };

  const handleSelectAssignment = (assignmentId: string) => {
    if (selectedAssignments.includes(assignmentId)) {
      onSelectionChange(selectedAssignments.filter(id => id !== assignmentId));
    } else {
      onSelectionChange([...selectedAssignments, assignmentId]);
    }
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getEvaluationTypeBadge = (type: EvaluationType) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (type) {
      case 'self':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'peer':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'manager':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSurveyUrl = (surveyToken: string) => {
    return `/survey/${surveyToken}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4 mb-4">
          <FilterIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Search evaluators/evaluatees..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Quarter Filter */}
          <div>
            <label htmlFor="quarter" className="block text-xs font-medium text-gray-700 mb-1">
              Quarter
            </label>
            <select
              id="quarter"
              value={filters.quarter_id || ''}
              onChange={(e) => handleFilterChange({ quarter_id: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Quarters</option>
              {quarters.map(quarter => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name}
                </option>
              ))}
            </select>
          </div>

          {/* Evaluation Type Filter */}
          <div>
            <label htmlFor="evaluation-type" className="block text-xs font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="evaluation-type"
              value={filters.evaluation_type || ''}
              onChange={(e) => handleFilterChange({ evaluation_type: e.target.value as EvaluationType || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Types</option>
              {evaluationTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange({ status: e.target.value as AssignmentStatus || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {Object.keys(filters).some(key => filters[key as keyof AssignmentFilters]) && (
          <div className="mt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                console.log('🧹 Clearing all filters');
                onFilterChange({});
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredAndSortedAssignments.length === 0 ? (
        <EmptyState
          title="No assignments found"
          message="No assignments match your current filters."
          icon={<FilterIcon className="w-12 h-12 text-gray-400" />}
        />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAssignments.length === filteredAndSortedAssignments.length && filteredAndSortedAssignments.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('evaluator_name')}
                  >
                    Evaluator
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('evaluatee_name')}
                  >
                    Evaluatee
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('evaluation_type')}
                  >
                    Type
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('quarter_name')}
                  >
                    Quarter
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('assigned_at')}
                  >
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedAssignments.includes(assignment.id)}
                        onChange={() => handleSelectAssignment(assignment.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.evaluator_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.evaluator_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.evaluatee_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.evaluatee_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getEvaluationTypeBadge(assignment.evaluation_type)}>
                        {assignment.evaluation_type.charAt(0).toUpperCase() + assignment.evaluation_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.quarter_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(assignment.status)}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(assignment.assigned_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ width: `${assignment.progress_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {assignment.progress_percentage || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {assignment.status !== 'completed' && (
                          <a
                            href={getSurveyUrl(assignment.survey_token)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                          >
                            <ExternalLinkIcon className="w-4 h-4" />
                            <span>Survey</span>
                          </a>
                        )}
                        {assignment.status === 'completed' && (
                          <span className="flex items-center space-x-1 text-green-600">
                            <CheckIcon className="w-4 h-4" />
                            <span>Complete</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedAssignments.length} of {assignments.length} assignments
      </div>
    </div>
  );
}; 