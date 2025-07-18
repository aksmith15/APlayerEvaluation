import type { Person, WeightedEvaluationScore } from './database';

// Evaluation-specific types

export interface Employee extends Person {
  overallScore?: number;
  latestQuarter?: string;
}

export interface Quarter {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface EvaluationData {
  employee: Employee;
  scores: WeightedEvaluationScore[];
  quarter: Quarter;
}

export interface PerformanceAttribute {
  name: string;
  managerScore: number;
  peerScore: number;
  selfScore: number;
  weightedScore: number;
  hasManagerEval: boolean;
  hasPeerEval: boolean;
  hasSelfEval: boolean;
  completionPercentage: number;
}

export interface QuarterData {
  quarter: Quarter;
  attributes: PerformanceAttribute[];
  overallScore: number;
}

export interface TrendData {
  quarter: string;
  score: number;
  date: string;
}

export interface WebhookPayload {
  quarterId: string;
  evaluateeId: string;
}

// Analysis job tracking for long-running processes
export interface AnalysisJob {
  id: string;
  evaluatee_id: string;
  quarter_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  stage?: string; // Current processing stage
  created_at: string;
  updated_at: string;
  completed_at?: string;
  pdf_url?: string;
  error_message?: string;
}

export interface AIAnalysisResult {
  jobId?: string; // For async operations
  url?: string; // PDF URL (backward compatibility)
  pdfData?: string; // Base64 encoded PDF data
  pdfFilename?: string; // Original filename
  status: 'pending' | 'processing' | 'completed' | 'error';
  stage?: string;
  error?: string;
  createdAt?: string; // For job resumption
} 