import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { checkAnalysisJobStatus } from '../../services/dataFetching';
import type { AnalysisJob } from '../../types/database';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Card } from './Card';

interface AnalysisJobManagerProps {
  evaluateeId?: string;
  onJobSelect?: (jobId: string) => void;
  showAllJobs?: boolean;
}

// Helper function to get progress percentage based on status
const getProgressPercentage = (status: AnalysisJob['status']): number => {
  switch (status) {
    case 'completed': return 100;
    case 'processing': return 50;
    case 'pending': return 10;
    case 'error': return 0;
    default: return 0;
  }
};

export const AnalysisJobManager: React.FC<AnalysisJobManagerProps> = ({
  evaluateeId,
  onJobSelect,
  showAllJobs = false
}) => {
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState<string[]>([]);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      let query = supabase
        .from('analysis_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!showAllJobs && evaluateeId) {
        query = query.eq('evaluatee_id', evaluateeId);
      }

      const { data, error: fetchError } = await query.limit(20);

      if (fetchError) {
        throw fetchError;
      }

      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching analysis jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis jobs');
    } finally {
      setLoading(false);
    }
  }, [evaluateeId, showAllJobs]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const refreshJobStatus = async (jobId: string) => {
    try {
      setRefreshing(prev => [...prev, jobId]);
      const result = await checkAnalysisJobStatus(jobId);
      
      // Update the job in our local state
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: result.status,
              // progress: result.progress || 0, // Progress not available in current implementation
              stage: result.stage || '',
              pdf_url: result.url || job.pdf_url,
              error_message: result.error || job.error_message,
              updated_at: new Date().toISOString()
            }
          : job
      ));
    } catch (err) {
      console.error('Error refreshing job status:', err);
    } finally {
      setRefreshing(prev => prev.filter(id => id !== jobId));
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-secondary-600">Loading analysis jobs...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorMessage 
          message={error}
          onRetry={fetchJobs}
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-800">
          Analysis Jobs {evaluateeId ? '(This Employee)' : '(All)'}
        </h3>
        <button
          onClick={fetchJobs}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-8 text-secondary-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No analysis jobs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div 
              key={job.id}
              className="border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span 
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(job.status)}`}
                  >
                    {job.status}
                  </span>
                                      {job.status === 'processing' && (
                      <span className="text-xs text-secondary-600">
                        {getProgressPercentage(job.status)}%
                      </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-secondary-500">
                    {formatTimeAgo(job.updated_at)}
                  </span>
                  <button
                    onClick={() => refreshJobStatus(job.id)}
                    disabled={refreshing.includes(job.id)}
                    className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
                  >
                    {refreshing.includes(job.id) ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {/* Progress bar for processing jobs */}
              {job.status === 'processing' && (
                <div className="mb-2">
                  <div className="w-full bg-secondary-200 rounded-full h-1.5">
                                          <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(job.status)}%` }}
                      ></div>
                  </div>
                </div>
              )}

              {/* Job details */}
              <div className="text-sm text-secondary-600 mb-2">
                <div>ID: <span className="font-mono text-xs">{job.id}</span></div>
                {job.stage && (
                  <div>Stage: <span className="font-medium">{job.stage}</span></div>
                )}
              </div>

              {/* Error message */}
              {job.error_message && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200 mb-2">
                  {job.error_message}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-secondary-500">
                  Created: {new Date(job.created_at).toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  {job.pdf_url && (
                    <a
                      href={job.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View PDF
                    </a>
                  )}
                  {onJobSelect && (
                    <button
                      onClick={() => onJobSelect(job.id)}
                      className="text-xs text-secondary-600 hover:text-secondary-700 font-medium"
                    >
                      Select
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}; 