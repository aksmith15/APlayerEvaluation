/**
 * Persona Classification Service
 * Service functions for fetching employee persona data and organizational analytics
 */

import { supabase } from './supabase';
import type { 
  PersonaClassification,
  PersonaWidgetData,
  DevelopmentPath,
  PersonaResponse,
  PersonaDistribution,
  PersonaAnalyticsResponse,
  PersonaFetchOptions,
  PersonaType
} from '../types/evaluation';
import { PERSONA_COLOR_THEMES } from '../types/evaluation';

/**
 * Fetch persona classification for a specific employee and quarter
 * Equivalent to: /api/analytics/persona/[employeeId]/[quarterId]
 */
export const fetchPersonaClassification = async (
  employeeId: string, 
  quarterId: string,
  options: PersonaFetchOptions = {}
): Promise<PersonaResponse> => {
  try {
    console.log(`Fetching persona classification for employee ${employeeId} in quarter ${quarterId}`);

    // Call the persona classification function
    const { data: personaData, error } = await supabase
      .rpc('classify_employee_persona', {
        input_evaluatee_id: employeeId,
        input_quarter_id: quarterId
      });

    if (error) {
      console.error('Error fetching persona classification:', error);
      throw error;
    }

    if (!personaData || personaData.length === 0) {
      throw new Error('No persona data found for the specified employee and quarter');
    }

    const classification = personaData[0];

    // Transform database result to PersonaClassification interface
    const persona: PersonaClassification = {
      evaluatee_id: classification.evaluatee_id,
      evaluatee_name: classification.evaluatee_name,
      quarter_id: classification.quarter_id,
      quarter_name: classification.quarter_name,
      persona_type: classification.persona_type as PersonaType,
      persona_description: classification.persona_description,
      competence_level: classification.competence_level,
      character_level: classification.character_level,
      curiosity_level: classification.curiosity_level,
      competence_score: parseFloat(classification.competence_score),
      character_score: parseFloat(classification.character_score),
      curiosity_score: parseFloat(classification.curiosity_score),
      overall_performance_level: classification.overall_performance_level,
      development_priority: classification.development_priority,
      coaching_focus: classification.coaching_focus || [],
      stretch_assignments: classification.stretch_assignments || [],
      risk_factors: classification.risk_factors || []
    };

    // Generate widget data if requested
    const widget_data: PersonaWidgetData = options.include_widget_data !== false ? {
      persona_type: persona.persona_type,
      persona_description: persona.persona_description,
      performance_level: persona.overall_performance_level,
      hml_pattern: `${persona.competence_level}/${persona.character_level}/${persona.curiosity_level}`,
      core_group_breakdown: {
        competence: { level: persona.competence_level, score: persona.competence_score },
        character: { level: persona.character_level, score: persona.character_score },
        curiosity: { level: persona.curiosity_level, score: persona.curiosity_score }
      },
      development_summary: {
        primary_focus: persona.development_priority,
        key_recommendations: persona.coaching_focus.slice(0, 3) // Top 3 recommendations
      },
      color_theme: PERSONA_COLOR_THEMES[persona.persona_type]
    } : {} as PersonaWidgetData;

    // Generate development path if requested
    const development_path: DevelopmentPath = options.include_development_path !== false ? {
      development_priority: persona.development_priority,
      coaching_focus: persona.coaching_focus,
      stretch_assignments: persona.stretch_assignments,
      risk_factors: persona.risk_factors,
      timeline_recommendations: generateTimelineRecommendations(persona)
    } : {} as DevelopmentPath;

    // Fetch quarter metadata for context
    const { data: quarterData } = await supabase
      .from('quarter_final_scores')
      .select('quarter_name, quarter_start_date, quarter_end_date')
      .eq('quarter_id', quarterId)
      .limit(1)
      .single();

    return {
      persona,
      widget_data,
      development_path,
      context: {
        quarter_info: {
          quarter_id: quarterId,
          quarter_name: quarterData?.quarter_name || classification.quarter_name,
          quarter_start_date: quarterData?.quarter_start_date || '',
          quarter_end_date: quarterData?.quarter_end_date || ''
        },
        employee_info: {
          evaluatee_id: employeeId,
          evaluatee_name: classification.evaluatee_name
        },
        calculated_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('fetchPersonaClassification error:', error);
    throw error;
  }
};

/**
 * Fetch organizational persona distribution for a quarter
 */
export const fetchPersonaDistribution = async (
  quarterId: string
): Promise<PersonaAnalyticsResponse> => {
  try {
    console.log(`Fetching persona distribution for quarter ${quarterId}`);

    // Call the persona distribution analysis function
    const { data: distributionData, error } = await supabase
      .rpc('analyze_persona_distribution', {
        input_quarter_id: quarterId
      });

    if (error) {
      console.error('Error fetching persona distribution:', error);
      throw error;
    }

    if (!distributionData || distributionData.length === 0) {
      throw new Error('No persona distribution data found for the specified quarter');
    }

    // Transform data to PersonaDistribution interface
    const persona_distribution: PersonaDistribution[] = distributionData.map((item: any) => ({
      quarter_id: item.quarter_id,
      quarter_name: item.quarter_name,
      persona_type: item.persona_type as PersonaType,
      employee_count: parseInt(item.employee_count),
      percentage: parseFloat(item.percentage),
      avg_competence_score: parseFloat(item.avg_competence_score),
      avg_character_score: parseFloat(item.avg_character_score),
      avg_curiosity_score: parseFloat(item.avg_curiosity_score),
      performance_level: item.performance_level
    }));

    // Calculate summary statistics
    const total_employees = persona_distribution.reduce((sum, p) => sum + p.employee_count, 0);
    
    const high_performers = persona_distribution
      .filter(p => ['A-Player', 'Adaptive Leader', 'Adaptable Veteran'].includes(p.persona_type))
      .reduce((sum, p) => sum + p.employee_count, 0);

    const high_potential = persona_distribution
      .filter(p => p.persona_type === 'Sharp & Eager Sprout')
      .reduce((sum, p) => sum + p.employee_count, 0);

    const solid_contributors = persona_distribution
      .filter(p => ['Reliable Contributor', 'Collaborative Specialist', 'Visionary Soloist'].includes(p.persona_type))
      .reduce((sum, p) => sum + p.employee_count, 0);

    const at_risk = persona_distribution
      .filter(p => p.persona_type === 'At-Risk')
      .reduce((sum, p) => sum + p.employee_count, 0);

    // Performance level distribution
    const performance_distribution = {
      exceptional: persona_distribution.filter(p => p.performance_level === 'Exceptional').reduce((sum, p) => sum + p.employee_count, 0),
      high: persona_distribution.filter(p => p.performance_level === 'High').reduce((sum, p) => sum + p.employee_count, 0),
      high_potential: persona_distribution.filter(p => p.performance_level === 'High Potential').reduce((sum, p) => sum + p.employee_count, 0),
      solid: persona_distribution.filter(p => p.performance_level === 'Solid').reduce((sum, p) => sum + p.employee_count, 0),
      below_standards: persona_distribution.filter(p => p.performance_level === 'Below Standards').reduce((sum, p) => sum + p.employee_count, 0)
    };

    const quarter_name = distributionData[0]?.quarter_name || '';

    return {
      persona_distribution,
      summary_stats: {
        total_employees,
        high_performers,
        high_potential,
        solid_contributors,
        at_risk,
        performance_distribution
      },
      quarter_metadata: {
        quarter_id: quarterId,
        quarter_name,
        calculated_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('fetchPersonaDistribution error:', error);
    throw error;
  }
};

/**
 * Check if persona data is available for an employee in a quarter
 */
export const checkPersonaDataAvailability = async (
  employeeId: string, 
  quarterId: string
): Promise<boolean> => {
  try {
    // Check if core group data exists (prerequisite for persona classification)
    const { data, error } = await supabase
      .from('core_group_scores')
      .select('evaluatee_id')
      .eq('evaluatee_id', employeeId)
      .eq('quarter_id', quarterId)
      .limit(1);

    if (error) {
      console.error('Error checking persona data availability:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('checkPersonaDataAvailability error:', error);
    return false;
  }
};

/**
 * Fetch simple persona widget data (minimal API call for header/badge display)
 */
export const fetchPersonaWidget = async (
  employeeId: string, 
  quarterId: string
): Promise<PersonaWidgetData | null> => {
  try {
    const response = await fetchPersonaClassification(employeeId, quarterId, {
      include_development_path: false,
      include_widget_data: true,
      include_distribution_context: false
    });

    return response.widget_data;
  } catch (error) {
    console.error('fetchPersonaWidget error:', error);
    return null;
  }
};

/**
 * Generate timeline-based development recommendations
 */
function generateTimelineRecommendations(persona: PersonaClassification): {
  immediate: string[];
  short_term: string[];
  long_term: string[];
} {
  const { persona_type, coaching_focus, stretch_assignments } = persona;

  // Default timeline structure based on persona type
  const timelineMap: Partial<Record<PersonaType, { immediate: string[]; short_term: string[]; long_term: string[]; }>> = {
    'A-Player': {
      immediate: ['Take on stretch assignment', 'Begin mentoring junior team members'],
      short_term: ['Lead cross-functional initiative', 'Develop executive presence'],
      long_term: ['Consider promotion to senior leadership', 'Board interaction opportunities']
    },
    'Adaptive Leader': {
      immediate: ['Join innovation project', 'Shadow senior leader'],
      short_term: ['Lead change initiative', 'Develop creative problem-solving skills'],
      long_term: ['Take on transformational leadership role', 'Drive organizational innovation']
    },
    'Adaptable Veteran': {
      immediate: ['Enroll in leadership communication course', 'Join team leadership project'],
      short_term: ['Lead technical team', 'Develop emotional intelligence'],
      long_term: ['Move into people management', 'Senior technical leadership role']
    },
    'Sharp & Eager Sprout': {
      immediate: ['Set up accountability system', 'Focus on current project quality'],
      short_term: ['Complete project management certification', 'Take ownership of key deliverable'],
      long_term: ['Progress to team leadership', 'Develop strategic thinking skills']
    },
    'Reliable Contributor': {
      immediate: ['Volunteer for presentation opportunity', 'Join innovation team'],
      short_term: ['Develop influence skills', 'Lead best practice initiative'],
      long_term: ['Move into subject matter expert role', 'Consider team lead opportunities']
    },
    'Collaborative Specialist': {
      immediate: ['Take ownership of team process', 'Volunteer for decision-making role'],
      short_term: ['Develop accountability frameworks', 'Lead team coordination'],
      long_term: ['Progress to team leadership', 'Develop strategic ownership mindset']
    },
    'Visionary Soloist': {
      immediate: ['Join collaborative project', 'Focus on follow-through systems'],
      short_term: ['Lead innovation team', 'Develop execution discipline'],
      long_term: ['Balance creativity with delivery', 'Strategic planning role']
    },
    'At-Risk': {
      immediate: ['Complete performance improvement plan', 'Schedule weekly check-ins'],
      short_term: ['Complete skills training program', 'Demonstrate consistent improvement'],
      long_term: ['Achieve baseline performance standards', 'Consider role realignment']
    }
  };

  return timelineMap[persona_type] || {
    immediate: coaching_focus.slice(0, 2),
    short_term: stretch_assignments.slice(0, 2),
    long_term: ['Continue development plan', 'Regular performance review']
  };
}

/**
 * Batch fetch personas for multiple employees (useful for team views)
 */
export const fetchMultiplePersonas = async (
  employeeQuarterPairs: { employeeId: string; quarterId: string }[]
): Promise<PersonaWidgetData[]> => {
  try {
    const promises = employeeQuarterPairs.map(({ employeeId, quarterId }) =>
      fetchPersonaWidget(employeeId, quarterId)
    );

    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<PersonaWidgetData | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value as PersonaWidgetData);

  } catch (error) {
    console.error('fetchMultiplePersonas error:', error);
    return [];
  }
};