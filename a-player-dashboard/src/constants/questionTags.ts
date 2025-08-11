export type QuestionTag =
  | 'example'
  | 'strength_indicator'
  | 'weakness_indicator'
  | 'context'
  | 'critical_incident';

// Deterministic tags for known survey question IDs from EvaluationSurvey.tsx
const explicit: Record<string, QuestionTag[]> = {
  // Reliability
  reliability_excellence_example: ['example', 'strength_indicator'],
  reliability_specific_examples: ['example', 'weakness_indicator', 'critical_incident'],
  reliability_success_situations: ['context', 'strength_indicator'],
  reliability_struggle_situations: ['context', 'weakness_indicator'],

  // Accountability for Action
  accountability_impact_analysis: ['example', 'weakness_indicator', 'critical_incident'],
  accountability_comfort_situations: ['context', 'strength_indicator'],
  accountability_avoidance_situations: ['context', 'weakness_indicator'],
  accountability_avoidance_patterns: ['context', 'weakness_indicator'],

  // Quality of Work
  quality_excellence_example: ['example', 'strength_indicator'],
  quality_strong_situations: ['context', 'strength_indicator'],
  quality_inconsistent_situations: ['context', 'weakness_indicator'],
  quality_improvement_potential: ['example', 'weakness_indicator'],

  // Taking Initiative
  initiative_example: ['example', 'strength_indicator'],
  initiative_excellence_example: ['example', 'strength_indicator'],
  initiative_comfortable_areas: ['context', 'strength_indicator'],
  initiative_hesitation_areas: ['context', 'weakness_indicator'],
  initiative_avoidance_patterns: ['context', 'weakness_indicator'],

  // Adaptability
  adaptability_example: ['example', 'strength_indicator'],
  adaptability_excellence_example: ['example', 'strength_indicator'],
  adaptability_comfortable_changes: ['context', 'strength_indicator'],
  adaptability_challenging_changes: ['context', 'weakness_indicator'],
  adaptability_resistance_behaviors: ['context', 'weakness_indicator'],

  // Problem Solving Ability
  problem_solving_example: ['example'],
  problem_solving_excellence_example: ['example', 'strength_indicator'],
  problem_solving_success_types: ['context', 'strength_indicator'],
  problem_solving_struggle_types: ['context', 'weakness_indicator'],
  problem_solving_avoidance_patterns: ['context', 'weakness_indicator'],

  // Teamwork
  teamwork_example: ['example', 'strength_indicator'],
  teamwork_strong_situations: ['context', 'strength_indicator'],
  teamwork_challenging_situations: ['context', 'weakness_indicator'],
  teamwork_problematic_behaviors: ['context', 'weakness_indicator'],

  // Continuous Improvement
  continuous_improvement_example: ['example', 'strength_indicator'],
  continuous_improvement_behaviors: ['strength_indicator'],
  continuous_improvement_resistance_behaviors: ['context', 'weakness_indicator'],
};

export function getTagsForQuestionId(qid?: string, qtext?: string): QuestionTag[] {
  if (!qid) return [];
  const key = qid.toLowerCase().trim();
  if (explicit[key]) return explicit[key];

  // Fallback patterns to cover remaining IDs
  const tags: QuestionTag[] = [];
  const qt = (qtext || '').toLowerCase();

  // Examples
  if (key.includes('example') || qt.includes('describe')) tags.push('example');

  // Strength indicators
  if (
    key.includes('success') ||
    key.includes('strong') ||
    key.includes('excellence') ||
    key.includes('behaviors') && (qt.includes('exceptional') || qt.includes('effective'))
  ) {
    tags.push('strength_indicator');
  }

  // Weakness indicators
  if (
    key.includes('struggle') ||
    key.includes('avoid') ||
    key.includes('problem') ||
    key.includes('issues') ||
    key.includes('resistance') ||
    key.includes('inconsistent')
  ) {
    tags.push('weakness_indicator');
  }

  // Context questions
  if (key.includes('situations') || key.includes('areas') || key.includes('changes') || qt.includes('when')) {
    tags.push('context');
  }

  // Critical incidents / impact
  if (key.includes('impact') || key.includes('incident')) tags.push('critical_incident');

  return tags;
}


