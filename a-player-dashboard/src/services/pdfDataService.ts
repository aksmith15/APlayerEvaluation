/**
 * PDF Data Service
 * Fetches all necessary data for comprehensive 5-page PDF report generation
 */

import { supabase } from './supabase';
import { fetchCompetenceAnalysis, fetchCharacterAnalysis, fetchCuriosityAnalysis } from './coreGroupService';
import { fetchPersonaClassification } from './personaService';
import { getSubmissionCount } from './submissionCountService';
import type { Person } from '../types/database';
import type { PersonaClassification, DetailedCoreGroupAnalysis } from '../types/evaluation';

export interface CoreGroupScore {
  core_group: string;
  weighted_score: number;
  manager_avg_score: number;
  peer_avg_score: number;
  self_avg_score: number;
  submission_count: number;
}

export interface ConsensusMetrics {
  self_vs_others_gap: number;
  manager_vs_peer_gap: number;
  overall_variance: number;
  consensus_level: 'high' | 'medium' | 'low';
  consensus_description: string;
}

export interface CoreGroupBreakdown {
  competence: DetailedCoreGroupAnalysis | null;
  character: DetailedCoreGroupAnalysis | null;
  curiosity: DetailedCoreGroupAnalysis | null;
}

export interface PDFEmployeeData {
  employee: Person;
  quarter: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  coreGroupScores: CoreGroupScore[];
  overallAverage: number;
  overallGrade: string;
  totalSubmissions: number;
  personaClassification: PersonaClassification | null;
  consensusMetrics: ConsensusMetrics;
  coreGroupBreakdown: CoreGroupBreakdown;
}

/**
 * Calculate letter grade from score
 */
export const calculateLetterGrade = (score: number): string => {
  if (score >= 9.0) return 'A+';
  if (score >= 8.5) return 'A';
  if (score >= 8.0) return 'A-';
  if (score >= 7.5) return 'B+';
  if (score >= 7.0) return 'B';
  if (score >= 6.5) return 'B-';
  if (score >= 6.0) return 'C+';
  if (score >= 5.5) return 'C';
  if (score >= 5.0) return 'C-';
  if (score >= 4.0) return 'D';
  return 'F';
};

/**
 * Calculate consensus metrics from core group scores
 */
const calculateConsensusMetrics = (scores: CoreGroupScore[]): ConsensusMetrics => {
  if (scores.length === 0) {
    return {
      self_vs_others_gap: 0,
      manager_vs_peer_gap: 0,
      overall_variance: 0,
      consensus_level: 'low',
      consensus_description: 'Insufficient data'
    };
  }

  // Calculate average gaps across all core groups
  const selfVsOthersGaps = scores.map(score => {
    const othersAvg = (score.manager_avg_score + score.peer_avg_score) / 2;
    return Math.abs(score.self_avg_score - othersAvg);
  });

  const managerVsPeerGaps = scores.map(score => 
    Math.abs(score.manager_avg_score - score.peer_avg_score)
  );

  const allScores = scores.flatMap(score => [
    score.manager_avg_score,
    score.peer_avg_score,
    score.self_avg_score
  ]).filter(score => score > 0);

  const meanScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  const variance = allScores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / allScores.length;

  const avgSelfVsOthersGap = selfVsOthersGaps.reduce((sum, gap) => sum + gap, 0) / selfVsOthersGaps.length;
  const avgManagerVsPeerGap = managerVsPeerGaps.reduce((sum, gap) => sum + gap, 0) / managerVsPeerGaps.length;

  // Determine consensus level
  let consensusLevel: 'high' | 'medium' | 'low';
  let consensusDescription: string;

  if (avgSelfVsOthersGap <= 0.5 && avgManagerVsPeerGap <= 0.5) {
    consensusLevel = 'high';
    consensusDescription = 'Scores are highly trustworthy. Include all attributes in analysis.';
  } else if (avgSelfVsOthersGap <= 1.0 && avgManagerVsPeerGap <= 1.0) {
    consensusLevel = 'medium';
    consensusDescription = 'Moderate agreement between evaluators. Focus on areas with higher consensus.';
  } else {
    consensusLevel = 'low';
    consensusDescription = 'Significant disagreement between evaluators. Review evaluation criteria and process.';
  }

  return {
    self_vs_others_gap: avgSelfVsOthersGap,
    manager_vs_peer_gap: avgManagerVsPeerGap,
    overall_variance: variance,
    consensus_level: consensusLevel,
    consensus_description: consensusDescription
  };
};

/**
 * Fetch comprehensive employee data for PDF report generation
 */
export const fetchPDFEmployeeData = async (
  employeeId: string, 
  quarterId: string
): Promise<PDFEmployeeData> => {
  try {
    console.log('🔄 Fetching comprehensive PDF data for employee:', employeeId);
    
    // Fetch employee data
    const { data: employee, error: employeeError } = await supabase
      .from('people')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee) {
      throw new Error('Failed to fetch employee data');
    }

    // Fetch quarter data
    const { data: quarter, error: quarterError } = await supabase
      .from('evaluation_cycles')
      .select('*')
      .eq('id', quarterId)
      .single();

    if (quarterError || !quarter) {
      throw new Error('Failed to fetch quarter data');
    }

    // Fetch core group scores
    const { data: coreGroupData, error: coreGroupError } = await supabase
      .from('core_group_scores')
      .select('*')
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterId);

    if (coreGroupError) {
      console.warn('Failed to fetch core group scores:', coreGroupError);
    }

    // Transform core group data and calculate submission counts
    const coreGroupScores: CoreGroupScore[] = [];
    let totalSubmissions = 0;

    if (coreGroupData && coreGroupData.length > 0) {
      for (const scoreData of coreGroupData) {
        const submissionCount = await getSubmissionCount(employeeId, quarterId, scoreData.core_group);
        
        coreGroupScores.push({
          core_group: scoreData.core_group,
          weighted_score: scoreData.weighted_score || 0,
          manager_avg_score: scoreData.manager_avg_score || 0,
          peer_avg_score: scoreData.peer_avg_score || 0,
          self_avg_score: scoreData.self_avg_score || 0,
          submission_count: submissionCount
        });

        totalSubmissions += submissionCount;
      }
    }

    // Calculate overall average and grade
    const overallAverage = coreGroupScores.length > 0 
      ? coreGroupScores.reduce((sum, score) => sum + score.weighted_score, 0) / coreGroupScores.length
      : 0;
    
    const overallGrade = calculateLetterGrade(overallAverage);

    // Calculate consensus metrics
    const consensusMetrics = calculateConsensusMetrics(coreGroupScores);

    // Fetch persona classification
    let personaClassification: PersonaClassification | null = null;
    try {
      personaClassification = await fetchPersonaClassification(employeeId, quarterId);
    } catch (err) {
      console.warn('Failed to fetch persona classification:', err);
    }

    // Fetch individual core group breakdowns
    console.log('🔄 Fetching core group breakdowns...');
    const [competenceData, characterData, curiosityData] = await Promise.allSettled([
      fetchCompetenceAnalysis(employeeId, quarterId),
      fetchCharacterAnalysis(employeeId, quarterId),
      fetchCuriosityAnalysis(employeeId, quarterId)
    ]);

    const coreGroupBreakdown: CoreGroupBreakdown = {
      competence: competenceData.status === 'fulfilled' ? competenceData.value : null,
      character: characterData.status === 'fulfilled' ? characterData.value : null,
      curiosity: curiosityData.status === 'fulfilled' ? curiosityData.value : null
    };

    console.log('✅ PDF employee data fetched successfully with core group breakdowns');
    
    return {
      employee,
      quarter: {
        id: quarter.id,
        name: quarter.name,
        start_date: quarter.start_date,
        end_date: quarter.end_date
      },
      coreGroupScores,
      overallAverage,
      overallGrade,
      totalSubmissions,
      personaClassification,
      consensusMetrics,
      coreGroupBreakdown
    };
    
  } catch (error) {
    console.error('❌ Error fetching PDF employee data:', error);
    throw new Error('Failed to fetch employee data for PDF generation');
  }
};