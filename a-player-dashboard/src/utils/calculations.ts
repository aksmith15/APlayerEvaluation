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