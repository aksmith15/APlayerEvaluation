import { supabase } from './supabase';
import type { 
  EvaluationAssignment, 
  EvaluationAssignmentWithDetails,
  AssignmentCreationRequest,
  AssignmentCreationResult,
  BulkAssignmentData,
  AssignmentStatistics,
  SurveyProgress,
  EvaluationType,
  AssignmentStatus 
} from '../types/database';

/**
 * Assignment Service for Survey Assignment System
 * Integrates with existing Supabase schema: submissions, attribute_scores, attribute_responses
 */

// ===================================================================
// ASSIGNMENT CRUD OPERATIONS
// ===================================================================

/**
 * Fetch assignments for a specific user (evaluator)
 */
export const fetchUserAssignments = async (userId: string): Promise<EvaluationAssignmentWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('assignment_details') // Using the view we created
      .select('*')
      .eq('evaluator_id', userId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user assignments:', error);
      throw new Error(`Failed to fetch assignments: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchUserAssignments:', error);
    throw error;
  }
};

/**
 * Fetch assignments managed by a specific user (for admin dashboard)
 */
export const fetchManagedAssignments = async (managerId: string, quarterIds?: string[]): Promise<EvaluationAssignmentWithDetails[]> => {
  try {
    let query = supabase
      .from('assignment_details')
      .select('*')
      .eq('assigned_by', managerId);

    if (quarterIds && quarterIds.length > 0) {
      query = query.in('quarter_id', quarterIds);
    }

    const { data, error } = await query.order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching managed assignments:', error);
      throw new Error(`Failed to fetch managed assignments: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchManagedAssignments:', error);
    throw error;
  }
};

/**
 * Fetch all assignments (admin only)
 */
export const fetchAllAssignments = async (filters?: {
  quarter_id?: string;
  evaluation_type?: EvaluationType;
  status?: AssignmentStatus;
}): Promise<EvaluationAssignmentWithDetails[]> => {
  try {
    let query = supabase.from('assignment_details').select('*');

    if (filters?.quarter_id) {
      query = query.eq('quarter_id', filters.quarter_id);
    }
    if (filters?.evaluation_type) {
      query = query.eq('evaluation_type', filters.evaluation_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching all assignments:', error);
      throw new Error(`Failed to fetch all assignments: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchAllAssignments:', error);
    throw error;
  }
};

/**
 * Get assignment by survey token (for survey access)
 */
export const getAssignmentByToken = async (surveyToken: string): Promise<EvaluationAssignmentWithDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('assignment_details')
      .select('*')
      .eq('survey_token', surveyToken)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No assignment found
      }
      console.error('Error fetching assignment by token:', error);
      throw new Error(`Failed to fetch assignment: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getAssignmentByToken:', error);
    throw error;
  }
};

// ===================================================================
// ASSIGNMENT CREATION
// ===================================================================

/**
 * Create bulk assignments
 */
export const createBulkAssignments = async (request: AssignmentCreationRequest): Promise<AssignmentCreationResult> => {
  try {
    console.log('🚀 Starting bulk assignment creation...');
    console.log('Request details:', {
      quarter_id: request.quarter_id,
      evaluation_type: request.evaluation_type,
      evaluator_count: request.evaluator_ids.length,
      evaluatee_count: request.evaluatee_ids.length,
      assigned_by: request.assigned_by
    });

    // First, validate that the assigned_by user exists in people table
    // If the ID doesn't exist, try to look up by current user's email
    let { data: assignerData, error: assignerError } = await supabase
      .from('people')
      .select('id, name, email')
      .eq('id', request.assigned_by)
      .single();

    if (assignerError || !assignerData) {
      console.warn('⚠️ assigned_by ID not found in people table, trying email lookup...');
      console.warn('assigned_by ID that failed:', request.assigned_by);
      
      // Try to get current user's email and find their people table record
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser?.email) {
        console.log('🔍 Looking up people table record by email:', authUser.email);
        
        const { data: emailLookupData, error: emailLookupError } = await supabase
          .from('people')
          .select('id, name, email, jwt_role')
          .eq('email', authUser.email)
          .eq('active', true)
          .single();
          
        if (emailLookupError || !emailLookupData) {
          console.error('❌ Email lookup failed:', emailLookupError);
          console.error('Email searched:', authUser.email);
          throw new Error(`No people table record found for email: ${authUser.email}. Contact administrator to set up your account with proper jwt_role.`);
        }
        
        console.log('✅ Found people record by email:', emailLookupData);
        
        // Check if user has permission to create assignments
        if (!emailLookupData.jwt_role || !['super_admin', 'hr_admin'].includes(emailLookupData.jwt_role)) {
          throw new Error(`Access denied: User ${authUser.email} does not have assignment creation permissions. Current role: ${emailLookupData.jwt_role}. Required: super_admin or hr_admin.`);
        }
        
        // Use the correct people table ID
        assignerData = emailLookupData;
        console.log('🔧 Fixed assigned_by ID:', {
          original_id: request.assigned_by,
          correct_people_id: emailLookupData.id,
          user_email: authUser.email,
          jwt_role: emailLookupData.jwt_role
        });
        
        // Update the request to use the correct ID
        request.assigned_by = emailLookupData.id;
      } else {
        throw new Error('Cannot determine current user identity. Please log out and log back in.');
      }
    } else {
      console.log('✅ Assigner validation passed:', assignerData);
    }

    console.log('✅ Assigner validation passed:', assignerData);
    
    const assignments: Omit<EvaluationAssignment, 'id' | 'created_at' | 'assigned_at' | 'survey_token'>[] = [];
    
    // Generate all combinations of evaluator/evaluatee pairs
    for (const evaluatorId of request.evaluator_ids) {
      for (const evaluateeId of request.evaluatee_ids) {
        // Skip if evaluator and evaluatee are the same (unless it's self-evaluation)
        if (evaluatorId === evaluateeId && request.evaluation_type !== 'self') {
          continue;
        }
        // Skip if it's self-evaluation but evaluator != evaluatee
        if (request.evaluation_type === 'self' && evaluatorId !== evaluateeId) {
          continue;
        }

        assignments.push({
          evaluator_id: evaluatorId,
          evaluatee_id: evaluateeId,
          quarter_id: request.quarter_id,
          evaluation_type: request.evaluation_type,
          status: 'pending',
          assigned_by: request.assigned_by,
          completed_at: undefined
        });
      }
    }

    if (assignments.length === 0) {
      console.log('⚠️ No assignments to create after filtering');
      return {
        success: true,
        created_count: 0,
        skipped_count: 0,
        errors: ['No valid assignments to create']
      };
    }

    console.log(`📝 Generated ${assignments.length} assignments to create`);
    console.log('Sample assignment:', assignments[0]);

    const { data, error } = await supabase
      .from('evaluation_assignments')
      .insert(assignments)
      .select();

    if (error) {
      console.error('❌ Database error creating assignments:', error);
      console.error('Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      
      // Check if it's the foreign key constraint error
      if (error.message.includes('evaluation_assignments_assigned_by_fkey')) {
        throw new Error(`Assignment creation failed: The assigned_by user ID (${request.assigned_by}) does not exist in the people table. Please ensure the user has a valid profile record.`);
      }
      
      return {
        success: false,
        created_count: 0,
        skipped_count: assignments.length,
        errors: [error.message],
        assignments: []
      };
    }

    console.log(`✅ Successfully created ${data?.length || 0} assignments`);
    if (data && data.length > 0) {
      console.log('Created assignment IDs:', data.map(a => a.id));
    }

    return {
      success: true,
      created_count: data?.length || 0,
      skipped_count: 0,
      errors: [],
      assignments: data || []
    };
  } catch (error) {
    console.error('💥 Error in createBulkAssignments:', error);
    
    // If it's a foreign key error, provide detailed help
    if (error instanceof Error && error.message.includes('assigned_by')) {
      console.error('🔍 This appears to be a user ID mismatch issue');
      console.error('Assigned by value:', request.assigned_by);
      console.error('💡 Solution: Run the SQL fix in Supabase to create safe user lookup functions');
    }
    
    return {
      success: false,
      created_count: 0,
      skipped_count: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
};

/**
 * Process CSV data for bulk assignment creation
 */
export const processBulkAssignmentCSV = async (csvData: BulkAssignmentData[], assignedBy: string): Promise<AssignmentCreationResult> => {
  try {
    const results: AssignmentCreationResult = {
      success: true,
      created_count: 0,
      skipped_count: 0,
      errors: []
    };

    // Get all people and quarters for lookup
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, email')
      .eq('active', true);

    const { data: quarters, error: quartersError } = await supabase
      .from('evaluation_cycles')
      .select('id, name');

    if (peopleError || quartersError) {
      throw new Error('Failed to fetch lookup data');
    }

    const peopleMap = new Map(people?.map(p => [p.email.toLowerCase(), p.id]) || []);
    const quarterMap = new Map(quarters?.map(q => [q.name.toLowerCase(), q.id]) || []);

    const assignmentsToCreate: Omit<EvaluationAssignment, 'id' | 'created_at' | 'assigned_at' | 'survey_token'>[] = [];

    for (const row of csvData) {
      const evaluatorId = peopleMap.get(row.evaluator_email.toLowerCase());
      const evaluateeId = peopleMap.get(row.evaluatee_email.toLowerCase());
      const quarterId = quarterMap.get(row.quarter_name.toLowerCase());

      if (!evaluatorId) {
        results.errors.push(`Evaluator email not found: ${row.evaluator_email}`);
        results.skipped_count++;
        continue;
      }
      if (!evaluateeId) {
        results.errors.push(`Evaluatee email not found: ${row.evaluatee_email}`);
        results.skipped_count++;
        continue;
      }
      if (!quarterId) {
        results.errors.push(`Quarter not found: ${row.quarter_name}`);
        results.skipped_count++;
        continue;
      }

      // Validation for self-evaluations
      if (row.evaluation_type === 'self' && evaluatorId !== evaluateeId) {
        results.errors.push(`Self-evaluation must have same evaluator and evaluatee: ${row.evaluator_email}`);
        results.skipped_count++;
        continue;
      }
      if (row.evaluation_type !== 'self' && evaluatorId === evaluateeId) {
        results.errors.push(`Non-self evaluation cannot have same evaluator and evaluatee: ${row.evaluator_email}`);
        results.skipped_count++;
        continue;
      }

      assignmentsToCreate.push({
        evaluator_id: evaluatorId,
        evaluatee_id: evaluateeId,
        quarter_id: quarterId,
        evaluation_type: row.evaluation_type,
        status: 'pending',
        assigned_by: assignedBy,
        completed_at: undefined
      });
    }

    if (assignmentsToCreate.length > 0) {
      const { data, error } = await supabase
        .from('evaluation_assignments')
        .insert(assignmentsToCreate)
        .select();

      if (error) {
        results.success = false;
        results.errors.push(`Database error: ${error.message}`);
        results.skipped_count += assignmentsToCreate.length;
      } else {
        results.created_count = data?.length || 0;
        results.assignments = data || [];
      }
    }

    return results;
  } catch (error) {
    console.error('Error in processBulkAssignmentCSV:', error);
    return {
      success: false,
      created_count: 0,
      skipped_count: csvData.length,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
};

// ===================================================================
// ASSIGNMENT STATUS MANAGEMENT
// ===================================================================

/**
 * Update assignment status
 */
export const updateAssignmentStatus = async (assignmentId: string, status: AssignmentStatus, completedAt?: string): Promise<void> => {
  try {
    const updates: Partial<EvaluationAssignment> = { 
      status,
      ...(status === 'completed' && completedAt ? { completed_at: completedAt } : {})
    };

    const { error } = await supabase
      .from('evaluation_assignments')
      .update(updates)
      .eq('id', assignmentId);

    if (error) {
      console.error('Error updating assignment status:', error);
      throw new Error(`Failed to update assignment status: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in updateAssignmentStatus:', error);
    throw error;
  }
};

/**
 * Link assignment to submission (when survey is started/completed)
 */
export const linkAssignmentToSubmission = async (assignmentId: string, submissionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        submission_id: submissionId
      });

    if (error) {
      console.error('Error linking assignment to submission:', error);
      throw new Error(`Failed to link assignment to submission: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in linkAssignmentToSubmission:', error);
    throw error;
  }
};

// ===================================================================
// ASSIGNMENT STATISTICS AND REPORTING
// ===================================================================

/**
 * Get assignment statistics
 */
export const getAssignmentStatistics = async (quarterIds?: string[]): Promise<AssignmentStatistics[]> => {
  try {
    let query = supabase.from('assignment_statistics').select('*');

    if (quarterIds && quarterIds.length > 0) {
      query = query.in('quarter_id', quarterIds);
    }

    const { data, error } = await query.order('quarter_name', { ascending: false });

    if (error) {
      console.error('Error fetching assignment statistics:', error);
      throw new Error(`Failed to fetch assignment statistics: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAssignmentStatistics:', error);
    throw error;
  }
};

/**
 * Get survey progress for an assignment
 */
export const getSurveyProgress = async (assignmentId: string): Promise<SurveyProgress | null> => {
  try {
    // Get assignment with submission link
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignment_details')
      .select('submission_id, evaluatee_id')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return null;
    }

    if (!assignment.submission_id) {
      // No submission yet - survey not started
      return {
        assignment_id: assignmentId,
        total_attributes: 10, // Based on the 10 attributes in the survey
        completed_attributes: 0,
        percentage_complete: 0
      };
    }

    // Get completed attribute scores
    const { data: scores, error: scoresError } = await supabase
      .from('attribute_scores')
      .select('attribute_name')
      .eq('submission_id', assignment.submission_id);

    if (scoresError) {
      console.error('Error fetching attribute scores:', scoresError);
      return null;
    }

    const completedAttributes = scores?.length || 0;
    const totalAttributes = 10; // Based on the survey structure

    return {
      assignment_id: assignmentId,
      submission_id: assignment.submission_id,
      total_attributes: totalAttributes,
      completed_attributes: completedAttributes,
      percentage_complete: Math.round((completedAttributes / totalAttributes) * 100),
      current_attribute: completedAttributes < totalAttributes ? 
        ['reliability', 'accountability', 'quality_of_work', 'taking_initiative', 'adaptability', 
         'problem_solving', 'teamwork', 'continuous_improvement', 'communication', 'leadership'][completedAttributes] 
        : undefined
    };
  } catch (error) {
    console.error('Error in getSurveyProgress:', error);
    return null;
  }
};

// ===================================================================
// ASSIGNMENT DELETION
// ===================================================================

/**
 * Delete assignment (admin only)
 */
export const deleteAssignment = async (assignmentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('evaluation_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting assignment:', error);
      throw new Error(`Failed to delete assignment: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteAssignment:', error);
    throw error;
  }
};

/**
 * Delete multiple assignments (admin only)
 */
export const deleteBulkAssignments = async (assignmentIds: string[]): Promise<{ success: boolean; deletedCount: number; errors: string[] }> => {
  try {
    const { data, error } = await supabase
      .from('evaluation_assignments')
      .delete()
      .in('id', assignmentIds)
      .select('id');

    if (error) {
      console.error('Error deleting bulk assignments:', error);
      return {
        success: false,
        deletedCount: 0,
        errors: [error.message]
      };
    }

    return {
      success: true,
      deletedCount: data?.length || 0,
      errors: []
    };
  } catch (error) {
    console.error('Error in deleteBulkAssignments:', error);
    return {
      success: false,
      deletedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
}; 