/**
 * Survey Navigation Hook
 * Manages survey state, progress, and navigation logic
 */

import { useState, useEffect, useCallback } from 'react';
import { PERFORMANCE_ATTRIBUTES } from '../../../constants/attributes';
// import { COMPREHENSIVE_ATTRIBUTE_DEFINITIONS } from './constants-simple';
import type { 
  EvaluationAssignmentWithDetails,
  EnhancedSurveySession 
} from '../../../types/database';

type SurveyPhase = 'intro' | 'base_questions' | 'scoring' | 'conditional_questions' | 'complete';

interface SurveyNavigationState {
  currentPhase: SurveyPhase;
  currentAttributeIndex: number;
  currentScore: number | null;
  baseResponses: Record<string, Record<string, any>>;
  conditionalResponses: Record<string, Record<string, any>>;
  submissionId: string | null;
  session: EnhancedSurveySession | null;
}

interface SurveyNavigationActions {
  startSurvey: () => void;
  nextPhase: () => void;
  previousPhase: () => void;
  setScore: (score: number) => void;
  updateBaseResponse: (questionId: string, value: any) => void;
  updateConditionalResponse: (questionId: string, value: any) => void;
  saveSession: () => void;
  loadSession: () => void;
  resetSurvey: () => void;
}

export const useSurveyNavigation = (
  assignment: EvaluationAssignmentWithDetails | null,
  token: string | undefined
): SurveyNavigationState & SurveyNavigationActions => {
  
  const [state, setState] = useState<SurveyNavigationState>({
    currentPhase: 'intro',
    currentAttributeIndex: 0,
    currentScore: null,
    baseResponses: {},
    conditionalResponses: {},
    submissionId: null,
    session: null
  });

  const currentAttribute = PERFORMANCE_ATTRIBUTES[state.currentAttributeIndex];
  const isLastAttribute = state.currentAttributeIndex === PERFORMANCE_ATTRIBUTES.length - 1;

  // Save session to localStorage
  const saveSession = useCallback(() => {
    if (!token) return;

    const sessionData: EnhancedSurveySession = {
      assignment_id: assignment?.id || '',
      current_attribute: currentAttribute,
      current_attribute_index: state.currentAttributeIndex,
      current_score: state.currentScore || undefined,
      base_responses: state.baseResponses,
      conditional_responses: state.conditionalResponses,
      submission_id: state.submissionId || undefined,
      completed_attributes: [],
      start_time: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      is_complete: false
    };

    localStorage.setItem(`survey_session_${token}`, JSON.stringify(sessionData));
    setState(prev => ({ ...prev, session: sessionData }));
  }, [token, assignment?.id, state, currentAttribute]);

  // Load session from localStorage
  const loadSession = useCallback(() => {
    if (!token) return;

    const savedSession = localStorage.getItem(`survey_session_${token}`);
    if (savedSession) {
      try {
        const parsedSession: EnhancedSurveySession = JSON.parse(savedSession);
        setState(prev => ({
          ...prev,
          session: parsedSession,
          currentPhase: (parsedSession as any).current_phase || 'intro',
          currentAttributeIndex: parsedSession.current_attribute_index || 0,
          currentScore: parsedSession.current_score || null,
          baseResponses: parsedSession.base_responses || {},
          conditionalResponses: parsedSession.conditional_responses || {},
          submissionId: parsedSession.submission_id || null
        }));
      } catch (error) {
        console.error('Failed to load saved session:', error);
      }
    }
  }, [token]);

  // Auto-save session when state changes
  useEffect(() => {
    if (state.currentPhase !== 'intro') {
      saveSession();
    }
  }, [state, saveSession]);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const startSurvey = () => {
    setState(prev => ({ ...prev, currentPhase: 'base_questions' }));
  };

  const nextPhase = () => {
    setState(prev => {
      switch (prev.currentPhase) {
        case 'intro':
          return { ...prev, currentPhase: 'base_questions' };
          
        case 'base_questions':
          return { ...prev, currentPhase: 'scoring' };
          
        case 'scoring':
          return { ...prev, currentPhase: 'conditional_questions' };
          
        case 'conditional_questions':
          if (isLastAttribute) {
            return { ...prev, currentPhase: 'complete' };
          } else {
            return {
              ...prev,
              currentPhase: 'base_questions',
              currentAttributeIndex: prev.currentAttributeIndex + 1,
              currentScore: null
            };
          }
          
        default:
          return prev;
      }
    });
  };

  const previousPhase = () => {
    setState(prev => {
      switch (prev.currentPhase) {
        case 'base_questions':
          if (prev.currentAttributeIndex === 0) {
            return { ...prev, currentPhase: 'intro' };
          } else {
            return {
              ...prev,
              currentPhase: 'conditional_questions',
              currentAttributeIndex: prev.currentAttributeIndex - 1
            };
          }
          
        case 'scoring':
          return { ...prev, currentPhase: 'base_questions' };
          
        case 'conditional_questions':
          return { ...prev, currentPhase: 'scoring' };
          
        default:
          return prev;
      }
    });
  };

  const setScore = (score: number) => {
    setState(prev => ({ ...prev, currentScore: score }));
  };

  const updateBaseResponse = (questionId: string, value: any) => {
    setState(prev => ({
      ...prev,
      baseResponses: {
        ...prev.baseResponses,
        [currentAttribute]: {
          ...prev.baseResponses[currentAttribute],
          [questionId]: value
        }
      }
    }));
  };

  const updateConditionalResponse = (questionId: string, value: any) => {
    setState(prev => ({
      ...prev,
      conditionalResponses: {
        ...prev.conditionalResponses,
        [currentAttribute]: {
          ...prev.conditionalResponses[currentAttribute],
          [questionId]: value
        }
      }
    }));
  };

  const resetSurvey = () => {
    if (token) {
      localStorage.removeItem(`survey_session_${token}`);
    }
    setState({
      currentPhase: 'intro',
      currentAttributeIndex: 0,
      currentScore: null,
      baseResponses: {},
      conditionalResponses: {},
      submissionId: null,
      session: null
    });
  };

  return {
    ...state,
    startSurvey,
    nextPhase,
    previousPhase,
    setScore,
    updateBaseResponse,
    updateConditionalResponse,
    saveSession,
    loadSession,
    resetSurvey
  };
};
