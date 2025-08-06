/**
 * TopAnalyticsGrid Component
 * Two-card responsive grid layout for core group analytics
 * Left: CoreGroupPerformanceCard (bar chart + KPIs)
 * Right: EvaluationConsensusCard (radar chart + consensus metrics)
 */

import React from 'react';
import { CoreGroupPerformanceCard } from './CoreGroupPerformanceCard';
import { EvaluationConsensusCard } from './EvaluationConsensusCard';
import type { CoreGroupAnalyticsResponse } from '../../types/evaluation';

interface TopAnalyticsGridProps {
  data: CoreGroupAnalyticsResponse | null;
  isLoading?: boolean;
  error?: string | null;
  employeeName?: string;
  quarterName?: string;
}

export const TopAnalyticsGrid: React.FC<TopAnalyticsGridProps> = ({
  data,
  isLoading = false,
  error = null,
  employeeName = '',
  quarterName = ''
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full mb-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-secondary-800 mb-2">
            Strategic Performance Overview
          </h2>
          <p className="text-secondary-600">
            Core group analytics for strategic performance assessment
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loading skeleton for performance card */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-secondary-200 rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-secondary-200 rounded mb-6 w-1/2"></div>
              <div className="h-64 bg-secondary-200 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-16 bg-secondary-200 rounded w-24"></div>
                <div className="h-16 bg-secondary-200 rounded w-24"></div>
                <div className="h-16 bg-secondary-200 rounded w-24"></div>
              </div>
            </div>
          </div>

          {/* Loading skeleton for consensus card */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-secondary-200 rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-secondary-200 rounded mb-6 w-1/2"></div>
              <div className="h-64 bg-secondary-200 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-16 bg-secondary-200 rounded w-20"></div>
                <div className="h-16 bg-secondary-200 rounded w-20"></div>
                <div className="h-16 bg-secondary-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full mb-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-secondary-800 mb-2">
            Strategic Performance Overview
          </h2>
          <p className="text-secondary-600">
            Core group analytics for strategic performance assessment
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Unable to load core group analytics
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="w-full mb-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-secondary-800 mb-2">
            Strategic Performance Overview
          </h2>
          <p className="text-secondary-600">
            Core group analytics for strategic performance assessment
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No core group data available
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Core group analytics are not available for {employeeName} in {quarterName}.
                    This may be because evaluation data is incomplete or still being processed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state with data
  return (
    <div className="w-full mb-8">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-800 mb-2">
              Strategic Performance Overview
            </h2>
            <p className="text-secondary-600">
              Core group analytics for {data.metadata.evaluatee_name} • {data.metadata.quarter_name}
            </p>
          </div>
          
          {/* Core Group Legend */}
          <div className="hidden sm:flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-secondary-600">🎯 Competence</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-secondary-600">👥 Character</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-secondary-600">🚀 Curiosity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Card Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Core Group Performance */}
        <div className="lg:col-span-1">
          <CoreGroupPerformanceCard 
            data={data}
            className="h-full"
          />
        </div>

        {/* Right Card: Evaluation Consensus */}
        <div className="lg:col-span-1">  
          <EvaluationConsensusCard 
            data={data}
            className="h-full"
          />
        </div>
      </div>

      {/* Mobile Core Group Legend */}
      <div className="sm:hidden mt-4 flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-secondary-600">🎯 Competence</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-secondary-600">👥 Character</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
          <span className="text-secondary-600">🚀 Curiosity</span>
        </div>
      </div>

      {/* Data Quality Indicator */}
      {data && (
        <div className="mt-4 text-xs text-secondary-500 text-center">
          Last calculated: {new Date(data.metadata.calculated_at).toLocaleDateString()} • 
          Data from {data.metadata.quarter_start_date} to {data.metadata.quarter_end_date}
        </div>
      )}
    </div>
  );
};