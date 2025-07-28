// Database entity types matching Supabase schema

import type { LetterGrade } from '../utils/calculations';

export interface WeightedEvaluationScore {
  evaluatee_id: string;
  evaluatee_name: string;
  quarter_id: string;
  quarter_name: string;
  quarter_start_date: string;
  quarter_end_date: string;
  attribute_name: string;
  manager_score: number;
  peer_score: number;
  self_score: number;
  weighted_final_score: number;
  // A-Player Letter Grading System
  weighted_final_grade?: LetterGrade;
  manager_grade?: LetterGrade;
  peer_grade?: LetterGrade;
  self_grade?: LetterGrade;
  has_manager_eval: boolean;
  has_peer_eval: boolean;
  has_self_eval: boolean;
  completion_percentage: number;
}

export interface AppConfig {
  id: number;
  key: string;
  value: string;
  environment: string;
  created_at: string;
}

export interface EvaluationCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  person_description?: string;
  manager_notes?: string;
  department: string;
  hire_date: string;
  profile_picture_url?: string; // Profile picture stored in Supabase Storage
  created_at: string;
}

export interface EmployeeQuarterNotes {
  id: string;
  employee_id: string;
  quarter_id: string;
  notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuarterOption {
  quarter_id: string;
  quarter_name: string;
  quarter_start_date: string;
  quarter_end_date: string;
}

export interface Submission {
  submission_id: string;
  submission_time: string;
  submitter_id: string;
  evaluatee_id: string;
  evaluation_type: string;
  quarter_id: string;
  raw_json: Record<string, unknown>;
  created_at: string;
}

export interface AttributeScore {
  id: string;
  submission_id: string;
  attribute_name: string;
  score: number;
  created_at: string;
}

export interface AttributeResponse {
  id: string;
  submission_id: string;
  attribute_name: string;
  question_id: string;
  question_text: string;
  response_type: string;
  response_value: string;
  score_context?: string;
  attribute_score_id: string;
  created_at: string;
}

// Quarterly Final Scores - Added January 16, 2025
// Aggregated quarterly evaluation data for trend analysis
export interface QuarterlyTrendData {
  evaluatee_id: string;
  evaluatee_name: string;
  quarter_id: string;
  quarter_name: string;
  quarter_start_date: string;
  quarter_end_date: string;
  total_weighted_score: number;
  total_weight: number;
  attributes_count: number;
  final_quarter_score: number;
  // A-Player Letter Grading System
  final_quarter_grade?: LetterGrade;
  completion_percentage: number;
  peer_count: number;
  manager_count: number;
  self_count: number;
  total_submissions: number;
  meets_minimum_requirements: boolean;
}

// Analysis job tracking for long-running AI processes
export interface AnalysisJob {
  id: string;
  evaluatee_id: string;
  quarter_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';

  stage?: string; // Current processing stage
  created_at: string;
  updated_at: string;
  completed_at?: string;
  pdf_url?: string; // Keep for backward compatibility
  pdf_data?: string; // Base64 encoded PDF data (from BYTEA)
  pdf_filename?: string; // Original filename
  error_message?: string;
}

// ===================================================================
// STAGE 7: SURVEY ASSIGNMENT SYSTEM TYPES
// ===================================================================

// Enum types for evaluation assignments
export type EvaluationType = 'peer' | 'manager' | 'self';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

// Main evaluation assignment interface (matches existing table structure)
export interface EvaluationAssignment {
  id: string;
  evaluator_id: string;
  evaluatee_id: string;
  quarter_id: string;
  evaluation_type: EvaluationType;
  status: AssignmentStatus;
  assigned_by: string;
  assigned_at: string;
  completed_at?: string;
  survey_token: string;
  created_at: string;
}

// Extended assignment interface with related data for UI display (from assignment_details view)
export interface EvaluationAssignmentWithDetails extends EvaluationAssignment {
  evaluator_name: string;
  evaluator_email: string;
  evaluator_department?: string;
  evaluatee_name: string;
  evaluatee_email: string;
  evaluatee_department?: string;
  quarter_name: string;
  quarter_start_date: string;
  quarter_end_date: string;
  assigned_by_name: string;
  submission_id?: string;
  progress_percentage: number;
}

// Bridge table between assignments and existing submissions
export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  submission_id: string;
  created_at: string;
}

// Assignment statistics interface for reporting (from assignment_statistics view)
export interface AssignmentStatistics {
  quarter_id: string;
  quarter_name: string;
  evaluation_type: EvaluationType;
  total_assignments: number;
  pending_count: number;
  in_progress_count: number;
  completed_count: number;
  completion_percentage: number;
}

// Interface for bulk assignment creation
export interface AssignmentCreationRequest {
  evaluatee_ids: string[];
  evaluator_ids: string[];
  quarter_id: string;
  evaluation_type: EvaluationType;
  assigned_by: string;
}

// Interface for CSV bulk assignment upload
export interface BulkAssignmentData {
  evaluator_email: string;
  evaluatee_email: string;
  quarter_name: string;
  evaluation_type: EvaluationType;
}

// Interface for assignment creation result
export interface AssignmentCreationResult {
  success: boolean;
  created_count: number;
  skipped_count: number;
  errors: string[];
  assignments?: EvaluationAssignment[];
}

// Interface for survey progress tracking (calculated from existing submissions/responses)
export interface SurveyProgress {
  assignment_id: string;
  submission_id?: string;
  total_attributes: number;
  completed_attributes: number;
  current_attribute?: string;
  percentage_complete: number;
  estimated_time_remaining?: number; // in minutes
  last_saved_at?: string;
}

// Interface for survey question definition (based on the logic-based survey provided)
export interface SurveyQuestion {
  id: string;
  attribute_name: string;
  question_text: string;
  question_type: 'rating' | 'text' | 'multi_select' | 'single_select' | 'yes_no' | 'scale';
  is_required: boolean;
  options?: string[]; // For select questions
  conditional_logic?: {
    show_if_score_range?: '1-5' | '6-8' | '9-10';
    show_if_answer?: {
      question_id: string;
      answer_value: any;
    };
    dependent_question_id?: string;
  };
  order: number;
  placeholder?: string;
  description?: string;
}

// Enhanced conditional question structure for score-based logic
export interface ConditionalQuestionSet {
  score_range: '1-5' | '6-8' | '9-10';
  questions: SurveyQuestion[];
}

// Interface for attribute definition in surveys with comprehensive question sets
export interface AttributeDefinition {
  name: string;
  display_name: string;
  definition: string;
  scale_descriptions: {
    excellent: string; // 10
    good: string; // 7
    below_expectation: string; // 5
    poor: string; // 1
  };
  base_questions: SurveyQuestion[]; // Questions shown before scoring
  conditional_question_sets: ConditionalQuestionSet[]; // Score-based question sets
}

// Enhanced survey response structure for complex questions
export interface EnhancedSurveyResponseData {
  attribute_name: string;
  attribute_score: number; // 1-10 rating
  base_responses: Record<string, any>; // Responses to questions before scoring
  conditional_responses: Record<string, any>; // Responses to score-based questions
  response_metadata: {
    score_range: '1-5' | '6-8' | '9-10';
    questions_shown: string[]; // Track which questions were actually displayed
    completion_timestamp: string;
  };
}

// Interface for survey session data with enhanced tracking
export interface EnhancedSurveySession {
  assignment_id: string;
  submission_id?: string;
  current_attribute: string;
  current_attribute_index: number;
  current_score?: number;
  base_responses: Record<string, Record<string, any>>; // Per-attribute base responses
  conditional_responses: Record<string, Record<string, any>>; // Per-attribute conditional responses
  completed_attributes: string[]; // Track completed attributes
  start_time: string;
  last_activity: string;
  is_complete: boolean;
}

// ===================================================================
// CUSTOMIZABLE ATTRIBUTE WEIGHTING SYSTEM TYPES
// ===================================================================

// Attribute weight configuration for company-specific priorities
export interface AttributeWeight {
  id: string;
  attribute_name: string;
  weight: number; // Weight multiplier (e.g., 1.0 = normal, 2.0 = double importance)
  description?: string;
  environment: 'production' | 'development' | 'testing';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Interface for updating attribute weights
export interface AttributeWeightUpdate {
  attribute_name: string;
  weight: number;
  description?: string;
}

// Interface for weight distribution analytics
export interface WeightDistribution {
  attribute_name: string;
  weight: number;
  normalized_percentage: number; // Percentage of total weight
  description?: string;
}

// Enhanced WeightedEvaluationScore with custom weights
export interface WeightedEvaluationScoreWithCustomWeights extends WeightedEvaluationScore {
  base_weighted_score: number; // Original calculation
  attribute_weight: number; // Custom weight multiplier
  custom_weighted_score: number; // Score with custom weighting
  base_weighted_grade: LetterGrade; // Grade without custom weights
  custom_weighted_grade: LetterGrade; // Grade with custom weights
}

// Enhanced QuarterlyTrendData with custom weights
export interface QuarterlyTrendDataWithCustomWeights extends QuarterlyTrendData {
  avg_base_weighted_score: number; // Original calculation
  final_quarter_score_custom_weighted: number; // Score with custom weighting
  final_quarter_grade_custom_weighted: LetterGrade; // Grade with custom weights
}

// Weight preset configurations for different company types
export interface WeightPreset {
  id: string;
  name: string;
  description: string;
  company_type: string; // e.g., 'Technology', 'Sales', 'Manufacturing', 'Healthcare'
  weights: Record<string, number>; // attribute_name -> weight mapping
  created_at: string;
} 