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
  created_at: string;
}

export interface Submission {
  submission_id: string;
  submission_time: string;
  submitter_id: string;
  evaluatee_id: string;
  evaluation_type: string;
  quarter_id: string;
  raw_json: Record<string, any>;
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