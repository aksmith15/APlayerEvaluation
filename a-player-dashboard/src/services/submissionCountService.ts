/**
 * Submission Count Service
 * Fetches accurate submission counts from assignment data for PDF reports
 */

import { supabase } from './supabase';

export interface SubmissionCounts {
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number;
  by_evaluation_type: {
    self: { assigned: number; completed: number };
    peer: { assigned: number; completed: number };
    manager: { assigned: number; completed: number };
  };
}

/**
 * Get submission counts for a specific employee and quarter
 * Based on actual assignment data from the assignments table
 */
export const getSubmissionCounts = async (
  evaluateeId: string, 
  quarterId: string
): Promise<SubmissionCounts> => {
  try {
    console.log(`Fetching submission counts for employee ${evaluateeId} in quarter ${quarterId}`);

    // Query the assignment_details view for this employee and quarter
    const { data: assignments, error } = await supabase
      .from('assignment_details')
      .select(`
        id,
        evaluator_id,
        evaluatee_id,
        quarter_id,
        evaluation_type,
        status,
        completed_at,
        submission_id
      `)
      .eq('evaluatee_id', evaluateeId)
      .eq('quarter_id', quarterId);

    if (error) {
      console.error('Error fetching assignment data:', error);
      throw error;
    }

    if (!assignments || assignments.length === 0) {
      console.log('No assignments found for this employee and quarter');
      return {
        total_assignments: 0,
        completed_assignments: 0,
        completion_rate: 0,
        by_evaluation_type: {
          self: { assigned: 0, completed: 0 },
          peer: { assigned: 0, completed: 0 },
          manager: { assigned: 0, completed: 0 }
        }
      };
    }

    // Count assignments by type and completion status
    const selfAssignments = assignments.filter(a => a.evaluation_type === 'self');
    const peerAssignments = assignments.filter(a => a.evaluation_type === 'peer');
    const managerAssignments = assignments.filter(a => a.evaluation_type === 'manager');

    // Count completed assignments (those with completed_at or submission_id)
    const completedSelf = selfAssignments.filter(a => 
      a.status === 'completed' || a.completed_at || a.submission_id
    ).length;
    
    const completedPeer = peerAssignments.filter(a => 
      a.status === 'completed' || a.completed_at || a.submission_id
    ).length;
    
    const completedManager = managerAssignments.filter(a => 
      a.status === 'completed' || a.completed_at || a.submission_id
    ).length;

    const totalAssignments = assignments.length;
    const totalCompleted = completedSelf + completedPeer + completedManager;
    const completionRate = totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0;

    const result: SubmissionCounts = {
      total_assignments: totalAssignments,
      completed_assignments: totalCompleted,
      completion_rate: completionRate,
      by_evaluation_type: {
        self: { 
          assigned: selfAssignments.length, 
          completed: completedSelf 
        },
        peer: { 
          assigned: peerAssignments.length, 
          completed: completedPeer 
        },
        manager: { 
          assigned: managerAssignments.length, 
          completed: completedManager 
        }
      }
    };

    console.log('📊 Submission counts:', result);
    return result;

  } catch (error) {
    console.error('Error in getSubmissionCounts:', error);
    throw error;
  }
};

/**
 * Get simplified submission count for display purposes
 * Returns just the total completed assignments count
 */
export const getSimpleSubmissionCount = async (
  evaluateeId: string, 
  quarterId: string
): Promise<number> => {
  try {
    const counts = await getSubmissionCounts(evaluateeId, quarterId);
    return counts.completed_assignments;
  } catch (error) {
    console.error('Error getting simple submission count:', error);
    return 0;
  }
};

/**
 * Get submission count for a specific core group
 * Since core groups are calculated from all submissions, we return the total completed count
 */
export const getSubmissionCount = async (
  evaluateeId: string, 
  quarterId: string
): Promise<number> => {
  try {
    const counts = await getSubmissionCounts(evaluateeId, quarterId);
    // For core groups, we return total completed as each submission contributes to all core groups
    return counts.completed_assignments;
  } catch (error) {
    console.error('Error getting submission count for core group:', error);
    return 0;
  }
};