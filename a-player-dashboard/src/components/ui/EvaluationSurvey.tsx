import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Card,
  Button,
  LoadingSpinner,
  ErrorMessage
} from '../ui';
import { 
  getAssignmentByToken,
  updateAssignmentStatus,
  linkAssignmentToSubmission 
} from '../../services/assignmentService';
import { supabase } from '../../services/supabase';
import type { 
  EvaluationAssignmentWithDetails,
  EnhancedSurveySession,
  AttributeDefinition,
  SurveyQuestion
} from '../../types/database';
import { PERFORMANCE_ATTRIBUTES } from '../../constants/attributes';

// Scale titles for each attribute (extracted from survey.md)
const ATTRIBUTE_SCALE_TITLES: Record<string, { excellent: string; good: string; below_expectation: string; poor: string }> = {
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
    excellent: 'Exceptionally adaptable',
    good: 'Generally adaptable',
    below_expectation: 'Below expectations',
    poor: 'Completely unadaptable'
  },
  'Problem Solving Ability': {
    excellent: 'Exceptional problem solver',
    good: 'Generally good at problem solving',
    below_expectation: 'Below expectations',
    poor: 'Fails to engage in problem solving'
  },
  'Teamwork': {
    excellent: 'Model team player',
    good: 'Generally effective in teams',
    below_expectation: 'Below expectations',
    poor: 'Toxic teammate'
  },
  'Continuous Improvement': {
    excellent: 'Growth-oriented leader',
    good: 'Generally improves well',
    below_expectation: 'Below expectations',
    poor: 'Hostile to growth'
  },
  'Communication Skills': {
    excellent: 'Exceptional communicator',
    good: 'Generally a good communicator',
    below_expectation: 'Below expectations',
    poor: 'Critically poor communicator'
  },
  'Leadership': {
    excellent: 'Transformational leader',
    good: 'Generally a good leader',
    below_expectation: 'Below expectations',
    poor: 'Destructive influence'
  }
};

// Comprehensive attribute definitions with full question sets
const COMPREHENSIVE_ATTRIBUTE_DEFINITIONS: Record<string, AttributeDefinition> = {
  'Reliability': {
    name: 'Reliability',
    display_name: 'Reliability',
    definition: 'Reliability is the degree to which someone consistently shows up, follows through, and can be counted on to deliver as promised—even under stress or without supervision.',
    scale_descriptions: {
      excellent: 'Always early or on time, never needs reminders, proactively communicates if delays are possible, follows through 100% of the time. Trusted with mission-critical responsibilities.',
      good: 'Delivers on time and meets commitments. Occasional lapses in punctuality or communication, but not impactful.',
      below_expectation: 'Noticeably inconsistent. Frequently late or fails to follow through. Causes team friction or requires consistent monitoring.',
      poor: 'Fundamentally unreliable in role. Cannot be relied on for basic responsibilities. Undermines team performance.'
    },
    base_questions: [
      {
        id: 'reliability_observed',
        attribute_name: 'Reliability',
        question_text: 'In your experience with this person, which of these have you observed? (Check all that apply)',
        question_type: 'multi_select',
        is_required: true,
        options: [
          'Completes work accurately but often needs deadline extensions',
          'Others actively seek them out for critical or time-sensitive work',
          'Frequently misses deadlines or fails to follow through on commitments',
          'Requires regular check-ins or follow-up to ensure completion',
          'Generally meets commitments with occasional minor delays or reminders needed',
          'Consistently delivers ahead of deadlines and takes ownership without supervision'
        ],
        order: 1
      },
      {
        id: 'reliability_example',
        attribute_name: 'Reliability',
        question_text: 'Any specific example that stands out? (Optional - brief description)',
        question_type: 'text',
        is_required: false,
        placeholder: 'Type NA if you can\'t recall...',
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'reliability_traits_high',
            attribute_name: 'Reliability',
            question_text: 'What reliability traits have you observed consistently over the last 30 days? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Always early or on time',
              'Never needs follow-up or reminders',
              'Takes ownership for critical deadlines without supervision',
              'Recognized by others as dependable person',
              'Communicates proactively when blocked',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'reliability_high_pressure',
            attribute_name: 'Reliability',
            question_text: 'Have they performed reliably in high-pressure or high-stakes situations recently?',
            question_type: 'single_select',
            is_required: true,
            options: ['Yes', 'No', 'Not sure'],
            order: 2
          },
          {
            id: 'reliability_high_pressure_describe',
            attribute_name: 'Reliability',
            question_text: 'Briefly describe the situation.',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'reliability_high_pressure',
                answer_value: ['Yes', 'No']
              }
            },
            order: 3
          },
          {
            id: 'reliability_critical_task',
            attribute_name: 'Reliability',
            question_text: 'Would you assign them a critical task with no follow-up?',
            question_type: 'single_select',
            is_required: true,
            options: ['Yes, absolutely', 'Yes, but with some reservations', 'No'],
            order: 4
          },
          {
            id: 'reliability_critical_how',
            attribute_name: 'Reliability',
            question_text: 'Briefly describe how this person was reliable in this situation.',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'reliability_critical_task',
                answer_value: ['Yes, absolutely']
              }
            },
            order: 5
          },
          {
            id: 'reliability_concerns',
            attribute_name: 'Reliability',
            question_text: 'What concerns would you have?',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'reliability_critical_task',
                answer_value: ['Yes, but with some reservations', 'No']
              }
            },
            order: 6
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'reliability_patterns_mid',
            attribute_name: 'Reliability',
            question_text: 'What reliability patterns best describe them? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Usually on time but occasionally needs reminders',
              'Keeps most commitments but misses small details',
              'Relies on others to track progress',
              'Performs reliably only when actively managed',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'reliability_missed_deadline',
            attribute_name: 'Reliability',
            question_text: 'Have you seen this person miss a deadline in the past month?',
            question_type: 'single_select',
            is_required: true,
            options: ['Yes', 'No', 'Not sure'],
            order: 2
          },
          {
            id: 'reliability_miss_frequency',
            attribute_name: 'Reliability',
            question_text: 'How often do you think this happens?',
            question_type: 'single_select',
            is_required: false,
            options: ['Often', 'Sometimes', 'Rarely', 'Never'],
            conditional_logic: {
              show_if_answer: {
                question_id: 'reliability_missed_deadline',
                answer_value: ['Yes']
              }
            },
            order: 3
          },
          {
            id: 'reliability_inconsistency_cause',
            attribute_name: 'Reliability',
            question_text: 'What do you think contributes most to their inconsistency?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Workload/capacity issues',
              'Unclear priorities or expectations',
              'Skill gaps',
              'Communication challenges',
              'Other (describe)'
            ],
            order: 4
          },
          {
            id: 'reliability_inconsistency_other',
            attribute_name: 'Reliability',
            question_text: 'Please describe the other factor contributing to inconsistency:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'reliability_inconsistency_cause',
                answer_value: ['Other (describe)']
              }
            },
            order: 5
          },
          {
            id: 'reliability_most_reliable',
            attribute_name: 'Reliability',
            question_text: 'In what situations is this person most reliable?',
            question_type: 'text',
            is_required: false,
            order: 6
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'reliability_issues_low',
            attribute_name: 'Reliability',
            question_text: 'What issues have you observed? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Regularly misses deadlines',
              'Doesn\'t inform others when blocked',
              'Needs frequent reminders or monitoring',
              'Drops responsibilities without explanation',
              'Others compensate for their gaps',
              'Other (please describe)'
            ],
            order: 1
          },
          {
            id: 'reliability_issues_other',
            attribute_name: 'Reliability',
            question_text: 'Please describe the other reliability issues:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'reliability_issues_low',
                answer_value: ['Other (please describe)']
              }
            },
            order: 2
          },
          {
            id: 'reliability_frequency',
            attribute_name: 'Reliability',
            question_text: 'How frequent are these behaviors?',
            question_type: 'single_select',
            is_required: true,
            options: ['Multiple times a week', 'Weekly', 'Occasionally', 'Once or twice', 'Isolated incident'],
            order: 3
          },
          {
            id: 'reliability_improvement',
            attribute_name: 'Reliability',
            question_text: 'In your opinion, what would most help this person improve their reliability?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Clearer expectations and deadlines',
              'More frequent check-ins or support',
              'Different role or responsibilities',
              'Skill development in [specific area]',
              'I\'m not sure they can improve in this role',
              'Other (describe)'
            ],
            order: 4
          },
          {
            id: 'reliability_improvement_other',
            attribute_name: 'Reliability',
            question_text: 'Please describe the other improvement approach:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'reliability_improvement',
                answer_value: ['Other (describe)']
              }
            },
            order: 5
          },
          {
            id: 'reliability_team_impact',
            attribute_name: 'Reliability',
            question_text: 'How has this person\'s reliability affected the team or deliverables?',
            question_type: 'text',
            is_required: false,
            order: 6
          }
        ]
      }
    ]
  },
  'Accountability for Action': {
    name: 'Accountability for Action',
    display_name: 'Accountability for Action',
    definition: 'Accountability for Action is the degree to which someone takes ownership of their responsibilities, decisions, and outcomes—especially when things go wrong. It reflects how reliably they acknowledge mistakes, follow through on commitments, and avoid blaming others.',
    scale_descriptions: {
      excellent: 'Exceptionally accountable: Owns outcomes fully, even in failure. Proactively admits mistakes, corrects them quickly, and communicates clearly about lessons learned. Sets an example for others.',
      good: 'Usually responsible for personal tasks and outcomes. May be hesitant to admit mistakes but accepts them with guidance. Some follow-through may require reminders.',
      below_expectation: 'Below standard: Often avoids or delays ownership. Needs coaching to acknowledge faults. Makes excuses or externalizes responsibility.',
      poor: 'Totally unaccountable: Refuses ownership, even when presented with evidence. Undermines trust. Disruptive to team performance and culture.'
    },
    base_questions: [
      {
        id: 'accountability_observed',
        attribute_name: 'Accountability for Action',
        question_text: 'In your experience with this person, which of these have you observed? (Check all that apply)',
        question_type: 'multi_select',
        is_required: true,
        options: [
          'Takes full ownership of mistakes and immediately works to correct them',
          'Generally accepts responsibility but may need gentle prompting occasionally',
          'Acknowledges errors only when directly confronted about them',
          'Consistently makes excuses or blames external factors for problems',
          'Proactively takes accountability for team outcomes, both positive and negative',
          'Admits mistakes but rarely follows through with corrective action'
        ],
        order: 1
      },
      {
        id: 'accountability_example',
        attribute_name: 'Accountability for Action',
        question_text: 'Any specific example that stands out? (Optional - brief description)',
        question_type: 'text',
        is_required: false,
        placeholder: 'Brief description of a specific example...',
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'accountability_traits_high',
            attribute_name: 'Accountability for Action',
            question_text: 'In the last 30 days, which of the following have you observed? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Consistently owns outcomes without being prompted',
              'Accepts responsibility for shared/team issues',
              'Publicly admits mistakes and outlines corrections',
              'Proactively corrects issues before being asked',
              'Trusted by others to "own" high-visibility work',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'accountability_team_ownership',
            attribute_name: 'Accountability for Action',
            question_text: 'Have you seen this person take accountability for team or shared outcomes (not just their individual mistakes)?',
            question_type: 'single_select',
            is_required: true,
            options: ['Yes', 'No', 'Not sure'],
            order: 2
          },
          {
            id: 'accountability_team_describe',
            attribute_name: 'Accountability for Action',
            question_text: 'Briefly describe how this person took accountability.',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'accountability_team_ownership',
                answer_value: ['Yes']
              }
            },
            order: 3
          },
          {
            id: 'accountability_project_trust',
            attribute_name: 'Accountability for Action',
            question_text: 'Would you assign them to lead a project with executive-level visibility and accountability risk?',
            question_type: 'single_select',
            is_required: true,
            options: ['Yes, confidently', 'Yes, but with some reservations', 'No'],
            order: 4
          },
          {
            id: 'accountability_concerns',
            attribute_name: 'Accountability for Action',
            question_text: 'What concerns do you have?',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'accountability_project_trust',
                answer_value: ['Yes, but with some reservations', 'No']
              }
            },
            order: 5
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'accountability_behavior_mid',
            attribute_name: 'Accountability for Action',
            question_text: 'When taking accountability is required, how do they typically behave? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Takes ownership but needs time to process before admitting mistakes',
              'Accountable for individual work but hesitates on team-level issues',
              'Admits errors readily but follow-through varies in quality/speed',
              'Strong accountability in familiar areas, weaker in new/complex situations',
              'Accepts feedback about accountability gaps and works to improve',
              'Generally reliable but occasionally gets defensive initially'
            ],
            order: 1
          },
          {
            id: 'accountability_barriers',
            attribute_name: 'Accountability for Action',
            question_text: 'What do you think prevents this person from taking fuller accountability?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Fear of consequences/judgment',
              'Lack of clarity on expectations',
              'Defensive personality trait',
              'Insufficient support when mistakes happen',
              'Workload/stress factors',
              'Other (describe)'
            ],
            order: 2
          },
          {
            id: 'accountability_barriers_other',
            attribute_name: 'Accountability for Action',
            question_text: 'Please describe the other factor:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'accountability_barriers',
                answer_value: ['Other (describe)']
              }
            },
            order: 3
          },
          {
            id: 'accountability_support',
            attribute_name: 'Accountability for Action',
            question_text: 'What support would help them improve?',
            question_type: 'text',
            is_required: false,
            order: 4
          },
          {
            id: 'accountability_situations',
            attribute_name: 'Accountability for Action',
            question_text: 'Describe situations where this person shows strongest vs. weakest accountability patterns.',
            question_type: 'text',
            is_required: false,
            order: 5
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'accountability_breakdowns',
            attribute_name: 'Accountability for Action',
            question_text: 'What accountability breakdowns have you personally observed? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Regularly blames others or avoids fault',
              'Needs external pressure to follow through',
              'Deflects, omits, or reframes facts to dodge accountability',
              'Undermines team trust by not "owning" mistakes',
              'Doesn\'t follow through, even after reminders',
              'Other (please describe)'
            ],
            order: 1
          },
          {
            id: 'accountability_breakdowns_other',
            attribute_name: 'Accountability for Action',
            question_text: 'Please describe the other accountability breakdowns:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'accountability_breakdowns',
                answer_value: ['Other (please describe)']
              }
            },
            order: 2
          },
          {
            id: 'accountability_frequency',
            attribute_name: 'Accountability for Action',
            question_text: 'How often do these issues happen?',
            question_type: 'single_select',
            is_required: true,
            options: ['Multiple times per month', 'Monthly', 'Occasionally', 'One-time or rare', 'Unsure'],
            order: 3
          },
          {
            id: 'accountability_impact',
            attribute_name: 'Accountability for Action',
            question_text: 'What was the impact of this person\'s lack of accountability on the team, outcomes, or trust?',
            question_type: 'text',
            is_required: false,
            order: 4
          }
        ]
      }
    ]
  },
  'Quality of Work': {
    name: 'Quality of Work',
    display_name: 'Quality of Work',
    definition: 'Quality of Work refers to the consistency, accuracy, clarity, and attention to detail in an employee\'s output. High-quality work meets or exceeds expectations with minimal rework, error, or supervision.',
    scale_descriptions: {
      excellent: 'Exceptionally high quality: Produces error-free, clear, and thorough work. Anticipates edge cases or requirements and exceeds expectations consistently. Sets the standard for excellence.',
      good: 'Generally meets expectations for quality. Occasionally makes minor mistakes or misses detail, but overall work is usable and effective.',
      below_expectation: 'Below expectations: Frequent errors or inconsistencies. Requires editing, clarification, or supervisor follow-up more often than not.',
      poor: 'Unacceptable work quality: Cannot deliver basic expectations. Output is consistently unusable or requires full redo.'
    },
    base_questions: [
      {
        id: 'quality_observed',
        attribute_name: 'Quality of Work',
        question_text: 'In your experience with this person\'s work output, which of these have you observed? (Check all that apply)',
        question_type: 'multi_select',
        is_required: true,
        options: [
          'Delivers exceptional work that exceeds standards and serves as a model for others',
          'Produces consistently solid work with minimal revisions needed',
          'Completes adequate work but occasionally misses minor details or requirements',
          'Frequently submits work requiring significant corrections or rework',
          'Others regularly reference their output as the gold standard',
          'Takes care to understand requirements but execution sometimes falls short',
          'Meets requirements accurately but rarely adds insights or improvements'
        ],
        order: 1
      },
      {
        id: 'quality_example',
        attribute_name: 'Quality of Work',
        question_text: 'Any specific example that stands out? (Optional - brief description)',
        question_type: 'text',
        is_required: false,
        placeholder: 'Brief description of a specific example...',
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'quality_output_high',
            attribute_name: 'Quality of Work',
            question_text: 'What best describes this person\'s output in the last 30 days? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Nearly always error-free or self-corrected before delivery',
              'Exceeds expectations in structure, clarity, or finish',
              'Requires little to no review or rework',
              'Sets a quality benchmark for peers',
              'Improves team deliverables through feedback, tools, or standards',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'quality_revisions_needed',
            attribute_name: 'Quality of Work',
            question_text: 'How often do their deliverables need clarification, revisions, or corrections?',
            question_type: 'single_select',
            is_required: true,
            options: ['Never', 'Rarely', 'Occasionally', 'Often', 'Not sure'],
            order: 2
          },
          {
            id: 'quality_revision_types',
            attribute_name: 'Quality of Work',
            question_text: 'What types of revisions are needed?',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'quality_revisions_needed',
                answer_value: ['Occasionally', 'Often']
              }
            },
            order: 3
          },
          {
            id: 'quality_helps_others',
            attribute_name: 'Quality of Work',
            question_text: 'Have they helped others improve their work quality (e.g., through coaching, feedback, standards)?',
            question_type: 'single_select',
            is_required: true,
            options: ['Yes', 'No', 'Not sure'],
            order: 4
          },
          {
            id: 'quality_helps_describe',
            attribute_name: 'Quality of Work',
            question_text: 'Briefly describe how or when.',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'quality_helps_others',
                answer_value: ['Yes']
              }
            },
            order: 5
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'quality_issues_mid',
            attribute_name: 'Quality of Work',
            question_text: 'What quality issues or inconsistencies have you observed recently? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Work is generally good, but inconsistent',
              'Lacks clarity, formatting, or polish',
              'Often requires clarification from others',
              'Has a pattern of minor but recurring errors',
              'Meets expectations, but rarely exceeds them',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'quality_best_work_type',
            attribute_name: 'Quality of Work',
            question_text: 'In what types of work does this person produce their highest quality?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Familiar/routine tasks',
              'Creative/strategic work',
              'Collaborative projects',
              'Independent work',
              'Technical/analytical tasks',
              'Client-facing deliverables'
            ],
            order: 2
          },
          {
            id: 'quality_inconsistency_causes',
            attribute_name: 'Quality of Work',
            question_text: 'What do you think most contributes to their quality inconsistencies?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Rushing due to workload/deadlines',
              'Insufficient understanding of requirements',
              'Lack of review/checking processes',
              'Missing tools or resources',
              'Unclear quality standards',
              'Other (describe)'
            ],
            order: 3
          },
          {
            id: 'quality_inconsistency_other',
            attribute_name: 'Quality of Work',
            question_text: 'Please describe the other factor:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'quality_inconsistency_causes',
                answer_value: ['Other (describe)']
              }
            },
            order: 4
          },
          {
            id: 'quality_feedback',
            attribute_name: 'Quality of Work',
            question_text: 'What feedback have you given (or would you give) to help improve their quality of work?',
            question_type: 'text',
            is_required: false,
            order: 5
          },
          {
            id: 'quality_visibility_confidence',
            attribute_name: 'Quality of Work',
            question_text: 'If given a high-visibility project (visible to senior leadership or clients), how confident would you be in their output quality?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very confident',
              'Mostly confident',
              'Somewhat concerned',
              'Not confident',
              'Would not assign them such a project'
            ],
            order: 6
          },
          {
            id: 'quality_concern_type',
            attribute_name: 'Quality of Work',
            question_text: 'Is it accuracy, polish, consistency, or something else?',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'quality_visibility_confidence',
                answer_value: ['Somewhat concerned', 'Not confident', 'Would not assign them such a project']
              }
            },
            order: 7
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'quality_concerns_low',
            attribute_name: 'Quality of Work',
            question_text: 'What specific concerns about work quality have you observed? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Frequent errors that impact delivery',
              'Poor attention to detail',
              'Incomplete or careless work submissions',
              'Substandard clarity or formatting',
              'Quality issues caused confusion or rework for others',
              'Other (please explain)'
            ],
            order: 1
          },
          {
            id: 'quality_concerns_other',
            attribute_name: 'Quality of Work',
            question_text: 'Please explain the other quality concerns:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'quality_concerns_low',
                answer_value: ['Other (please explain)']
              }
            },
            order: 2
          },
          {
            id: 'quality_duration',
            attribute_name: 'Quality of Work',
            question_text: 'How long have these quality issues been occurring?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Recent development (last 1-3 months)',
              'Ongoing issue (3-6 months)',
              'Long-standing pattern (6+ months)',
              'Not sure'
            ],
            order: 3
          },
          {
            id: 'quality_improvement_support',
            attribute_name: 'Quality of Work',
            question_text: 'What type of support do you think would most help this person improve their work quality?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'More detailed requirements/specifications',
              'Additional training or skill development',
              'Better review processes or checkpoints',
              'Different types of assignments',
              'More time for quality checks',
              'I don\'t think they can improve significantly',
              'Other (describe)'
            ],
            order: 4
          },
          {
            id: 'quality_improvement_other',
            attribute_name: 'Quality of Work',
            question_text: 'Please describe the other improvement approach:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'quality_improvement_support',
                answer_value: ['Other (describe)']
              }
            },
            order: 5
          },
          {
            id: 'quality_feedback_given',
            attribute_name: 'Quality of Work',
            question_text: 'Have you given feedback on these issues before?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Yes, and they improved',
              'Yes, but little or no improvement',
              'No, not yet',
              'Not sure'
            ],
            order: 6
          },
          {
            id: 'quality_team_impact',
            attribute_name: 'Quality of Work',
            question_text: 'How has this person\'s work quality affected the team or deliverables?',
            question_type: 'text',
            is_required: false,
            order: 7
          },
          {
            id: 'quality_score_basis',
            attribute_name: 'Quality of Work',
            question_text: 'Was your score shaped more by one standout project or consistent patterns?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'One standout project',
              'Mostly consistent performance',
              'A mix of both',
              'Not sure'
            ],
            order: 8
          }
        ]
      }
    ]
  },
  'Taking Initiative': {
    name: 'Taking Initiative',
    display_name: 'Taking Initiative',
    definition: 'Taking Initiative refers to how often and how effectively someone acts without being told—whether solving problems, identifying opportunities, or contributing beyond their defined responsibilities.',
    scale_descriptions: {
      excellent: 'Proactive leader: Consistently anticipates needs, initiates improvements, and takes ownership beyond their role. Creates momentum for others.',
      good: 'Generally takes initiative but typically sticks to assigned tasks. Will volunteer when encouraged.',
      below_expectation: 'Below expectations: Reluctant to act without direction. Avoids additional responsibilities even when capable.',
      poor: 'Opposes initiative: Undermines proactive efforts. Discourages others or refuses to act beyond job description.'
    },
    base_questions: [
      {
        id: 'initiative_observed',
        attribute_name: 'Taking Initiative',
        question_text: 'In your experience with this person, which of these have you observed? (Check all that apply)',
        question_type: 'multi_select',
        is_required: true,
        options: [
          'Proactively identifies and solves problems before they escalate',
          'Generally takes action when needed but may wait for some guidance on complex issues',
          'Requires clear direction and detailed instructions to move forward',
          'Consistently avoids responsibility beyond their basic job requirements',
          'Regularly brings innovative ideas and volunteers for challenging projects',
          'Recognizes opportunities for improvement but rarely acts without approval',
          'Takes initiative in some areas but hesitates when stakes are higher or visibility increases'
        ],
        order: 1
      },
      {
        id: 'initiative_example',
        attribute_name: 'Taking Initiative',
        question_text: 'Any specific example that stands out? (Optional - brief description)',
        question_type: 'text',
        is_required: false,
        placeholder: 'Brief description of a specific example...',
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'initiative_examples_high',
            attribute_name: 'Taking Initiative',
            question_text: 'Which of the following examples of initiative has this person demonstrated recently (last 30 days)? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Stepped up on a task or project without being asked',
              'Proposed improvements or created something new proactively',
              'Solved a problem before it escalated',
              'Acted to support teammates without being directed',
              'Took ownership in an area outside their normal scope',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'initiative_frequency',
            attribute_name: 'Taking Initiative',
            question_text: 'Frequency of initiative (give your best answer)',
            question_type: 'single_select',
            is_required: true,
            options: ['Weekly', 'Monthly', 'Rarely', 'Not sure'],
            order: 2
          },
          {
            id: 'initiative_impact_level',
            attribute_name: 'Taking Initiative',
            question_text: 'Impact level of most recent action',
            question_type: 'single_select',
            is_required: true,
            options: ['Minor', 'Moderate', 'Major'],
            order: 3
          },
          {
            id: 'initiative_examples_describe',
            attribute_name: 'Taking Initiative',
            question_text: 'Provide 1–2 examples of impactful initiative this person has taken recently.',
            question_type: 'text',
            is_required: false,
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'initiative_situations_mid',
            attribute_name: 'Taking Initiative',
            question_text: 'In what situations do they tend to take initiative? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Primarily takes initiative only in familiar tasks',
              'After others hesitate or delay',
              'When they\'re passionate about the topic',
              'Rarely acts without direct prompting',
              'Occasionally in ambiguous situations',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'initiative_prevention',
            attribute_name: 'Taking Initiative',
            question_text: 'What do you think prevents this person from taking more initiative?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Unclear boundaries or authority',
              'Fear of overstepping or making mistakes',
              'Lack of confidence in their ideas',
              'Too focused on existing workload',
              'Waiting for explicit permission/encouragement',
              'Limited visibility into broader needs/opportunities',
              'Other (describe)'
            ],
            order: 2
          },
          {
            id: 'initiative_prevention_other',
            attribute_name: 'Taking Initiative',
            question_text: 'Please describe the other factor:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'initiative_prevention',
                answer_value: ['Other (describe)']
              }
            },
            order: 3
          },
          {
            id: 'initiative_success_conditions',
            attribute_name: 'Taking Initiative',
            question_text: 'When they DO take initiative, what conditions make them most successful?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Clear problem definition',
              'Working with familiar team members',
              'Lower-stakes situations',
              'Areas of personal expertise',
              'When given explicit encouragement',
              'Other (describe)'
            ],
            order: 4
          },
          {
            id: 'initiative_success_other',
            attribute_name: 'Taking Initiative',
            question_text: 'Please describe the other success condition:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'initiative_success_conditions',
                answer_value: ['Other (describe)']
              }
            },
            order: 5
          },
          {
            id: 'initiative_consistency',
            attribute_name: 'Taking Initiative',
            question_text: 'How consistent is their initiative across different types of work?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Consistently proactive across roles',
              'Somewhat consistent — depends on scope or context',
              'Infrequent unless directly responsible',
              'Not sure'
            ],
            order: 6
          },
          {
            id: 'initiative_important_change',
            attribute_name: 'Taking Initiative',
            question_text: 'What\'s the most important change that would increase their initiative?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'More confidence in decision-making',
              'Clearer understanding of when initiative is expected',
              'Better problem identification skills',
              'Greater authority/permission to act',
              'More recognition when they do take initiative',
              'Different types of opportunities',
              'Other (describe)'
            ],
            order: 7
          },
          {
            id: 'initiative_change_other',
            attribute_name: 'Taking Initiative',
            question_text: 'Please describe the other change needed:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'initiative_important_change',
                answer_value: ['Other (describe)']
              }
            },
            order: 8
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'initiative_issues_low',
            attribute_name: 'Taking Initiative',
            question_text: 'What issues have you observed related to initiative? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Avoids acting unless explicitly told',
              'Doesn\'t step up when gaps appear',
              'Misses opportunities to contribute beyond the minimum',
              'Avoids ambiguity or risk',
              'Ignores or delays emerging issues',
              'Other (please describe)'
            ],
            order: 1
          },
          {
            id: 'initiative_issues_other',
            attribute_name: 'Taking Initiative',
            question_text: 'Please describe the other initiative issues:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'initiative_issues_low',
                answer_value: ['Other (please describe)']
              }
            },
            order: 2
          },
          {
            id: 'initiative_lack_primary_cause',
            attribute_name: 'Taking Initiative',
            question_text: 'Do you think this person\'s lack of initiative is primarily due to:',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Not recognizing opportunities (awareness issue)',
              'Recognizing but not knowing how to act (skill issue)',
              'Knowing what to do but avoiding risk/responsibility (motivation issue)',
              'Unclear expectations about when initiative is appropriate',
              'Overwhelmed with current responsibilities',
              'Other (describe)'
            ],
            order: 3
          },
          {
            id: 'initiative_cause_other',
            attribute_name: 'Taking Initiative',
            question_text: 'Please describe the other primary cause:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'initiative_lack_primary_cause',
                answer_value: ['Other (describe)']
              }
            },
            order: 4
          },
          {
            id: 'initiative_behavior_frequency',
            attribute_name: 'Taking Initiative',
            question_text: 'How frequently do these behaviors occur?',
            question_type: 'single_select',
            is_required: true,
            options: ['Weekly or more', 'Occasionally', 'Rare or one-time', 'Not sure'],
            order: 5
          },
          {
            id: 'initiative_improvement_likelihood',
            attribute_name: 'Taking Initiative',
            question_text: 'If this person received coaching on initiative, how likely do you think improvement would be?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very likely - they have the foundation',
              'Possible with significant support and clear expectations',
              'Unlikely - seems to be a fundamental preference/trait',
              'Not sure'
            ],
            order: 6
          },
          {
            id: 'initiative_confidence_change',
            attribute_name: 'Taking Initiative',
            question_text: 'What would need to change for you to feel confident in this person\'s proactive contributions?',
            question_type: 'text',
            is_required: false,
            order: 7
          }
        ]
      }
    ]
  },
  'Adaptability': {
    name: 'Adaptability',
    display_name: 'Adaptability',
    definition: 'Adaptability refers to how well a person adjusts to changes in priorities, plans, teams, environments, or expectations. It includes staying composed under stress, learning from feedback, and being willing to try new approaches.',
    scale_descriptions: {
      excellent: 'Exceptionally adaptable: Embraces change positively. Can pivot quickly, maintain productivity, and guide others through change. Thrives in ambiguity.',
      good: 'Generally adaptable, though may take some time to adjust. Accepts new directions with minor hesitation.',
      below_expectation: 'Below expectations: Shows visible discomfort with change. Resists alterations in process or responsibility. Slow to adapt.',
      poor: 'Completely unadaptable: Shuts down under change. Cannot function or collaborate in evolving environments.'
    },
    base_questions: [
      {
        id: 'adaptability_observed',
        attribute_name: 'Adaptability',
        question_text: 'In your experience with this person during changes or uncertainty, which of these have you observed? (Check all that apply)',
        question_type: 'multi_select',
        is_required: true,
        options: [
          'Thrives during change and helps guide others through transitions smoothly',
          'Adjusts well to most changes with only brief periods of adjustment',
          'Adapts eventually but needs time and support during transitions',
          'Becomes notably stressed or resistant when faced with unexpected changes',
          'Maintains high performance and composure even during major organizational shifts',
          'Handles routine changes adequately but struggles with significant or frequent disruptions',
          'Shows strong adaptability in technical/process changes but struggles with interpersonal or cultural shifts'
        ],
        order: 1
      },
      {
        id: 'adaptability_example',
        attribute_name: 'Adaptability',
        question_text: 'Any specific example that stands out? (Optional - brief description) Type NA if you can\'t recall',
        question_type: 'text',
        is_required: false,
        placeholder: 'Type NA if you can\'t recall...',
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'adaptability_examples_high',
            attribute_name: 'Adaptability',
            question_text: 'Which of the following examples of adaptability has this person shown recently? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Stayed calm and productive during unexpected changes',
              'Shifted gears between tasks, teams, or tools without friction',
              'Helped others adapt to a new plan or environment',
              'Found creative solutions under pressure or uncertainty',
              'Handled unclear direction or goals with minimal guidance',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'adaptability_helps_others',
            attribute_name: 'Adaptability',
            question_text: 'When others struggle with change, how does this person typically respond?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Actively helps and coaches others through transitions',
              'Available for support when asked but doesn\'t proactively help',
              'Focuses on their own adaptation first',
              'Sometimes impatient with others who struggle to adapt',
              'Not sure'
            ],
            order: 2
          },
          {
            id: 'adaptability_incomplete_requirements',
            attribute_name: 'Adaptability',
            question_text: 'How well do they perform when given incomplete or changing requirements?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Thrives with minimal direction - fills gaps effectively',
              'Performs well but seeks clarification when needed',
              'Generally good but prefers more structure',
              'Needs significant guidance in ambiguous situations',
              'Not sure'
            ],
            order: 3
          },
          {
            id: 'adaptability_major_change_recovery',
            attribute_name: 'Adaptability',
            question_text: 'When a major change disrupts their work, how quickly do they return to full productivity?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Immediately - often more productive than before',
              'Within a few days with minimal impact',
              'Takes 1-2 weeks to fully adjust',
              'Longer adjustment periods',
              'Not sure'
            ],
            order: 4
          },
          {
            id: 'adaptability_priority_changes',
            attribute_name: 'Adaptability',
            question_text: 'How do they typically respond to shifting priorities or last-minute changes?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Embrace it and re-prioritize effectively',
              'Struggle initially, but adapt',
              'Quickly re-prioritizes even without clarity',
              'Resist or push back',
              'Not sure'
            ],
            order: 5
          },
          {
            id: 'adaptability_examples_describe',
            attribute_name: 'Adaptability',
            question_text: 'Provide 1–2 examples of this person handling change or ambiguity effectively.',
            question_type: 'text',
            is_required: false,
            order: 6
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'adaptability_challenging_changes',
            attribute_name: 'Adaptability',
            question_text: 'What types of changes seem to challenge this person most? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Technical change',
              'Strategic change',
              'Team change',
              'Process change',
              'Cultural change',
              'Not sure'
            ],
            order: 1
          },
          {
            id: 'adaptability_energizing_changes',
            attribute_name: 'Adaptability',
            question_text: 'What types of changes seem to energize this person? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Technical change',
              'Strategic change',
              'Team change',
              'Process change',
              'Cultural change',
              'Not sure'
            ],
            order: 2
          },
          {
            id: 'adaptability_communication_during_change',
            attribute_name: 'Adaptability',
            question_text: 'How effectively do they communicate during periods of change or uncertainty?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Transparent about concerns and needs',
              'Generally communicates well but may need prompting',
              'Tends to keep concerns to themselves',
              'Communication becomes unclear or negative',
              'Not sure'
            ],
            order: 3
          },
          {
            id: 'adaptability_coaching_support',
            attribute_name: 'Adaptability',
            question_text: 'What coaching or support would make them more adaptable in tough conditions?',
            question_type: 'text',
            is_required: false,
            order: 4
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'adaptability_concerns_low',
            attribute_name: 'Adaptability',
            question_text: 'What concerns have you observed around adaptability? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Reacts poorly to last-minute or ambiguous requests',
              'Struggles to change gears or routines',
              'Pushes back on new processes, roles, or expectations',
              'Causes delay or disruption when plans shift',
              'Disengages during uncertainty',
              'Other (please describe)'
            ],
            order: 1
          },
          {
            id: 'adaptability_concerns_other',
            attribute_name: 'Adaptability',
            question_text: 'Please describe the other adaptability concerns:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'adaptability_concerns_low',
                answer_value: ['Other (please describe)']
              }
            },
            order: 2
          },
          {
            id: 'adaptability_behavior_frequency',
            attribute_name: 'Adaptability',
            question_text: 'How frequently do these behaviors occur?',
            question_type: 'single_select',
            is_required: true,
            options: ['Weekly or more', 'Occasionally', 'Rare or one-time', 'Not sure'],
            order: 3
          },
          {
            id: 'adaptability_difficult_changes',
            attribute_name: 'Adaptability',
            question_text: 'Which types of changes cause the most difficulty for this person?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Technology or process changes',
              'Organizational structure or reporting changes',
              'Priority or deadline changes',
              'Team composition or role changes',
              'Strategic direction changes',
              'All types of changes equally',
              'Other (describe)'
            ],
            order: 4
          },
          {
            id: 'adaptability_difficult_other',
            attribute_name: 'Adaptability',
            question_text: 'Please describe the other difficult change types:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'adaptability_difficult_changes',
                answer_value: ['Other (describe)']
              }
            },
            order: 5
          },
          {
            id: 'adaptability_improvement_possibility',
            attribute_name: 'Adaptability',
            question_text: 'Based on your observations, do you think this person could improve their adaptability with:',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Clear communication about why changes are needed',
              'More time and support during transitions',
              'Training on change management skills',
              'Different types of changes (gradual vs. sudden)',
              'It seems to be a fundamental trait - unlikely to change significantly',
              'Not sure'
            ],
            order: 6
          },
          {
            id: 'adaptability_rigidity_impact',
            attribute_name: 'Adaptability',
            question_text: 'How has this rigidity or resistance affected their output or the team?',
            question_type: 'text',
            is_required: false,
            order: 7
          }
        ]
      }
    ]
  },
  'Problem Solving Ability': {
    name: 'Problem Solving Ability',
    display_name: 'Problem Solving Ability',
    definition: 'Problem Solving Ability is the extent to which someone identifies, analyzes, and resolves issues effectively—especially under pressure or in ambiguous situations. It includes critical thinking, creativity, and the ability to make sound decisions with limited guidance.',
    scale_descriptions: {
      excellent: 'Exceptional problem solver: Rapidly identifies root causes, evaluates multiple options, and implements effective solutions. Thinks creatively under pressure and mentors others in problem solving.',
      good: 'Generally good at problem solving: Handles most day-to-day issues well. May struggle slightly with complexity but seeks help appropriately.',
      below_expectation: 'Below expectations: Struggles to resolve problems independently. Often needs help defining or analyzing issues.',
      poor: 'Fails to engage in problem solving: Avoids responsibility, takes no initiative, or regularly makes situations worse.'
    },
    base_questions: [
      {
        id: 'problem_solving_observed',
        attribute_name: 'Problem Solving Ability',
        question_text: 'In your experience with this person when facing challenges, which of these have you observed? (Check all that apply)',
        question_type: 'multi_select',
        is_required: true,
        options: [
          'Consistently finds creative solutions to complex problems and helps others through challenges',
          'Generally works through problems methodically with occasional need for guidance',
          'Handles routine problems well but struggles when issues become complex or unclear',
          'Frequently avoids difficult problems or gives up when facing obstacles',
          'Others seek them out specifically for their problem-solving expertise and insight',
          'Attempts to solve problems but often needs significant support to reach effective solutions'
        ],
        order: 1
      },
      {
        id: 'problem_solving_example',
        attribute_name: 'Problem Solving Ability',
        question_text: 'Any specific example that stands out? (Optional - brief description)',
        question_type: 'text',
        is_required: false,
        placeholder: 'Brief description of a specific example...',
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'problem_solving_behaviors_high',
            attribute_name: 'Problem Solving Ability',
            question_text: 'Which of these problem-solving behaviors have you seen in the last 30 days? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Solved a complex issue without needing detailed guidance',
              'Tackled a challenge creatively or from multiple angles',
              'Found the root cause of a recurring issue',
              'Took initiative to fix something before it escalated',
              'Helped others improve their problem-solving approach',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'problem_solving_unexpected_response',
            attribute_name: 'Problem Solving Ability',
            question_text: 'When problems arise unexpectedly, how do they usually respond?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Stay calm and quickly assess options',
              'Default to proven solutions',
              'Wait for direction',
              'Tend to escalate instead of solving',
              'Not sure'
            ],
            order: 2
          },
          {
            id: 'problem_solving_others_bring_problems',
            attribute_name: 'Problem Solving Ability',
            question_text: 'When others bring complex problems to this person, what typically happens?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'They help others think through solutions effectively',
              'They solve it themselves but teach the approach',
              'They collaborate well to find joint solutions',
              'Others mostly just want them to fix it',
              'Not sure'
            ],
            order: 3
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'problem_solving_performance_mid',
            attribute_name: 'Problem Solving Ability',
            question_text: 'How does this person typically perform when solving problems? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Proactively addresses technical or process-related challenges',
              'Responds well under pressure when issues are clear',
              'Can resolve interpersonal or team issues constructively',
              'Occasionally avoids ambiguous or sensitive problems',
              'Jumps into action quickly but misses deeper analysis',
              'Offers solutions but needs guidance to implement',
              'Often reluctant to engage with high-stakes or complex issues',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'problem_solving_struggle_response',
            attribute_name: 'Problem Solving Ability',
            question_text: 'When they struggle with problem solving, what usually happens?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'They recognize the struggle and seek appropriate help',
              'They persist but may take longer than optimal',
              'They avoid the problem or delay addressing it',
              'They try the same approach repeatedly',
              'Other (describe)'
            ],
            order: 2
          },
          {
            id: 'problem_solving_struggle_other',
            attribute_name: 'Problem Solving Ability',
            question_text: 'Please describe the other response:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'problem_solving_struggle_response',
                answer_value: ['Other (describe)']
              }
            },
            order: 3
          },
          {
            id: 'problem_solving_unfamiliar_first_step',
            attribute_name: 'Problem Solving Ability',
            question_text: 'When faced with unfamiliar problems, what do they typically do first?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Try to solve it themselves',
              'Ask for clarification or guidance',
              'Delay action until others step in',
              'Escalate the issue',
              'Varies significantly case-by-case'
            ],
            order: 4
          },
          {
            id: 'problem_solving_varies_case',
            attribute_name: 'Problem Solving Ability',
            question_text: 'Please describe a recent case where they adapted or struggled.',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'problem_solving_unfamiliar_first_step',
                answer_value: ['Varies significantly case-by-case']
              }
            },
            order: 5
          },
          {
            id: 'problem_solving_coaching_needed',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What coaching or experience would help this person improve their problem-solving confidence or outcomes?',
            question_type: 'text',
            is_required: false,
            order: 6
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'problem_solving_gaps_low',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What specific problem-solving gaps have you observed? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Misses obvious problems or reacts too late',
              'Relies on others to diagnose or fix issues',
              'Repeats ineffective solutions',
              'Avoids responsibility when problems arise',
              'Fails to learn from past mistakes',
              'Other (please describe)'
            ],
            order: 1
          },
          {
            id: 'problem_solving_gaps_other',
            attribute_name: 'Problem Solving Ability',
            question_text: 'Please describe the other problem-solving gaps:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'problem_solving_gaps_low',
                answer_value: ['Other (please describe)']
              }
            },
            order: 2
          },
          {
            id: 'problem_solving_gap_frequency',
            attribute_name: 'Problem Solving Ability',
            question_text: 'How frequently does this problem-solving gap occur?',
            question_type: 'single_select',
            is_required: true,
            options: ['Weekly or more', 'Occasionally', 'Rare or one-time', 'Not sure'],
            order: 3
          },
          {
            id: 'problem_solving_avoids_most',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What type of problems does this person avoid most?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Complex analytical problems',
              'Interpersonal conflicts or sensitive issues',
              'Problems requiring quick decisions',
              'Issues outside their comfort zone',
              'Problems with unclear solutions',
              'Any problems that might involve criticism',
              'Other (describe)'
            ],
            order: 4
          },
          {
            id: 'problem_solving_avoids_other',
            attribute_name: 'Problem Solving Ability',
            question_text: 'Please describe the other types of problems they avoid:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'problem_solving_avoids_most',
                answer_value: ['Other (describe)']
              }
            },
            order: 5
          },
          {
            id: 'problem_solving_struggles_primary',
            attribute_name: 'Problem Solving Ability',
            question_text: 'Do you think this person\'s problem-solving struggles are primarily:',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Knowledge/skill gaps that could be addressed with training',
              'Analysis paralysis or lack of confidence',
              'Avoidance of responsibility or accountability',
              'Overwhelmed by current workload',
              'Fundamental reasoning difficulties',
              'Other (describe)'
            ],
            order: 6
          },
          {
            id: 'problem_solving_primary_other',
            attribute_name: 'Problem Solving Ability',
            question_text: 'Please describe the other primary struggle:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'problem_solving_struggles_primary',
                answer_value: ['Other (describe)']
              }
            },
            order: 7
          },
          {
            id: 'problem_solving_impact',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What\'s the impact of this behavior on project flow, decision-making, or team confidence?',
            question_type: 'text',
            is_required: false,
            order: 8
          }
        ]
      }
    ]
  },
  'Teamwork': {
    name: 'Teamwork',
    display_name: 'Teamwork',
    definition: 'Teamwork refers to how effectively someone works with others toward shared goals. It includes communication, cooperation, conflict resolution, and the ability to contribute meaningfully in group settings.',
    scale_descriptions: {
      excellent: 'Model team player: Actively supports teammates, resolves conflict constructively, and elevates the group. Trusted in every team setting.',
      good: 'Generally effective in teams: Participates and delivers, but may defer too much or avoid conflict.',
      below_expectation: 'Below expectations: Inconsistent engagement. Sometimes creates tension, miscommunicates, or fails to support peers.',
      poor: 'Toxic teammate: Actively harms group performance through blame, hostility, or refusal to cooperate.'
    },
    base_questions: [
      {
        id: 'teamwork_observed',
        attribute_name: 'Teamwork',
        question_text: 'In your experience with this person in team settings, which of these have you observed? (Check all that apply)',
        question_type: 'multi_select',
        is_required: true,
        options: [
          'Actively strengthens team dynamics and goes above and beyond to support colleagues',
          'Collaborates well with most people and contributes positively to team goals',
          'Works adequately in teams but tends to focus primarily on their own responsibilities',
          'Creates tension or conflict that negatively impacts team productivity and morale',
          'Others specifically request to work with them because of their collaborative skills',
          'Participates in team activities but requires encouragement to fully engage or contribute'
        ],
        order: 1
      },
      {
        id: 'teamwork_example',
        attribute_name: 'Teamwork',
        question_text: 'Any specific example that stands out? (Optional - brief description)',
        question_type: 'text',
        is_required: false,
        placeholder: 'Brief description of a specific example...',
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'teamwork_exceptional_behaviors',
            attribute_name: 'Teamwork',
            question_text: 'In the past 30 days, how has this person shown exceptional teamwork? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Proactively supported a teammate with their workload or a blocker',
              'Resolved or defused conflict with maturity',
              'Took on an unglamorous task for the team\'s success',
              'Helped others improve or grow through feedback or collaboration',
              'Elevated the group by improving communication, clarity, or cohesion',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'teamwork_conflict_handling',
            attribute_name: 'Teamwork',
            question_text: 'How does this person handle team conflict or disagreements?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Addresses issues directly and constructively',
              'Helps mediate and find common ground',
              'Stays neutral but supports resolution',
              'Prevents conflicts through proactive communication',
              'Not sure - haven\'t observed conflict situations'
            ],
            order: 2
          },
          {
            id: 'teamwork_team_description',
            attribute_name: 'Teamwork',
            question_text: 'How would others on the team describe this person\'s collaborative style?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Highly dependable and team-oriented',
              'Positive but not always available',
              'Quiet contributor',
              'Selective collaborator (only with certain teammates)',
              'Not sure'
            ],
            order: 3
          },
          {
            id: 'teamwork_strengthened_examples',
            attribute_name: 'Teamwork',
            question_text: 'Share 1–2 recent examples of how this person strengthened a team effort.',
            question_type: 'text',
            is_required: false,
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'teamwork_behavior_patterns',
            attribute_name: 'Teamwork',
            question_text: 'Which of these describe their team behavior? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Works well in familiar teams but avoids broader collaboration',
              'Helpful when asked but not proactive',
              'Contributes but rarely takes initiative to unify the group',
              'Avoids difficult team dynamics or personalities',
              'Shows strong teamwork in some projects, but inconsistently',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'teamwork_best_situations',
            attribute_name: 'Teamwork',
            question_text: 'In what team situations does this person perform best?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Small, familiar teams',
              'Cross-functional or diverse teams',
              'Project-based temporary teams',
              'Ongoing operational teams',
              'High-pressure deadline situations',
              'Low-stakes, routine collaboration',
              'Other (describe)'
            ],
            order: 2
          },
          {
            id: 'teamwork_best_other',
            attribute_name: 'Teamwork',
            question_text: 'Please describe the other team situation:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'teamwork_best_situations',
                answer_value: ['Other (describe)']
              }
            },
            order: 3
          },
          {
            id: 'teamwork_effectiveness_barriers',
            attribute_name: 'Teamwork',
            question_text: 'What prevents this person from being a more effective team member?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Lack of confidence in group settings',
              'Tendency to avoid conflict or difficult conversations',
              'Focus on individual work over team goals',
              'Communication style doesn\'t always resonate',
              'Reluctance to take on team leadership roles',
              'Workload prevents full team engagement',
              'Other (describe)'
            ],
            order: 4
          },
          {
            id: 'teamwork_barriers_other',
            attribute_name: 'Teamwork',
            question_text: 'Please describe the other barrier:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'teamwork_effectiveness_barriers',
                answer_value: ['Other (describe)']
              }
            },
            order: 5
          },
          {
            id: 'teamwork_cross_functional_confidence',
            attribute_name: 'Teamwork',
            question_text: 'How would you feel assigning this person to lead or support a cross-functional team project?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very confident',
              'Somewhat confident',
              'Not confident',
              'Wouldn\'t assign them to that role',
              'Not sure'
            ],
            order: 6
          },
          {
            id: 'teamwork_assignment_concerns',
            attribute_name: 'Teamwork',
            question_text: 'Explain what would need to change.',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'teamwork_cross_functional_confidence',
                answer_value: ['Not confident', 'Wouldn\'t assign them to that role']
              }
            },
            order: 7
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'teamwork_concerns_low',
            attribute_name: 'Teamwork',
            question_text: 'What teamwork concerns have you directly observed? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Avoids group collaboration or team tasks',
              'Frequently clashes with teammates or resists feedback',
              'Undermines team morale or cohesion',
              'Doesn\'t communicate or coordinate in shared work',
              'Has caused avoidable conflict or delays',
              'Other (please describe)'
            ],
            order: 1
          },
          {
            id: 'teamwork_concerns_other',
            attribute_name: 'Teamwork',
            question_text: 'Please describe the other teamwork concerns:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'teamwork_concerns_low',
                answer_value: ['Other (please describe)']
              }
            },
            order: 2
          },
          {
            id: 'teamwork_problem_situations',
            attribute_name: 'Teamwork',
            question_text: 'What type of team situations create the most problems for this person?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'High-pressure or deadline situations',
              'Cross-functional teams with diverse perspectives',
              'Teams with strong personalities or leaders',
              'Ambiguous roles or unclear team goals',
              'Any situation requiring compromise or consensus',
              'Conflict resolution or difficult conversations',
              'Other (describe)'
            ],
            order: 3
          },
          {
            id: 'teamwork_problem_other',
            attribute_name: 'Teamwork',
            question_text: 'Please describe the other problematic situations:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'teamwork_problem_situations',
                answer_value: ['Other (describe)']
              }
            },
            order: 4
          },
          {
            id: 'teamwork_issues_primary_cause',
            attribute_name: 'Teamwork',
            question_text: 'Do you think this person\'s teamwork issues are primarily:',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Communication or interpersonal skill gaps',
              'Unwillingness to collaborate or share responsibility',
              'Conflict avoidance that creates bigger problems',
              'Ego or competitiveness that undermines cooperation',
              'Overwhelmed by individual responsibilities',
              'Past negative team experiences affecting current behavior',
              'Other (describe)'
            ],
            order: 5
          },
          {
            id: 'teamwork_cause_other',
            attribute_name: 'Teamwork',
            question_text: 'Please describe the other primary cause:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'teamwork_issues_primary_cause',
                answer_value: ['Other (describe)']
              }
            },
            order: 6
          },
          {
            id: 'teamwork_behavior_frequency',
            attribute_name: 'Teamwork',
            question_text: 'How often do these behaviors occur?',
            question_type: 'single_select',
            is_required: true,
            options: ['Weekly or more', 'Occasionally', 'Rare or one-time', 'Not sure'],
            order: 7
          },
          {
            id: 'teamwork_performance_impact',
            attribute_name: 'Teamwork',
            question_text: 'How have these behaviors affected the team\'s performance or dynamics?',
            question_type: 'text',
            is_required: false,
            order: 8
          }
        ]
      }
    ]
  },
  'Continuous Improvement': {
    name: 'Continuous Improvement',
    display_name: 'Continuous Improvement',
    definition: 'Continuous Improvement refers to a person\'s mindset and behavior around growth. It includes their willingness to seek feedback, learn new skills, reflect on mistakes, and improve performance, processes, or systems over time.',
    scale_descriptions: {
      excellent: 'Growth-oriented leader: Proactively seeks feedback, reflects regularly, and drives improvement in self, team, and systems. Actively mentors others in growth mindset.',
      good: 'Generally improves well: Open to growth and accepts feedback when offered, but doesn\'t always seek it. Makes improvements, but not always consistently.',
      below_expectation: 'Below expectations: Occasionally resists feedback. Rarely initiates growth or learning without external pressure.',
      poor: 'Hostile to growth: Openly resists change or improvement. Undermines feedback processes or discourages others from growing.'
    },
    base_questions: [
      {
        id: 'continuous_improvement_observed',
        attribute_name: 'Continuous Improvement',
        question_text: 'In your experience with this person\'s approach to growth and learning, which of these have you observed? (Check all that apply)',
        question_type: 'multi_select',
        is_required: true,
        options: [
          'Proactively seeks growth opportunities and consistently applies feedback to achieve measurable improvements',
          'Generally receptive to feedback and shows steady improvement over time',
          'Shows some interest in learning but inconsistent in applying feedback or making changes',
          'Resists feedback and tends to stick with familiar methods despite better alternatives available',
          'Others look to them as a model for professional development and continuous learning',
          'Acknowledges the value of improvement but rarely takes concrete steps to develop new skills'
        ],
        order: 1
      },
      {
        id: 'continuous_improvement_example',
        attribute_name: 'Continuous Improvement',
        question_text: 'Any specific example that stands out? (Optional - brief description)',
        question_type: 'text',
        is_required: false,
        placeholder: 'Brief description of a specific example...',
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'continuous_improvement_mindset_high',
            attribute_name: 'Continuous Improvement',
            question_text: 'In the past 30–60 days, how have they demonstrated a growth mindset? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Asked for feedback without being prompted',
              'Integrated feedback and changed their approach',
              'Improved a personal workflow or system',
              'Initiated changes to improve team or org efficiency',
              'Shared lessons learned or coached others to improve',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'continuous_improvement_helps_others',
            attribute_name: 'Continuous Improvement',
            question_text: 'How does this person help others grow and improve?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Actively mentors and shares knowledge',
              'Creates learning opportunities for teammates',
              'Provides constructive feedback regularly',
              'Models growth behaviors for others',
              'Advocates for team development resources',
              'Not sure - limited observation of this'
            ],
            order: 2
          },
          {
            id: 'continuous_improvement_effectiveness',
            attribute_name: 'Continuous Improvement',
            question_text: 'What makes this person particularly effective at continuous improvement?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Strong self-awareness and reflection skills',
              'Systems thinking - sees broader improvement opportunities',
              'Excellent at learning from failures and setbacks',
              'Creates accountability structures for themselves',
              'Naturally curious and experimental mindset',
              'Other (describe)'
            ],
            order: 3
          },
          {
            id: 'continuous_improvement_effectiveness_other',
            attribute_name: 'Continuous Improvement',
            question_text: 'Please describe what else makes them effective:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'continuous_improvement_effectiveness',
                answer_value: ['Other (describe)']
              }
            },
            order: 4
          },
          {
            id: 'continuous_improvement_criticism_response',
            attribute_name: 'Continuous Improvement',
            question_text: 'How do they typically respond to constructive criticism?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Grateful and adaptive',
              'Accepts but applies slowly',
              'Defends or deflects',
              'Avoids feedback',
              'Not sure'
            ],
            order: 5
          },
          {
            id: 'continuous_improvement_recent_example',
            attribute_name: 'Continuous Improvement',
            question_text: 'Share a recent example where their commitment to improvement led to a noticeable change or result.',
            question_type: 'text',
            is_required: false,
            order: 6
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'continuous_improvement_pursuit_mid',
            attribute_name: 'Continuous Improvement',
            question_text: 'How does this person typically pursue growth opportunities? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Applies feedback when it\'s direct and detailed',
              'Open to improvement but not proactive',
              'Tries new things but reverts to old habits',
              'Avoids uncomfortable feedback topics',
              'Improves in some areas, but stays stagnant in others',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'continuous_improvement_motivation',
            attribute_name: 'Continuous Improvement',
            question_text: 'What seems to motivate this person\'s improvement efforts most?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Recognition and career advancement',
              'Personal satisfaction and mastery',
              'Team success and collaboration',
              'External pressure or requirements',
              'Specific feedback or coaching',
              'Problem-solving and challenge-solving',
              'Other (describe)'
            ],
            order: 2
          },
          {
            id: 'continuous_improvement_motivation_other',
            attribute_name: 'Continuous Improvement',
            question_text: 'Please describe the other motivation:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'continuous_improvement_motivation',
                answer_value: ['Other (describe)']
              }
            },
            order: 3
          },
          {
            id: 'continuous_improvement_learning_style',
            attribute_name: 'Continuous Improvement',
            question_text: 'How does this person learn most effectively?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Through direct instruction and training',
              'By observing others and modeling behaviors',
              'Through hands-on practice and experimentation',
              'Via reading, research, and self-study',
              'Through collaborative discussion and feedback',
              'Mixed approach depending on the skill',
              'Not sure'
            ],
            order: 4
          },
          {
            id: 'continuous_improvement_growth_tone',
            attribute_name: 'Continuous Improvement',
            question_text: 'Would you describe them as someone who sets the tone for growth on their team?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Absolutely',
              'In some ways',
              'Not really',
              'No',
              'Not sure'
            ],
            order: 5
          },
          {
            id: 'continuous_improvement_tone_why',
            attribute_name: 'Continuous Improvement',
            question_text: 'Why do you think that?',
            question_type: 'text',
            is_required: false,
            order: 6
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'continuous_improvement_resistance_low',
            attribute_name: 'Continuous Improvement',
            question_text: 'What behaviors led you to rate their improvement mindset this low? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Rejects feedback or becomes defensive',
              'Rarely acts on coaching',
              'Avoids trying new methods',
              'Dismisses learning opportunities or team debriefs',
              'Stagnates despite support or resources',
              'Other (please describe)'
            ],
            order: 1
          },
          {
            id: 'continuous_improvement_resistance_other',
            attribute_name: 'Continuous Improvement',
            question_text: 'Please describe the other resistance behaviors:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'continuous_improvement_resistance_low',
                answer_value: ['Other (please describe)']
              }
            },
            order: 2
          },
          {
            id: 'continuous_improvement_resistance_type',
            attribute_name: 'Continuous Improvement',
            question_text: 'What type of improvement resistance do you observe most?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Defensive reactions to any feedback',
              'Acknowledges feedback but never acts on it',
              'Claims to be too busy for development activities',
              'Believes current methods are always best',
              'Fears change will make them look incompetent',
              'Shows improvement only under direct pressure',
              'Other (describe)'
            ],
            order: 3
          },
          {
            id: 'continuous_improvement_type_other',
            attribute_name: 'Continuous Improvement',
            question_text: 'Please describe the other resistance type:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'continuous_improvement_resistance_type',
                answer_value: ['Other (describe)']
              }
            },
            order: 4
          },
          {
            id: 'continuous_improvement_resistance_primary',
            attribute_name: 'Continuous Improvement',
            question_text: 'Do you think this person\'s resistance to growth is primarily:',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lack of confidence or fear of failure',
              'Fixed mindset - believes abilities can\'t change',
              'Overwhelmed by current responsibilities',
              'Past negative experiences with feedback',
              'Unclear about expectations or how to improve',
              'Fundamental personality trait',
              'Other (describe)'
            ],
            order: 5
          },
          {
            id: 'continuous_improvement_primary_other',
            attribute_name: 'Continuous Improvement',
            question_text: 'Please describe the other primary cause:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'continuous_improvement_resistance_primary',
                answer_value: ['Other (describe)']
              }
            },
            order: 6
          },
          {
            id: 'continuous_improvement_support_needed',
            attribute_name: 'Continuous Improvement',
            question_text: 'What type of support might help this person become more open to growth?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'More private, supportive feedback delivery',
              'Clearer connection between improvement and career goals',
              'Smaller, less threatening development steps',
              'Different feedback sources (peers vs. managers)',
              'More time and resources for development',
              'I don\'t think significant change is likely',
              'Other (describe)'
            ],
            order: 7
          },
          {
            id: 'continuous_improvement_support_other',
            attribute_name: 'Continuous Improvement',
            question_text: 'Please describe the other support needed:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'continuous_improvement_support_needed',
                answer_value: ['Other (describe)']
              }
            },
            order: 8
          },
          {
            id: 'continuous_improvement_team_impact',
            attribute_name: 'Continuous Improvement',
            question_text: 'What has been the impact of their resistance to growth on others or the team?',
            question_type: 'text',
            is_required: false,
            order: 9
          }
        ]
      }
    ]
  },
  'Communication Skills': {
    name: 'Communication Skills',
    display_name: 'Communication Skills',
    definition: 'Communication Skills refer to how clearly, concisely, and appropriately a person expresses ideas—both written and verbal. It also includes their ability to listen, adjust to their audience, and contribute effectively in conversations, meetings, or written formats.',
    scale_descriptions: {
      excellent: 'Exceptional communicator: Tailors messages to any audience, speaks and writes clearly, listens deeply, and influences others. Resolves misunderstandings proactively.',
      good: 'Generally a good communicator: Gets the message across effectively but may lack clarity or polish in certain contexts. Listens adequately and follows up when needed.',
      below_expectation: 'Below expectations: Regularly unclear or incomplete in communication. May over-communicate or under-communicate. Creates misunderstandings.',
      poor: 'Critically poor communicator: Confusing, unresponsive, or inappropriate in most interactions. Undermines collaboration or morale.'
    },
    base_questions: [
      {
        id: 'communication_observed',
        attribute_name: 'Communication Skills',
        question_text: 'In your experience with this person\'s communication, which of these have you observed? (Check all that apply)',
        question_type: 'multi_select',
        is_required: true,
        options: [
          'Communicates with exceptional clarity and others frequently praise their ability to explain complex topics',
          'Generally communicates effectively with occasional minor misunderstandings or delays',
          'Gets their point across adequately but sometimes lacks clarity or important details',
          'Frequently creates confusion through unclear messaging or poor listening habits',
          'Others specifically seek them out for important communications because of their skill',
          'Attempts to communicate well but often needs follow-up questions to clarify their meaning'
        ],
        order: 1
      },
      {
        id: 'communication_example',
        attribute_name: 'Communication Skills',
        question_text: 'Any specific example that stands out? (Optional - brief description)',
        question_type: 'text',
        is_required: false,
        placeholder: 'Brief description of a specific example...',
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'communication_strengths_high',
            attribute_name: 'Communication Skills',
            question_text: 'What communication strengths have you directly observed in the last 30 days? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Delivers clear, concise updates without rambling',
              'Adjusts tone and depth depending on audience',
              'Uses written formats (email, documentation) clearly and professionally',
              'Listens actively and integrates others\' input',
              'Resolves misunderstandings calmly and constructively',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'communication_under_pressure',
            attribute_name: 'Communication Skills',
            question_text: 'How effective are they at communicating under pressure (e.g., live updates, urgent changes, critical meetings)?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Always composed and clear',
              'Usually strong, but sometimes flustered',
              'Inconsistent or reactive under pressure',
              'Not sure'
            ],
            order: 2
          },
          {
            id: 'communication_difficult_sensitive',
            attribute_name: 'Communication Skills',
            question_text: 'How does this person handle difficult or sensitive communications?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Addresses issues directly while maintaining relationships',
              'Finds diplomatic ways to deliver challenging messages',
              'Prepares thoroughly for difficult conversations',
              'Sometimes avoids tough conversations but handles them well when necessary',
              'Not sure - haven\'t observed sensitive situations'
            ],
            order: 3
          },
          {
            id: 'communication_particularly_effective',
            attribute_name: 'Communication Skills',
            question_text: 'What makes this person particularly effective at communication?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Exceptional listening skills and empathy',
              'Natural ability to simplify complex information',
              'Strong written communication and documentation',
              'Builds trust quickly through transparent communication',
              'Adapts style seamlessly to different audiences',
              'Other (describe)'
            ],
            order: 4
          },
          {
            id: 'communication_effective_other',
            attribute_name: 'Communication Skills',
            question_text: 'Please describe what else makes them effective:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'communication_particularly_effective',
                answer_value: ['Other (describe)']
              }
            },
            order: 5
          },
          {
            id: 'communication_others_response',
            attribute_name: 'Communication Skills',
            question_text: 'How do others typically respond to their communication?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Frequently ask them to lead important communications',
              'Generally very positive and engaged',
              'Mixed - effective but sometimes intimidating',
              'Good but can be overwhelming with detail',
              'Not sure'
            ],
            order: 6
          },
          {
            id: 'communication_team_outcome',
            attribute_name: 'Communication Skills',
            question_text: 'Give an example of a time their communication improved a team outcome.',
            question_type: 'text',
            is_required: false,
            order: 7
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'communication_areas_weaker',
            attribute_name: 'Communication Skills',
            question_text: 'What areas of communication could be stronger? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'They give too much detail or unclear structure',
              'They don\'t adapt well across different audiences',
              'Passive listener or prone to interruptions',
              'Struggles with written clarity',
              'Avoids giving difficult or corrective feedback',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'communication_challenges_cause',
            attribute_name: 'Communication Skills',
            question_text: 'What seems to cause their communication challenges most?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Nervousness or lack of confidence in certain situations',
              'Too much detail or difficulty prioritizing key points',
              'Assumption that others have the same context/knowledge',
              'Limited experience with formal or high-stakes communication',
              'Tends to rush through explanations',
              'Other (describe)'
            ],
            order: 2
          },
          {
            id: 'communication_challenges_other',
            attribute_name: 'Communication Skills',
            question_text: 'Please describe the other challenge:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'communication_challenges_cause',
                answer_value: ['Other (describe)']
              }
            },
            order: 3
          },
          {
            id: 'communication_effective_conditions',
            attribute_name: 'Communication Skills',
            question_text: 'When they do communicate effectively, what conditions are present?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Familiar audience and comfortable environment',
              'Written format with time to prepare and edit',
              'One-on-one or small group settings',
              'Topics within their area of expertise',
              'Low-pressure, informal situations',
              'Other (describe)'
            ],
            order: 4
          },
          {
            id: 'communication_conditions_other',
            attribute_name: 'Communication Skills',
            question_text: 'Please describe the other effective conditions:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'communication_effective_conditions',
                answer_value: ['Other (describe)']
              }
            },
            order: 5
          },
          {
            id: 'communication_development_help',
            attribute_name: 'Communication Skills',
            question_text: 'What type of communication development would help them most?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Practice with presentation and public speaking',
              'Training on writing clarity and structure',
              'Coaching on active listening skills',
              'Experience with difficult conversation management',
              'Feedback on adapting style to different audiences',
              'Other (describe)'
            ],
            order: 6
          },
          {
            id: 'communication_development_other',
            attribute_name: 'Communication Skills',
            question_text: 'Please describe the other development need:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'communication_development_help',
                answer_value: ['Other (describe)']
              }
            },
            order: 7
          },
          {
            id: 'communication_cross_functional_trust',
            attribute_name: 'Communication Skills',
            question_text: 'Would you trust them to deliver a message to a cross-functional or senior group on behalf of the team?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Yes, confidently',
              'Maybe, depending on the topic',
              'No, not at this time',
              'Not sure'
            ],
            order: 8
          },
          {
            id: 'communication_trust_why',
            attribute_name: 'Communication Skills',
            question_text: 'Why do you think that?',
            question_type: 'text',
            is_required: false,
            order: 9
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'communication_breakdowns_low',
            attribute_name: 'Communication Skills',
            question_text: 'What communication breakdowns have you witnessed recently? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Causes confusion with vague or disorganized messaging',
              'Fails to document or follow up in writing',
              'Struggles to listen or overtalks others',
              'Reacts defensively to feedback',
              'Creates friction by misinterpreting tone or context',
              'Other (please describe)'
            ],
            order: 1
          },
          {
            id: 'communication_breakdowns_other',
            attribute_name: 'Communication Skills',
            question_text: 'Please describe the other communication breakdowns:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'communication_breakdowns_low',
                answer_value: ['Other (please describe)']
              }
            },
            order: 2
          },
          {
            id: 'communication_issues_type',
            attribute_name: 'Communication Skills',
            question_text: 'What type of communication issues occur most frequently?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Verbal communication problems (unclear speaking, poor listening)',
              'Written communication problems (confusing emails, poor documentation)',
              'Interpersonal communication (defensive reactions, misreading social cues)',
              'Formal communication (presentations, meetings with leadership)',
              'Cross-functional communication (different teams, external partners)',
              'All types equally problematic'
            ],
            order: 3
          },
          {
            id: 'communication_issues_stem',
            attribute_name: 'Communication Skills',
            question_text: 'Do you think this person\'s communication issues stem primarily from:',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lack of skills or training',
              'Anxiety or confidence issues',
              'Cultural or language barriers',
              'Overwhelming workload affecting communication quality',
              'Personality traits or interpersonal challenges',
              'Limited awareness of their communication impact',
              'Other (describe)'
            ],
            order: 4
          },
          {
            id: 'communication_stem_other',
            attribute_name: 'Communication Skills',
            question_text: 'Please describe the other primary cause:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'communication_issues_stem',
                answer_value: ['Other (describe)']
              }
            },
            order: 5
          },
          {
            id: 'communication_improvement_realistic',
            attribute_name: 'Communication Skills',
            question_text: 'What level of improvement do you think is realistic for this person?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Significant improvement possible with focused development',
              'Moderate improvement likely with ongoing support',
              'Minor improvement in specific areas only',
              'Unlikely to improve substantially',
              'Not sure'
            ],
            order: 6
          },
          {
            id: 'communication_impact_trust',
            attribute_name: 'Communication Skills',
            question_text: 'Has this impacted trust, delivery, or morale within the team or with external partners?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Yes, multiple times',
              'Occasionally',
              'Rare/one-off',
              'Not sure'
            ],
            order: 7
          }
        ]
      }
    ]
  },
  'Leadership': {
    name: 'Leadership',
    display_name: 'Leadership',
    definition: 'Leadership refers to a person\'s ability to influence, guide, and motivate others toward shared goals. It includes setting a clear vision, modeling behavior, making sound decisions, and building trust—regardless of formal title.',
    scale_descriptions: {
      excellent: 'Transformational leader: Inspires others, drives vision, makes bold but grounded decisions, and develops people consistently. Creates high-trust environments.',
      good: 'Generally a good leader: Can lead when needed. Models good behavior and supports others, but may not consistently influence or inspire.',
      below_expectation: 'Below expectations: Doesn\'t naturally lead or step up. May avoid accountability or have trouble inspiring others.',
      poor: 'Destructive influence: Disempowers teammates, promotes mistrust, and consistently leads others in the wrong direction.'
    },
    base_questions: [
      {
        id: 'leadership_observed',
        attribute_name: 'Leadership',
        question_text: 'In your experience with this person in leadership situations (formal or informal), which of these have you observed? (Check all that apply)',
        question_type: 'multi_select',
        is_required: true,
        options: [
          'Naturally inspires others and consistently demonstrates exceptional leadership that people want to follow',
          'Shows solid leadership qualities and others often turn to them for guidance and direction',
          'Displays some leadership potential but inconsistent in taking charge when situations require it',
          'Avoids leadership responsibilities and struggles when others look to them for direction',
          'Others actively seek their leadership on important projects because of their proven track record',
          'Attempts to lead when asked but often needs significant support to be effective in leadership roles'
        ],
        order: 1
      },
      {
        id: 'leadership_example',
        attribute_name: 'Leadership',
        question_text: 'Any specific example that stands out? (Optional - brief description)',
        question_type: 'text',
        is_required: false,
        placeholder: 'Brief description of a specific example...',
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'leadership_demonstration_high',
            attribute_name: 'Leadership',
            question_text: 'In the last 30–60 days, how has this person demonstrated leadership? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Sets a strong example of professionalism and accountability',
              'Inspires others through communication and action',
              'Coaches or uplifts others during challenges',
              'Makes tough decisions with clarity and fairness',
              'Anticipates problems and mobilizes solutions',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'leadership_void_choice',
            attribute_name: 'Leadership',
            question_text: 'If a sudden leadership void opened on your team, would this person be a natural choice to step in?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Yes, without hesitation',
              'Possibly, depending on the situation',
              'No',
              'Not sure'
            ],
            order: 2
          },
          {
            id: 'leadership_void_why',
            attribute_name: 'Leadership',
            question_text: 'What would they need to earn that confidence?',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'leadership_void_choice',
                answer_value: ['Possibly, depending on the situation', 'No']
              }
            },
            order: 3
          },
          {
            id: 'leadership_develops_others',
            attribute_name: 'Leadership',
            question_text: 'How does this person develop leadership in others?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Actively mentors and coaches emerging leaders',
              'Creates opportunities for others to lead and grow',
              'Provides constructive feedback on leadership skills',
              'Models leadership behaviors for others to follow',
              'Advocates for others\' leadership advancement',
              'Not sure - limited observation of this'
            ],
            order: 4
          },
          {
            id: 'leadership_particularly_effective',
            attribute_name: 'Leadership',
            question_text: 'What makes this person particularly effective as a leader?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Exceptional emotional intelligence and people skills',
              'Strong strategic thinking and vision-setting ability',
              'Natural ability to build trust and psychological safety',
              'Excellent decision-making under pressure',
              'Inspiring communication and influence skills',
              'Other (describe)'
            ],
            order: 5
          },
          {
            id: 'leadership_effective_other',
            attribute_name: 'Leadership',
            question_text: 'Please describe what else makes them effective:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'leadership_particularly_effective',
                answer_value: ['Other (describe)']
              }
            },
            order: 6
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'leadership_behaviors_mid',
            attribute_name: 'Leadership',
            question_text: 'Which of the following statements best describe this person\'s leadership behaviors? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Demonstrates leadership confidence when guiding peers',
              'Demonstrates leadership confidence across teams and levels',
              'Hesitates or holds back in cross-team or high-visibility settings',
              'Frequently offers emotional or tactical support to teammates',
              'Often suggests direction or ideas in meetings',
              'Struggles to rally others or gain buy-in around their ideas',
              'Acts as a consistent role model for values and behavior',
              'Is respected but not often chosen to lead initiatives',
              'Demonstrates influence in their area of expertise',
              'Has limited leadership influence outside their domain',
              'None of the above'
            ],
            order: 1
          },
          {
            id: 'leadership_best_contexts',
            attribute_name: 'Leadership',
            question_text: 'In what leadership contexts does this person perform best?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Leading peers in familiar areas of expertise',
              'Supporting others through coaching and guidance',
              'Leading small teams or project groups',
              'Informal leadership in collaborative settings',
              'Crisis or problem-solving leadership',
              'Strategic or visionary leadership',
              'Other (describe)'
            ],
            order: 2
          },
          {
            id: 'leadership_contexts_other',
            attribute_name: 'Leadership',
            question_text: 'Please describe the other leadership context:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'leadership_best_contexts',
                answer_value: ['Other (describe)']
              }
            },
            order: 3
          },
          {
            id: 'leadership_others_response',
            attribute_name: 'Leadership',
            question_text: 'How do others typically respond to this person\'s leadership attempts?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very positive - others readily follow their lead',
              'Generally supportive but may need more direction',
              'Mixed - depends on the situation or team dynamics',
              'Sometimes resistant or questioning of their authority',
              'Limited attempts at leadership to observe'
            ],
            order: 4
          },
          {
            id: 'leadership_behavior_strengthen',
            attribute_name: 'Leadership',
            question_text: 'What leadership behavior, if strengthened, would unlock their next level?',
            question_type: 'text',
            is_required: false,
            order: 5
          },
          {
            id: 'leadership_strengthen_why',
            attribute_name: 'Leadership',
            question_text: 'Why do you think that?',
            question_type: 'text',
            is_required: false,
            order: 6
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'leadership_gaps_low',
            attribute_name: 'Leadership',
            question_text: 'What leadership gaps or concerns have you seen? (Multi-select)',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Avoids responsibility or tough calls',
              'Undermines team morale or clarity',
              'Doesn\'t guide or coach others when needed',
              'Makes reactive or inconsistent decisions',
              'Lacks presence or credibility in key settings',
              'Other (please describe)'
            ],
            order: 1
          },
          {
            id: 'leadership_gaps_other',
            attribute_name: 'Leadership',
            question_text: 'Please describe the other leadership gaps:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'leadership_gaps_low',
                answer_value: ['Other (please describe)']
              }
            },
            order: 2
          },
          {
            id: 'leadership_challenges_frequent',
            attribute_name: 'Leadership',
            question_text: 'What type of leadership challenges occur most frequently with this person?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Avoids taking charge when leadership is needed',
              'Makes poor decisions that negatively impact others',
              'Creates conflict or undermines team dynamics',
              'Lacks credibility or respect from teammates',
              'Tries to lead but lacks necessary skills',
              'Actively resists or undermines other leaders',
              'Other (describe)'
            ],
            order: 3
          },
          {
            id: 'leadership_challenges_other',
            attribute_name: 'Leadership',
            question_text: 'Please describe the other leadership challenge:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'leadership_challenges_frequent',
                answer_value: ['Other (describe)']
              }
            },
            order: 4
          },
          {
            id: 'leadership_struggles_primary',
            attribute_name: 'Leadership',
            question_text: 'Do you think this person\'s leadership struggles are primarily due to:',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lack of leadership skills or training',
              'Low confidence or fear of responsibility',
              'Personality traits that conflict with leadership',
              'Overwhelmed by current role responsibilities',
              'Limited understanding of what leadership requires',
              'Fundamental unsuitability for leadership roles',
              'Other (describe)'
            ],
            order: 5
          },
          {
            id: 'leadership_primary_other',
            attribute_name: 'Leadership',
            question_text: 'Please describe the other primary cause:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'leadership_struggles_primary',
                answer_value: ['Other (describe)']
              }
            },
            order: 6
          },
          {
            id: 'leadership_improvement_needed',
            attribute_name: 'Leadership',
            question_text: 'What would need to change for this person to be more effective in leadership situations?',
            question_type: 'multi_select',
            is_required: true,
            options: [
              'Leadership skills development and training',
              'Gradual increase in leadership responsibilities',
              'Better understanding of leadership expectations',
              'Different types of leadership opportunities',
              'Significant mindset or behavioral changes',
              'I don\'t think they\'re suited for leadership roles',
              'Other (describe)'
            ],
            order: 7
          },
          {
            id: 'leadership_improvement_other',
            attribute_name: 'Leadership',
            question_text: 'Please describe the other improvement needed:',
            question_type: 'text',
            is_required: false,
            conditional_logic: {
              show_if_answer: {
                question_id: 'leadership_improvement_needed',
                answer_value: ['Other (describe)']
              }
            },
            order: 8
          },
          {
            id: 'leadership_opportunities_response',
            attribute_name: 'Leadership',
            question_text: 'Have they been offered leadership opportunities—and how did they respond?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Stepped up successfully',
              'Declined or avoided',
              'Tried but struggled',
              'Not given opportunity',
              'Not sure'
            ],
            order: 9
          },
          {
            id: 'leadership_gap_team_impact',
            attribute_name: 'Leadership',
            question_text: 'How does their leadership gap affect the team or outcomes?',
            question_type: 'text',
            is_required: false,
            order: 10
          }
        ]
      }
    ]
  }
  // 🎉 ALL 10 ATTRIBUTES COMPLETED! 
  // Survey implementation now matches survey.md exactly with:
  // ✅ Reliability, Accountability for Action, Quality of Work, Taking Initiative, Adaptability
  // ✅ Problem Solving Ability, Teamwork, Continuous Improvement, Communication Skills, Leadership
  // ✅ All conditional logic, exact question text, and scale descriptions implemented correctly
};

export const EvaluationSurvey: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [assignment, setAssignment] = useState<EvaluationAssignmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Enhanced survey state
  const [currentAttributeIndex, setCurrentAttributeIndex] = useState(0);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [baseResponses, setBaseResponses] = useState<Record<string, Record<string, any>>>({});
  const [conditionalResponses, setConditionalResponses] = useState<Record<string, Record<string, any>>>({});
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'base_questions' | 'scoring' | 'conditional_questions'>('intro');
  
  // Session management
  const [session, setSession] = useState<EnhancedSurveySession | null>(null);

  const currentAttribute = PERFORMANCE_ATTRIBUTES[currentAttributeIndex];
  const attributeDefinition = COMPREHENSIVE_ATTRIBUTE_DEFINITIONS[currentAttribute];
  const isLastAttribute = currentAttributeIndex === PERFORMANCE_ATTRIBUTES.length - 1;

  useEffect(() => {
    if (token) {
      loadAssignment();
    }
  }, [token]);

  useEffect(() => {
    // Load saved session from localStorage
    const savedSession = localStorage.getItem(`survey_session_${token}`);
    if (savedSession) {
      try {
        const parsedSession: EnhancedSurveySession = JSON.parse(savedSession);
        setSession(parsedSession);
        setBaseResponses(parsedSession.base_responses);
        setConditionalResponses(parsedSession.conditional_responses);
        setSubmissionId(parsedSession.submission_id || null);
        
        // Resume from saved attribute
        const resumeIndex = PERFORMANCE_ATTRIBUTES.findIndex(attr => attr === parsedSession.current_attribute);
        if (resumeIndex >= 0) {
          setCurrentAttributeIndex(resumeIndex);
          setCurrentScore(getScoreForAttribute(parsedSession.current_attribute, parsedSession));
          
          // Determine current phase based on completion state
          if (parsedSession.completed_attributes.includes(parsedSession.current_attribute)) {
            // Move to next attribute if current is completed
            if (resumeIndex < PERFORMANCE_ATTRIBUTES.length - 1) {
              setCurrentAttributeIndex(resumeIndex + 1);
              setCurrentPhase('intro');
            }
          } else {
            // Resume where we left off
            setCurrentPhase(determineCurrentPhase(parsedSession.current_attribute, parsedSession));
          }
        }
      } catch (err) {
        console.error('Error loading saved session:', err);
      }
    }
  }, [token]);

  const getScoreForAttribute = (attributeName: string, sessionData: EnhancedSurveySession): number | null => {
    return sessionData.conditional_responses[attributeName]?.attribute_score || null;
  };

  const determineCurrentPhase = (attributeName: string, sessionData: EnhancedSurveySession): 'intro' | 'base_questions' | 'scoring' | 'conditional_questions' => {
    const hasBaseResponses = sessionData.base_responses[attributeName] && Object.keys(sessionData.base_responses[attributeName]).length > 0;
    const hasScore = sessionData.conditional_responses[attributeName]?.attribute_score;
    const hasConditionalResponses = sessionData.conditional_responses[attributeName] && Object.keys(sessionData.conditional_responses[attributeName]).length > 1; // More than just score
    
    if (!hasBaseResponses) return 'intro';
    if (!hasScore) return 'scoring';
    if (!hasConditionalResponses) return 'conditional_questions';
    return 'intro'; // Completed, should move to next
  };

  const loadAssignment = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const assignmentData = await getAssignmentByToken(token);
      
      if (!assignmentData) {
        setError('Assignment not found or token is invalid');
        return;
      }

      // Verify user is authorized to complete this assignment
      if (user?.id !== assignmentData.evaluator_id) {
        setError('You are not authorized to complete this assignment');
        return;
      }

      setAssignment(assignmentData);

      // If assignment already has a submission, load it
      if (assignmentData.submission_id) {
        setSubmissionId(assignmentData.submission_id);
      }
    } catch (err) {
      console.error('Error loading assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const saveSession = (updatedBaseResponses?: Record<string, Record<string, any>>, updatedConditionalResponses?: Record<string, Record<string, any>>) => {
    if (!assignment || !token) return;

    const sessionData: EnhancedSurveySession = {
      assignment_id: assignment.id,
      submission_id: submissionId || undefined,
      current_attribute: currentAttribute,
      current_attribute_index: currentAttributeIndex,
      current_score: currentScore || undefined,
      base_responses: updatedBaseResponses || baseResponses,
      conditional_responses: updatedConditionalResponses || conditionalResponses,
      completed_attributes: session?.completed_attributes || [],
      start_time: session?.start_time || new Date().toISOString(),
      last_activity: new Date().toISOString(),
      is_complete: false
    };

    setSession(sessionData);
    if (token) {
      localStorage.setItem(`survey_session_${token}`, JSON.stringify(sessionData));
    }
  };

  const handleBaseQuestionResponse = (questionId: string, value: any) => {
    const updatedResponses = {
      ...baseResponses,
      [currentAttribute]: {
        ...baseResponses[currentAttribute],
        [questionId]: value
      }
    };
    
    setBaseResponses(updatedResponses);
    saveSession(updatedResponses, conditionalResponses);
  };

  const handleConditionalQuestionResponse = (questionId: string, value: any) => {
    const updatedResponses = {
      ...conditionalResponses,
      [currentAttribute]: {
        ...conditionalResponses[currentAttribute],
        [questionId]: value
      }
    };
    
    setConditionalResponses(updatedResponses);
    saveSession(baseResponses, updatedResponses);
  };

  const handleScoreChange = (score: number) => {
    setCurrentScore(score);
    
    const updatedResponses = {
      ...conditionalResponses,
      [currentAttribute]: {
        ...conditionalResponses[currentAttribute],
        attribute_score: score
      }
    };
    
    setConditionalResponses(updatedResponses);
    saveSession(baseResponses, updatedResponses);
  };

  const getScoreRange = (score: number): '1-5' | '6-8' | '9-10' => {
    if (score >= 1 && score <= 5) return '1-5';
    if (score >= 6 && score <= 8) return '6-8';
    return '9-10';
  };

  const getConditionalQuestions = (): SurveyQuestion[] => {
    if (!currentScore || !attributeDefinition) return [];
    
    const scoreRange = getScoreRange(currentScore);
    const questionSet = attributeDefinition.conditional_question_sets.find(set => set.score_range === scoreRange);
    
    if (!questionSet) return [];

    // Filter questions based on conditional logic
    return questionSet.questions.filter(question => {
      if (!question.conditional_logic?.show_if_answer) return true;
      
      const { question_id, answer_value } = question.conditional_logic.show_if_answer;
      const currentAnswer = conditionalResponses[currentAttribute]?.[question_id];
      
      // Handle conditional logic for both single and multi-select questions
      if (Array.isArray(answer_value)) {
        // Expected answer is an array - check if current answer matches any of them
        if (Array.isArray(currentAnswer)) {
          // Current answer is array (multi-select) - check if any expected values are in the current answer
          return answer_value.some(expectedValue => currentAnswer.includes(expectedValue));
        } else {
          // Current answer is single value - check if it's in the expected array
          return answer_value.includes(currentAnswer);
        }
      } else {
        // Expected answer is a single value
        if (Array.isArray(currentAnswer)) {
          // Current answer is array (multi-select) - check if expected value is included
          return currentAnswer.includes(answer_value);
        } else {
          // Both are single values - direct comparison
          return currentAnswer === answer_value;
        }
      }
    });
  };

  const renderQuestionInput = (question: SurveyQuestion, isBaseQuestion: boolean = false) => {
    const currentValue = isBaseQuestion 
      ? baseResponses[currentAttribute]?.[question.id]
      : conditionalResponses[currentAttribute]?.[question.id];

    const handleChange = isBaseQuestion ? handleBaseQuestionResponse : handleConditionalQuestionResponse;

    switch (question.question_type) {
      case 'multi_select':
        return (
          <div className="space-y-3">
            {question.options?.map(option => (
              <label key={option} className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentValue?.includes(option) || false}
                  onChange={(e) => {
                    const currentValues = currentValue || [];
                    const updatedValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    handleChange(question.id, updatedValues);
                  }}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-relaxed">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'single_select':
        return (
          <div className="space-y-3">
            {question.options?.map(option => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            rows={4}
            value={currentValue || ''}
            onChange={(e) => handleChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical"
          />
        );

      case 'yes_no':
        return (
          <div className="flex space-x-6">
            {['Yes', 'No'].map(option => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceedFromCurrentPhase = (): boolean => {
    switch (currentPhase) {
      case 'intro':
        return true;
      case 'base_questions':
        if (!attributeDefinition) return false;
        return attributeDefinition.base_questions
          .filter(q => q.is_required)
          .every(q => {
            const response = baseResponses[currentAttribute]?.[q.id];
            return response !== undefined && response !== null && response !== '';
          });
      case 'scoring':
        return currentScore !== null;
      case 'conditional_questions':
        const conditionalQuestions = getConditionalQuestions();
        return conditionalQuestions
          .filter(q => q.is_required)
          .every(q => {
            const response = conditionalResponses[currentAttribute]?.[q.id];
            return response !== undefined && response !== null && response !== '';
          });
      default:
        return false;
    }
  };

  const handlePhaseNext = () => {
    switch (currentPhase) {
      case 'intro':
        setCurrentPhase('base_questions');
        break;
      case 'base_questions':
        setCurrentPhase('scoring');
        break;
      case 'scoring':
        setCurrentPhase('conditional_questions');
        break;
      case 'conditional_questions':
        handleCompleteAttribute();
        break;
    }
  };

  const handleCompleteAttribute = async () => {
    if (!assignment || !user || currentScore === null) return;

    try {
      setSaving(true);
      await saveAttributeToDatabase();
      
      // Mark attribute as completed
      const updatedCompletedAttributes = [...(session?.completed_attributes || []), currentAttribute];
      const updatedSession = {
        ...session!,
        completed_attributes: updatedCompletedAttributes
      };
      setSession(updatedSession);
             if (token) {
         localStorage.setItem(`survey_session_${token}`, JSON.stringify(updatedSession));
       }

      if (isLastAttribute) {
        await completeSurvey();
      } else {
        // Move to next attribute
        setCurrentAttributeIndex(prev => prev + 1);
        setCurrentScore(null);
        setCurrentPhase('intro');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const saveAttributeToDatabase = async () => {
    if (!assignment || !user || currentScore === null) return;

    // Create submission if it doesn't exist
    let currentSubmissionId = submissionId;
    if (!currentSubmissionId) {
      const { data: newSubmission, error: submissionError } = await supabase
        .from('submissions')
        .insert([{
          submitter_id: user.id,
          evaluatee_id: assignment.evaluatee_id,
          evaluation_type: assignment.evaluation_type,
          quarter_id: assignment.quarter_id,
          raw_json: {}
        }])
        .select()
        .single();

      if (submissionError) {
        throw new Error(`Failed to create submission: ${submissionError.message}`);
      }

      currentSubmissionId = newSubmission.submission_id;
      setSubmissionId(currentSubmissionId);

      // Link assignment to submission
      if (!currentSubmissionId) {
        throw new Error('Failed to get submission ID after creation');
      }
      await linkAssignmentToSubmission(assignment.id, currentSubmissionId);
      await updateAssignmentStatus(assignment.id, 'in_progress');
    }

    // Save attribute score
    const { data: scoreData, error: scoreError } = await supabase
      .from('attribute_scores')
      .upsert([{
        submission_id: currentSubmissionId,
        attribute_name: currentAttribute,
        score: currentScore
      }], {
        onConflict: 'submission_id,attribute_name'
      })
      .select()
      .single();

    if (scoreError) {
      throw new Error(`Failed to save attribute score: ${scoreError.message}`);
    }

    // Save all question responses (base + conditional)
    const allResponses = {
      ...baseResponses[currentAttribute],
      ...conditionalResponses[currentAttribute]
    };

    const questionData = Object.entries(allResponses)
      .filter(([key]) => key !== 'attribute_score') // Exclude score from responses
      .map(([questionId, responseValue]) => ({
        submission_id: currentSubmissionId,
        attribute_name: currentAttribute,
        question_id: questionId,
        question_text: findQuestionText(questionId),
        response_type: 'text', // Simplified for storage
        response_value: typeof responseValue === 'object' ? JSON.stringify(responseValue) : String(responseValue),
        score_context: currentScore,
        attribute_score_id: scoreData.id
      }));

    if (questionData.length > 0) {
      const { error: responseError } = await supabase
        .from('attribute_responses')
        .upsert(questionData, {
          onConflict: 'submission_id,attribute_name,question_id'
        });

      if (responseError) {
        throw new Error(`Failed to save responses: ${responseError.message}`);
      }
    }
  };

  const findQuestionText = (questionId: string): string => {
    if (!attributeDefinition) return '';
    
    // Search in base questions
    const baseQuestion = attributeDefinition.base_questions.find(q => q.id === questionId);
    if (baseQuestion) return baseQuestion.question_text;
    
    // Search in conditional questions
    for (const questionSet of attributeDefinition.conditional_question_sets) {
      const conditionalQuestion = questionSet.questions.find(q => q.id === questionId);
      if (conditionalQuestion) return conditionalQuestion.question_text;
    }
    
    return '';
  };

  const completeSurvey = async () => {
    if (!assignment) return;

    try {
      await updateAssignmentStatus(assignment.id, 'completed', new Date().toISOString());
      if (token) {
        localStorage.removeItem(`survey_session_${token}`);
      }
      navigate('/assignments/my');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete survey');
    }
  };

  const getPhaseTitle = (): string => {
    switch (currentPhase) {
      case 'intro':
        return `Attribute ${currentAttributeIndex + 1}: ${attributeDefinition?.display_name}`;
      case 'base_questions':
        return 'Initial Questions';
      case 'scoring':
        return 'Rate This Attribute';
      case 'conditional_questions':
        return 'Follow-up Questions';
      default:
        return '';
    }
  };

  const getPhaseProgress = (): number => {
    const attributeProgress = (currentAttributeIndex / PERFORMANCE_ATTRIBUTES.length) * 100;
    const phaseProgress = (() => {
      switch (currentPhase) {
        case 'intro': return 0;
        case 'base_questions': return 25;
        case 'scoring': return 50;
        case 'conditional_questions': return 75;
        default: return 100;
      }
    })();
    
    return attributeProgress + (phaseProgress * (1 / PERFORMANCE_ATTRIBUTES.length));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage 
          message={error || 'Assignment not found'}
          onRetry={() => {
            setError(null);
            loadAssignment();
          }}
        />
      </div>
    );
  }

  if (!attributeDefinition) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message="Attribute definition not found" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {assignment.evaluation_type === 'self' 
                  ? 'Self Evaluation' 
                  : `Evaluate ${assignment.evaluatee_name}`
                }
              </h1>
              <p className="text-gray-600 mt-1">
                {assignment.quarter_name} • {assignment.evaluation_type.charAt(0).toUpperCase() + assignment.evaluation_type.slice(1)} Evaluation
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/assignments/my')}
            >
              Exit Survey
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{getPhaseTitle()}</span>
              <span>{Math.round(getPhaseProgress())}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getPhaseProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Survey Content */}
        <Card className="p-8">
          {currentPhase === 'intro' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {attributeDefinition.display_name}
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Definition</h3>
                  <p className="text-green-700 italic text-lg leading-relaxed">
                    {attributeDefinition.definition}
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentPhase === 'base_questions' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 text-center">Initial Questions</h2>
              
              {attributeDefinition.base_questions.map((question) => (
                <div key={question.id} className="space-y-4">
                  <label className="block text-lg font-medium text-gray-900">
                    {question.question_text}
                    {question.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderQuestionInput(question, true)}
                </div>
              ))}
            </div>
          )}

          {currentPhase === 'scoring' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 text-center">Rate This Attribute</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Our scale is DIFFERENT:</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <span className="font-bold text-blue-800 min-w-[60px]">10 - {ATTRIBUTE_SCALE_TITLES[currentAttribute]?.excellent || 'Excellent'}:</span>
                    <span className="text-blue-700">{attributeDefinition.scale_descriptions.excellent}</span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <span className="font-bold text-green-800 min-w-[60px]">7 - {ATTRIBUTE_SCALE_TITLES[currentAttribute]?.good || 'Good'}:</span>
                    <span className="text-green-700">{attributeDefinition.scale_descriptions.good}</span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <span className="font-bold text-yellow-800 min-w-[60px]">5 - {ATTRIBUTE_SCALE_TITLES[currentAttribute]?.below_expectation || 'Below Expectation'}:</span>
                    <span className="text-yellow-700">{attributeDefinition.scale_descriptions.below_expectation}</span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <span className="font-bold text-red-800 min-w-[60px]">1 - {ATTRIBUTE_SCALE_TITLES[currentAttribute]?.poor || 'Poor'}:</span>
                    <span className="text-red-700">{attributeDefinition.scale_descriptions.poor}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 text-center">
                  On a scale of 1–10, how would you rate this person's {attributeDefinition.display_name.toLowerCase()}?
                </h3>
                
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                    <button
                      key={score}
                      onClick={() => handleScoreChange(score)}
                      className={`
                        p-4 rounded-lg border-2 transition-all duration-200 font-bold text-lg
                        ${currentScore === score
                          ? 'border-primary-500 bg-primary-500 text-white shadow-lg transform scale-105'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                        }
                      `}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                
                <div className="text-center text-sm text-gray-500">
                  <span className="font-medium">{ATTRIBUTE_SCALE_TITLES[currentAttribute]?.poor || 'Poor'}</span>
                  <span className="mx-8">↔</span>
                  <span className="font-medium">{ATTRIBUTE_SCALE_TITLES[currentAttribute]?.excellent || 'Excellent'}</span>
                </div>
              </div>
            </div>
          )}

          {currentPhase === 'conditional_questions' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Follow-up Questions</h2>
                <p className="text-gray-600 mt-2">
                  Based on your rating of {currentScore}, please answer these additional questions:
                </p>
              </div>
              
              {getConditionalQuestions().map((question) => (
                <div key={question.id} className="space-y-4">
                  <label className="block text-lg font-medium text-gray-900">
                    {question.question_text}
                    {question.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderQuestionInput(question, false)}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="secondary"
            onClick={() => {
              if (currentPhase === 'intro') {
                if (currentAttributeIndex > 0) {
                  setCurrentAttributeIndex(prev => prev - 1);
                  setCurrentPhase('conditional_questions');
                                     setCurrentScore(getScoreForAttribute(PERFORMANCE_ATTRIBUTES[currentAttributeIndex - 1], session!) || null);
                }
              } else if (currentPhase === 'base_questions') {
                setCurrentPhase('intro');
              } else if (currentPhase === 'scoring') {
                setCurrentPhase('base_questions');
              } else if (currentPhase === 'conditional_questions') {
                setCurrentPhase('scoring');
              }
            }}
            disabled={currentPhase === 'intro' && currentAttributeIndex === 0}
          >
            Previous
          </Button>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 mb-1">
              {attributeDefinition?.display_name}
            </div>
            <div className="text-sm text-gray-500">
              Attribute {currentAttributeIndex + 1} of {PERFORMANCE_ATTRIBUTES.length} • Phase: {currentPhase.replace('_', ' ')}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handlePhaseNext}
            disabled={!canProceedFromCurrentPhase() || saving}
            className="flex items-center space-x-2"
          >
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <span>
                {currentPhase === 'conditional_questions' 
                  ? (isLastAttribute ? 'Complete Survey' : 'Next Attribute')
                  : 'Continue'
                }
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}; 