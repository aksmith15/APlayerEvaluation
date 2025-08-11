/**
 * Core Group Analytics Service
 * Service functions for fetching core group performance data and analytics
 */

import { supabase } from './supabase';
import type { 
  CoreGroupData, 
  EvaluationConsensus, 
  CoreGroupPerformance,
  CoreGroupAnalyticsResponse 
} from '../types/evaluation';

/**
 * Fetch core group analytics data for a specific employee and quarter
 * Equivalent to: /api/analytics/core-groups/[employeeId]/[quarterId]
 */
export const fetchCoreGroupAnalytics = async (
  employeeId: string, 
  quarterId: string
): Promise<CoreGroupAnalyticsResponse> => {
  try {
    console.log(`Fetching core group analytics for employee ${employeeId} in quarter ${quarterId}`);

    // Fetch core group scores
    const { data: coreGroupScores, error: scoresError } = await supabase
      .from('core_group_scores')
      .select('*')
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterId)
      .order('core_group');

    if (scoresError) {
      console.error('Error fetching core group scores:', scoresError);
      throw scoresError;
    }

    // Fetch consensus data
    const { data: consensusData, error: consensusError } = await supabase
      .from('core_group_scores_with_consensus')
      .select('*')
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterId)
      .order('core_group');

    if (consensusError) {
      console.error('Error fetching consensus data:', consensusError);
      throw consensusError;
    }

    if (!coreGroupScores || coreGroupScores.length === 0) {
      throw new Error(`No core group data found for employee ${employeeId} in quarter ${quarterId}`);
    }

    // Transform data into response format
    const response: CoreGroupAnalyticsResponse = {
      coreGroups: {
        competence: { overall: 0, self: 0, peer: 0, manager: 0, attribute_count: 0, completion_percentage: 0 },
        character: { overall: 0, self: 0, peer: 0, manager: 0, attribute_count: 0, completion_percentage: 0 },
        curiosity: { overall: 0, self: 0, peer: 0, manager: 0, attribute_count: 0, completion_percentage: 0 }
      },
      evaluatorConsensus: {
        selfAverage: 0,
        peerAverage: 0,
        managerAverage: 0,
        consensusMetrics: {
          competence: { self_vs_others_gap: 0, manager_vs_peer_gap: 0, consensus_variance: 0 },
          character: { self_vs_others_gap: 0, manager_vs_peer_gap: 0, consensus_variance: 0 },
          curiosity: { self_vs_others_gap: 0, manager_vs_peer_gap: 0, consensus_variance: 0 }
        }
      },
      metadata: {
        evaluatee_id: employeeId,
        evaluatee_name: coreGroupScores[0]?.evaluatee_name || '',
        quarter_id: quarterId,
        quarter_name: coreGroupScores[0]?.quarter_name || '',
        quarter_start_date: coreGroupScores[0]?.quarter_start_date || '',
        quarter_end_date: coreGroupScores[0]?.quarter_end_date || '',
        calculated_at: coreGroupScores[0]?.calculated_at || new Date().toISOString()
      }
    };

    // Process core group scores
    const selfScores: number[] = [];
    const peerScores: number[] = [];
    const managerScores: number[] = [];

    coreGroupScores.forEach((score: any) => {
      const coreGroup = score.core_group as 'competence' | 'character' | 'curiosity';
      
      response.coreGroups[coreGroup] = {
        overall: Number(score.weighted_score) || 0,
        self: Number(score.self_avg_score) || 0,
        peer: Number(score.peer_avg_score) || 0,
        manager: Number(score.manager_avg_score) || 0,
        attribute_count: Number(score.attribute_count) || 0,
        completion_percentage: Number(score.completion_percentage) || 0
      };

      // Collect scores for overall averages
      if (score.self_avg_score > 0) selfScores.push(Number(score.self_avg_score));
      if (score.peer_avg_score > 0) peerScores.push(Number(score.peer_avg_score));
      if (score.manager_avg_score > 0) managerScores.push(Number(score.manager_avg_score));
    });

    // Calculate overall consensus averages
    response.evaluatorConsensus.selfAverage = selfScores.length > 0 
      ? Number((selfScores.reduce((a, b) => a + b, 0) / selfScores.length).toFixed(2))
      : 0;
    
    response.evaluatorConsensus.peerAverage = peerScores.length > 0 
      ? Number((peerScores.reduce((a, b) => a + b, 0) / peerScores.length).toFixed(2))
      : 0;
    
    response.evaluatorConsensus.managerAverage = managerScores.length > 0 
      ? Number((managerScores.reduce((a, b) => a + b, 0) / managerScores.length).toFixed(2))
      : 0;

    // Process consensus metrics if available
    if (consensusData && consensusData.length > 0) {
      consensusData.forEach((consensus: any) => {
        const coreGroup = consensus.core_group as 'competence' | 'character' | 'curiosity';
        
        response.evaluatorConsensus.consensusMetrics[coreGroup] = {
          self_vs_others_gap: Number(consensus.self_vs_others_gap) || 0,
          manager_vs_peer_gap: Number(consensus.manager_vs_peer_gap) || 0,
          consensus_variance: Number(consensus.consensus_variance) || 0
        };
      });
    }

    console.log(`Successfully fetched core group analytics for ${response.metadata.evaluatee_name}`);
    return response;

  } catch (error) {
    console.error('Error in fetchCoreGroupAnalytics:', error);
    throw error;
  }
};

/**
 * Fetch core group performance summary for dashboard overview
 */
export const fetchCoreGroupSummary = async (
  employeeId: string, 
  quarterId: string
): Promise<CoreGroupPerformance> => {
  try {
    console.log(`Fetching core group summary for employee ${employeeId} in quarter ${quarterId}`);

    const { data: summaryData, error } = await supabase
      .from('core_group_summary')
      .select('*')
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterId)
      .single();

    if (error) {
      console.error('Error fetching core group summary:', error);
      throw error;
    }

    if (!summaryData) {
      throw new Error(`No core group summary found for employee ${employeeId} in quarter ${quarterId}`);
    }

    // Determine performance level based on overall score
    const overallScore = Number(summaryData.overall_weighted_score) || 0;
    let performanceLevel: 'high' | 'medium' | 'low' = 'low';
    if (overallScore >= 8.0) performanceLevel = 'high';
    else if (overallScore >= 6.0) performanceLevel = 'medium';

    const performance: CoreGroupPerformance = {
      evaluatee_id: summaryData.evaluatee_id,
      evaluatee_name: summaryData.evaluatee_name,
      quarter_id: summaryData.quarter_id,
      quarter_name: summaryData.quarter_name,
      overall_weighted_score: overallScore,
      overall_manager_score: Number(summaryData.overall_manager_score) || 0,
      overall_peer_score: Number(summaryData.overall_peer_score) || 0,
      overall_self_score: Number(summaryData.overall_self_score) || 0,
      competence_score: Number(summaryData.competence_score) || 0,
      character_score: Number(summaryData.character_score) || 0,
      curiosity_score: Number(summaryData.curiosity_score) || 0,
      overall_completion_percentage: Number(summaryData.overall_completion_percentage) || 0,
      total_attributes_evaluated: Number(summaryData.total_attributes_evaluated) || 0,
      core_groups_evaluated: Number(summaryData.core_groups_evaluated) || 0,
      performance_level: performanceLevel
    };

    console.log(`Successfully fetched core group summary for ${performance.evaluatee_name}`);
    return performance;

  } catch (error) {
    console.error('Error in fetchCoreGroupSummary:', error);
    throw error;
  }
};

/**
 * Fetch core group trend data across multiple quarters for an employee
 */
export const fetchCoreGroupTrends = async (
  employeeId: string
): Promise<Array<{
  quarter: string;
  quarterName?: string;
  competence: number;
  character: number;
  curiosity: number;
  quarter_start_date: string;
}>> => {
  try {
    console.log(`Fetching core group trends for employee ${employeeId}`);

    const { data: trendsData, error } = await supabase
      .from('quarter_core_group_trends')
      .select('*')
      .eq('evaluatee_id', employeeId)
      .order('quarter_start_date');
      
    console.log('🔍 Database query result:', { trendsData, error });

    if (error) {
      console.error('Error fetching core group trends:', error);
      throw error;
    }

    if (!trendsData || trendsData.length === 0) {
      console.warn(`No trend data found for employee ${employeeId}`);
      return [];
    }

    // Group by quarter and aggregate core group scores
    const quarterMap = new Map();
    
    console.log('🔍 Raw trends data from database:', trendsData);
    
    trendsData.forEach((trend: any) => {
      // Use quarter_id as the key to match with individual trends
      const quarter = trend.quarter_id;
      console.log('📋 Processing trend record:', trend);
      
      if (!quarterMap.has(quarter)) {
        quarterMap.set(quarter, {
          quarter: quarter,
          quarterName: trend.quarter_name, // Keep quarter name for display
          competence: 0,
          character: 0,
          curiosity: 0,
          quarter_start_date: trend.quarter_start_date
        });
      }
      
      const quarterData = quarterMap.get(quarter);
      const scoreValue = Number(trend.current_score) || 0;
      quarterData[trend.core_group] = scoreValue;
      
      console.log(`📊 Updated quarter ${quarter} (${trend.quarter_name}) ${trend.core_group} = ${scoreValue}`);
    });

    const trends = Array.from(quarterMap.values())
      .sort((a, b) => new Date(a.quarter_start_date).getTime() - new Date(b.quarter_start_date).getTime());

    console.log(`✅ Successfully fetched ${trends.length} quarters of trend data:`, trends);
    return trends;

  } catch (error) {
    console.error('Error in fetchCoreGroupTrends:', error);
    throw error;
  }
};

/**
 * Fetch all core group data for multiple employees in a quarter (for admin/manager views)
 */
export const fetchAllCoreGroupScores = async (
  quarterId: string
): Promise<CoreGroupPerformance[]> => {
  try {
    console.log(`Fetching all core group scores for quarter ${quarterId}`);

    const { data: allScores, error } = await supabase
      .from('core_group_summary')
      .select('*')
      .eq('quarter_id', quarterId)
      .order('evaluatee_name');

    if (error) {
      console.error('Error fetching all core group scores:', error);
      throw error;
    }

    if (!allScores || allScores.length === 0) {
      console.warn(`No core group scores found for quarter ${quarterId}`);
      return [];
    }

    const performances: CoreGroupPerformance[] = allScores.map((score: any) => {
      const overallScore = Number(score.overall_weighted_score) || 0;
      let performanceLevel: 'high' | 'medium' | 'low' = 'low';
      if (overallScore >= 8.0) performanceLevel = 'high';
      else if (overallScore >= 6.0) performanceLevel = 'medium';

      return {
        evaluatee_id: score.evaluatee_id,
        evaluatee_name: score.evaluatee_name,
        quarter_id: score.quarter_id,
        quarter_name: score.quarter_name,
        overall_weighted_score: overallScore,
        overall_manager_score: Number(score.overall_manager_score) || 0,
        overall_peer_score: Number(score.overall_peer_score) || 0,
        overall_self_score: Number(score.overall_self_score) || 0,
        competence_score: Number(score.competence_score) || 0,
        character_score: Number(score.character_score) || 0,
        curiosity_score: Number(score.curiosity_score) || 0,
        overall_completion_percentage: Number(score.overall_completion_percentage) || 0,
        total_attributes_evaluated: Number(score.total_attributes_evaluated) || 0,
        core_groups_evaluated: Number(score.core_groups_evaluated) || 0,
        performance_level: performanceLevel
      };
    });

    console.log(`Successfully fetched core group data for ${performances.length} employees`);
    return performances;

  } catch (error) {
    console.error('Error in fetchAllCoreGroupScores:', error);
    throw error;
  }
};

/**
 * Check if core group data exists for an employee in a specific quarter
 */
export const checkCoreGroupDataAvailability = async (
  employeeId: string,
  quarterId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('core_group_scores')
      .select('evaluatee_id')
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterId)
      .limit(1);

    if (error) {
      console.error('Error checking core group data availability:', error);
      return false;
    }

    return data && data.length > 0;

  } catch (error) {
    console.error('Error in checkCoreGroupDataAvailability:', error);
    return false;
  }
};

// ===================================================================
// STAGE 12 - DETAILED CORE GROUP ANALYSIS ENDPOINTS
// ===================================================================

/**
 * Fetch detailed competence analysis data
 * Equivalent to: /api/analytics/competence/[employeeId]/[quarterId]
 */
export const fetchCompetenceAnalysis = async (
  employeeId: string,
  quarterId: string
): Promise<DetailedCoreGroupAnalysis> => {
  try {
    console.log(`Fetching competence analysis for employee ${employeeId} in quarter ${quarterId}`);

    // Fetch competence attribute scores
    const { data: attributeScores, error: scoresError } = await supabase
      .from('weighted_evaluation_scores')
      .select(`
        attribute_name,
        manager_score,
        peer_score,
        self_score,
        weighted_final_score,
        has_manager_eval,
        has_peer_eval,
        has_self_eval,
        completion_percentage
      `)
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterId)
      .in('attribute_name', ['Reliability', 'Accountability for Action', 'Quality of Work'])
      .order('attribute_name');

    if (scoresError) {
      console.error('Error fetching competence scores:', scoresError);
      throw scoresError;
    }

    // Fetch attribute responses for insight generation - join with submissions table
    const { data: responses, error: responsesError } = await supabase
      .from('attribute_responses')
      .select(`
        attribute_name,
        question_text,
        response_value,
        score_context,
        submission_id,
        submissions!inner(evaluatee_id, quarter_id)
      `)
      .eq('submissions.evaluatee_id', employeeId)
      .eq('submissions.quarter_id', quarterId)
      .in('attribute_name', ['Reliability', 'Accountability for Action', 'Quality of Work']);

    if (responsesError) {
      console.error('Error fetching competence responses:', responsesError);
      throw responsesError;
    }

    // Collect unique submission IDs
    const submissionIds = Array.from(new Set((responses || []).map((r: any) => r.submission_id))).filter(Boolean) as string[];

    // Generate insights using the existing algorithm
    const insights = generateCompetenceInsights(attributeScores || [], responses || []);

    return {
      coreGroup: 'competence',
      attributes: transformAttributeScores(attributeScores || []),
      insights,
      metadata: {
        employeeId,
        quarterId,
        calculatedAt: new Date().toISOString(),
        attributeCount: attributeScores?.length || 0,
        submissionIds
      }
    };

  } catch (error) {
    console.error('Error in fetchCompetenceAnalysis:', error);
    throw error;
  }
};

/**
 * Fetch detailed character analysis data
 * Equivalent to: /api/analytics/character/[employeeId]/[quarterId]
 */
export const fetchCharacterAnalysis = async (
  employeeId: string,
  quarterId: string
): Promise<DetailedCoreGroupAnalysis> => {
  try {
    console.log(`Fetching character analysis for employee ${employeeId} in quarter ${quarterId}`);

    // Fetch character attribute scores
    const { data: attributeScores, error: scoresError } = await supabase
      .from('weighted_evaluation_scores')
      .select(`
        attribute_name,
        manager_score,
        peer_score,
        self_score,
        weighted_final_score,
        has_manager_eval,
        has_peer_eval,
        has_self_eval,
        completion_percentage
      `)
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterId)
      .in('attribute_name', ['Leadership', 'Communication Skills', 'Teamwork'])
      .order('attribute_name');

    if (scoresError) {
      console.error('Error fetching character scores:', scoresError);
      throw scoresError;
    }

    // Fetch attribute responses for insight generation - join with submissions table
    const { data: responses, error: responsesError } = await supabase
      .from('attribute_responses')
      .select(`
        attribute_name,
        question_text,
        response_value,
        score_context,
        submission_id,
        submissions!inner(evaluatee_id, quarter_id)
      `)
      .eq('submissions.evaluatee_id', employeeId)
      .eq('submissions.quarter_id', quarterId)
      .in('attribute_name', ['Leadership', 'Communication Skills', 'Teamwork']);

    if (responsesError) {
      console.error('Error fetching character responses:', responsesError);
      throw responsesError;
    }

    // Collect unique submission IDs
    const submissionIds = Array.from(new Set((responses || []).map((r: any) => r.submission_id))).filter(Boolean) as string[];

    // Generate insights using the existing algorithm
    const insights = generateCharacterInsights(attributeScores || [], responses || []);

    return {
      coreGroup: 'character',
      attributes: transformAttributeScores(attributeScores || []),
      insights,
      metadata: {
        employeeId,
        quarterId,
        calculatedAt: new Date().toISOString(),
        attributeCount: attributeScores?.length || 0,
        submissionIds
      }
    };

  } catch (error) {
    console.error('Error in fetchCharacterAnalysis:', error);
    throw error;
  }
};

/**
 * Fetch detailed curiosity analysis data
 * Equivalent to: /api/analytics/curiosity/[employeeId]/[quarterId]
 */
export const fetchCuriosityAnalysis = async (
  employeeId: string,
  quarterId: string
): Promise<DetailedCoreGroupAnalysis> => {
  try {
    console.log(`Fetching curiosity analysis for employee ${employeeId} in quarter ${quarterId}`);

    // Fetch curiosity attribute scores (4 attributes)
    const { data: attributeScores, error: scoresError } = await supabase
      .from('weighted_evaluation_scores')
      .select(`
        attribute_name,
        manager_score,
        peer_score,
        self_score,
        weighted_final_score,
        has_manager_eval,
        has_peer_eval,
        has_self_eval,
        completion_percentage
      `)
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterId)
      .in('attribute_name', ['Problem Solving Ability', 'Adaptability', 'Taking Initiative', 'Continuous Improvement'])
      .order('attribute_name');

    if (scoresError) {
      console.error('Error fetching curiosity scores:', scoresError);
      throw scoresError;
    }

    // Fetch attribute responses for insight generation - join with submissions table
    const { data: responses, error: responsesError } = await supabase
      .from('attribute_responses')
      .select(`
        attribute_name,
        question_text,
        response_value,
        score_context,
        submission_id,
        submissions!inner(evaluatee_id, quarter_id)
      `)
      .eq('submissions.evaluatee_id', employeeId)
      .eq('submissions.quarter_id', quarterId)
      .in('attribute_name', ['Problem Solving Ability', 'Adaptability', 'Taking Initiative', 'Continuous Improvement']);

    if (responsesError) {
      console.error('Error fetching curiosity responses:', responsesError);
      throw responsesError;
    }

    // Collect unique submission IDs
    const submissionIds = Array.from(new Set((responses || []).map((r: any) => r.submission_id))).filter(Boolean) as string[];

    // Generate insights using the existing algorithm
    const insights = generateCuriosityInsights(attributeScores || [], responses || []);

    return {
      coreGroup: 'curiosity',
      attributes: transformAttributeScores(attributeScores || []),
      insights,
      metadata: {
        employeeId,
        quarterId,
        calculatedAt: new Date().toISOString(),
        attributeCount: attributeScores?.length || 0,
        submissionIds
      }
    };

  } catch (error) {
    console.error('Error in fetchCuriosityAnalysis:', error);
    throw error;
  }
};

// ===================================================================
// HELPER FUNCTIONS FOR DETAILED ANALYSIS
// ===================================================================

/**
 * Transform raw attribute scores into structured format for charts
 */
function transformAttributeScores(scores: any[]): DetailedAttributeScore[] {
  return scores.map(score => ({
    attributeName: score.attribute_name,
    scores: {
      self: Number(score.self_score) || 0,
      peer: Number(score.peer_score) || 0,
      manager: Number(score.manager_score) || 0,
      weighted: Number(score.weighted_final_score) || 0
    },
    weights: {
      self: 0.10,  // Fixed weights from weighted_evaluation_scores view
      peer: 0.35,
      manager: 0.55
    },
    evaluatorCoverage: {
      hasSelf: score.has_self_eval || false,
      hasPeer: score.has_peer_eval || false,
      hasManager: score.has_manager_eval || false
    }
  }));
}

/**
 * Generate competence-specific insights
 */
function generateCompetenceInsights(scores: any[], responses: any[]): CoreGroupInsight[] {
  const insights: CoreGroupInsight[] = [];

  // Analyze strengths (scores >= 8.0)
  const strengths = scores.filter(s => s.weighted_final_score >= 8.0);
  if (strengths.length > 0) {
    insights.push({
      type: 'strength',
      title: 'Execution Excellence',
      content: `Strong performance in ${strengths.map(s => s.attribute_name).join(', ')}. Consistently delivers reliable, high-quality work with strong accountability.`,
      attributes: strengths.map(s => s.attribute_name),
      priority: 'high',
      actionable: false
    });
  }

  // Analyze development areas (scores < 7.0)
  const developments = scores.filter(s => s.weighted_final_score < 7.0);
  if (developments.length > 0) {
    insights.push({
      type: 'development',
      title: 'Delivery Enhancement Opportunity',
      content: `Focus on improving ${developments.map(s => s.attribute_name).join(', ')}. Consider structured delivery processes and accountability frameworks.`,
      attributes: developments.map(s => s.attribute_name),
      priority: 'high',
      actionable: true
    });
  }

  // Analyze self-awareness gaps (>1.0 difference between self and others)
  scores.forEach(score => {
    const selfScore = score.self_score || 0;
    const othersAverage = ((score.manager_score || 0) + (score.peer_score || 0)) / 2;
    const gap = Math.abs(selfScore - othersAverage);
    
    if (gap > 1.0) {
      insights.push({
        type: 'awareness',
        title: `${score.attribute_name} Perception Gap`,
        content: `Significant difference between self-assessment (${selfScore.toFixed(1)}) and others' views (${othersAverage.toFixed(1)}). Consider seeking feedback on execution and delivery standards.`,
        attributes: [score.attribute_name],
        priority: 'medium',
        actionable: true
      });
    }
  });

  return insights.slice(0, 5); // Limit to top 5 insights
}

/**
 * Generate character-specific insights
 */
function generateCharacterInsights(scores: any[], responses: any[]): CoreGroupInsight[] {
  const insights: CoreGroupInsight[] = [];

  // Analyze leadership strengths
  const strengths = scores.filter(s => s.weighted_final_score >= 8.0);
  if (strengths.length > 0) {
    insights.push({
      type: 'strength',
      title: 'Leadership & Interpersonal Excellence',
      content: `Demonstrates strong ${strengths.map(s => s.attribute_name).join(', ')}. Natural influencer with excellent relationship-building abilities.`,
      attributes: strengths.map(s => s.attribute_name),
      priority: 'high',
      actionable: false
    });
  }

  // Analyze development areas
  const developments = scores.filter(s => s.weighted_final_score < 7.0);
  if (developments.length > 0) {
    insights.push({
      type: 'development',
      title: 'Interpersonal Development Focus',
      content: `Growth opportunity in ${developments.map(s => s.attribute_name).join(', ')}. Consider leadership training and communication skills development.`,
      attributes: developments.map(s => s.attribute_name),
      priority: 'high',
      actionable: true
    });
  }

  // Leadership potential analysis
  const leadershipScore = scores.find(s => s.attribute_name === 'Leadership')?.weighted_final_score || 0;
  const communicationScore = scores.find(s => s.attribute_name === 'Communication Skills')?.weighted_final_score || 0;
  
  if (leadershipScore >= 8.0 && communicationScore >= 8.0) {
    insights.push({
      type: 'strength',
      title: 'High Leadership Potential',
      content: 'Strong combination of leadership skills and communication effectiveness suggests readiness for increased leadership responsibilities.',
      attributes: ['Leadership', 'Communication Skills'],
      priority: 'high',
      actionable: true
    });
  }

  return insights.slice(0, 5);
}

/**
 * Generate curiosity-specific insights
 */
function generateCuriosityInsights(scores: any[], responses: any[]): CoreGroupInsight[] {
  const insights: CoreGroupInsight[] = [];

  // Analyze innovation strengths
  const strengths = scores.filter(s => s.weighted_final_score >= 8.0);
  if (strengths.length > 0) {
    insights.push({
      type: 'strength',
      title: 'Innovation & Growth Excellence',
      content: `High performance in ${strengths.map(s => s.attribute_name).join(', ')}. Demonstrates strong learning agility and creative problem-solving.`,
      attributes: strengths.map(s => s.attribute_name),
      priority: 'high',
      actionable: false
    });
  }

  // Analyze development areas
  const developments = scores.filter(s => s.weighted_final_score < 7.0);
  if (developments.length > 0) {
    insights.push({
      type: 'development',
      title: 'Growth Mindset Development',
      content: `Focus on ${developments.map(s => s.attribute_name).join(', ')}. Consider innovation challenges and continuous learning opportunities.`,
      attributes: developments.map(s => s.attribute_name),
      priority: 'high',
      actionable: true
    });
  }

  // Innovation potential analysis
  const problemSolvingScore = scores.find(s => s.attribute_name === 'Problem Solving Ability')?.weighted_final_score || 0;
  const initiativeScore = scores.find(s => s.attribute_name === 'Taking Initiative')?.weighted_final_score || 0;
  
  if (problemSolvingScore >= 8.0 && initiativeScore >= 8.0) {
    insights.push({
      type: 'strength',
      title: 'High Innovation Potential',
      content: 'Strong problem-solving abilities combined with proactive initiative suggests excellent potential for innovation and creative contributions.',
      attributes: ['Problem Solving Ability', 'Taking Initiative'],
      priority: 'high',
      actionable: true
    });
  }

  return insights.slice(0, 5);
}