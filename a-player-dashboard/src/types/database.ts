// Database entity types matching Supabase schema

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