/**
 * Overview Tab Component
 * Displays assignment statistics and overview information
 */

import React from 'react';
import { Card } from '../Card';
import { Button } from '../Button';

// Temporary interface until AssignmentStatistics is properly exported
interface AssignmentStatistics {
  quarter_name: string;
  total_assignments: number;
  completed_assignments: number;
  status: string;
}

interface OverviewTabProps {
  statistics: AssignmentStatistics[];
  loading: boolean;
  onNavigateToManage: () => void;
}

// Icon components
const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

export const OverviewTab: React.FC<OverviewTabProps> = ({
  statistics,
  loading,
  onNavigateToManage
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-8 h-8 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-8 h-8 text-orange-500" />;
      case 'in_progress':
        return <CalendarIcon className="w-8 h-8 text-blue-500" />;
      default:
        return <UsersIcon className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const totalAssignments = statistics.reduce((sum, stat) => sum + stat.total_assignments, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Assignment Overview</h1>
          <div className="animate-pulse">
            <div className="h-4 bg-secondary-200 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <div className="p-6 animate-pulse">
                <div className="h-8 bg-secondary-200 rounded w-8 mb-4"></div>
                <div className="h-4 bg-secondary-200 rounded w-full mb-2"></div>
                <div className="h-6 bg-secondary-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-secondary-900 mb-4">Assignment Overview</h1>
        <p className="text-secondary-600 mb-6">
          Manage evaluation assignments across quarters and track completion status
        </p>
        
        {/* Total Count */}
        <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full">
          <UsersIcon className="w-5 h-5" />
          <span className="font-medium">
            {totalAssignments} Total Assignment{totalAssignments !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statistics.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                {getStatusIcon(stat.status)}
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(stat.status)}`}>
                  {formatStatusLabel(stat.status)}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                {stat.quarter_name}
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Total Assignments:</span>
                  <span className="font-medium text-secondary-900">{stat.total_assignments}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Completion Rate:</span>
                  <span className="font-medium text-secondary-900">
                    {stat.total_assignments > 0 
                      ? Math.round((stat.completed_assignments / stat.total_assignments) * 100)
                      : 0}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-secondary-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stat.total_assignments > 0 
                        ? (stat.completed_assignments / stat.total_assignments) * 100
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      {totalAssignments > 0 && (
        <div className="text-center">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={onNavigateToManage}
                  className="w-full sm:w-auto"
                >
                  Manage All Assignments
                </Button>
                <p className="text-sm text-secondary-600">
                  View, filter, and manage assignment details and completion status
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {totalAssignments === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No Assignments Yet</h3>
          <p className="text-secondary-600 mb-6">
            Create your first evaluation assignments to get started
          </p>
        </div>
      )}
    </div>
  );
};
