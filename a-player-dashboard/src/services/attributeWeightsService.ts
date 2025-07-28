import { supabase } from './supabase';
import type { 
  AttributeWeight, 
  AttributeWeightUpdate, 
  WeightDistribution,
  WeightedEvaluationScoreWithCustomWeights,
  QuarterlyTrendDataWithCustomWeights
} from '../types/database';
import { PERFORMANCE_ATTRIBUTES } from '../constants/attributes';

/**
 * Service for managing customizable attribute weights
 * Allows administrators to configure attribute importance based on company priorities
 */

// ===================================================================
// ATTRIBUTE WEIGHTS CRUD OPERATIONS
// ===================================================================

/**
 * Fetch all attribute weights for a specific environment
 */
export const fetchAttributeWeights = async (environment: string = 'production'): Promise<AttributeWeight[]> => {
  try {
    const { data, error } = await supabase
      .from('attribute_weights')
      .select('*')
      .eq('environment', environment)
      .order('weight', { ascending: false });

    if (error) {
      console.error('Error fetching attribute weights:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchAttributeWeights:', error);
    throw error;
  }
};

/**
 * Get weight distribution with normalized percentages
 */
export const fetchWeightDistribution = async (environment: string = 'production'): Promise<WeightDistribution[]> => {
  try {
    const weights = await fetchAttributeWeights(environment);
    
    // Calculate total weight
    const totalWeight = weights.reduce((sum, weight) => sum + weight.weight, 0);
    
    // Create distribution with normalized percentages
    const distribution: WeightDistribution[] = weights.map(weight => ({
      attribute_name: weight.attribute_name,
      weight: weight.weight,
      normalized_percentage: totalWeight > 0 ? Math.round((weight.weight / totalWeight) * 100) : 0,
      description: weight.description
    }));

    return distribution;
  } catch (error) {
    console.error('Error in fetchWeightDistribution:', error);
    throw error;
  }
};

/**
 * Update multiple attribute weights in a single transaction
 */
export const updateAttributeWeights = async (
  updates: AttributeWeightUpdate[],
  environment: string = 'production'
): Promise<AttributeWeight[]> => {
  try {
    // Start a transaction to update all weights atomically
    const updatePromises = updates.map(update => 
      supabase
        .from('attribute_weights')
        .update({
          weight: update.weight,
          description: update.description,
          updated_at: new Date().toISOString()
        })
        .eq('attribute_name', update.attribute_name)
        .eq('environment', environment)
        .select()
    );

    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Errors updating attribute weights:', errors);
      throw new Error('Failed to update some attribute weights');
    }

    // Return updated weights
    return await fetchAttributeWeights(environment);
  } catch (error) {
    console.error('Error in updateAttributeWeights:', error);
    throw error;
  }
};

/**
 * Reset weights to default (1.0 for all attributes)
 */
export const resetAttributeWeights = async (environment: string = 'production'): Promise<AttributeWeight[]> => {
  try {
    const defaultUpdates: AttributeWeightUpdate[] = PERFORMANCE_ATTRIBUTES.map(attributeName => ({
      attribute_name: attributeName,
      weight: 1.0,
      description: 'Reset to default weight'
    }));

    return await updateAttributeWeights(defaultUpdates, environment);
  } catch (error) {
    console.error('Error in resetAttributeWeights:', error);
    throw error;
  }
};

/**
 * Create or update a single attribute weight
 */
export const upsertAttributeWeight = async (
  attributeName: string,
  weight: number,
  description?: string,
  environment: string = 'production'
): Promise<AttributeWeight> => {
  try {
    const { data, error } = await supabase
      .from('attribute_weights')
      .upsert({
        attribute_name: attributeName,
        weight: weight,
        description: description,
        environment: environment,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'attribute_name,environment'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting attribute weight:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertAttributeWeight:', error);
    throw error;
  }
};

// ===================================================================
// CUSTOM WEIGHTED DATA FETCHING
// ===================================================================

/**
 * Fetch evaluation scores with custom attribute weighting
 */
export const fetchEvaluationScoresWithCustomWeights = async (
  employeeId: string,
  quarterId: string
): Promise<WeightedEvaluationScoreWithCustomWeights[]> => {
  try {
    const { data, error } = await supabase
      .from('weighted_evaluation_scores_with_custom_weights')
      .select('*')
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterId)
      .order('attribute_name');

    if (error) {
      console.error('Error fetching custom weighted scores:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchEvaluationScoresWithCustomWeights:', error);
    throw error;
  }
};

/**
 * Fetch quarterly trend data with custom attribute weighting
 */
export const fetchQuarterlyTrendDataWithCustomWeights = async (
  employeeId: string,
  quarterCount: number = 4
): Promise<QuarterlyTrendDataWithCustomWeights[]> => {
  try {
    const { data, error } = await supabase
      .from('quarter_final_scores_with_custom_weights')
      .select('*')
      .eq('evaluatee_id', employeeId)
      .order('quarter_start_date', { ascending: false })
      .limit(quarterCount);

    if (error) {
      console.error('Error fetching custom weighted quarterly data:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchQuarterlyTrendDataWithCustomWeights:', error);
    throw error;
  }
};

/**
 * Get current overall score with custom weighting for an employee
 */
export const fetchCurrentCustomWeightedScore = async (
  employeeId: string,
  quarterId: string
): Promise<{ score: number; grade: string } | null> => {
  try {
    const { data, error } = await supabase
      .rpc('calculate_overall_weighted_score', {
        evaluatee_id_param: employeeId,
        quarter_id_param: quarterId,
        env: 'production'
      });

    if (error) {
      console.error('Error fetching current custom weighted score:', error);
      throw error;
    }

    if (data === null || data === undefined) {
      return null;
    }

    // Get letter grade for the score
    const { data: gradeData, error: gradeError } = await supabase
      .rpc('get_letter_grade', { score: data });

    if (gradeError) {
      console.error('Error getting letter grade:', gradeError);
      throw gradeError;
    }

    return {
      score: parseFloat(data),
      grade: gradeData || 'F'
    };
  } catch (error) {
    console.error('Error in fetchCurrentCustomWeightedScore:', error);
    throw error;
  }
};

// ===================================================================
// WEIGHT VALIDATION AND UTILITIES
// ===================================================================

/**
 * Validate attribute weight value
 */
export const validateWeight = (weight: number): { isValid: boolean; error?: string } => {
  if (isNaN(weight) || weight < 0.1 || weight > 5.0) {
    return {
      isValid: false,
      error: 'Weight must be between 0.1 and 5.0'
    };
  }
  return { isValid: true };
};

/**
 * Calculate weight impact analysis
 */
export const calculateWeightImpact = (weights: AttributeWeight[]): {
  totalWeight: number;
  averageWeight: number;
  highestWeight: { attribute: string; weight: number };
  lowestWeight: { attribute: string; weight: number };
} => {
  if (weights.length === 0) {
    return {
      totalWeight: 0,
      averageWeight: 0,
      highestWeight: { attribute: '', weight: 0 },
      lowestWeight: { attribute: '', weight: 0 }
    };
  }

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const averageWeight = totalWeight / weights.length;
  
  const sorted = [...weights].sort((a, b) => b.weight - a.weight);
  const highestWeight = { attribute: sorted[0].attribute_name, weight: sorted[0].weight };
  const lowestWeight = { attribute: sorted[sorted.length - 1].attribute_name, weight: sorted[sorted.length - 1].weight };

  return {
    totalWeight: Math.round(totalWeight * 100) / 100,
    averageWeight: Math.round(averageWeight * 100) / 100,
    highestWeight,
    lowestWeight
  };
};

/**
 * Get default company weights (based on your company's configuration)
 */
export const getDefaultCompanyWeights = (): AttributeWeightUpdate[] => {
  return [
    { attribute_name: 'Accountability for Action', weight: 2.0, description: 'Highest priority - Critical for company success' },
    { attribute_name: 'Reliability', weight: 1.9, description: 'Nearly as important - Foundation of trust' },
    { attribute_name: 'Quality of Work', weight: 1.9, description: 'Essential for delivering excellent results' },
    { attribute_name: 'Taking Initiative', weight: 1.8, description: 'Important for growth and innovation' },
    { attribute_name: 'Adaptability', weight: 1.8, description: 'Critical in fast-changing environment' },
    { attribute_name: 'Problem Solving Ability', weight: 1.7, description: 'Important for overcoming challenges' },
    { attribute_name: 'Teamwork', weight: 1.6, description: 'Essential for collaboration' },
    { attribute_name: 'Continuous Improvement', weight: 1.5, description: 'Important for long-term success' },
    { attribute_name: 'Communication Skills', weight: 1.5, description: 'Foundation for effective work' },
    { attribute_name: 'Leadership', weight: 1.4, description: 'Valuable but not critical for all roles' }
  ];
}; 