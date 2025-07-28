/**
 * Evaluation Data Service
 * Functions to check evaluation data availability for employees and quarters
 */

import { supabase } from './supabase';
import { getCurrentQuarter } from '../utils/quarterUtils';

export interface QuarterDataStatus {
  quarterId: string;
  quarterName: string;
  hasData: boolean;
  hasSelf: boolean;
  hasPeer: boolean;
  hasManager: boolean;
  dataTypes: ('self' | 'peer' | 'manager')[];
}

/**
 * Check if evaluation data exists for a specific employee in the current quarter
 */
export const checkCurrentQuarterDataAvailability = async (
  employeeId: string
): Promise<QuarterDataStatus | null> => {
  try {
    // Get current quarter info
    const _currentQuarter = getCurrentQuarter();
    
    // Find the quarter record in database that matches current quarter
    const { data: quarterData, error: quarterError } = await supabase
      .from('evaluation_cycles')
      .select('id, name, start_date, end_date')
      .gte('end_date', new Date().toISOString().split('T')[0]) // Quarter hasn't ended yet
      .lte('start_date', new Date().toISOString().split('T')[0]) // Quarter has started
      .single();

    if (quarterError || !quarterData) {
      console.log(`No active quarter found for current date`);
      return null;
    }

    // Check if submissions exist for this employee in this quarter
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('evaluation_type')
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterData.id);

    if (submissionsError) {
      console.error('Error checking submissions:', submissionsError);
      return null;
    }

    // Analyze what types of evaluations exist
    const evaluationTypes = submissions?.map(s => s.evaluation_type) || [];
    const hasSelf = evaluationTypes.includes('self');
    const hasPeer = evaluationTypes.includes('peer');
    const hasManager = evaluationTypes.includes('manager');
    const hasData = evaluationTypes.length > 0;

    return {
      quarterId: quarterData.id,
      quarterName: quarterData.name,
      hasData,
      hasSelf,
      hasPeer,
      hasManager,
      dataTypes: evaluationTypes.filter((type, index, arr) => arr.indexOf(type) === index) as ('self' | 'peer' | 'manager')[] // Remove duplicates
    };
  } catch (error) {
    console.error('Error checking current quarter data availability:', error);
    return null;
  }
};

/**
 * Format quarter data status for display
 */
export const formatQuarterDataStatus = (status: QuarterDataStatus | null): string => {
  if (!status) {
    return 'No quarter data';
  }

  if (!status.hasData) {
    return `${status.quarterName} - No data`;
  }

  const completionCount = [status.hasSelf, status.hasPeer, status.hasManager].filter(Boolean).length;
  
  if (completionCount === 3) {
    return `${status.quarterName} - Complete data`;
  } else {
    const dataTypes = [];
    if (status.hasSelf) dataTypes.push('Self');
    if (status.hasPeer) dataTypes.push('Peer'); 
    if (status.hasManager) dataTypes.push('Manager');
    
    return `${status.quarterName} - ${dataTypes.join(' + ')} data`;
  }
};

/**
 * Batch check quarter data availability for multiple employees
 */
export const batchCheckCurrentQuarterDataAvailability = async (
  employeeIds: string[]
): Promise<Record<string, QuarterDataStatus | null>> => {
  try {
    // Get current quarter info
    const { data: quarterData, error: quarterError } = await supabase
      .from('evaluation_cycles')
      .select('id, name, start_date, end_date')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .lte('start_date', new Date().toISOString().split('T')[0])
      .single();

    if (quarterError || !quarterData) {
      console.log('No active quarter found for batch check');
      return {};
    }

    // Get all submissions for these employees in current quarter
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('evaluatee_id, evaluation_type')
      .in('evaluatee_id', employeeIds)
      .eq('quarter_id', quarterData.id);

    if (submissionsError) {
      console.error('Error in batch submissions check:', submissionsError);
      return {};
    }

    // Group submissions by employee
    const submissionsByEmployee = submissions?.reduce((acc, submission) => {
      if (!acc[submission.evaluatee_id]) {
        acc[submission.evaluatee_id] = [];
      }
      acc[submission.evaluatee_id].push(submission.evaluation_type);
      return acc;
    }, {} as Record<string, string[]>) || {};

    // Create status objects for each employee
    const results: Record<string, QuarterDataStatus | null> = {};
    
    for (const employeeId of employeeIds) {
      const evaluationTypes = submissionsByEmployee[employeeId] || [];
      const hasSelf = evaluationTypes.includes('self');
      const hasPeer = evaluationTypes.includes('peer');
      const hasManager = evaluationTypes.includes('manager');
      const hasData = evaluationTypes.length > 0;

      results[employeeId] = {
        quarterId: quarterData.id,
        quarterName: quarterData.name,
        hasData,
        hasSelf,
        hasPeer,
        hasManager,
        dataTypes: evaluationTypes.filter((type, index, arr) => arr.indexOf(type) === index) as ('self' | 'peer' | 'manager')[]
      };
    }

    return results;
  } catch (error) {
    console.error('Error in batch quarter data availability check:', error);
    return {};
  }
}; 