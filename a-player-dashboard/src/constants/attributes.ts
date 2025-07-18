// Performance attributes definitions

export const PERFORMANCE_ATTRIBUTES = [
  'Communication',
  'Leadership',
  'Technical Skills',
  'Collaboration',
  'Problem Solving',
  'Initiative',
  'Reliability',
  'Innovation',
  'Quality Focus',
  'Adaptability'
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