/**
 * Mock OverviewTab for testing
 * Simplified version for testing purposes
 */

import React from 'react';

interface AssignmentStatistics {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  completion_rate: number;
  average_completion_time: number;
}

interface OverviewTabProps {
  assignmentStats: AssignmentStatistics | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ assignmentStats }) => {
  if (!assignmentStats) {
    return <div>Loading assignment statistics...</div>;
  }

  if (assignmentStats.total === 0) {
    return <div>No assignments found</div>;
  }

  return (
    <div>
      <h2>Assignment Overview</h2>
      
      <div className="stats-grid">
        <div aria-label="Total assignments">
          <span>Total: </span>
          <span>{assignmentStats.total.toLocaleString()}</span>
        </div>
        
        <div data-testid="pending-count" className="pending">
          <span>Pending: </span>
          <span>{assignmentStats.pending}</span>
        </div>
        
        <div>
          <span>In Progress: </span>
          <span>{assignmentStats.in_progress}</span>
        </div>
        
        <div data-testid="completed-count" className="success">
          <span>Completed: </span>
          <span>{assignmentStats.completed}</span>
        </div>
        
        <div data-testid="overdue-count" className="danger" data-status="overdue">
          <span>Overdue: </span>
          <span>{assignmentStats.overdue}</span>
        </div>
      </div>

      <div>
        <span>Completion Rate: </span>
        <span>{assignmentStats.completion_rate}%</span>
      </div>

      <div>
        <span>Average Completion Time: </span>
        <span>{assignmentStats.average_completion_time} days</span>
      </div>

      <div data-testid="status-distribution-chart">
        Status Distribution Chart
      </div>

      <div>
        <h3>Completion Trend</h3>
        <p>Showing completion trends over time</p>
      </div>
    </div>
  );
};


