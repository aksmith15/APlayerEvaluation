/**
 * Survey Introduction Component
 * Displays welcome message and assignment details to the evaluator
 */

import React from 'react';
import { Card, Button } from '../';
import type { EvaluationAssignmentWithDetails } from '../../../types/database';

interface SurveyIntroProps {
  assignment: EvaluationAssignmentWithDetails;
  onStartSurvey: () => void;
}

export const SurveyIntro: React.FC<SurveyIntroProps> = ({
  assignment,
  onStartSurvey
}) => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Performance Evaluation Survey
          </h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              Evaluation Details
            </h2>
            <div className="space-y-2 text-left">
              <p className="text-blue-800">
                <span className="font-medium">Evaluating:</span> {assignment.evaluatee_name}
              </p>
              <p className="text-blue-800">
                <span className="font-medium">Evaluation Type:</span> {assignment.evaluation_type}
              </p>
              <p className="text-blue-800">
                <span className="font-medium">Quarter:</span> {assignment.quarter_name}
              </p>
              <p className="text-blue-800">
                <span className="font-medium">Due Date:</span> {new Date(assignment.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mb-8 text-left">
            <h3 className="text-lg font-semibold text-secondary-900 mb-3">
              Survey Instructions
            </h3>
            <div className="space-y-3 text-secondary-700">
              <p>
                You will be evaluating <strong>{assignment.evaluatee_name}</strong> across 
                10 key performance attributes. This survey consists of two main phases:
              </p>
              
              <div className="pl-4 border-l-4 border-blue-200">
                <p className="font-medium text-blue-900">Phase 1: Base Questions</p>
                <p className="text-sm">
                  Answer 2 specific questions for each attribute to provide context for your scoring.
                </p>
              </div>
              
              <div className="pl-4 border-l-4 border-green-200">
                <p className="font-medium text-green-900">Phase 2: Scoring & Follow-up</p>
                <p className="text-sm">
                  Provide a numerical score (1-10) and answer conditional questions based on your score.
                </p>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Your progress will be automatically saved. You can close and 
                  return to complete the survey later using the same link.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-secondary-600">
              Estimated completion time: 15-25 minutes
            </p>
            
            <Button
              onClick={onStartSurvey}
              size="lg"
              className="px-8 py-3"
            >
              Start Evaluation
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
