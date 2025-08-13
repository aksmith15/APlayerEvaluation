/**
 * Manage Tab Component
 * Assignment management interface with bulk operations
 */

import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { AssignmentStatusTable } from '../AssignmentStatusTable';
import type { 
  EvaluationAssignmentWithDetails
} from '../../../types/database';

// Removed unused interface to fix TypeScript error

interface ManageTabProps {
  assignments: EvaluationAssignmentWithDetails[];
  loading: boolean;
  filters: any; // Temporary fix for type conflicts
  onFilterChange: (filters: any) => void;
  onBulkDelete: (assignmentIds: string[]) => Promise<void>;
  onAssignmentUpdate: () => void;
}

const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
  </svg>
);

export const ManageTab: React.FC<ManageTabProps> = ({
  assignments,
  loading,
  filters,
  onFilterChange,
  onBulkDelete,
  onAssignmentUpdate
}) => {
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedAssignments.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedAssignments.length} assignment${selectedAssignments.length > 1 ? 's' : ''}? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    setDeletingBulk(true);
    try {
      await onBulkDelete(selectedAssignments);
      setSelectedAssignments([]);
    } catch (error) {
      console.error('Failed to delete assignments:', error);
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleRefresh = () => {
    onAssignmentUpdate();
  };

  const getSelectionSummary = () => {
    if (selectedAssignments.length === 0) return 'No assignments selected';
    if (selectedAssignments.length === 1) return '1 assignment selected';
    return `${selectedAssignments.length} assignments selected`;
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-secondary-900">
            Manage Assignments
          </h2>
          <span className="text-sm text-secondary-600">
            ({assignments.length} total)
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedAssignments.length > 0 && (
        <Card>
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-900">
                  {getSelectionSummary()}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deletingBulk}
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  {deletingBulk ? 'Deleting...' : 'Delete Selected'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAssignments([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Assignment Table */}
      <Card>
        <div className="p-6">
          <AssignmentStatusTable
            assignments={assignments}
            selectedAssignments={selectedAssignments}
            onSelectionChange={setSelectedAssignments}
            filters={filters}
            onFilterChange={onFilterChange}
            onAssignmentUpdate={onAssignmentUpdate}
            loading={loading}
          />
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-sm text-secondary-600">Completed</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {assignments.filter(a => a.status === 'in_progress').length}
            </div>
            <div className="text-sm text-secondary-600">In Progress</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {assignments.filter(a => a.status === 'pending').length}
            </div>
            <div className="text-sm text-secondary-600">Pending</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
