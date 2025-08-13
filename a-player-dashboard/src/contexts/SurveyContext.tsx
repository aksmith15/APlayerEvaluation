/**
 * Survey Context
 * Eliminates prop drilling by providing survey state and navigation through context
 */

import React, { createContext, useContext } from 'react';
// import { useSurveyNavigation } from '../components/ui/survey/useSurveyNavigation';
import type { EvaluationAssignmentWithDetails } from '../types/database';

type SurveyPhase = 'intro' | 'base_questions' | 'scoring' | 'conditional_questions' | 'complete';

interface SurveyContextType {
  // Navigation state
  currentPhase: SurveyPhase;
  currentAttributeIndex: number;
  currentScore: number | null;
  
  // Data state
  baseResponses: Record<string, Record<string, any>>;
  conditionalResponses: Record<string, Record<string, any>>;
  submissionId: string | null;
  
  // Navigation actions
  startSurvey: () => void;
  nextPhase: () => void;
  previousPhase: () => void;
  
  // Data actions
  setScore: (score: number) => void;
  updateBaseResponse: (questionId: string, value: any) => void;
  updateConditionalResponse: (questionId: string, value: any) => void;
  
  // Session management
  saveSession: () => void;
  loadSession: () => void;
  resetSurvey: () => void;
  
  // Helper properties
  isFirstAttribute: boolean;
  isLastAttribute: boolean;
  totalAttributes: number;
  currentAttribute: string;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

interface SurveyProviderProps {
  children: React.ReactNode;
  assignment: EvaluationAssignmentWithDetails | null;
  token: string | undefined;
}

export const SurveyProvider: React.FC<SurveyProviderProps> = ({ 
  children, 
  assignment: _assignment, 
  token: _token 
}) => {
  // Simplified implementation - would need to integrate with actual survey navigation
  const value: SurveyContextType = {
    currentPhase: 'intro',
    currentAttributeIndex: 0,
    currentScore: null,
    baseResponses: {},
    conditionalResponses: {},
    submissionId: null,
    startSurvey: () => {},
    nextPhase: () => {},
    previousPhase: () => {},
    setScore: () => {},
    updateBaseResponse: () => {},
    updateConditionalResponse: () => {},
    saveSession: () => {},
    loadSession: () => {},
    resetSurvey: () => {},
    isFirstAttribute: true,
    isLastAttribute: false,
    totalAttributes: 10,
    currentAttribute: 'Attribute 1'
  };

  return (
    <SurveyContext.Provider value={value}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurveyContext = (): SurveyContextType => {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error('useSurveyContext must be used within a SurveyProvider');
  }
  return context;
};

// Convenience hooks for specific survey concerns
export const useSurveyNavigationState = () => {
  const context = useSurveyContext();
  return {
    currentPhase: context.currentPhase,
    currentAttributeIndex: context.currentAttributeIndex,
    isFirstAttribute: context.isFirstAttribute,
    isLastAttribute: context.isLastAttribute,
    totalAttributes: context.totalAttributes,
    startSurvey: context.startSurvey,
    nextPhase: context.nextPhase,
    previousPhase: context.previousPhase
  };
};

export const useSurveyData = () => {
  const context = useSurveyContext();
  return {
    currentScore: context.currentScore,
    baseResponses: context.baseResponses,
    conditionalResponses: context.conditionalResponses,
    submissionId: context.submissionId,
    setScore: context.setScore,
    updateBaseResponse: context.updateBaseResponse,
    updateConditionalResponse: context.updateConditionalResponse
  };
};

export const useSurveySession = () => {
  const context = useSurveyContext();
  return {
    saveSession: context.saveSession,
    loadSession: context.loadSession,
    resetSurvey: context.resetSurvey
  };
};
