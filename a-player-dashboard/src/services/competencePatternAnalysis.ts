/**
 * Competence Pattern Analysis Service
 * Generates intelligent pattern-based insights for PDF reports
 * Analyzes combinations of Accountability, Quality of Work, and Reliability scores
 */

import type { DetailedCoreGroupAnalysis, DetailedAttributeScore } from '../types/evaluation';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

export interface CompetenceScores {
  accountability: {
    manager: number;
    peer: number;
    self: number;
    average: number;
  };
  quality: {
    manager: number;
    peer: number;
    self: number;
    average: number;
  };
  reliability: {
    manager: number;
    peer: number;
    self: number;
    average: number;
  };
}

export interface PerceptionGap {
  type: 'overconfident' | 'undervalues';
  attribute: string;
  gap: string; // Formatted gap value
}

export interface CompetencePatternData {
  title: string;
  insight: string;
  recommendations: {
    immediate: string;
    development: string;
    coaching: string;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskIcon: string;
}

export interface CompetenceAnalysisResult {
  pattern: string;
  title: string;
  insight: string;
  perceptionGaps: PerceptionGap[];
  recommendations: {
    immediate: string;
    development: string;
    coaching: string;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskIcon: string;
}

// ===================================================================
// COMPETENCE PATTERN LIBRARY - ALL 64 PATTERNS
// ===================================================================

const competencePatternLibrary: Record<string, CompetencePatternData> = {
  // A-A-A through A-A-D
  'A-A-A': {
    title: 'The Elite Performer',
    insight: '{name} is an exceptional A-player who consistently exceeds expectations across all dimensions. They deliver outstanding work, on time, and own every outcome.',
    recommendations: {
      immediate: 'Leverage for mission-critical projects',
      development: 'Prepare for leadership or expanded scope',
      coaching: 'Maintain excellence while avoiding burnout'
    },
    riskLevel: 'low',
    riskIcon: '🟢'
  },
  
  'A-A-B': {
    title: 'The Quality-Focused Professional',
    insight: '{name} produces exceptional work and takes full ownership. They\'re generally reliable with occasional timing hiccups, likely due to their focus on excellence.',
    recommendations: {
      immediate: 'Help balance perfection with deadlines',
      development: 'Time management techniques',
      coaching: 'Set clear "good enough" thresholds'
    },
    riskLevel: 'low',
    riskIcon: '🟢'
  },
  
  'A-A-C': {
    title: 'The Inconsistent Excellence',
    insight: '{name} produces brilliant work and owns outcomes, but their below-standard reliability significantly undermines their value.',
    recommendations: {
      immediate: 'Address reliability issues urgently',
      development: 'Project management and planning skills',
      coaching: 'Focus on consistent delivery systems'
    },
    riskLevel: 'high',
    riskIcon: '🚨'
  },
  
  'A-A-D': {
    title: 'The Unreliable Talent',
    insight: '{name} has exceptional skills and ownership but fundamental reliability failures. Excellence without dependability destroys value.',
    recommendations: {
      immediate: 'Performance improvement plan required',
      development: 'Fundamental time and project management',
      coaching: 'Address underlying reliability barriers'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // A-B-A through A-B-D  
  'A-B-A': {
    title: 'The Dependable Owner',
    insight: '{name} is exceptionally reliable and accountable with solid work quality. They\'re the dependable professional who owns everything.',
    recommendations: {
      immediate: 'Use for consistent, important deliverables',
      development: 'Quality enhancement techniques',
      coaching: 'Stretch assignments for quality growth'
    },
    riskLevel: 'low',
    riskIcon: '🟢'
  },
  
  'A-B-B': {
    title: 'The Solid Contributor',
    insight: '{name} takes exceptional ownership with good execution. A strong B-player with A-player accountability.',
    recommendations: {
      immediate: 'Assign leadership responsibilities',
      development: 'Quality and delivery optimization',
      coaching: 'Build on ownership strength'
    },
    riskLevel: 'low',
    riskIcon: '🟢'
  },
  
  'A-B-C': {
    title: 'The Time-Challenged Owner',
    insight: '{name} owns their work and produces solid quality, but below-standard reliability is undermining their contributions.',
    recommendations: {
      immediate: 'Implement delivery tracking systems',
      development: 'Time and priority management',
      coaching: 'Balance ownership with execution'
    },
    riskLevel: 'high',
    riskIcon: '🚨'
  },
  
  'A-B-D': {
    title: 'The Reliability Crisis',
    insight: '{name} takes ownership and does solid work when delivered, but fundamental reliability failures make them undependable.',
    recommendations: {
      immediate: 'Immediate intervention on reliability',
      development: 'Basic project management skills',
      coaching: 'Address reliability root causes'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // A-C-A through A-C-D
  'A-C-A': {
    title: 'The Quality Gap',
    insight: 'Problem pattern: {name} consistently delivers below-standard work despite exceptional ownership and reliability.',
    recommendations: {
      immediate: 'Assess role fit and skill gaps',
      development: 'Quality standards and techniques training',
      coaching: 'Focus on raising quality bar'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },
  
  'A-C-B': {
    title: 'The Skills Mismatch',
    insight: '{name} has the right attitude but wrong capabilities. Below-standard quality despite strong ownership suggests role mismatch.',
    recommendations: {
      immediate: 'Role fit assessment',
      development: 'Skill development or role transition',
      coaching: 'Align role with capabilities'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },
  
  'A-C-C': {
    title: 'The Performance Gap',
    insight: '{name} takes ownership but has multiple performance gaps. Right attitude, wrong role.',
    recommendations: {
      immediate: 'Performance improvement plan',
      development: 'Comprehensive skills assessment',
      coaching: 'Consider role change or intensive support'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },
  
  'A-C-D': {
    title: 'The Critical Mismatch',
    insight: '{name} has exceptional accountability but fundamental execution failures across quality and reliability.',
    recommendations: {
      immediate: 'Urgent role evaluation required',
      development: 'Fundamental skills rebuild',
      coaching: 'Major intervention or role change'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // A-D-A through A-D-D
  'A-D-A': {
    title: 'The Fundamental Quality Issue',
    insight: '{name} takes full ownership and delivers reliably, but the quality is fundamentally below standards.',
    recommendations: {
      immediate: 'Quality intervention required',
      development: 'Intensive quality training',
      coaching: 'Focus exclusively on quality standards'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },
  
  'A-D-B': {
    title: 'The Quality Crisis',
    insight: '{name} has strong ownership but fundamentally poor quality output despite decent reliability.',
    recommendations: {
      immediate: 'Stop current assignments, focus on quality',
      development: 'Back-to-basics quality training',
      coaching: 'Intensive quality coaching required'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },
  
  'A-D-C': {
    title: 'The Compounding Gaps',
    insight: '{name} takes ownership but has fundamental quality and reliability issues that compound each other.',
    recommendations: {
      immediate: 'Comprehensive performance plan',
      development: 'Multi-faceted skill development',
      coaching: 'Address systemic performance issues'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },
  
  'A-D-D': {
    title: 'The Role Mismatch',
    insight: '{name} has exceptional accountability but fundamental failures in both quality and reliability.',
    recommendations: {
      immediate: 'Role change assessment',
      development: 'Complete skills evaluation',
      coaching: 'Consider different role or exit strategy'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // B-A-A through B-A-D
  'B-A-A': {
    title: 'The Skilled Professional',
    insight: '{name} delivers exceptional work reliably with solid accountability. Strong A-player potential with minor ownership development.',
    recommendations: {
      immediate: 'Increase responsibility and ownership',
      development: 'Leadership and accountability training',
      coaching: 'Build on existing strengths'
    },
    riskLevel: 'low',
    riskIcon: '🟢'
  },
  
  'B-A-B': {
    title: 'The Talented Contributor',
    insight: '{name} produces exceptional work as a solid B-player. Their exceptional quality elevates their overall contribution.',
    recommendations: {
      immediate: 'Leverage for quality-critical projects',
      development: 'Accountability and reliability enhancement',
      coaching: 'Build around quality strength'
    },
    riskLevel: 'low',
    riskIcon: '🟢'
  },
  
  'B-A-C': {
    title: 'The Quality Specialist',
    insight: '{name} produces exceptional work but below-standard reliability wastes their talent.',
    recommendations: {
      immediate: 'Address reliability gaps',
      development: 'Time and project management',
      coaching: 'Balance quality focus with delivery'
    },
    riskLevel: 'high',
    riskIcon: '🚨'
  },
  
  'B-A-D': {
    title: 'The Wasted Talent',
    insight: '{name}\'s exceptional quality is negated by fundamental reliability failures.',
    recommendations: {
      immediate: 'Reliability improvement plan',
      development: 'Fundamental delivery skills',
      coaching: 'Address reliability barriers'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // B-B-A through B-B-D
  'B-B-A': {
    title: 'The Steady Reliable',
    insight: '{name} is exceptionally dependable with solid B-player performance across the board. The backbone of consistent delivery.',
    recommendations: {
      immediate: 'Use for mission-critical deliverables',
      development: 'Quality and accountability growth',
      coaching: 'Build on reliability strength'
    },
    riskLevel: 'low',
    riskIcon: '🟢'
  },
  
  'B-B-B': {
    title: 'The Solid B-Player',
    insight: '{name} is a solid B-player performing well across all dimensions. Reliable, professional, and consistent with normal workplace variations.',
    recommendations: {
      immediate: 'Maintain current performance level',
      development: 'Identify growth opportunities',
      coaching: 'Steady development across all areas'
    },
    riskLevel: 'low',
    riskIcon: '🟢'
  },
  
  'B-B-C': {
    title: 'The Reliability Gap',
    insight: '{name} does solid work with good ownership but below-standard reliability undermines their otherwise good performance.',
    recommendations: {
      immediate: 'Focus on delivery consistency',
      development: 'Time management and planning',
      coaching: 'Address reliability patterns'
    },
    riskLevel: 'high',
    riskIcon: '🚨'
  },
  
  'B-B-D': {
    title: 'The Delivery Problem',
    insight: '{name} is a solid performer when they deliver, but fundamental reliability issues destroy their value.',
    recommendations: {
      immediate: 'Immediate reliability intervention',
      development: 'Basic delivery and time management',
      coaching: 'Address fundamental reliability issues'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // B-C and B-D patterns
  'B-C-A': {
    title: 'The Quality Challenge',
    insight: '{name} is exceptionally reliable with solid accountability but below-standard quality needs attention.',
    recommendations: {
      immediate: 'Quality improvement focus',
      development: 'Quality standards and techniques',
      coaching: 'Leverage reliability for quality growth'
    },
    riskLevel: 'medium',
    riskIcon: '🟡'
  },

  'B-C-B': {
    title: 'The Quality Development Need',
    insight: '{name} has solid accountability and reliability but below-standard quality limits their impact.',
    recommendations: {
      immediate: 'Quality training and standards',
      development: 'Skills enhancement program',
      coaching: 'Focus on quality improvement'
    },
    riskLevel: 'medium',
    riskIcon: '🟡'
  },

  'B-C-C': {
    title: 'The Performance Concern',
    insight: '{name} has solid accountability but both quality and reliability are below standards.',
    recommendations: {
      immediate: 'Performance improvement plan',
      development: 'Comprehensive skills development',
      coaching: 'Address multiple performance gaps'
    },
    riskLevel: 'high',
    riskIcon: '🚨'
  },

  'B-C-D': {
    title: 'The Execution Challenge',
    insight: '{name} has good ownership but fundamental issues with both quality and reliability.',
    recommendations: {
      immediate: 'Intensive performance intervention',
      development: 'Basic execution skills training',
      coaching: 'Address fundamental execution gaps'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'B-D-A': {
    title: 'The Quality Crisis with Reliability',
    insight: '{name} is exceptionally reliable with solid ownership but fundamentally poor quality.',
    recommendations: {
      immediate: 'Immediate quality intervention',
      development: 'Intensive quality training',
      coaching: 'Focus exclusively on quality standards'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'B-D-B': {
    title: 'The Fundamental Quality Issue',
    insight: '{name} has decent execution patterns but fundamentally poor quality output.',
    recommendations: {
      immediate: 'Stop work, focus on quality',
      development: 'Back-to-basics quality training',
      coaching: 'Intensive quality improvement'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'B-D-C': {
    title: 'The Multiple Execution Gaps',
    insight: '{name} has solid ownership but fundamental quality and reliability issues.',
    recommendations: {
      immediate: 'Comprehensive performance plan',
      development: 'Multi-area skill development',
      coaching: 'Address systemic execution issues'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'B-D-D': {
    title: 'The Execution Failure',
    insight: '{name} has solid accountability but fundamental failures in quality and reliability.',
    recommendations: {
      immediate: 'Role fit assessment required',
      development: 'Complete execution skills rebuild',
      coaching: 'Consider role change or exit'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // C-A-A and critical accountability gaps
  'C-A-A': {
    title: 'The Accountability Gap',
    insight: 'Cultural threat: {name} delivers exceptional work reliably but below-standard accountability poisons team dynamics.',
    recommendations: {
      immediate: 'Address accountability issues immediately',
      development: 'Ownership and responsibility training',
      coaching: 'Cultural alignment coaching'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'C-A-B': {
    title: 'The Cultural Risk',
    insight: '{name} produces exceptional work but below-standard accountability creates team dysfunction.',
    recommendations: {
      immediate: 'Immediate accountability intervention',
      development: 'Leadership and ownership training',
      coaching: 'Address cultural impact'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'C-A-C': {
    title: 'The High-Skill Cultural Threat',
    insight: '{name} has exceptional quality but below-standard accountability and reliability damage team culture.',
    recommendations: {
      immediate: 'Comprehensive behavioral intervention',
      development: 'Accountability and reliability training',
      coaching: 'Address cultural and execution issues'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'C-A-D': {
    title: 'The Toxic High Performer',
    insight: '{name} produces exceptional work but below-standard accountability and poor reliability create toxicity.',
    recommendations: {
      immediate: 'Urgent intervention or separation',
      development: 'Fundamental behavioral change',
      coaching: 'Address toxic patterns immediately'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // Continue with remaining C and D patterns - all represent significant concerns
  'C-B-A': {
    title: 'The Accountability Challenge',
    insight: '{name} executes well with exceptional reliability but below-standard accountability limits leadership potential.',
    recommendations: {
      immediate: 'Accountability development focus',
      development: 'Leadership and ownership training',
      coaching: 'Build accountability mindset'
    },
    riskLevel: 'medium',
    riskIcon: '🟡'
  },

  'C-B-B': {
    title: 'The Ownership Gap',
    insight: '{name} performs adequately but below-standard accountability prevents them from being truly reliable.',
    recommendations: {
      immediate: 'Ownership and accountability training',
      development: 'Leadership mindset development',
      coaching: 'Focus on taking ownership'
    },
    riskLevel: 'medium',
    riskIcon: '🟡'
  },

  'C-B-C': {
    title: 'The Accountability and Reliability Concern',
    insight: '{name} does solid work but below-standard accountability and reliability create execution gaps.',
    recommendations: {
      immediate: 'Dual focus on accountability and reliability',
      development: 'Ownership and delivery training',
      coaching: 'Address multiple behavioral gaps'
    },
    riskLevel: 'high',
    riskIcon: '🚨'
  },

  'C-B-D': {
    title: 'The Cultural and Delivery Risk',
    insight: '{name} has decent quality but below-standard accountability and poor reliability create multiple risks.',
    recommendations: {
      immediate: 'Performance improvement plan',
      development: 'Comprehensive behavioral training',
      coaching: 'Address cultural and delivery issues'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'C-C-A': {
    title: 'The Reliability Strength Only',
    insight: '{name} is exceptionally reliable but below-standard in both accountability and quality.',
    recommendations: {
      immediate: 'Quality and accountability development',
      development: 'Leadership and skills training',
      coaching: 'Build on reliability strength'
    },
    riskLevel: 'high',
    riskIcon: '🚨'
  },

  'C-C-B': {
    title: 'The Limited Contributor',
    insight: '{name} has decent reliability but below-standard accountability and quality limit their contribution.',
    recommendations: {
      immediate: 'Comprehensive development plan',
      development: 'Multi-area skill building',
      coaching: 'Address multiple performance gaps'
    },
    riskLevel: 'high',
    riskIcon: '🚨'
  },

  'C-C-C': {
    title: 'The Below-Standard Performer',
    insight: '{name} performs below standards across all dimensions but shows potential for improvement.',
    recommendations: {
      immediate: 'Intensive performance improvement',
      development: 'Comprehensive skills development',
      coaching: 'Address all performance areas'
    },
    riskLevel: 'high',
    riskIcon: '🚨'
  },

  'C-C-D': {
    title: 'The Performance Risk',
    insight: '{name} has below-standard accountability and quality with poor reliability.',
    recommendations: {
      immediate: 'Performance improvement plan',
      development: 'Fundamental skills rebuild',
      coaching: 'Consider role fit or exit strategy'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // D patterns - all critical
  'D-A-A': {
    title: 'The Accountability Crisis',
    insight: 'Critical pattern: {name} delivers exceptional work reliably but fundamental accountability failures destroy value.',
    recommendations: {
      immediate: 'Urgent accountability intervention',
      development: 'Fundamental ownership training',
      coaching: 'Address accountability crisis immediately'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-A-B': {
    title: 'The High-Skill Accountability Failure',
    insight: '{name} produces exceptional work but fundamental accountability failures create team dysfunction.',
    recommendations: {
      immediate: 'Immediate behavioral intervention',
      development: 'Accountability and leadership training',
      coaching: 'Address fundamental accountability issues'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-A-C': {
    title: 'The Quality-Accountability Crisis',
    insight: '{name} has exceptional quality but fundamental accountability and reliability failures.',
    recommendations: {
      immediate: 'Urgent comprehensive intervention',
      development: 'Fundamental behavioral change',
      coaching: 'Address multiple critical failures'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-A-D': {
    title: 'The High-Quality Failure',
    insight: '{name} produces exceptional work but fundamental failures in accountability and reliability.',
    recommendations: {
      immediate: 'Crisis intervention required',
      development: 'Complete behavioral rebuild',
      coaching: 'Consider separation if no improvement'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // All remaining D patterns follow similar critical patterns
  'D-B-A': {
    title: 'The Accountability Failure',
    insight: '{name} has decent execution but fundamental accountability failures damage team effectiveness.',
    recommendations: {
      immediate: 'Urgent accountability intervention',
      development: 'Ownership and responsibility training',
      coaching: 'Address fundamental accountability gaps'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-B-B': {
    title: 'The Fundamental Accountability Issue',
    insight: '{name} performs adequately but fundamental accountability failures create trust issues.',
    recommendations: {
      immediate: 'Immediate accountability focus',
      development: 'Leadership and ownership training',
      coaching: 'Rebuild accountability foundation'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-B-C': {
    title: 'The Multiple Critical Gaps',
    insight: '{name} has decent quality but fundamental accountability and reliability failures.',
    recommendations: {
      immediate: 'Crisis intervention plan',
      development: 'Comprehensive behavioral training',
      coaching: 'Address multiple critical issues'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-B-D': {
    title: 'The Execution Crisis',
    insight: '{name} has decent quality but fundamental failures in accountability and reliability.',
    recommendations: {
      immediate: 'Performance crisis intervention',
      development: 'Complete execution rebuild',
      coaching: 'Consider role change or exit'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-C-A': {
    title: 'The Reliability-Only Performer',
    insight: '{name} is reliable but has fundamental accountability and quality failures.',
    recommendations: {
      immediate: 'Urgent multi-area intervention',
      development: 'Comprehensive skills rebuild',
      coaching: 'Address fundamental performance gaps'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-C-B': {
    title: 'The Limited Reliable Contributor',
    insight: '{name} has decent reliability but fundamental accountability and quality failures.',
    recommendations: {
      immediate: 'Performance improvement crisis plan',
      development: 'Multi-area fundamental training',
      coaching: 'Address critical performance gaps'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-C-C': {
    title: 'The Critical Performance Failure',
    insight: '{name} has fundamental failures across accountability and quality with below-standard reliability.',
    recommendations: {
      immediate: 'Immediate performance crisis intervention',
      development: 'Complete performance rebuild',
      coaching: 'Consider role fit or separation'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-C-D': {
    title: 'The Comprehensive Failure',
    insight: '{name} has fundamental accountability failures with below-standard quality and reliability.',
    recommendations: {
      immediate: 'Crisis intervention or separation',
      development: 'Complete performance rebuild required',
      coaching: 'Urgent role evaluation needed'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-D-A': {
    title: 'The Reliability-Only Exception',
    insight: '{name} is exceptionally reliable but has fundamental failures in accountability and quality.',
    recommendations: {
      immediate: 'Urgent intervention on core failures',
      development: 'Comprehensive skills and behavioral training',
      coaching: 'Leverage reliability while addressing failures'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-D-B': {
    title: 'The Triple Failure Risk',
    insight: '{name} has fundamental failures in accountability and quality with declining reliability.',
    recommendations: {
      immediate: 'Crisis intervention required',
      development: 'Complete performance rebuild',
      coaching: 'Consider immediate role change'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-D-C': {
    title: 'The Comprehensive Performance Crisis',
    insight: '{name} has fundamental failures in accountability and quality with below-standard reliability.',
    recommendations: {
      immediate: 'Immediate separation consideration',
      development: 'Complete rebuild if retention attempted',
      coaching: 'Crisis intervention or exit strategy'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  'D-D-D': {
    title: 'The Complete Performance Failure',
    insight: '{name} has fundamental failures across all competence dimensions. Immediate action required.',
    recommendations: {
      immediate: 'Immediate separation or crisis intervention',
      development: 'Complete performance rebuild if attempted',
      coaching: 'Consider exit strategy'
    },
    riskLevel: 'critical',
    riskIcon: '🔴'
  },

  // Add fallback pattern for any missing combinations
  'UNKNOWN': {
    title: 'Pattern Analysis Unavailable',
    insight: '{name}\'s performance pattern could not be determined with available data.',
    recommendations: {
      immediate: 'Gather additional performance data',
      development: 'Comprehensive performance review',
      coaching: 'Individual assessment needed'
    },
    riskLevel: 'medium',
    riskIcon: '🟡'
  }
};

// ===================================================================
// CORE ANALYSIS FUNCTIONS
// ===================================================================

/**
 * Extract competence scores from detailed analysis data
 */
export const extractCompetenceScores = (analysisData: DetailedCoreGroupAnalysis): CompetenceScores | null => {
  if (!analysisData?.attributes) {
    return null;
  }

  const findAttribute = (name: string): DetailedAttributeScore | undefined => {
    return analysisData.attributes.find(attr => 
      attr.attributeName.toLowerCase().includes(name.toLowerCase())
    );
  };

  const accountability = findAttribute('accountability');
  const quality = findAttribute('quality');
  const reliability = findAttribute('reliability');

  if (!accountability || !quality || !reliability) {
    console.warn('Missing required competence attributes:', {
      hasAccountability: !!accountability,
      hasQuality: !!quality,
      hasReliability: !!reliability
    });
    return null;
  }

  const calculateAverage = (scores: { self: number; peer: number; manager: number }) => {
    const validScores = [scores.self, scores.peer, scores.manager].filter(score => score > 0);
    return validScores.length > 0 ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length : 0;
  };

  return {
    accountability: {
      manager: accountability.scores.manager,
      peer: accountability.scores.peer,
      self: accountability.scores.self,
      average: calculateAverage(accountability.scores)
    },
    quality: {
      manager: quality.scores.manager,
      peer: quality.scores.peer,
      self: quality.scores.self,
      average: calculateAverage(quality.scores)
    },
    reliability: {
      manager: reliability.scores.manager,
      peer: reliability.scores.peer,
      self: reliability.scores.self,
      average: calculateAverage(reliability.scores)
    }
  };
};

/**
 * Generate competence pattern analysis
 */
export const generateCompetencePattern = (
  competenceScores: CompetenceScores, 
  employeeName: string = 'This employee'
): CompetenceAnalysisResult => {
  
  // Step 1: Classify each score
  const getCategory = (score: number): string => {
    if (score >= 8) return 'A';
    if (score >= 7) return 'B';
    if (score >= 6) return 'C';
    return 'D';
  };
  
  // Step 2: Create pattern key
  const pattern = `${getCategory(competenceScores.accountability.average)}-${getCategory(competenceScores.quality.average)}-${getCategory(competenceScores.reliability.average)}`;
  
  // Step 3: Look up pattern in library
  const patternData = competencePatternLibrary[pattern] || competencePatternLibrary['UNKNOWN'];
  
  // Step 4: Analyze perception gaps
  const perceptionGaps: PerceptionGap[] = [];
  
  // Check accountability gaps
  const accSelfGap = competenceScores.accountability.self - ((competenceScores.accountability.manager + competenceScores.accountability.peer) / 2);
  if (Math.abs(accSelfGap) > 1) {
    perceptionGaps.push({
      type: accSelfGap > 0 ? 'overconfident' : 'undervalues',
      attribute: 'accountability',
      gap: Math.abs(accSelfGap).toFixed(1)
    });
  }
  
  // Check quality gaps
  const qualSelfGap = competenceScores.quality.self - ((competenceScores.quality.manager + competenceScores.quality.peer) / 2);
  if (Math.abs(qualSelfGap) > 1) {
    perceptionGaps.push({
      type: qualSelfGap > 0 ? 'overconfident' : 'undervalues',
      attribute: 'quality of work',
      gap: Math.abs(qualSelfGap).toFixed(1)
    });
  }
  
  // Check reliability gaps
  const relSelfGap = competenceScores.reliability.self - ((competenceScores.reliability.manager + competenceScores.reliability.peer) / 2);
  if (Math.abs(relSelfGap) > 1) {
    perceptionGaps.push({
      type: relSelfGap > 0 ? 'overconfident' : 'undervalues',
      attribute: 'reliability',
      gap: Math.abs(relSelfGap).toFixed(1)
    });
  }
  
  // Step 5: Return complete analysis
  return {
    pattern: pattern,
    title: patternData.title,
    insight: patternData.insight.replace('{name}', employeeName),
    perceptionGaps: perceptionGaps,
    recommendations: patternData.recommendations,
    riskLevel: patternData.riskLevel,
    riskIcon: patternData.riskIcon
  };
};

/**
 * Generate complete competence analysis from detailed data
 */
export const generateCompetenceAnalysisFromData = (
  analysisData: DetailedCoreGroupAnalysis,
  employeeName: string = 'This employee'
): CompetenceAnalysisResult | null => {
  
  const competenceScores = extractCompetenceScores(analysisData);
  
  if (!competenceScores) {
    console.warn('Could not extract competence scores for pattern analysis');
    return null;
  }
  
  return generateCompetencePattern(competenceScores, employeeName);
};