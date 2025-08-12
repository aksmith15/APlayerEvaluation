import { SCORING_WEIGHTS } from '../constants/attributes';
import type { WeightedEvaluationScore } from '../types/database';
import type { PerformanceAttribute } from '../types/evaluation';

// Score calculation utilities

export const calculateWeightedScore = (
  managerScore: number,
  peerScore: number,
  selfScore: number
): number => {
  return (
    managerScore * SCORING_WEIGHTS.MANAGER +
    peerScore * SCORING_WEIGHTS.PEER +
    selfScore * SCORING_WEIGHTS.SELF
  );
};

export const formatScore = (score: number): string => {
  return score.toFixed(1);
};

// Tenure calculation utilities for AI insights
export type TenureCategory = 'new' | 'growing' | 'established' | 'advanced';

export const getMonthsSinceHire = (hireDate: string): number => {
  const hire = new Date(hireDate);
  const now = new Date();
  
  // Calculate difference in months
  const yearDiff = now.getFullYear() - hire.getFullYear();
  const monthDiff = now.getMonth() - hire.getMonth();
  
  return yearDiff * 12 + monthDiff;
};

export const getTenureCategory = (hireDate: string): TenureCategory => {
  const monthsEmployed = getMonthsSinceHire(hireDate);
  
  if (monthsEmployed <= 6) return 'new';          // ≤ 6 months
  if (monthsEmployed <= 12) return 'growing';     // 6-12 months  
  if (monthsEmployed <= 36) return 'established'; // 1-3 years
  return 'advanced';                              // 3+ years
};

export const getTenureDescription = (tenureCategory: TenureCategory): string => {
  switch (tenureCategory) {
    case 'new': return 'new team member';
    case 'growing': return 'developing employee';
    case 'established': return 'experienced team member';
    case 'advanced': return 'senior team member';
    default: return 'team member';
  }
};

export const calculateOverallScore = (scores: WeightedEvaluationScore[]): number => {
  if (scores.length === 0) return 0;
  
  const total = scores.reduce((sum, score) => sum + score.weighted_final_score, 0);
  return total / scores.length;
};

export const transformToPerformanceAttributes = (
  scores: WeightedEvaluationScore[]
): PerformanceAttribute[] => {
  return scores.map(score => ({
    name: score.attribute_name,
    managerScore: score.manager_score,
    peerScore: score.peer_score,
    selfScore: score.self_score,
    weightedScore: score.weighted_final_score,
    hasManagerEval: score.has_manager_eval,
    hasPeerEval: score.has_peer_eval,
    hasSelfEval: score.has_self_eval,
    completionPercentage: score.completion_percentage
  }));
}; 

// A-Player Letter Grading System
export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface GradeScale {
  grade: LetterGrade;
  minScore: number;
  maxScore: number;
  description: string;
  color: string;
}

// A-Player Grade Scale - Optimized for High Performance Evaluation
export const A_PLAYER_GRADE_SCALE: GradeScale[] = [
  {
    grade: 'A',
    minScore: 8.5,
    maxScore: 10.0,
    description: 'A-Player - Exceptional Performance',
    color: 'text-green-700 bg-green-50'
  },
  {
    grade: 'B',
    minScore: 7.0,
    maxScore: 8.49,
    description: 'High Performer - Exceeds Expectations',
    color: 'text-blue-700 bg-blue-50'
  },
  {
    grade: 'C',
    minScore: 5.5,
    maxScore: 6.99,
    description: 'Solid Contributor - Meets Expectations',
    color: 'text-yellow-700 bg-yellow-50'
  },
  {
    grade: 'D',
    minScore: 4.0,
    maxScore: 5.49,
    description: 'Below Expectations - Needs Improvement',
    color: 'text-orange-700 bg-orange-50'
  },
  {
    grade: 'F',
    minScore: 0.0,
    maxScore: 3.99,
    description: 'Failing Performance - Requires Action',
    color: 'text-red-700 bg-red-50'
  }
];

/**
 * Convert numeric score to A-Player letter grade
 * @param score - Numeric score (0-10 scale)
 * @returns Letter grade (A, B, C, D, F)
 */
export const getLetterGrade = (score: number): LetterGrade => {
  // Handle edge cases
  if (score < 0 || score > 10 || isNaN(score)) {
    return 'F';
  }

  // Find matching grade scale
  for (const gradeScale of A_PLAYER_GRADE_SCALE) {
    if (score >= gradeScale.minScore && score <= gradeScale.maxScore) {
      return gradeScale.grade;
    }
  }

  // Default fallback
  return 'F';
};

/**
 * Get grade scale information for a specific letter grade
 * @param grade - Letter grade
 * @returns Grade scale information
 */
export const getGradeScale = (grade: LetterGrade): GradeScale | undefined => {
  return A_PLAYER_GRADE_SCALE.find(scale => scale.grade === grade);
};

/**
 * Get grade scale information for a numeric score
 * @param score - Numeric score (0-10 scale)
 * @returns Grade scale information
 */
export const getGradeScaleForScore = (score: number): GradeScale | undefined => {
  const grade = getLetterGrade(score);
  return getGradeScale(grade);
};

/**
 * Calculate letter grade distribution from multiple scores
 * @param scores - Array of numeric scores
 * @returns Grade distribution with counts and percentages
 */
export const calculateGradeDistribution = (scores: number[]) => {
  const distribution = {
    A: { count: 0, percentage: 0 },
    B: { count: 0, percentage: 0 },
    C: { count: 0, percentage: 0 },
    D: { count: 0, percentage: 0 },
    F: { count: 0, percentage: 0 }
  };

  if (scores.length === 0) return distribution;

  // Count grades
  scores.forEach(score => {
    const grade = getLetterGrade(score);
    distribution[grade].count++;
  });

  // Calculate percentages
  const total = scores.length;
  Object.keys(distribution).forEach(grade => {
    const gradeKey = grade as LetterGrade;
    distribution[gradeKey].percentage = Math.round((distribution[gradeKey].count / total) * 100);
  });

  return distribution;
};

/**
 * Determine if a score qualifies as "A-Player" performance
 * @param score - Numeric score (0-10 scale)
 * @returns True if score is A or B grade (7.0+)
 */
export const isAPlayerPerformance = (score: number): boolean => {
  const grade = getLetterGrade(score);
  return grade === 'A' || grade === 'B';
}; 