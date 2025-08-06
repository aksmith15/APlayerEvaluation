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
        id: 'reliability_commitment_follow_through',
        attribute_name: 'Reliability',
        question_text: 'When this person makes a commitment, how often do they follow through completely?',
        question_type: 'single_select',
        is_required: true,
        options: [
          'Always delivers on commitments, often ahead of schedule',
          'Usually delivers with occasional minor delays or adjustments',
          'Sometimes delivers but often needs reminders or support',
          'Frequently fails to deliver or delivers incomplete work',
          'Consistently unreliable with commitments'
        ],
        order: 1
      },
      {
        id: 'reliability_communication_proactivity',
        attribute_name: 'Reliability',
        question_text: 'How do they communicate when issues might affect their commitments?',
        question_type: 'single_select',
        is_required: true,
        options: [
          'Proactively communicates potential issues early with solutions',
          'Usually gives advance notice when problems arise',
          'Sometimes communicates issues but often at the last minute',
          'Rarely communicates problems until asked directly',
          'Consistently fails to communicate issues affecting commitments'
        ],
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'reliability_excellence_systems',
            attribute_name: 'Reliability',
            question_text: 'What are the top two systems or methods this person uses to ensure their exceptional reliability? (Select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Uses detailed planning and scheduling systems',
              'Has personal tracking methods for commitments',
              'Builds in buffer time for unexpected issues',
              'Creates personal accountability checkpoints',
              'Uses reminder systems consistently',
              'I haven\'t observed their specific systems'
            ],
            order: 1
          },
          {
            id: 'reliability_pressure_performance',
            attribute_name: 'Reliability',
            question_text: 'How does this person typically respond when under pressure?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Becomes even more reliable and organized',
              'Maintains same level of reliability',
              'Slight decrease but still very reliable',
              'Noticeable decrease under pressure',
              'Haven\'t observed them under pressure'
            ],
            order: 2
          },
          {
            id: 'reliability_teaching_others',
            attribute_name: 'Reliability',
            question_text: 'How does this person support others in being more reliable?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Regularly coaches others on reliability',
              'Occasionally when asked for advice',
              'Others learn by observing their example',
              'They focus on their own work',
              'I haven\'t observed this'
            ],
            order: 3
          },
          {
            id: 'reliability_excellence_example',
            attribute_name: 'Reliability',
            question_text: 'Describe one specific situation that best demonstrates why you rated their reliability this high.',
            question_type: 'text',
            is_required: true,
            order: 4
          },
          {
            id: 'reliability_leadership_readiness',
            attribute_name: 'Reliability',
            question_text: 'How ready is this person for greater responsibility based on their reliability?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Ready for significantly expanded responsibility',
              'Could handle moderate additional responsibility',
              'Should focus on deepening expertise in current role',
              'Not ready for additional responsibility yet',
              'Unclear about their leadership potential'
            ],
            order: 5
          },
          {
            id: 'reliability_organizational_impact',
            attribute_name: 'Reliability',
            question_text: 'What effect does this person\'s reliability have on the rest of the team?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Raises the bar for entire team performance',
              'Serves as reliable anchor during team challenges',
              'Others seek them out for critical work',
              'Consistent individual contributor without team impact',
              'I haven\'t observed their impact on others'
            ],
            order: 6
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'reliability_success_situations',
            attribute_name: 'Reliability',
            question_text: 'In what types of situations does this person perform most reliably? (Select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Work within their established expertise',
              'Projects they can fully control',
              'Short-term, clear deadlines',
              'Work they\'re passionate about',
              'Stable, consistent work rhythms',
              'When expectations are explicitly detailed'
            ],
            order: 1
          },
          {
            id: 'reliability_struggle_situations',
            attribute_name: 'Reliability',
            question_text: 'What types of situations seem to challenge their reliability the most? (Select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Tasks requiring new skills they haven\'t developed',
              'Work requiring constant coordination with others',
              'Projects without regular feedback or progress markers',
              'Tasks that feel disconnected from their goals',
              'High-pressure, changing environments',
              'When expectations are unclear or assumed'
            ],
            order: 2
          },
          {
            id: 'reliability_workload_impact',
            attribute_name: 'Reliability',
            question_text: 'How does this person\'s reliability change depending on their workload?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Reliable regardless of workload',
              'Reliable when workload is manageable',
              'Becomes unreliable when overwhelmed',
              'Actually more reliable when busy',
              'Workload doesn\'t seem to be the factor'
            ],
            order: 3
          },
          {
            id: 'reliability_consistency_pattern',
            attribute_name: 'Reliability',
            question_text: 'What is the most common pattern you see in their reliability over time?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Consistent performance with occasional dips',
              'Strong starts but fades on longer projects',
              'Reliable for important work, less so for routine tasks',
              'Performance varies with team dynamics',
              'Struggles with competing priorities'
            ],
            order: 4
          },
          {
            id: 'reliability_primary_motivation',
            attribute_name: 'Reliability',
            question_text: 'What seems to most motivate this person to stay reliable?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Personal standards and pride',
              'Not wanting to disappoint others',
              'Clear consequences or accountability',
              'Genuine interest in the work',
              'External oversight or check-ins',
              'Not sure what motivates their reliability'
            ],
            order: 5
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'reliability_primary_cause',
            attribute_name: 'Reliability',
            question_text: 'What seems to be the primary cause of their unreliable performance?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lacks organizational systems and methods',
              'Consistently overcommits relative to capacity',
              'Avoids difficult or uncomfortable tasks',
              'Personal life significantly interfering with work',
              'Misaligned expectations about role requirements',
              'Lacks motivation or engagement with the work'
            ],
            order: 1
          },
          {
            id: 'reliability_improvement_pattern',
            attribute_name: 'Reliability',
            question_text: 'What is the current pattern of their reliability performance over time?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Steady improvement over recent months',
              'Inconsistent – good periods followed by setbacks',
              'Stable poor performance with no change',
              'Getting progressively worse over time',
              'Too early to determine pattern'
            ],
            order: 2
          },
          {
            id: 'reliability_intervention_response',
            attribute_name: 'Reliability',
            question_text: 'How has this person responded to conversations or efforts to improve their reliability?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Actively works on improvements and shows progress',
              'Acknowledges issues but struggles to implement changes',
              'Agrees to improvements but doesn\'t follow through',
              'Defensive about feedback and resistant to change',
              'Haven\'t had direct improvement conversations yet'
            ],
            order: 3
          },
          {
            id: 'reliability_support_needs',
            attribute_name: 'Reliability',
            question_text: 'What type of support do you think would help them improve most? (Select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'More structured systems and processes',
              'Clearer expectations and more frequent check-ins',
              'Workload adjustment or reprioritization help',
              'Skill development in specific areas',
              'Personal support for external challenges',
              'Role clarification or potential reassignment'
            ],
            order: 4
          },
          {
            id: 'reliability_improvement_likelihood',
            attribute_name: 'Reliability',
            question_text: 'How likely do you think it is that this person\'s reliability will improve?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very likely with appropriate support and time',
              'Possible but will require significant effort from everyone',
              'Unlikely unless external circumstances change significantly',
              'Very unlikely in their current role',
              'Too early to assess improvement potential'
            ],
            order: 5
          },
          {
            id: 'reliability_specific_examples',
            attribute_name: 'Reliability',
            question_text: 'Describe 1–2 recent examples of reliability failures.',
            question_type: 'text',
            is_required: true,
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
        id: 'accountability_ownership_speed',
        attribute_name: 'Accountability for Action',
        question_text: 'When something goes wrong in their area, how quickly do they take ownership?',
        question_type: 'single_select',
        is_required: true,
        options: [
          'Immediately steps forward before being asked',
          'Takes ownership when it becomes clear it\'s their responsibility',
          'Needs prompting but then accepts responsibility',
          'Reluctant even with clear responsibility',
          'Actively avoids or deflects ownership',
          'Haven\'t observed this directly'
        ],
        order: 1
      },
      {
        id: 'accountability_learning_demonstration',
        attribute_name: 'Accountability for Action',
        question_text: 'After taking accountability for an issue, how do they demonstrate learning? (Select top 2)',
        question_type: 'multi_select',
        is_required: true,
        max_selections: 2,
        options: [
          'Implements systematic changes to prevent recurrence',
          'Shares lessons learned with others proactively',
          'Makes personal adjustments but doesn\'t share broadly',
          'Says they\'ve learned but behavior doesn\'t change',
          'Rarely references past accountability situations'
        ],
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'accountability_leadership_style',
            attribute_name: 'Accountability for Action',
            question_text: 'How do they influence accountability in others?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Creates culture of ownership through visible example',
              'Coaches others through accountability moments',
              'Takes preventive ownership before issues arise',
              'Transforms failures into team learning opportunities',
              'Quietly ensures nothing falls through cracks',
              'Haven\'t observed these directly'
            ],
            order: 1
          },
          {
            id: 'accountability_boundary_management',
            attribute_name: 'Accountability for Action',
            question_text: 'How well do they manage what to own vs. what not to own?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Perfect balance - owns their part without overreaching',
              'Sometimes takes too much responsibility for others\' failures',
              'Occasionally under-owns shared responsibilities',
              'Clear about boundaries and communicates them well',
              'Boundary clarity varies by situation',
              'Haven\'t observed this directly'
            ],
            order: 2
          },
          {
            id: 'accountability_speaking_up',
            attribute_name: 'Accountability for Action',
            question_text: 'When they make a mistake that affects senior leaders, what do they do?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Openly admits mistakes to senior leaders, even when uncomfortable',
              'Carefully but honestly communicates issues upward',
              'Strong ownership with peers, more cautious with managers',
              'Avoids taking ownership when senior people are involved',
              'Haven\'t seen them need to own mistakes with leadership'
            ],
            order: 3
          },
          {
            id: 'accountability_scope_awareness',
            attribute_name: 'Accountability for Action',
            question_text: 'When taking ownership, how much do they consider the wider impact?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Explains how their actions affected the team/organization',
              'Focuses on fixing their specific task',
              'Helps others understand the domino effect of accountability',
              'Only thinks about their individual responsibility',
              'Develops systems to prevent similar issues team-wide',
              'Unsure'
            ],
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'accountability_comfort_situations',
            attribute_name: 'Accountability for Action',
            question_text: 'In what situations do they take accountability most readily? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Individual mistakes with clear solutions',
              'Team issues where they played a clear role',
              'When the stakes are relatively low',
              'When they have strong relationships with those affected',
              'When they feel confident about how to fix it',
              'When prompted by others'
            ],
            order: 1
          },
          {
            id: 'accountability_avoidance_situations',
            attribute_name: 'Accountability for Action',
            question_text: 'In what situations do they avoid or delay taking accountability? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Complex situations with multiple contributing factors',
              'High-visibility mistakes with senior leadership involved',
              'Team failures where individual responsibility is unclear',
              'When they disagree with the criticism or feedback',
              'When the solution or path forward is unclear',
              'When emotions are running high'
            ],
            order: 2
          },
          {
            id: 'accountability_primary_hesitation',
            attribute_name: 'Accountability for Action',
            question_text: 'What seems to be their primary hesitation with taking accountability?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Fear of negative consequences or judgment',
              'Uncertainty about their actual role or responsibility',
              'Tendency to focus on solutions rather than ownership',
              'Discomfort with being in the spotlight',
              'Preference to understand the full situation first',
              'Not sure what drives their hesitation'
            ],
            order: 3
          },
          {
            id: 'accountability_follow_through_quality',
            attribute_name: 'Accountability for Action',
            question_text: 'When they do take accountability, how is their follow-through?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Excellent - creates and executes clear action plans',
              'Good - follows through but may need some guidance',
              'Inconsistent - sometimes strong, sometimes weak',
              'Weak - acknowledges but struggles with follow-through',
              'Haven\'t observed enough follow-through to assess'
            ],
            order: 4
          },
          {
            id: 'accountability_support_needs',
            attribute_name: 'Accountability for Action',
            question_text: 'What would help them take accountability more consistently? (Select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Needs clearer role definitions and expectations',
              'Requires safer environment for admitting mistakes',
              'Benefits from accountability partners or structures',
              'Needs skill development in specific areas',
              'Requires different consequence/reward balance',
              'Not sure what support would help'
            ],
            order: 4
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'accountability_avoidance_patterns',
            attribute_name: 'Accountability for Action',
            question_text: 'What accountability avoidance patterns do you observe most?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Blames external circumstances or other people',
              'Acknowledges issues but doesn\'t take personal ownership',
              'Avoids or delays addressing mistakes until forced to',
              'Becomes defensive when accountability is expected',
              'Simply doesn\'t follow through on commitments to improve',
              'Makes excuses or minimizes the impact of issues'
            ],
            order: 1
          },
          {
            id: 'accountability_pattern_consistency',
            attribute_name: 'Accountability for Action',
            question_text: 'How consistent are these accountability issues?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very consistent - occurs in most situations requiring accountability',
              'Frequent - happens more often than not',
              'Occasional - depends on the situation or stakes involved',
              'Rare but memorable when it happens'
            ],
            order: 2
          },
          {
            id: 'accountability_root_cause_assessment',
            attribute_name: 'Accountability for Action',
            question_text: 'What do you think is the root cause of their accountability struggles?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Fear of consequences or negative judgment',
              'Lack of understanding about what accountability means',
              'Defensive personality trait or ego protection',
              'Overwhelmed and using avoidance as a coping mechanism',
              'Past negative experiences with taking accountability',
              'Fundamental discomfort with responsibility',
              'Unclear - could be multiple factors'
            ],
            order: 3
          },
          {
            id: 'accountability_impact_analysis',
            attribute_name: 'Accountability for Action',
            question_text: 'Describe the most significant impact their lack of accountability has had on the team or work:',
            question_type: 'text',
            is_required: false,
            placeholder: 'Focus on specific consequences and how it affected others or outcomes...',
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
        id: 'quality_output_consistency',
        attribute_name: 'Quality of Work',
        question_text: 'How would you describe the consistency of their work quality?',
        question_type: 'single_select',
        is_required: true,
        options: [
          'Exceptional quality across all types of work',
          'High quality with rare exceptions',
          'Good quality with occasional inconsistencies',
          'Quality varies significantly by task type',
          'Generally below expected standards'
        ],
        order: 1
      },
      {
        id: 'quality_self_assessment',
        attribute_name: 'Quality of Work',
        question_text: 'How accurately do they judge their own work quality before submitting it?',
        question_type: 'single_select',
        is_required: true,
        options: [
          'Highly accurate - rarely surprised by feedback',
          'Generally accurate with minor blind spots',
          'Sometimes overestimates their work quality',
          'Often unaware of quality gaps',
          'Haven\'t observed their self-assessment'
        ],
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'quality_excellence_behaviors',
            attribute_name: 'Quality of Work',
            question_text: 'What makes their work quality exceptional? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Nearly always accurate and error-free on first submission',
              'Exceeds expectations in thoroughness and completeness',
              'Anticipates potential issues and addresses them proactively',
              'Sets quality standards that others reference',
              'Consistently professional and well-executed work',
              'Delivers work that requires minimal or no corrections'
            ],
            order: 1
          },
          {
            id: 'quality_under_pressure',
            attribute_name: 'Quality of Work',
            question_text: 'How does their quality hold up under pressure or tight deadlines?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Quality remains consistently high even under pressure',
              'Minor decrease but still exceeds most standards',
              'Noticeable decrease but still acceptable',
              'Haven\'t observed them under significant pressure'
            ],
            order: 2
          },
          {
            id: 'quality_helps_others_improve',
            attribute_name: 'Quality of Work',
            question_text: 'How do they help elevate quality standards for others?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Actively mentors others and provides quality feedback',
              'Creates standards or best practices for the team',
              'Serves as a quality resource when others need help',
              'Sets a good example but doesn\'t actively teach',
              'Haven\'t observed them helping others with quality'
            ],
            order: 3
          },
          {
            id: 'quality_excellence_example',
            attribute_name: 'Quality of Work',
            question_text: 'Describe a recent example that best demonstrates their exceptional work quality:',
            question_type: 'text',
            is_required: false,
            placeholder: 'Focus on what made the quality exceptional and its impact...',
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'quality_strong_situations',
            attribute_name: 'Quality of Work',
            question_text: 'In what situations does this person produce their highest quality work?',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Familiar or routine tasks',
              'Complex problem-solving projects',
              'Individual work with clear requirements',
              'Team projects with collaboration',
              'Customer-facing or high-visibility work',
              'When given adequate time to complete'
            ],
            order: 1
          },
          {
            id: 'quality_inconsistent_situations',
            attribute_name: 'Quality of Work',
            question_text: 'In what situations does their quality become less consistent?',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Unfamiliar or complex tasks',
              'Rushed deadlines or high pressure',
              'Ambiguous or unclear requirements',
              'When juggling multiple priorities',
              'Customer or external stakeholder work',
              'Haven\'t observed quality inconsistencies'
            ],
            order: 2
          },
          {
            id: 'quality_improvement_barrier',
            attribute_name: 'Quality of Work',
            question_text: 'What seems to be the main barrier to more consistent quality?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Time pressure and competing priorities',
              'Lack of clear quality standards or examples',
              'Missing skills or training in certain areas',
              'Overwhelm with workload volume',
              'Limited access to tools or resources',
              'Not sure what the main barrier is'
            ],
            order: 3
          },
          {
            id: 'quality_high_stakes_confidence',
            attribute_name: 'Quality of Work',
            question_text: 'How confident would you be assigning them a high-stakes deliverable (visible to leadership or customers)?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very confident - would be my first choice',
              'Confident with normal oversight',
              'Would need extra review and support',
              'Would prefer someone else for high-stakes work',
              'Haven\'t seen enough to judge'
            ],
            order: 4
          },
          {
            id: 'quality_development_focus',
            attribute_name: 'Quality of Work',
            question_text: 'What would most help this person achieve more consistent quality in their work?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider skills, processes, resources, or environmental changes...',
            order: 5
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'quality_specific_issues',
            attribute_name: 'Quality of Work',
            question_text: 'What specific quality problems occur most frequently? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Errors or inaccuracies in work',
              'Poor organization or structure',
              'Missing key information or requirements',
              'Unclear or confusing work output',
              'Sloppy or careless execution',
              'Work that doesn\'t meet basic specifications',
              'Creates problems for others who use the work'
            ],
            order: 1
          },
          {
            id: 'quality_primary_cause',
            attribute_name: 'Quality of Work',
            question_text: 'What appears to be the primary cause of quality issues?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lacks necessary skills or knowledge',
              'Rushes through work without adequate checking',
              'Doesn\'t understand quality expectations',
              'Overwhelmed by workload demands',
              'Seems to lack attention to detail',
              'Not sure what causes the quality issues'
            ],
            order: 2
          },
          {
            id: 'quality_downstream_impact',
            attribute_name: 'Quality of Work',
            question_text: 'What is the top impact of their quality problems on the team?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Creates critical failures requiring escalation',
              'Causes significant rework for colleagues',
              'Minor inconveniences but work is usable',
              'Mainly affects their own productivity',
              'Impact varies by project type'
            ],
            order: 3
          },
          {
            id: 'quality_improvement_potential',
            attribute_name: 'Quality of Work',
            question_text: 'What would most likely help this person improve their work quality?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider specific training, processes, support, or changes that might help...',
            order: 4
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
        id: 'initiative_frequency',
        attribute_name: 'Taking Initiative',
        question_text: 'In your experience with this person, how frequently do they act without being asked?',
        question_type: 'single_select',
        is_required: true,
        options: [
          'Consistently takes ownership and steps in proactively',
          'Often takes initiative, especially when comfortable with the context',
          'Occasionally steps up but usually waits for direction',
          'Rarely takes initiative, even when opportunities are clear',
          'Not sure / haven\'t observed'
        ],
        order: 1
      },
      {
        id: 'initiative_style',
        attribute_name: 'Taking Initiative',
        question_text: 'When they do take initiative, what best describes their style? (select top 2)',
        question_type: 'multi_select',
        is_required: true,
        max_selections: 2,
        options: [
          'Problem-solver: fixes things before they break',
          'Builder: creates or improves systems, tools, or processes',
          'Helper: supports others without being prompted',
          'Challenger: questions assumptions to create value',
          'Opportunist: spots and seizes new openings',
          'Not sure / haven\'t observed'
        ],
        order: 2
      },
      {
        id: 'initiative_example',
        attribute_name: 'Taking Initiative',
        question_text: 'Share an example of when this person took initiative.',
        question_type: 'text',
        is_required: false,
        order: 3
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'initiative_proactive_behaviors',
            attribute_name: 'Taking Initiative',
            question_text: 'What types of proactive behaviors do you observe most frequently? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Identifies and solves problems before they escalate',
              'Takes on additional responsibilities without being asked',
              'Proposes improvements to processes or workflows',
              'Steps up to help teammates or other departments',
              'Anticipates needs and prepares solutions in advance',
              'Takes ownership of gaps or unclear responsibilities'
            ],
            order: 1
          },
          {
            id: 'initiative_leadership_influence',
            attribute_name: 'Taking Initiative',
            question_text: 'How does their initiative influence others?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Inspires others to be more proactive',
              'Others look to them when initiative is needed',
              'Sets a good example but doesn\'t actively encourage others',
              'Focuses on their own initiatives',
              'Haven\'t observed their influence on others'
            ],
            order: 2
          },
          {
            id: 'initiative_scope_comfort',
            attribute_name: 'Taking Initiative',
            question_text: 'What scope of initiative are they most comfortable taking?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Takes initiative on team-wide or organizational issues',
              'Comfortable with department-level improvements',
              'Primarily focuses on their immediate work area',
              'Takes initiative mainly on individual tasks',
              'Scope varies significantly by situation'
            ],
            order: 3
          },
          {
            id: 'initiative_excellence_example',
            attribute_name: 'Taking Initiative',
            question_text: 'Describe their most impactful recent initiative and what made it exceptional:',
            question_type: 'text',
            is_required: false,
            placeholder: 'Focus on what they initiated, why it mattered, and the results...',
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'initiative_comfortable_areas',
            attribute_name: 'Taking Initiative',
            question_text: 'In what areas do they most readily take initiative? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Within their core expertise and responsibilities',
              'When they see clear problems that need solving',
              'In collaborative or team-support situations',
              'When they have strong relationships with those involved',
              'In low-risk or familiar situations',
              'When explicitly encouraged by others'
            ],
            order: 1
          },
          {
            id: 'initiative_hesitation_areas',
            attribute_name: 'Taking Initiative',
            question_text: 'In what areas do they hesitate to take initiative? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Cross-departmental or unfamiliar areas',
              'High-visibility or high-stakes situations',
              'When roles and authority are unclear',
              'Complex problems without obvious solutions',
              'When it might step on others\' responsibilities',
              'Don\'t observe hesitation - they\'re generally proactive'
            ],
            order: 2
          },
          {
            id: 'initiative_primary_barrier',
            attribute_name: 'Taking Initiative',
            question_text: 'What seems to be their primary barrier to taking more initiative?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Uncertainty about boundaries or authority',
              'Fear of making mistakes or overstepping',
              'Lack of confidence in their ideas or solutions',
              'Already fully occupied with current responsibilities',
              'Preference to wait for clear direction',
              'Not sure what holds them back'
            ],
            order: 3
          },
          {
            id: 'initiative_support_effectiveness',
            attribute_name: 'Taking Initiative',
            question_text: 'When they do take initiative, how effective are they typically?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very effective - consistently gets good results',
              'Generally effective but may need some guidance',
              'Mixed results - sometimes successful, sometimes not',
              'Well-intentioned but often needs redirection',
              'Haven\'t observed enough outcomes to assess'
            ],
            order: 4
          },
          {
            id: 'initiative_development_focus',
            attribute_name: 'Taking Initiative',
            question_text: 'What would most help this person take initiative more consistently?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider confidence building, authority clarification, skill development, or environmental changes...',
            order: 5
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'initiative_avoidance_patterns',
            attribute_name: 'Taking Initiative',
            question_text: 'What patterns do you observe regarding their lack of initiative? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Waits for explicit direction even when action is clearly needed',
              'Sees problems but doesn\'t act to address them',
              'Avoids taking on anything beyond minimum requirements',
              'Misses opportunities to contribute or help others',
              'Defers to others even when they could take the lead',
              'Seems paralyzed by uncertainty or risk'
            ],
            order: 1
          },
          {
            id: 'initiative_root_cause',
            attribute_name: 'Taking Initiative',
            question_text: 'What appears to be the root cause of their lack of initiative?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lacks confidence in their abilities or judgment',
              'Doesn\'t recognize opportunities where initiative is needed',
              'Understands the need but avoids responsibility or risk',
              'Overwhelmed with current workload',
              'Cultural or personality preference for following direction',
              'Unclear about when initiative is expected or appropriate'
            ],
            order: 2
          },
          {
            id: 'initiative_team_impact',
            attribute_name: 'Taking Initiative',
            question_text: 'How does their lack of initiative affect team dynamics or outcomes?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Creates gaps that others must fill',
              'Slows progress when leadership is needed',
              'Minimal impact - others naturally step up',
              'Puts extra burden on more proactive team members',
              'Too early to assess the full impact'
            ],
            order: 3
          },
          {
            id: 'initiative_improvement_potential',
            attribute_name: 'Taking Initiative',
            question_text: 'What would most likely help this person become more proactive?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider confidence building, skill development, clearer expectations, or role adjustments...',
            order: 4
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
        id: 'adaptability_observation',
        attribute_name: 'Adaptability',
        question_text: 'In your experience with this person during changes or uncertainty, which of these have you observed? (select top 2)',
        question_type: 'multi_select',
        is_required: true,
        max_selections: 2,
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
        question_text: 'Any specific example that stands out? (Type NA if you can\'t recall)',
        question_type: 'text',
        is_required: false,
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'adaptability_change_response',
            attribute_name: 'Adaptability',
            question_text: 'How do they typically respond when significant changes occur? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Embraces change and helps others navigate it',
              'Adapts quickly and maintains productivity',
              'Stays calm and works through challenges methodically',
              'Finds creative solutions during transitions',
              'Takes charge when others struggle with change',
              'Thrives in uncertain or ambiguous situations'
            ],
            order: 1
          },
          {
            id: 'adaptability_recovery_speed',
            attribute_name: 'Adaptability',
            question_text: 'When disrupted by unexpected changes, how quickly do they return to full effectiveness?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Immediately - often performs better than before',
              'Within a day or two with minimal impact',
              'Takes about a week to fully adjust',
              'Longer adjustment periods but gets there',
              'Haven\'t observed them through major changes'
            ],
            order: 2
          },
          {
            id: 'adaptability_helps_others',
            attribute_name: 'Adaptability',
            question_text: 'How do they help others during periods of change?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Actively coaches and supports others through transitions',
              'Available for help when others ask',
              'Leads by example but focuses on their own adaptation',
              'Sometimes impatient with others who struggle to adapt',
              'Haven\'t observed them helping others with change'
            ],
            order: 3
          },
          {
            id: 'adaptability_excellence_example',
            attribute_name: 'Adaptability',
            question_text: 'Describe a recent example that best demonstrates their exceptional adaptability:',
            question_type: 'text',
            is_required: false,
            placeholder: 'Focus on the change they faced, how they handled it, and the positive outcome...',
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'adaptability_comfortable_changes',
            attribute_name: 'Adaptability',
            question_text: 'What types of changes do they handle most comfortably? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Gradual or planned changes with advance notice',
              'Technical or process improvements',
              'Team or organizational structure changes',
              'Priority or deadline adjustments',
              'New tools or methods',
              'Customer or project requirement changes'
            ],
            order: 1
          },
          {
            id: 'adaptability_challenging_changes',
            attribute_name: 'Adaptability',
            question_text: 'What types of changes create the most difficulty for them? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Sudden or unexpected changes with no warning',
              'Changes that affect their core responsibilities',
              'Ambiguous changes without clear direction',
              'Changes imposed from outside their department',
              'Multiple simultaneous changes',
              'Haven\'t observed them struggling with any changes'
            ],
            order: 2
          },
          {
            id: 'adaptability_adjustment_pattern',
            attribute_name: 'Adaptability',
            question_text: 'What is their typical adjustment pattern when facing change?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Adapts quickly with minimal visible stress',
              'Initial resistance but comes around within a reasonable time',
              'Takes time to process but eventually adapts well',
              'Adapts but with ongoing complaints or negativity',
              'Struggles significantly throughout the transition'
            ],
            order: 3
          },
          {
            id: 'adaptability_communication_style',
            attribute_name: 'Adaptability',
            question_text: 'How do they communicate during periods of change or uncertainty?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Stays positive and communicates openly about challenges',
              'Generally constructive but may express some concerns',
              'Tends to keep concerns to themselves',
              'Communication becomes negative or disruptive',
              'Haven\'t observed their communication during change'
            ],
            order: 4
          },
          {
            id: 'adaptability_development_focus',
            attribute_name: 'Adaptability',
            question_text: 'What would most help this person adapt more effectively to change?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider preparation methods, support systems, communication, or mindset changes...',
            order: 5
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'adaptability_resistance_behaviors',
            attribute_name: 'Adaptability',
            question_text: 'What resistance behaviors do you observe when changes occur? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Openly complains or criticizes the changes',
              'Becomes withdrawn or disengaged',
              'Continues old methods despite new requirements',
              'Creates tension or negativity in the team',
              'Requires extensive convincing or support',
              'Slows down or reduces productivity significantly'
            ],
            order: 1
          },
          {
            id: 'adaptability_primary_struggle',
            attribute_name: 'Adaptability',
            question_text: 'What appears to be their primary struggle with change?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Fear of failure or making mistakes in new situations',
              'Strong attachment to familiar methods and routines',
              'Difficulty processing or understanding new requirements',
              'Stress response that impairs their performance',
              'Resistance to authority or imposed changes',
              'Overwhelmed by the pace or scope of changes'
            ],
            order: 2
          },
          {
            id: 'adaptability_team_impact',
            attribute_name: 'Adaptability',
            question_text: 'How does their resistance to change affect team dynamics or productivity?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Significantly disrupts team progress and morale',
              'Creates extra work for others who must compensate',
              'Slows implementation but doesn\'t derail efforts',
              'Minimal impact - team works around their resistance',
              'Too early to assess the full impact'
            ],
            order: 3
          },
          {
            id: 'adaptability_improvement_potential',
            attribute_name: 'Adaptability',
            question_text: 'What would most likely help this person become more adaptable?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider gradual exposure, support systems, training, or role adjustments...',
            order: 4
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
        id: 'problem_solving_approach',
        attribute_name: 'Problem Solving Ability',
        question_text: 'In your experience with this person, how do they typically approach problem solving?',
        question_type: 'single_select',
        is_required: true,
        options: [
          'They quickly recognize problems and solve them effectively, often improving systems or helping others learn',
          'They handle most problems methodically, occasionally needing support for complex or ambiguous issues',
          'They handle routine problems reliably but struggle when things get uncertain, interpersonal, or high-pressure',
          'They often avoid, escalate, or delay when problems arise',
          'Not sure / I haven\'t observed enough'
        ],
        order: 1
      },
      {
        id: 'problem_solving_example',
        attribute_name: 'Problem Solving Ability',
        question_text: 'Describe a situation where their problem solving stood out—positively or negatively.',
        question_type: 'text',
        is_required: false,
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'problem_solving_approach_excellence',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What makes their problem-solving approach exceptional? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Quickly identifies root causes rather than just symptoms',
              'Develops creative solutions others hadn\'t considered',
              'Remains calm and systematic under pressure',
              'Anticipates and prevents problems before they occur',
              'Effectively involves others when collaboration is needed',
              'Finds solutions that address multiple issues at once'
            ],
            order: 1
          },
          {
            id: 'problem_solving_complexity_handling',
            attribute_name: 'Problem Solving Ability',
            question_text: 'How do they handle complex problems with multiple variables?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Breaks them down systematically and solves them effectively',
              'Seeks input from others but drives the solution process',
              'Generally handles complexity well with some guidance',
              'Prefers to escalate very complex problems',
              'Haven\'t observed them with highly complex problems'
            ],
            order: 2
          },
          {
            id: 'problem_solving_others_seek_help',
            attribute_name: 'Problem Solving Ability',
            question_text: 'How often do others come to them for help with difficult problems?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Regularly - they\'re known as a go-to problem solver',
              'Occasionally for problems in their area of expertise',
              'Rarely - others usually look elsewhere first',
              'Haven\'t observed others seeking their help',
              'Not sure'
            ],
            order: 3
          },
          {
            id: 'problem_solving_excellence_example',
            attribute_name: 'Problem Solving Ability',
            question_text: 'Describe their most impressive recent problem-solving success:',
            question_type: 'text',
            is_required: false,
            placeholder: 'Focus on the problem, their approach, and why it was particularly effective...',
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'problem_solving_success_types',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What types of problems do they solve most effectively? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Technical or equipment-related issues',
              'Process or workflow problems',
              'People or communication challenges',
              'Resource or scheduling conflicts',
              'Customer or external stakeholder issues',
              'Routine problems within their expertise'
            ],
            order: 1
          },
          {
            id: 'problem_solving_struggle_types',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What types of problems do they find most challenging? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Complex problems with multiple causes',
              'Issues outside their area of expertise',
              'Problems requiring quick decisions under pressure',
              'Interpersonal conflicts or sensitive situations',
              'Problems with unclear or incomplete information',
              'Haven\'t observed them struggling with any problem types'
            ],
            order: 2
          },
          {
            id: 'problem_solving_approach_pattern',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What is their typical approach when facing an unfamiliar problem?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Digs in independently and figures it out',
              'Gathers information and seeks appropriate guidance',
              'Tries basic solutions first, then escalates if needed',
              'Tends to escalate quickly rather than attempting solutions',
              'Approach varies significantly depending on the situation'
            ],
            order: 3
          },
          {
            id: 'problem_solving_effectiveness_consistency',
            attribute_name: 'Problem Solving Ability',
            question_text: 'How consistent is their problem-solving effectiveness?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very consistent - reliable problem solver',
              'Generally consistent with occasional struggles',
              'Inconsistent - sometimes effective, sometimes not',
              'Consistently struggles but tries',
              'Haven\'t observed enough to assess consistency'
            ],
            order: 4
          },
          {
            id: 'problem_solving_development_focus',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What would most help this person become a more effective problem solver?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider analytical skills, confidence building, resources, or experience...',
            order: 5
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'problem_solving_avoidance_patterns',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What problem-solving avoidance patterns do you observe? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Immediately escalates problems rather than attempting solutions',
              'Avoids problems entirely and hopes others will handle them',
              'Makes problems worse through poor decisions or inaction',
              'Gives up quickly when initial attempts don\'t work',
              'Blames problems on others or external circumstances',
              'Becomes overwhelmed and shuts down when problems arise'
            ],
            order: 1
          },
          {
            id: 'problem_solving_primary_limitation',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What appears to be their primary limitation in problem solving?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lacks analytical skills or logical thinking ability',
              'Avoids responsibility and accountability for solutions',
              'Gets overwhelmed and can\'t think through options clearly',
              'Doesn\'t have enough experience or knowledge',
              'Freezes up under pressure or when stakes are high',
              'Not sure what their primary limitation is'
            ],
            order: 2
          },
          {
            id: 'problem_solving_team_impact',
            attribute_name: 'Problem Solving Ability',
            question_text: 'How do their problem-solving limitations affect the team or work outcomes?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Creates significant burden on others to solve problems',
              'Causes delays when problems aren\'t addressed promptly',
              'Minor impact - others naturally handle problem-solving',
              'Sometimes makes situations worse before they get better',
              'Too early to assess the full impact'
            ],
            order: 3
          },
          {
            id: 'problem_solving_improvement_potential',
            attribute_name: 'Problem Solving Ability',
            question_text: 'What would most likely help this person develop better problem-solving abilities?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider training, mentoring, experience, confidence building, or role adjustments...',
            order: 4
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
        id: 'teamwork_observation',
        attribute_name: 'Teamwork',
        question_text: 'In your experience with this person in team settings, which of these have you observed? (select top 2)',
        question_type: 'multi_select',
        is_required: true,
        max_selections: 2,
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
        question_text: 'Any specific example that stands out?',
        question_type: 'text',
        is_required: false,
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'teamwork_contribution_style',
            attribute_name: 'Teamwork',
            question_text: 'What makes their teamwork contributions exceptional? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Actively supports and helps teammates succeed',
              'Builds trust and improves team communication',
              'Steps up to handle difficult team situations',
              'Brings out the best in other team members',
              'Takes on unglamorous tasks for team success',
              'Creates a positive and collaborative team environment'
            ],
            order: 1
          },
          {
            id: 'teamwork_conflict_resolution',
            attribute_name: 'Teamwork',
            question_text: 'How do they handle team conflicts or disagreements?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Actively works to resolve conflicts constructively',
              'Helps mediate and find common ground',
              'Stays positive but doesn\'t directly intervene',
              'Focuses on preventing conflicts through good communication',
              'Haven\'t observed them during team conflicts'
            ],
            order: 2
          },
          {
            id: 'teamwork_leadership_natural',
            attribute_name: 'Teamwork',
            question_text: 'How do others respond when they take on team leadership or coordination?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Others readily follow and support their leadership',
              'Generally positive response with good collaboration',
              'Mixed response depending on the situation',
              'They rarely take on formal team leadership roles',
              'Haven\'t observed them in team leadership situations'
            ],
            order: 3
          },
          {
            id: 'teamwork_excellence_example',
            attribute_name: 'Teamwork',
            question_text: 'Describe a recent example that best demonstrates their exceptional teamwork:',
            question_type: 'text',
            is_required: false,
            placeholder: 'Focus on what they did, how it helped the team, and the positive results...',
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'teamwork_strong_situations',
            attribute_name: 'Teamwork',
            question_text: 'In what team situations do they contribute most effectively? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Small, familiar teams with established relationships',
              'Project-based teams with clear goals',
              'Teams where they have relevant expertise',
              'Collaborative problem-solving situations',
              'Teams with strong leadership from others',
              'Cross-functional teams with diverse perspectives'
            ],
            order: 1
          },
          {
            id: 'teamwork_challenging_situations',
            attribute_name: 'Teamwork',
            question_text: 'In what team situations do they struggle or contribute less effectively? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Large teams with many personalities',
              'Teams with unclear roles or goals',
              'High-conflict or tense team environments',
              'When they\'re expected to take the lead',
              'Teams with tight deadlines and pressure',
              'Haven\'t observed them struggling in team situations'
            ],
            order: 2
          },
          {
            id: 'teamwork_collaboration_style',
            attribute_name: 'Teamwork',
            question_text: 'What best describes their typical collaboration style?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Proactive contributor who engages actively',
              'Reliable team player who does their part well',
              'Supportive follower who works best with clear direction',
              'Independent worker who collaborates when necessary',
              'Style varies significantly depending on the team'
            ],
            order: 3
          },
          {
            id: 'teamwork_improvement_barrier',
            attribute_name: 'Teamwork',
            question_text: 'What seems to be the main barrier to more effective teamwork?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lack of confidence in group settings',
              'Preference for individual work over collaboration',
              'Communication style that doesn\'t always connect',
              'Difficulty navigating different personalities',
              'Overwhelmed by current individual responsibilities',
              'Not sure what the main barrier is'
            ],
            order: 4
          },
          {
            id: 'teamwork_development_focus',
            attribute_name: 'Teamwork',
            question_text: 'What would most help this person become a more effective team member?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider communication skills, confidence building, role clarity, or experience...',
            order: 5
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'teamwork_problematic_behaviors',
            attribute_name: 'Teamwork',
            question_text: 'What problematic teamwork behaviors do you observe most frequently? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Avoids collaboration or team responsibilities',
              'Creates conflict or tension with teammates',
              'Doesn\'t communicate effectively with the team',
              'Focuses only on individual work and ignores team needs',
              'Becomes defensive or difficult during team discussions',
              'Undermines team decisions or group morale'
            ],
            order: 1
          },
          {
            id: 'teamwork_primary_issue',
            attribute_name: 'Teamwork',
            question_text: 'What appears to be the root cause of their teamwork difficulties?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Poor communication or interpersonal skills',
              'Ego or competitiveness that interferes with collaboration',
              'Anxiety or discomfort in group settings',
              'Strong preference for working independently',
              'Past negative experiences affecting current team behavior',
              'Not sure what causes their teamwork difficulties'
            ],
            order: 2
          },
          {
            id: 'teamwork_team_impact',
            attribute_name: 'Teamwork',
            question_text: 'How do their teamwork issues affect overall team performance?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Significantly disrupts team effectiveness and morale',
              'Creates extra work for others to compensate',
              'Causes occasional friction but team manages',
              'Minimal impact - team works around the issues',
              'Too early to assess the full impact'
            ],
            order: 3
          },
          {
            id: 'teamwork_improvement_potential',
            attribute_name: 'Teamwork',
            question_text: 'What would most likely help this person become a better team member?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider skills training, team environment changes, coaching, or role adjustments...',
            order: 4
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
        id: 'continuous_improvement_observation',
        attribute_name: 'Continuous Improvement',
        question_text: 'In your experience with this person\'s approach to growth and learning, which of these have you observed? (select top 2)',
        question_type: 'multi_select',
        is_required: true,
        max_selections: 2,
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
        question_text: 'Any specific example that stands out?',
        question_type: 'text',
        is_required: false,
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'continuous_improvement_behaviors',
            attribute_name: 'Continuous Improvement',
            question_text: 'What growth behaviors do you observe most consistently? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Proactively seeks feedback without being prompted',
              'Regularly reflects on and improves their own methods',
              'Implements suggestions and shows visible improvement',
              'Identifies and addresses their own development needs',
              'Coaches and develops others around them',
              'Drives improvements that benefit the whole team'
            ],
            order: 1
          },
          {
            id: 'continuous_improvement_feedback_seeking',
            attribute_name: 'Continuous Improvement',
            question_text: 'How do they approach feedback and development opportunities?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Actively seeks out feedback and learning opportunities',
              'Very receptive when feedback is offered',
              'Generally open but doesn\'t proactively seek input',
              'Accepts feedback but application can be slow',
              'Haven\'t observed their approach to feedback'
            ],
            order: 2
          },
          {
            id: 'continuous_improvement_influence_others',
            attribute_name: 'Continuous Improvement',
            question_text: 'How do they influence the growth mindset of others?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Actively mentors and encourages others to grow',
              'Sets a strong example that others follow',
              'Shares knowledge when asked but doesn\'t push',
              'Focuses primarily on their own development',
              'Haven\'t observed them influencing others\' growth'
            ],
            order: 3
          },
          {
            id: 'continuous_improvement_excellence_example',
            attribute_name: 'Continuous Improvement',
            question_text: 'Describe a recent example that best demonstrates their commitment to continuous improvement:',
            question_type: 'text',
            is_required: false,
            placeholder: 'Focus on what they improved, how they approached it, and the results...',
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'continuous_improvement_receptive_areas',
            attribute_name: 'Continuous Improvement',
            question_text: 'In what areas are they most receptive to feedback and improvement? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Technical skills and job-specific competencies',
              'Process efficiency and work methods',
              'Communication and interpersonal skills',
              'Leadership and team collaboration',
              'Problem-solving and decision-making',
              'Generally receptive across all areas'
            ],
            order: 1
          },
          {
            id: 'continuous_improvement_resistance_areas',
            attribute_name: 'Continuous Improvement',
            question_text: 'In what areas do they show resistance or slower improvement? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Interpersonal or soft skills feedback',
              'Changes to established work methods',
              'Leadership or authority-related development',
              'Feedback about attitude or mindset',
              'Skills outside their primary expertise',
              'Don\'t observe resistance in any particular areas'
            ],
            order: 2
          },
          {
            id: 'continuous_improvement_motivation_driver',
            attribute_name: 'Continuous Improvement',
            question_text: 'What seems to motivate their improvement efforts most?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Personal satisfaction and mastery',
              'Recognition and career advancement',
              'Team success and helping others',
              'External expectations or requirements',
              'Problem-solving and overcoming challenges',
              'Not sure what motivates their improvement'
            ],
            order: 3
          },
          {
            id: 'continuous_improvement_consistency',
            attribute_name: 'Continuous Improvement',
            question_text: 'How consistent are they in following through on improvement efforts?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very consistent - reliably implements changes',
              'Generally consistent with occasional lapses',
              'Inconsistent - starts strong but doesn\'t always sustain',
              'Good intentions but poor follow-through',
              'Haven\'t observed enough improvement efforts to assess'
            ],
            order: 4
          },
          {
            id: 'continuous_improvement_development_focus',
            attribute_name: 'Continuous Improvement',
            question_text: 'What would most help this person become more consistent in their growth and improvement?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider motivation, accountability, resources, or environmental changes...',
            order: 5
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'continuous_improvement_resistance_behaviors',
            attribute_name: 'Continuous Improvement',
            question_text: 'What resistance to improvement do you observe most frequently? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Rejects or dismisses feedback and suggestions',
              'Accepts feedback but never acts on it',
              'Becomes defensive when improvement is discussed',
              'Claims to be too busy for development activities',
              'Believes current methods are always sufficient',
              'Avoids situations where they might receive feedback'
            ],
            order: 1
          },
          {
            id: 'continuous_improvement_root_cause',
            attribute_name: 'Continuous Improvement',
            question_text: 'What appears to be the root cause of their resistance to improvement?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Fear of change or failure',
              'Fixed mindset - believes abilities can\'t be developed',
              'Past negative experiences with feedback or development',
              'Overwhelmed by current responsibilities',
              'Lack of understanding about why improvement matters',
              'Not sure what causes their resistance'
            ],
            order: 2
          },
          {
            id: 'continuous_improvement_team_impact',
            attribute_name: 'Continuous Improvement',
            question_text: 'How does their resistance to improvement affect the team or work environment?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Discourages others from pursuing growth and development',
              'Creates stagnation in processes and methods',
              'Requires others to work around outdated approaches',
              'Minimal impact - others pursue improvement independently',
              'Too early to assess the full impact'
            ],
            order: 3
          },
          {
            id: 'continuous_improvement_potential',
            attribute_name: 'Continuous Improvement',
            question_text: 'What would most likely help this person become more open to growth and improvement?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider different feedback approaches, incentives, support, or environmental changes...',
            order: 4
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
        id: 'communication_observation',
        attribute_name: 'Communication Skills',
        question_text: 'In your experience with this person\'s communication, which of these have you observed? (select top 2)',
        question_type: 'multi_select',
        is_required: true,
        max_selections: 2,
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
        question_text: 'Any specific example that stands out?',
        question_type: 'text',
        is_required: false,
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'communication_excellence_qualities',
            attribute_name: 'Communication Skills',
            question_text: 'What makes their communication exceptionally effective? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Always clear, concise, and easy to understand',
              'Adapts communication style to different audiences effectively',
              'Excellent listener who truly understands others',
              'Handles difficult conversations with skill and tact',
              'Builds trust and rapport quickly through communication',
              'Others seek them out for important or sensitive communications'
            ],
            order: 1
          },
          {
            id: 'communication_pressure_performance',
            attribute_name: 'Communication Skills',
            question_text: 'How effective is their communication under pressure or in critical situations?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Remains exceptionally clear and composed under pressure',
              'Generally strong with minor decrease under stress',
              'Maintains effectiveness but may become more direct',
              'Haven\'t observed them in high-pressure communication situations'
            ],
            order: 2
          },
          {
            id: 'communication_influence_others',
            attribute_name: 'Communication Skills',
            question_text: 'How do they use communication to influence and help others?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Actively coaches others to improve their communication',
              'Sets communication standards that others follow',
              'Facilitates better communication between team members',
              'Leads by example but doesn\'t actively teach others',
              'Haven\'t observed them helping others communicate better'
            ],
            order: 3
          },
          {
            id: 'communication_excellence_example',
            attribute_name: 'Communication Skills',
            question_text: 'Describe a recent example that best demonstrates their exceptional communication skills:',
            question_type: 'text',
            is_required: false,
            placeholder: 'Focus on the situation, their approach, and the positive outcome...',
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'communication_strong_situations',
            attribute_name: 'Communication Skills',
            question_text: 'In what communication situations are they most effective? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'One-on-one or small group conversations',
              'Written communication and documentation',
              'Familiar topics within their expertise',
              'Informal, low-pressure situations',
              'Planned presentations or formal communications',
              'Team meetings and group discussions'
            ],
            order: 1
          },
          {
            id: 'communication_challenging_situations',
            attribute_name: 'Communication Skills',
            question_text: 'In what communication situations do they struggle most? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Large groups or formal presentations',
              'Difficult or sensitive conversations',
              'Cross-functional or external communications',
              'High-pressure or time-sensitive communications',
              'Written documentation and detailed explanations',
              'Haven\'t observed them struggling in any situations'
            ],
            order: 2
          },
          {
            id: 'communication_primary_gap',
            attribute_name: 'Communication Skills',
            question_text: 'What seems to be their primary communication limitation?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lacks confidence in certain communication settings',
              'Provides too much or too little detail',
              'Difficulty reading audience and adjusting approach',
              'Struggles with unclear or incomplete explanations',
              'Tends to avoid difficult or confrontational discussions',
              'Not sure what their primary limitation is'
            ],
            order: 3
          },
          {
            id: 'communication_high_stakes_confidence',
            attribute_name: 'Communication Skills',
            question_text: 'How confident would you be having them communicate on behalf of the team to leadership or customers?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Very confident - would be my first choice',
              'Confident with some preparation or support',
              'Would need significant coaching or oversight',
              'Would prefer someone else for high-stakes communication',
              'Haven\'t seen enough to judge'
            ],
            order: 4
          },
          {
            id: 'communication_development_focus',
            attribute_name: 'Communication Skills',
            question_text: 'What would most help this person become a more effective communicator?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider confidence building, skill training, practice opportunities, or feedback...',
            order: 5
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'communication_frequent_problems',
            attribute_name: 'Communication Skills',
            question_text: 'What communication problems occur most frequently?',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Messages are unclear or confusing to others',
              'Fails to communicate important information',
              'Poor listening skills or interrupts others frequently',
              'Becomes defensive or confrontational in discussions',
              'Avoids necessary but difficult conversations',
              'Creates misunderstandings that require cleanup'
            ],
            order: 1
          },
          {
            id: 'communication_root_cause',
            attribute_name: 'Communication Skills',
            question_text: 'What appears to be the root cause of their communication difficulties?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lacks basic communication skills or training',
              'Anxiety or low confidence in communication situations',
              'Poor listening skills and self-awareness',
              'Overwhelmed and rushes through communications',
              'Interpersonal skills or emotional intelligence gaps',
              'Not sure what causes their communication problems'
            ],
            order: 2
          },
          {
            id: 'communication_team_impact',
            attribute_name: 'Communication Skills',
            question_text: 'How do their communication issues affect team effectiveness or relationships?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Creates significant confusion and requires frequent clarification',
              'Causes occasional misunderstandings but manageable',
              'Others have learned to work around their communication style',
              'Damages trust or relationships with team members',
              'Too early to assess the full impact'
            ],
            order: 3
          },
          {
            id: 'communication_improvement_potential',
            attribute_name: 'Communication Skills',
            question_text: 'What would most likely help this person improve their communication effectiveness?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider skills training, practice, feedback, confidence building, or coaching...',
            order: 4
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
        id: 'leadership_observation',
        attribute_name: 'Leadership',
        question_text: 'In your experience with this person in leadership situations (formal or informal), which of these have you observed? (select top 2)',
        question_type: 'multi_select',
        is_required: true,
        max_selections: 2,
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
        question_text: 'Any specific example that stands out?',
        question_type: 'text',
        is_required: false,
        order: 2
      }
    ],
    conditional_question_sets: [
      {
        score_range: '9-10',
        questions: [
          {
            id: 'leadership_influence_behaviors',
            attribute_name: 'Leadership',
            question_text: 'How do they demonstrate leadership influence, regardless of formal authority? (select top 2)',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Others naturally seek their guidance and advice',
              'Sets a strong example that others follow',
              'Takes initiative to guide team decisions or direction',
              'Builds trust and motivates others effectively',
              'Speaks up and influences outcomes in group settings',
              'Helps resolve conflicts and brings people together'
            ],
            order: 1
          },
          {
            id: 'leadership_trust_level',
            attribute_name: 'Leadership',
            question_text: 'When important decisions or guidance are needed, how do others respond to them?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Others actively seek their input and follow their lead',
              'Generally trusted and respected when they speak up',
              'Contributes good ideas but others may take the lead',
              'Has influence mainly within their area of expertise',
              'Haven\'t observed others looking to them for leadership'
            ],
            order: 2
          },
          {
            id: 'leadership_natural_situations',
            attribute_name: 'Leadership',
            question_text: 'In what situations does their natural leadership emerge most clearly?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Crisis or problem-solving situations',
              'When expertise or experience is needed',
              'During team conflicts or difficult discussions',
              'When coordinating group efforts or projects',
              'Haven\'t observed clear leadership emergence'
            ],
            order: 3
          },
          {
            id: 'leadership_excellence_example',
            attribute_name: 'Leadership',
            question_text: 'Describe a recent example that best demonstrates their leadership influence:',
            question_type: 'text',
            is_required: false,
            placeholder: 'Focus on how they influenced, guided, or motivated others and the positive results...',
            order: 4
          }
        ]
      },
      {
        score_range: '6-8',
        questions: [
          {
            id: 'leadership_influence_areas',
            attribute_name: 'Leadership',
            question_text: 'In what areas do they show the most leadership influence?',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Within their area of technical expertise',
              'When mentoring or training others',
              'During collaborative problem-solving',
              'In safety or quality-focused situations',
              'When coordinating work between team members',
              'During challenging or stressful situations'
            ],
            order: 1
          },
          {
            id: 'leadership_hesitation_areas',
            attribute_name: 'Leadership',
            question_text: 'In what areas do they hesitate to show leadership or influence?',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Outside their area of expertise or comfort zone',
              'With senior or more experienced team members',
              'In highly visible or high-stakes situations',
              'During interpersonal conflicts or sensitive issues',
              'When formal authority or decision-making is required',
              'Don\'t observe hesitation - they step up when needed'
            ],
            order: 2
          },
          {
            id: 'leadership_style_effectiveness',
            attribute_name: 'Leadership',
            question_text: 'How would you describe their leadership approach when they do step up?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Collaborative - brings people together to find solutions',
              'Direct - provides clear guidance and direction',
              'Supportive - helps others succeed and develop',
              'Leading by example - shows rather than tells',
              'Varies depending on the situation and people involved'
            ],
            order: 3
          },
          {
            id: 'leadership_development_barrier',
            attribute_name: 'Leadership',
            question_text: 'What seems to be the main barrier to more consistent leadership influence?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lack of confidence in leadership abilities',
              'Prefers to focus on individual work rather than leading others',
              'Uncertainty about when leadership is appropriate or expected',
              'Limited experience in leadership situations',
              'Reluctance to take responsibility for others\' outcomes',
              'Not sure what holds them back'
            ],
            order: 4
          },
          {
            id: 'leadership_development_focus',
            attribute_name: 'Leadership',
            question_text: 'What would most help this person develop stronger leadership influence?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider confidence building, experience opportunities, skills development, or clearer expectations...',
            order: 5
          }
        ]
      },
      {
        score_range: '1-5',
        questions: [
          {
            id: 'leadership_influence_problems',
            attribute_name: 'Leadership',
            question_text: 'What problems do you observe with their leadership or influence attempts?',
            question_type: 'multi_select',
            is_required: true,
            max_selections: 2,
            options: [
              'Avoids stepping up when guidance or direction is needed',
              'Others don\'t trust or follow their guidance',
              'Creates confusion or conflict when trying to lead',
              'Lacks credibility or respect from team members',
              'Makes poor decisions that affect others negatively',
              'Undermines or conflicts with other leaders'
            ],
            order: 1
          },
          {
            id: 'leadership_primary_limitation',
            attribute_name: 'Leadership',
            question_text: 'What appears to be their primary limitation in leadership or influence?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Lacks confidence to guide or influence others',
              'Poor interpersonal skills that prevent effective influence',
              'Avoids responsibility for group outcomes or decisions',
              'Doesn\'t understand how to motivate or guide others',
              'Gets overwhelmed when others look to them for direction',
              'Not sure what their primary limitation is'
            ],
            order: 2
          },
          {
            id: 'leadership_team_impact',
            attribute_name: 'Leadership',
            question_text: 'How do their leadership limitations affect team effectiveness?',
            question_type: 'single_select',
            is_required: true,
            options: [
              'Creates leadership gaps that others must constantly fill',
              'Sometimes makes group situations more difficult',
              'Minimal impact - others naturally provide direction',
              'Causes delays when decisive guidance is needed',
              'Too early to assess the full impact'
            ],
            order: 3
          },
          {
            id: 'leadership_improvement_potential',
            attribute_name: 'Leadership',
            question_text: 'What would most likely help this person develop basic leadership or influence capabilities?',
            question_type: 'text',
            is_required: false,
            placeholder: 'Consider confidence building, mentoring, gradual responsibility, or interpersonal skills...',
            order: 4
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

    // Helper function to identify exclusive options (like "Haven't observed" or "Not sure")
    const isExclusiveOption = (option: string): boolean => {
      const exclusivePatterns = [
        /^haven't observed/i,
        /^not sure/i,
        /^none of the above/i,
        /^don't know/i,
        /^i haven't observed/i,
        /^unsure$/i
      ];
      return exclusivePatterns.some(pattern => pattern.test(option));
    };

    switch (question.question_type) {
      case 'multi_select':
        // Ensure currentValues is always an array
        const currentValues = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
        const hasExclusiveSelected = currentValues.some((val: string) => isExclusiveOption(val));
        const hasNonExclusiveSelected = currentValues.some((val: string) => !isExclusiveOption(val));
        const maxSelections = question.max_selections || Infinity;

        return (
          <div className="space-y-3">
            {question.options?.map(option => {
              const isThisExclusive = isExclusiveOption(option);
              const isSelected = currentValues.includes(option);
              const atMaxSelections = currentValues.length >= maxSelections;
              
              // Disable logic:
              // 1. If an exclusive option is selected and this is not exclusive -> disable
              // 2. If non-exclusive options are selected and this is exclusive -> disable  
              // 3. If at max selections and this option is not selected -> disable
              const isDisabled = (!isSelected && atMaxSelections) ||
                                (hasExclusiveSelected && !isThisExclusive) ||
                                (hasNonExclusiveSelected && isThisExclusive);

              return (
                <label 
                  key={option} 
                  className={`flex items-start space-x-3 cursor-pointer group ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={(e) => {
                      if (isDisabled) return;
                      
                      let updatedValues: string[];
                      
                      if (e.target.checked) {
                        if (isThisExclusive) {
                          // If selecting an exclusive option, clear all others
                          updatedValues = [option];
                        } else {
                          // If selecting a non-exclusive option, clear any exclusive options first
                          const nonExclusiveValues = currentValues.filter((v: string) => !isExclusiveOption(v));
                          updatedValues = [...nonExclusiveValues, option];
                        }
                      } else {
                        // Simply remove the unchecked option
                        updatedValues = currentValues.filter((v: string) => v !== option);
                      }
                      
                      handleChange(question.id, updatedValues);
                    }}
                    className={`mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${
                      isDisabled ? 'cursor-not-allowed' : ''
                    }`}
                  />
                  <span className={`text-sm leading-relaxed ${
                    isDisabled 
                      ? 'text-gray-400' 
                      : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {option}
                  </span>
                </label>
              );
            })}
            {question.max_selections && (
              <div className="text-xs text-gray-500 mt-2">
                {currentValues.length}/{question.max_selections} selected
              </div>
            )}
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
      // Navigate with refresh parameter to ensure assignments list updates
      navigate('/assignments/my?completed=true');
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