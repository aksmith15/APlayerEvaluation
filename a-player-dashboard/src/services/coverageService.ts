import { supabase } from './supabase';
import type { EvaluationType } from '../types/database';

export interface CoverageData {
  person_id: string;
  name: string;
  email: string;
  department: string;
  // Assignment coverage (what's been assigned)
  assigned_self_count: number;
  assigned_manager_count: number;
  assigned_peer_count: number;
  has_assigned_self: boolean;
  has_assigned_manager: boolean;
  has_assigned_peer: boolean;
  assignment_coverage_complete: boolean;
  assignment_coverage_status: 'Complete' | 'Partial' | 'None';
  // Completion tracking (what's been submitted)
  completed_self_count: number;
  completed_manager_count: number;
  completed_peer_count: number;
  has_completed_self: boolean;
  has_completed_manager: boolean;
  has_completed_peer: boolean;
  completion_coverage_complete: boolean;
  completion_coverage_status: 'Complete' | 'Partial' | 'None';
  completion_rate: number; // Percentage of assigned evaluations that are completed
}

export interface CoverageStats {
  total_people: number;
  // Assignment coverage stats
  people_with_complete_assignments: number;
  people_with_partial_assignments: number;
  people_with_no_assignments: number;
  assignment_coverage_percentage: number;
  missing_self_assignments: number;
  missing_manager_assignments: number;
  missing_peer_assignments: number;
  // Completion tracking stats
  people_with_complete_submissions: number;
  people_with_partial_submissions: number;
  people_with_no_submissions: number;
  completion_coverage_percentage: number;
  total_assignments: number;
  total_submissions: number;
  overall_completion_rate: number;
}

export interface CoverageGap {
  person_id: string;
  person_name: string;
  person_email: string;
  department: string;
  missing_assignment_types: EvaluationType[]; // Missing assignments
  missing_completion_types: EvaluationType[]; // Assigned but not completed
  priority_score: number; // Higher = more urgent
  gap_type: 'assignment' | 'completion' | 'both';
}

/**
 * Get comprehensive coverage analysis for a specific quarter
 * Shows both assignment coverage AND completion tracking
 */
export const getCoverageAnalysis = async (quarterId: string): Promise<CoverageData[]> => {
  try {
    console.log('📊 Fetching dual coverage analysis (assignments + completions) for quarter:', quarterId);

    // Note: get_dual_coverage_analysis stored procedure not available in current schema
    // Using manual query implementation which provides the same functionality
    console.log('📋 Using manual dual coverage analysis query...');
    return await getFallbackDualCoverageAnalysis(quarterId);

    /* Future: When get_dual_coverage_analysis function is created in database, uncomment:
    const { data, error } = await supabase.rpc('get_dual_coverage_analysis', {
      quarter_id: quarterId
    });

    if (error) {
      console.error('Error fetching dual coverage analysis:', error);
      return await getFallbackDualCoverageAnalysis(quarterId);
    }

    console.log('✅ Dual coverage analysis data:', data);
    return data || [];
    */
  } catch (error) {
    console.error('Error in getCoverageAnalysis:', error);
    throw error;
  }
};

/**
 * Fallback dual coverage analysis using manual query
 * Tracks BOTH assignment coverage AND completion tracking
 */
export const getFallbackDualCoverageAnalysis = async (quarterId: string): Promise<CoverageData[]> => {
  try {
    console.log('🔍 Running manual dual coverage analysis for quarter:', quarterId);
    
    // Get all people with their assignments AND submissions
    const { data, error } = await supabase
      .from('people')
      .select(`
        id,
        name,
        email,
        department,
        evaluation_assignments!evaluatee_id (
          evaluation_type,
          quarter_id,
          status,
          created_at
        ),
        submissions!evaluatee_id (
          evaluation_type,
          quarter_id,
          created_at
        )
      `)
      .eq('active', true);

    if (error) throw error;

    console.log('📊 Raw data fetched for', data.length, 'people');

    // Process the data to calculate DUAL coverage (assignments + completions)
    const coverageData: CoverageData[] = data.map(person => {
      // Filter for this quarter
      const assignments = person.evaluation_assignments.filter(
        (assignment: any) => assignment.quarter_id === quarterId
      );
      
      const submissions = person.submissions.filter(
        (submission: any) => submission.quarter_id === quarterId
      );

      // COUNT ASSIGNMENTS (what's been assigned)
      const assigned_self_count = assignments.filter((a: any) => a.evaluation_type === 'self').length;
      const assigned_manager_count = assignments.filter((a: any) => a.evaluation_type === 'manager').length;
      const assigned_peer_count = assignments.filter((a: any) => a.evaluation_type === 'peer').length;

      // ASSIGNMENT COVERAGE (have they been assigned what they need?)
      const has_assigned_self = assigned_self_count >= 1;
      const has_assigned_manager = assigned_manager_count >= 1;
      const has_assigned_peer = assigned_peer_count >= 1;
      const assignment_coverage_complete = has_assigned_self && has_assigned_manager && has_assigned_peer;

      let assignment_coverage_status: 'Complete' | 'Partial' | 'None';
      if (assignment_coverage_complete) {
        assignment_coverage_status = 'Complete';
      } else if (has_assigned_self || has_assigned_manager || has_assigned_peer) {
        assignment_coverage_status = 'Partial';
      } else {
        assignment_coverage_status = 'None';
      }

      // COUNT SUBMISSIONS (what's been completed)
      const completed_self_count = submissions.filter((s: any) => s.evaluation_type === 'self').length;
      const completed_manager_count = submissions.filter((s: any) => s.evaluation_type === 'manager').length;
      const completed_peer_count = submissions.filter((s: any) => s.evaluation_type === 'peer').length;

      // COMPLETION COVERAGE (have they completed their required evaluations?)
      const has_completed_self = completed_self_count >= 1;
      const has_completed_manager = completed_manager_count >= 1;
      const has_completed_peer = completed_peer_count >= 1;
      const completion_coverage_complete = has_completed_self && has_completed_manager && has_completed_peer;

      let completion_coverage_status: 'Complete' | 'Partial' | 'None';
      if (completion_coverage_complete) {
        completion_coverage_status = 'Complete';
      } else if (has_completed_self || has_completed_manager || has_completed_peer) {
        completion_coverage_status = 'Partial';
      } else {
        completion_coverage_status = 'None';
      }

      // Calculate completion rate (of assigned evaluations, how many are completed?)
      const total_assignments = assigned_self_count + assigned_manager_count + assigned_peer_count;
      const total_submissions = completed_self_count + completed_manager_count + completed_peer_count;
      const completion_rate = total_assignments > 0 ? Math.round((total_submissions / total_assignments) * 100) : 0;

      const result = {
        person_id: person.id,
        name: person.name,
        email: person.email,
        department: person.department || 'Unknown',
        // Assignment coverage
        assigned_self_count,
        assigned_manager_count,
        assigned_peer_count,
        has_assigned_self,
        has_assigned_manager,
        has_assigned_peer,
        assignment_coverage_complete,
        assignment_coverage_status,
        // Completion tracking
        completed_self_count,
        completed_manager_count,
        completed_peer_count,
        has_completed_self,
        has_completed_manager,
        has_completed_peer,
        completion_coverage_complete,
        completion_coverage_status,
        completion_rate
      };

      // Log individual results for debugging
      if (total_assignments > 0 || total_submissions > 0) {
        console.log(`👤 ${person.name}:`, {
          assigned: { self: assigned_self_count, manager: assigned_manager_count, peer: assigned_peer_count },
          completed: { self: completed_self_count, manager: completed_manager_count, peer: completed_peer_count },
          assignment_status: assignment_coverage_status,
          completion_status: completion_coverage_status,
          completion_rate
        });
      }

      return result;
    });

    console.log('✅ Processed dual coverage for', coverageData.length, 'people');
    
    // Log summary
    const totalWithAssignments = coverageData.filter(p => p.assigned_self_count + p.assigned_manager_count + p.assigned_peer_count > 0).length;
    const totalWithCompletions = coverageData.filter(p => p.completed_self_count + p.completed_manager_count + p.completed_peer_count > 0).length;
    console.log(`📊 Summary: ${totalWithAssignments} people have assignments, ${totalWithCompletions} people have completions`);

    return coverageData;
  } catch (error) {
    console.error('Error in fallback dual coverage analysis:', error);
    throw error;
  }
};

/**
 * Get coverage statistics summary for a quarter
 * Updated to track both assignment and completion statistics
 */
export const getCoverageStats = async (quarterId: string): Promise<CoverageStats> => {
  try {
    const coverageData = await getCoverageAnalysis(quarterId);
    
    const total_people = coverageData.length;
    
    // Assignment coverage stats
    const people_with_complete_assignments = coverageData.filter(p => p.assignment_coverage_complete).length;
    const people_with_partial_assignments = coverageData.filter(p => 
      p.assignment_coverage_status === 'Partial'
    ).length;
    const people_with_no_assignments = coverageData.filter(p => 
      p.assignment_coverage_status === 'None'
    ).length;
    
    const assignment_coverage_percentage = total_people > 0 
      ? Math.round((people_with_complete_assignments / total_people) * 100)
      : 0;
    
    const missing_self_assignments = coverageData.filter(p => !p.has_assigned_self).length;
    const missing_manager_assignments = coverageData.filter(p => !p.has_assigned_manager).length;
    const missing_peer_assignments = coverageData.filter(p => !p.has_assigned_peer).length;

    // Completion tracking stats
    const people_with_complete_submissions = coverageData.filter(p => p.completion_coverage_complete).length;
    const people_with_partial_submissions = coverageData.filter(p => 
      p.completion_coverage_status === 'Partial'
    ).length;
    const people_with_no_submissions = coverageData.filter(p => 
      p.completion_coverage_status === 'None'
    ).length;
    
    const completion_coverage_percentage = total_people > 0 
      ? Math.round((people_with_complete_submissions / total_people) * 100)
      : 0;

    const total_assignments = coverageData.reduce((sum, p) => 
      sum + p.assigned_self_count + p.assigned_manager_count + p.assigned_peer_count, 0);
    const total_submissions = coverageData.reduce((sum, p) => 
      sum + p.completed_self_count + p.completed_manager_count + p.completed_peer_count, 0);
    const overall_completion_rate = total_assignments > 0 
      ? Math.round((total_submissions / total_assignments) * 100)
      : 0;

    const stats = {
      total_people,
      // Assignment coverage
      people_with_complete_assignments,
      people_with_partial_assignments,
      people_with_no_assignments,
      assignment_coverage_percentage,
      missing_self_assignments,
      missing_manager_assignments,
      missing_peer_assignments,
      // Completion tracking
      people_with_complete_submissions,
      people_with_partial_submissions,
      people_with_no_submissions,
      completion_coverage_percentage,
      total_assignments,
      total_submissions,
      overall_completion_rate
    };

    console.log('📊 Dual Coverage Stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting coverage stats:', error);
    throw error;
  }
};

/**
 * Get prioritized list of coverage gaps that need to be filled
 * Updated to show both assignment gaps and completion gaps
 */
export const getCoverageGaps = async (quarterId: string): Promise<CoverageGap[]> => {
  try {
    const coverageData = await getCoverageAnalysis(quarterId);
    
    const gaps: CoverageGap[] = coverageData
      .filter(person => !person.assignment_coverage_complete || !person.completion_coverage_complete)
      .map(person => {
        const missing_assignment_types: EvaluationType[] = [];
        const missing_completion_types: EvaluationType[] = [];
        
        // Check for missing assignments
        if (!person.has_assigned_self) missing_assignment_types.push('self');
        if (!person.has_assigned_manager) missing_assignment_types.push('manager');
        if (!person.has_assigned_peer) missing_assignment_types.push('peer');
        
        // Check for missing completions (assigned but not completed)
        if (person.has_assigned_self && !person.has_completed_self) missing_completion_types.push('self');
        if (person.has_assigned_manager && !person.has_completed_manager) missing_completion_types.push('manager');
        if (person.has_assigned_peer && !person.has_completed_peer) missing_completion_types.push('peer');
        
        // Determine gap type
        let gap_type: 'assignment' | 'completion' | 'both';
        if (missing_assignment_types.length > 0 && missing_completion_types.length > 0) {
          gap_type = 'both';
        } else if (missing_assignment_types.length > 0) {
          gap_type = 'assignment';
        } else {
          gap_type = 'completion';
        }
        
        // Calculate priority score (higher = more urgent)
        let priority_score = 0;
        
        // Assignment gaps are higher priority than completion gaps
        missing_assignment_types.forEach(type => {
          if (type === 'self') priority_score += 5;
          if (type === 'manager') priority_score += 4;
          if (type === 'peer') priority_score += 3;
        });
        
        missing_completion_types.forEach(type => {
          if (type === 'self') priority_score += 2;
          if (type === 'manager') priority_score += 2;
          if (type === 'peer') priority_score += 1;
        });
        
        // Boost priority for people with no assignments or completions at all
        if (person.assignment_coverage_status === 'None') priority_score += 10;
        if (person.completion_coverage_status === 'None' && person.assignment_coverage_status === 'Complete') priority_score += 5;
        
        return {
          person_id: person.person_id,
          person_name: person.name,
          person_email: person.email,
          department: person.department,
          missing_assignment_types,
          missing_completion_types,
          priority_score,
          gap_type
        };
      })
      .sort((a, b) => b.priority_score - a.priority_score); // Highest priority first
    
    return gaps;
  } catch (error) {
    console.error('Error getting coverage gaps:', error);
    throw error;
  }
};

/**
 * Get suggested assignments to fill coverage gaps
 * Focuses on assignment gaps first, then completion reminders
 */
export const getSuggestedAssignments = async (quarterId: string) => {
  try {
    const gaps = await getCoverageGaps(quarterId);
    const suggestions = [];
    
    // Get all active people for potential evaluators
    const { data: allPeople, error } = await supabase
      .from('people')
      .select('id, name, email, department, role')
      .eq('active', true);
      
    if (error) throw error;
    
    for (const gap of gaps.slice(0, 15)) { // Top 15 priority gaps
      // Prioritize assignment gaps first
      for (const missingType of gap.missing_assignment_types) {
        if (missingType === 'self') {
          suggestions.push({
            evaluatee_id: gap.person_id,
            evaluatee_name: gap.person_name,
            evaluator_id: gap.person_id,
            evaluator_name: gap.person_name,
            evaluation_type: 'self' as EvaluationType,
            quarter_id: quarterId,
            priority: gap.priority_score,
            reason: 'Missing self-evaluation assignment',
            action_type: 'create_assignment'
          });
        } else {
          // Find potential evaluators from same department
          const potentialEvaluators = allPeople.filter(person => 
            person.id !== gap.person_id && 
            person.department === gap.department
          );
          
          if (potentialEvaluators.length > 0) {
            const evaluator = potentialEvaluators[0];
            suggestions.push({
              evaluatee_id: gap.person_id,
              evaluatee_name: gap.person_name,
              evaluator_id: evaluator.id,
              evaluator_name: evaluator.name,
              evaluation_type: missingType,
              quarter_id: quarterId,
              priority: gap.priority_score,
              reason: `Missing ${missingType}-evaluation assignment`,
              action_type: 'create_assignment'
            });
          }
        }
      }
      
      // Then add completion reminders
      if (gap.missing_completion_types.length > 0) {
        suggestions.push({
          evaluatee_id: gap.person_id,
          evaluatee_name: gap.person_name,
          evaluator_id: null,
          evaluator_name: null,
          evaluation_type: gap.missing_completion_types[0], // First missing completion
          quarter_id: quarterId,
          priority: gap.priority_score - 10, // Lower priority than assignments
          reason: `Has ${gap.missing_completion_types.length} assigned evaluation(s) pending completion`,
          action_type: 'reminder'
        });
      }
    }
    
    return suggestions;
  } catch (error) {
    console.error('Error getting suggested assignments:', error);
    throw error;
  }
}; 