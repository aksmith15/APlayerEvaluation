/**
 * Simplified Survey Constants
 * Temporary simplified version to resolve TypeScript errors
 */

// Scale titles for each attribute
export const ATTRIBUTE_SCALE_TITLES: Record<string, { excellent: string; good: string; below_expectation: string; poor: string }> = {
  'Reliability': {
    excellent: 'Exceptionally reliable',
    good: 'Generally reliable',
    below_expectation: 'Below standard',
    poor: 'Fundamentally untrustworthy'
  },
  'Accountability for Action': {
    excellent: 'Exceptionally accountable',
    good: 'Usually responsible',
    below_expectation: 'Below standard',
    poor: 'Totally unaccountable'
  },
  'Quality of Work': {
    excellent: 'Exceptionally high quality',
    good: 'Generally meets expectations',
    below_expectation: 'Below expectations',
    poor: 'Unacceptable work quality'
  },
  'Taking Initiative': {
    excellent: 'Proactive leader',
    good: 'Generally takes initiative',
    below_expectation: 'Below expectations',
    poor: 'Opposes initiative'
  },
  'Adaptability': {
    excellent: 'Embraces change',
    good: 'Generally adaptable',
    below_expectation: 'Below expectations',
    poor: 'Resists all change'
  },
  'Problem Solving Ability': {
    excellent: 'Exceptional problem solver',
    good: 'Generally solves problems well',
    below_expectation: 'Below expectations',
    poor: 'Cannot solve problems'
  },
  'Teamwork': {
    excellent: 'Exceptional team player',
    good: 'Generally works well with others',
    below_expectation: 'Below expectations',
    poor: 'Cannot work with others'
  },
  'Leadership': {
    excellent: 'Natural leader',
    good: 'Generally shows leadership',
    below_expectation: 'Below expectations',
    poor: 'Cannot lead others'
  },
  'Communication Skills': {
    excellent: 'Exceptional communicator',
    good: 'Generally communicates well',
    below_expectation: 'Below expectations',
    poor: 'Cannot communicate effectively'
  },
  'Continuous Improvement': {
    excellent: 'Constantly improving',
    good: 'Generally seeks improvement',
    below_expectation: 'Below expectations',
    poor: 'Resists improvement'
  }
};

// Simplified attribute definitions for component demos
export const COMPREHENSIVE_ATTRIBUTE_DEFINITIONS: Record<string, any> = {
  'Reliability': {
    name: 'Reliability',
    definition: 'Consistently delivers on commitments and can be counted on to follow through.',
    base_questions: [
      {
        id: 'reliability_consistency',
        attribute_name: 'Reliability',
        question_text: 'How often does this person deliver on their commitments?',
        question_type: 'single_select',
        is_required: true,
        order: 1,
        options: [
          'Always delivers on time',
          'Usually delivers with minor delays',
          'Sometimes delivers but often late',
          'Rarely delivers on commitments',
          'Never delivers on commitments'
        ]
      },
      {
        id: 'reliability_follow_through',
        attribute_name: 'Reliability',
        question_text: 'How would you describe their follow-through on tasks and projects?',
        question_type: 'single_select',
        is_required: true,
        order: 2,
        options: [
          'Always follows through completely',
          'Usually follows through with minimal reminders',
          'Sometimes follows through but needs reminders',
          'Rarely follows through without constant supervision',
          'Never follows through independently'
        ]
      }
    ],
    conditional_question_sets: [
      {
        score_range: '8-10',
        questions: [
          {
            id: 'reliability_excellence_examples',
            attribute_name: 'Reliability',
            question_text: 'Can you provide specific examples of how this person has demonstrated exceptional reliability?',
            question_type: 'text',
            is_required: true,
            order: 1
          }
        ]
      },
      {
        score_range: '6-7',
        questions: [
          {
            id: 'reliability_strength_examples',
            attribute_name: 'Reliability',
            question_text: 'What are some specific examples of this person\'s reliability?',
            question_type: 'text',
            is_required: true,
            order: 1
          }
        ]
      },
      {
        score_range: '4-5',
        questions: [
          {
            id: 'reliability_improvement_areas',
            attribute_name: 'Reliability',
            question_text: 'What specific areas could this person improve to become more reliable?',
            question_type: 'text',
            is_required: true,
            order: 1
          }
        ]
      },
      {
        score_range: '1-3',
        questions: [
          {
            id: 'reliability_significant_issues',
            attribute_name: 'Reliability',
            question_text: 'What are the main reliability issues you\'ve observed with this person?',
            question_type: 'text',
            is_required: true,
            order: 1
          }
        ]
      }
    ]
  }
  // Additional attributes would follow the same pattern
};
