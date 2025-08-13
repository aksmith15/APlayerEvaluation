/**
 * Mock SurveyIntro for testing
 * Simplified version for testing purposes
 */

import React from 'react';

interface Assignment {
  id: string;
  evaluatee_name: string;
  quarter_name: string;
  created_at: string;
}

interface SurveyIntroProps {
  assignment: Assignment | null;
  onStart: () => void;
}

export const SurveyIntro: React.FC<SurveyIntroProps> = ({ assignment, onStart }) => {
  if (!assignment) {
    return <div>No assignment data available</div>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div>
      <h1>Employee Evaluation Survey</h1>
      
      <div>
        <p>You are evaluating: <strong>{assignment.evaluatee_name}</strong></p>
        <p>Quarter: <strong>{assignment.quarter_name}</strong></p>
        <p>Created: {formatDate(assignment.created_at)}</p>
      </div>

      <div>
        <p>Please provide honest and constructive feedback.</p>
        <p>This evaluation will take approximately 15-20 minutes to complete.</p>
      </div>

      <div>
        <span>Step 1 of 5: </span>
        <span>Introduction</span>
      </div>

      <button type="button" onClick={onStart}>
        Start Survey
      </button>
    </div>
  );
};
