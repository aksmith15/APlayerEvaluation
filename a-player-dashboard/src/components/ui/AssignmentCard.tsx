import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { getSurveyProgress, updateAssignmentStatus } from '../../services/assignmentService';
import type { EvaluationAssignmentWithDetails, SurveyProgress } from '../../types/database';

interface AssignmentCardProps {
  assignment: EvaluationAssignmentWithDetails;
  onStartEvaluation: (assignmentId: string, surveyToken: string) => void;
  onRefresh: () => void;
}

// Icon components
const UserIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onStartEvaluation,
  onRefresh
}) => {
  const [progress, setProgress] = useState<SurveyProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (assignment.status === 'in_progress' || assignment.status === 'completed') {
      loadProgress();
    }
  }, [assignment.id, assignment.status]);

  const loadProgress = async () => {
    try {
      setLoadingProgress(true);
      const progressData = await getSurveyProgress(assignment.id);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading survey progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleStartEvaluation = async () => {
    try {
      setLoadingAction(true);
      
      // Update status to in_progress if currently pending
      if (assignment.status === 'pending') {
        await updateAssignmentStatus(assignment.id, 'in_progress');
        onRefresh();
      }
      
      // Start the evaluation
      onStartEvaluation(assignment.id, assignment.survey_token);
    } catch (error) {
      console.error('Error starting evaluation:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  // Determine card variant based on evaluation type
  const getCardVariant = () => {
    if (assignment.evaluation_type === 'self') {
      return 'self-evaluation';
    }
    return 'evaluate-others';
  };

  // Get card styling based on variant
  const getCardStyling = () => {
    const variant = getCardVariant();
    
    const baseClasses = "bg-white border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg";
    
    if (variant === 'self-evaluation') {
      return `${baseClasses} border-l-4 border-l-blue-500 hover:border-l-blue-600 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100`;
    } else {
      return `${baseClasses} border-l-4 border-l-green-500 hover:border-l-green-600 bg-gradient-to-r from-green-50 to-white hover:from-green-100`;
    }
  };

  // Get status badge styling
  const getStatusBadge = () => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (assignment.status) {
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

  // Get evaluation type badge styling
  const getTypeBadge = () => {
    const variant = getCardVariant();
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    if (variant === 'self-evaluation') {
      return `${baseClasses} bg-blue-100 text-blue-800`;
    } else {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
  };

  // Format evaluation type for display
  const getEvaluationTypeLabel = () => {
    switch (assignment.evaluation_type) {
      case 'self':
        return 'Self Evaluation';
      case 'peer':
        return 'Peer Evaluation';
      case 'manager':
        return 'Manager Evaluation';
      default:
        return assignment.evaluation_type;
    }
  };

  // Get action button
  const getActionButton = () => {
    if (assignment.status === 'completed') {
      return (
        <Button
          variant="secondary"
          size="sm"
          className="w-full flex items-center justify-center space-x-2"
          disabled
        >
          <CheckCircleIcon className="w-4 h-4" />
          <span>Completed</span>
        </Button>
      );
    }

    if (assignment.status === 'in_progress') {
      return (
        <Button
          variant="primary"
          size="sm"
          onClick={handleStartEvaluation}
          disabled={loadingAction}
          className="w-full flex items-center justify-center space-x-2"
        >
          {loadingAction ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <PlayIcon className="w-4 h-4" />
              <span>Continue</span>
            </>
          )}
        </Button>
      );
    }

    return (
      <Button
        variant="primary"
        size="sm"
        onClick={handleStartEvaluation}
        disabled={loadingAction}
        className="w-full flex items-center justify-center space-x-2"
      >
        {loadingAction ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <PlayIcon className="w-4 h-4" />
            <span>Start Evaluation</span>
          </>
        )}
      </Button>
    );
  };

  return (
    <div className={getCardStyling()}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={getTypeBadge()}>
              {getEvaluationTypeLabel()}
            </span>
            <span className={getStatusBadge()}>
              {assignment.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <h3 className="text-base font-medium text-gray-900 mb-1">
            {assignment.evaluation_type === 'self' 
              ? 'Your Self Evaluation'
              : `Evaluate ${assignment.evaluatee_name}`
            }
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-3">
        {/* Evaluatee Info (for non-self evaluations) */}
        {assignment.evaluation_type !== 'self' && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <UserIcon className="w-4 h-4" />
            <span>{assignment.evaluatee_name}</span>
            {assignment.evaluatee_department && (
              <span className="text-gray-400">• {assignment.evaluatee_department}</span>
            )}
          </div>
        )}

        {/* Quarter Info */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>{assignment.quarter_name}</span>
        </div>

        {/* Assignment Date */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ClockIcon className="w-4 h-4" />
          <span>Assigned {new Date(assignment.assigned_at).toLocaleDateString()}</span>
        </div>

        {/* Progress */}
        {(assignment.status === 'in_progress' || assignment.status === 'completed') && (
          <div className="space-y-1.5">
            {loadingProgress ? (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <LoadingSpinner size="sm" />
                <span>Loading progress...</span>
              </div>
            ) : progress ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {progress.completed_attributes}/{progress.total_attributes} attributes
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      getCardVariant() === 'self-evaluation' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${progress.percentage_complete}%` }}
                  />
                </div>
                
                <div className="text-xs text-gray-500">
                  {progress.percentage_complete}% complete
                  {progress.current_attribute && (
                    <span> • Next: {progress.current_attribute.replace('_', ' ')}</span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Completion Info */}
        {assignment.status === 'completed' && assignment.completed_at && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircleIcon className="w-4 h-4 text-green-600" />
            <span>Completed {new Date(assignment.completed_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-3 border-t border-gray-200">
        {getActionButton()}
      </div>
    </div>
  );
}; 