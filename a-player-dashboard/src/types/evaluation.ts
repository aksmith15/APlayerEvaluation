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

export interface AIAnalysisResult {
  url?: string;
  status: 'pending' | 'completed' | 'error';
  error?: string;
} 