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
  // Enhanced with core group properties for Stage 11 integration
  overall?: number;
  competence?: number;
  character?: number; 
  curiosity?: number;
  // Individual attribute scores (backward compatibility)
  [attributeName: string]: string | number | undefined;
}

// Core Group Trend Data - Stage 11 Enhancement
export interface CoreGroupTrendData {
  quarter: string;
  quarterName?: string;
  competence: number;
  character: number;
  curiosity: number;
  quarter_start_date?: string;
}

// Enhanced Trend Chart Data Point with core group support
export interface TrendDataPoint {
  quarter: string;
  quarterName: string;
  averageScore: number;
  completionRate: number;
  quarterDate: string;
  // Core group scores for dual-view chart
  competence?: number;
  character?: number;
  curiosity?: number;
}

// Enhanced API Response for trend data with core groups
export interface EnhancedTrendResponse {
  individualTrends: TrendData[];
  coreGroupTrends: CoreGroupTrendData[];
  quarterRange: { start: string; end: string };
  employeeMetadata: { id: string; name: string };
}

// Trend view mode enumeration
export type TrendViewMode = 'individual' | 'coreGroups';

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

// Core Group Scoring System Interfaces

export interface CoreGroupScore {
  core_group: 'competence' | 'character' | 'curiosity';
  manager_avg_score: number;
  peer_avg_score: number;
  self_avg_score: number;
  weighted_score: number;
  attribute_count: number;
  completion_percentage: number;
}

export interface CoreGroupConsensusMetrics {
  core_group: 'competence' | 'character' | 'curiosity';
  self_vs_others_gap: number;
  manager_vs_peer_gap: number;
  consensus_variance: number;
}

export interface CoreGroupData {
  evaluatee_id: string;
  evaluatee_name: string;
  quarter_id: string;
  quarter_name: string;
  quarter_start_date: string;
  quarter_end_date: string;
  core_groups: {
    competence: CoreGroupScore;
    character: CoreGroupScore;
    curiosity: CoreGroupScore;
  };
  calculated_at: string;
}

export interface EvaluationConsensus {
  evaluatee_id: string;
  evaluatee_name: string;
  quarter_id: string;
  quarter_name: string;
  consensus_metrics: {
    competence: CoreGroupConsensusMetrics;
    character: CoreGroupConsensusMetrics;
    curiosity: CoreGroupConsensusMetrics;
  };
  overall_consensus: {
    self_average: number;
    peer_average: number;
    manager_average: number;
    overall_alignment_score: number;
  };
}

export interface CoreGroupPerformance {
  evaluatee_id: string;
  evaluatee_name: string;
  quarter_id: string;
  quarter_name: string;
  overall_weighted_score: number;
  overall_manager_score: number;
  overall_peer_score: number;
  overall_self_score: number;
  competence_score: number;
  character_score: number;
  curiosity_score: number;
  overall_completion_percentage: number;
  total_attributes_evaluated: number;
  core_groups_evaluated: number;
  performance_level: 'high' | 'medium' | 'low';
}

// API Response Interface for Core Group Analytics Endpoint
export interface CoreGroupAnalyticsResponse {
  coreGroups: {
    competence: { 
      overall: number; 
      self: number; 
      peer: number; 
      manager: number;
      attribute_count: number;
      completion_percentage: number;
    };
    character: { 
      overall: number; 
      self: number; 
      peer: number; 
      manager: number;
      attribute_count: number;
      completion_percentage: number;
    };
    curiosity: { 
      overall: number; 
      self: number; 
      peer: number; 
      manager: number;
      attribute_count: number;
      completion_percentage: number;
    };
  };
  evaluatorConsensus: {
    selfAverage: number;
    peerAverage: number;
    managerAverage: number;
    consensusMetrics: {
      competence: { self_vs_others_gap: number; manager_vs_peer_gap: number; consensus_variance: number; };
      character: { self_vs_others_gap: number; manager_vs_peer_gap: number; consensus_variance: number; };
      curiosity: { self_vs_others_gap: number; manager_vs_peer_gap: number; consensus_variance: number; };
    };
  };
  metadata: {
    evaluatee_id: string;
    evaluatee_name: string;
    quarter_id: string;
    quarter_name: string;
    quarter_start_date: string;
    quarter_end_date: string;
    calculated_at: string;
  };
}

// ===================================================================
// PERSONA CLASSIFICATION SYSTEM INTERFACES
// ===================================================================

// Core Group Performance Levels
export type PerformanceLevel = 'H' | 'M' | 'L';

// Persona Type Definitions
export type PersonaType = 
  | 'A-Player'
  | 'Adaptive Leader'
  | 'Adaptable Veteran'
  | 'Sharp & Eager Sprout'
  | 'Reliable Contributor'
  | 'Collaborative Specialist'
  | 'Visionary Soloist'
  | 'Developing Contributor'
  | 'At-Risk';

// Overall Performance Level Categories
export type OverallPerformanceLevel = 
  | 'Exceptional'
  | 'High'
  | 'High Potential'
  | 'Solid'
  | 'Below Standards';

// Development Priority Areas
export type DevelopmentPriority = 
  | 'Strategic Leadership'
  | 'Innovation & Growth Mindset'
  | 'Leadership & Interpersonal Skills'
  | 'Execution & Reliability'
  | 'Influence & Innovation'
  | 'Ownership & Accountability'
  | 'Execution & Collaboration'
  | 'Performance Improvement';

// Individual Persona Classification Result
export interface PersonaClassification {
  evaluatee_id: string;
  evaluatee_name: string;
  quarter_id: string;
  quarter_name: string;
  persona_type: PersonaType;
  persona_description: string;
  competence_level: PerformanceLevel;
  character_level: PerformanceLevel;
  curiosity_level: PerformanceLevel;
  competence_score: number;
  character_score: number;
  curiosity_score: number;
  overall_performance_level: OverallPerformanceLevel;
  development_priority: DevelopmentPriority;
  coaching_focus: string[];
  stretch_assignments: string[];
  risk_factors: string[];
}

// Development Path Information
export interface DevelopmentPath {
  development_priority: DevelopmentPriority;
  coaching_focus: string[];
  stretch_assignments: string[];
  risk_factors: string[];
  timeline_recommendations: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
}

// Persona Widget Display Data
export interface PersonaWidgetData {
  persona_type: PersonaType;
  persona_description: string;
  performance_level: OverallPerformanceLevel;
  hml_pattern: string; // e.g., "H/H/M"
  core_group_breakdown: {
    competence: { level: PerformanceLevel; score: number; };
    character: { level: PerformanceLevel; score: number; };
    curiosity: { level: PerformanceLevel; score: number; };
  };
  development_summary: {
    primary_focus: DevelopmentPriority;
    key_recommendations: string[];
  };
  color_theme: {
    primary: string;
    background: string;
    text: string;
  };
}

// Persona Distribution Analytics
export interface PersonaDistribution {
  quarter_id: string;
  quarter_name: string;
  persona_type: PersonaType;
  employee_count: number;
  percentage: number;
  avg_competence_score: number;
  avg_character_score: number;
  avg_curiosity_score: number;
  performance_level: OverallPerformanceLevel;
}

// Organizational Persona Analytics Response
export interface PersonaAnalyticsResponse {
  persona_distribution: PersonaDistribution[];
  summary_stats: {
    total_employees: number;
    high_performers: number; // A-Player + Adaptive Leader + Adaptable Veteran
    high_potential: number; // Sharp & Eager Sprout
    solid_contributors: number; // Reliable + Collaborative + Visionary
    at_risk: number;
    performance_distribution: {
      exceptional: number;
      high: number;
      high_potential: number;
      solid: number;
      below_standards: number;
    };
  };
  quarter_metadata: {
    quarter_id: string;
    quarter_name: string;
    calculated_at: string;
  };
}

// API Response for Individual Persona Endpoint
export interface PersonaResponse {
  persona: PersonaClassification;
  widget_data: PersonaWidgetData;
  development_path: DevelopmentPath;
  context: {
    quarter_info: {
      quarter_id: string;
      quarter_name: string;
      quarter_start_date: string;
      quarter_end_date: string;
    };
    employee_info: {
      evaluatee_id: string;
      evaluatee_name: string;
    };
    calculated_at: string;
  };
}

// Persona Service Data Fetching Options
export interface PersonaFetchOptions {
  include_development_path?: boolean;
  include_widget_data?: boolean;
  include_distribution_context?: boolean;
  cache_duration?: number;
}

// Persona Color Theme Configuration
export const PERSONA_COLOR_THEMES: Record<PersonaType, { primary: string; background: string; text: string; }> = {
  'A-Player': { primary: '#10B981', background: '#ECFDF5', text: '#065F46' },
  'Adaptive Leader': { primary: '#3B82F6', background: '#EFF6FF', text: '#1E40AF' },
  'Adaptable Veteran': { primary: '#8B5CF6', background: '#F5F3FF', text: '#5B21B6' },
  'Sharp & Eager Sprout': { primary: '#F59E0B', background: '#FFFBEB', text: '#92400E' },
  'Reliable Contributor': { primary: '#06B6D4', background: '#F0F9FF', text: '#0C4A6E' },
  'Collaborative Specialist': { primary: '#EC4899', background: '#FDF2F8', text: '#BE185D' },
  'Visionary Soloist': { primary: '#6366F1', background: '#F0F9FF', text: '#312E81' },
  'Developing Contributor': { primary: '#6B7280', background: '#F9FAFB', text: '#374151' },
  'At-Risk': { primary: '#EF4444', background: '#FEF2F2', text: '#991B1B' }
};

// ===================================================================
// STAGE 12 - DETAILED CORE GROUP ANALYSIS TYPES
// ===================================================================

export interface DetailedAttributeScore {
  attributeName: string;
  scores: {
    self: number;
    peer: number;
    manager: number;
    weighted: number;
  };
  weights: {
    self: number;
    peer: number;
    manager: number;
  };
  evaluatorCoverage: {
    hasSelf: boolean;
    hasPeer: boolean;
    hasManager: boolean;
  };
}

export interface CoreGroupInsight {
  type: 'strength' | 'development' | 'awareness' | 'coaching';
  title: string;
  content: string;
  attributes: string[];
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface DetailedCoreGroupAnalysis {
  coreGroup: 'competence' | 'character' | 'curiosity';
  attributes: DetailedAttributeScore[];
  insights: CoreGroupInsight[];
  metadata: {
    employeeId: string;
    quarterId: string;
    calculatedAt: string;
    attributeCount: number;
  };
}

// Core Group Tab Component Props
export interface CoreGroupTabProps {
  employeeId: string;
  quarterId: string;
  employeeName?: string;
  quarterName?: string;
  initialData?: DetailedCoreGroupAnalysis | null;
  onDataLoad?: (data: DetailedCoreGroupAnalysis) => void;
} 