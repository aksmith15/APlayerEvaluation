// Performance attributes definitions

export const PERFORMANCE_ATTRIBUTES = [
  'Reliability',
  'Accountability for Action',
  'Quality of Work',
  'Taking Initiative',
  'Adaptability',
  'Problem Solving Ability',
  'Teamwork',
  'Continuous Improvement',
  'Communication Skills',
  'Leadership'
] as const;

export type PerformanceAttributeName = typeof PERFORMANCE_ATTRIBUTES[number];

// Scoring system constants
export const SCORING_WEIGHTS = {
  MANAGER: 0.55,
  PEER: 0.35,
  SELF: 0.10
} as const;

export const SCORE_RANGE = {
  MIN: 1,
  MAX: 10
} as const;

// Chart colors matching the design system
export const CHART_COLORS = {
  manager: '#059669',
  peer: '#dc2626',
  self: '#7c3aed',
  weighted: '#f59e0b'
} as const; 