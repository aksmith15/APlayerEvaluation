# Core Group Insight Generation Algorithm Design
## Stage 12.1 - Auto-Generated Insights System with Qualitative Response Analysis

### 🎯 **Algorithm Overview**
Transform evaluation scores AND qualitative follow-up responses into actionable insights through sophisticated pattern recognition, cross-evaluator consistency analysis, and response-to-score validation for Competence, Character, and Curiosity core groups.

### 📊 **Input Data Structure**
For each core group attribute, we receive:
```typescript
interface AttributeAnalysisInput {
  // Quantitative Data
  scores: {
    self: number (1-10)
    peer: number (1-10) 
    manager: number (1-10)
    weighted_score: number (calculated final score)
  }
  
  // Qualitative Response Data (from attribute_responses table)
  responses: {
    evaluator_type: 'self' | 'peer' | 'manager'
    score_context: '1-5' | '6-8' | '9-10'
    question_responses: {
      [question_id]: string | string[] // Single or multi-select responses
    }
    has_example: boolean // Whether they provided specific examples
  }[]
}
```

### 🧠 **Advanced Analysis Patterns**

#### **1. Cross-Evaluator Response Consistency Analysis**
```sql
-- Analyze response consistency across evaluators for same questions
WITH response_consistency AS (
  SELECT 
    question_id,
    response_value,
    COUNT(DISTINCT evaluator_type) as evaluator_consensus_count,
    COUNT(*) as total_responses
  FROM attribute_responses 
  WHERE attribute_name = ? AND submission_id IN (?)
  GROUP BY question_id, response_value
)
SELECT 
  question_id,
  CASE 
    WHEN evaluator_consensus_count >= 2 THEN 'strong_consensus'
    WHEN total_responses >= 3 AND evaluator_consensus_count = 1 THEN 'no_consensus'
    ELSE 'partial_consensus'
  END as consensus_level
```

**Insight Generation:**
- **Strong Consensus**: High confidence insights based on evaluator agreement
- **No Consensus**: Flag for manager discussion and expectation clarification
- **Partial Consensus**: Moderate confidence insights with caveats

#### **2. Score-to-Response Validation (Failure Detection)**
```sql
-- Detect mismatches between scores and response patterns
WITH score_response_validation AS (
  SELECT 
    attr.weighted_score,
    resp.score_context,
    resp.response_value,
    resp.question_id
  FROM attribute_scores attr
  JOIN attribute_responses resp ON attr.id = resp.attribute_score_id
  WHERE attr.score >= 7 -- High scores
    AND resp.question_id IN ('reliability_observed', 'accountability_observed', 'quality_observed')
    AND resp.response_value IN (
      'Requires regular check-ins or follow-up to ensure completion',
      'Avoided taking ownership even when clearly responsible', 
      'Work frequently requires significant rework or has notable errors'
    )
)
```

**Validation Insights:**
- **Score Inflation**: "High rating but concerning behavioral indicators suggest deeper evaluation needed"
- **Potential Blind Spot**: "Score may not reflect full performance picture based on specific examples"

#### **3. Evidence Confidence Scoring**
```sql
-- Calculate confidence based on example provision and response depth
WITH evidence_confidence AS (
  SELECT 
    attribute_name,
    evaluator_type,
    COUNT(CASE WHEN question_id LIKE '%example%' AND LENGTH(response_value) > 50 THEN 1 END) as detailed_examples,
    COUNT(CASE WHEN response_value != 'I haven\'t observed this' THEN 1 END) as substantive_responses,
    COUNT(*) as total_questions
  FROM attribute_responses
  GROUP BY attribute_name, evaluator_type
)
SELECT 
  CASE 
    WHEN detailed_examples >= 1 AND substantive_responses/total_questions > 0.8 THEN 'high_confidence'
    WHEN substantive_responses/total_questions > 0.6 THEN 'moderate_confidence'
    ELSE 'low_confidence'
  END as evidence_confidence
```

#### **4. Situation-Specific Pattern Recognition (Competence Focus)**

**A. Performance Context Patterns (6-8 Score Range)**
```sql
-- Analyze when person is MOST vs LEAST reliable/accountable/quality-focused
WITH situation_patterns AS (
  SELECT 
    resp1.response_value as success_situations,
    resp2.response_value as struggle_situations
  FROM attribute_responses resp1
  JOIN attribute_responses resp2 ON resp1.submission_id = resp2.submission_id
  WHERE resp1.question_id LIKE '%success_situations' 
    AND resp2.question_id LIKE '%struggle_situations'
)
```

**Cross-Attribute Pattern Detection:**
- **"Low stakes environment"** across all 3 competence attributes → "Thrives in predictable environments; development opportunity in high-pressure situations"
- **"Familiar routine tasks"** across all 3 → "Strong executor in known domains; stretch assignments needed for growth"
- **"Unclear expectations"** as consistent struggle → "Needs explicit clarity; coaching focus on ambiguity tolerance"

**B. Systems and Motivation Analysis (9-10 Score Range)**
```sql
-- Identify A-Player systems and coaching indicators
SELECT 
  resp1.response_value as systems_used,
  resp2.response_value as pressure_performance,
  resp3.response_value as coaching_others
FROM attribute_responses resp1
JOIN attribute_responses resp2 ON resp1.submission_id = resp2.submission_id  
JOIN attribute_responses resp3 ON resp2.submission_id = resp3.submission_id
WHERE resp1.question_id LIKE '%systems'
  AND resp2.question_id LIKE '%pressure%'
  AND resp3.question_id LIKE '%coaching%'
```

**Leadership Potential Indicators:**
- **"Yes, regularly coaches others"** + **"Becomes even more reliable under pressure"** → "Strong leadership potential; ready for increased responsibility"
- **"Creates standards or best practices"** → "Quality leader; candidate for process improvement roles"

**C. Root Cause Analysis (1-5 Score Range)**
```sql
-- Deep-dive into performance issues for targeted coaching
SELECT 
  resp1.response_value as primary_cause,
  resp2.response_value as pattern_duration, 
  resp3.response_value as improvement_likelihood
FROM attribute_responses resp1
JOIN attribute_responses resp2 ON resp1.submission_id = resp2.submission_id
JOIN attribute_responses resp3 ON resp2.submission_id = resp3.submission_id  
WHERE resp1.question_id LIKE '%primary_cause'
  AND resp2.question_id LIKE '%pattern_duration'
  AND resp3.question_id LIKE '%improvement_likelihood'
```

**Coaching Recommendation Mapping:**
- **"Overwhelming workload"** + **"Recent issue"** + **"Very likely with proper support"** → "Workload rebalancing and time management coaching recommended"
- **"Fear of consequences"** + **"Since I started working with them"** → "Trust-building and psychological safety focus needed"

### 🎯 **Competence Core Group - Advanced Pattern Analysis**

#### **Meta-Pattern Detection Across Reliability, Accountability, Quality of Work**

**A. Cross-Attribute Consistency Patterns**
```sql
-- Detect recurring themes across all three competence attributes
WITH competence_themes AS (
  SELECT 
    submission_id,
    STRING_AGG(response_value, '; ') as response_pattern
  FROM attribute_responses 
  WHERE attribute_name IN ('Reliability', 'Accountability for Action', 'Quality of Work')
    AND question_id LIKE '%situations%' 
  GROUP BY submission_id
)
SELECT 
  CASE 
    WHEN response_pattern LIKE '%Low stakes environment%' AND response_pattern LIKE '%clear expectations%' 
    THEN 'needs_clarity_and_low_pressure'
    WHEN response_pattern LIKE '%Familiar routine tasks%' AND response_pattern LIKE '%Individual work%'
    THEN 'independent_executor_in_known_domains'  
    WHEN response_pattern LIKE '%overwhelming workload%' AND response_pattern LIKE '%time pressure%'
    THEN 'capacity_constraint_pattern'
  END as meta_pattern
```

**Competence Meta-Insights:**
- **Clarity Seeker**: "Consistently excels when expectations are explicit and stakes are manageable; development focus on ambiguity tolerance"
- **Independent Executor**: "Strong individual contributor in familiar domains; growth opportunity in collaborative and novel challenges"  
- **Capacity Constrained**: "Performance drops under time/workload pressure across all execution areas; workload optimization needed"

**B. Competence Leadership Indicators**
```sql
-- Identify competence-based leadership potential
WITH leadership_signals AS (
  SELECT 
    submission_id,
    COUNT(CASE WHEN response_value LIKE '%coaches others%' THEN 1 END) as teaching_count,
    COUNT(CASE WHEN response_value LIKE '%standards%' OR response_value LIKE '%best practices%' THEN 1 END) as standards_count,
    COUNT(CASE WHEN response_value LIKE '%pressure%' AND response_value LIKE '%reliable%' THEN 1 END) as pressure_resilience
  FROM attribute_responses
  WHERE attribute_name IN ('Reliability', 'Accountability for Action', 'Quality of Work')
  GROUP BY submission_id
)
SELECT 
  CASE 
    WHEN teaching_count >= 2 AND standards_count >= 1 
    THEN 'execution_leader'
    WHEN pressure_resilience >= 2 AND teaching_count >= 1
    THEN 'high_pressure_leader'
  END as leadership_type
```

**Leadership Insights:**
- **Execution Leader**: "Demonstrates competence leadership through teaching and standard-setting; candidate for process improvement roles"
- **High-Pressure Leader**: "Maintains competence under stress and helps others; ready for crisis management responsibilities"

**C. Development Pathway Mapping**
```sql
-- Map specific competence development paths based on response patterns
WITH development_needs AS (
  SELECT 
    submission_id,
    ARRAY_AGG(response_value) as struggle_responses
  FROM attribute_responses 
  WHERE question_id LIKE '%struggle%' OR question_id LIKE '%barrier%' OR question_id LIKE '%cause%'
  GROUP BY submission_id  
)
SELECT 
  CASE 
    WHEN 'unclear expectations' = ANY(struggle_responses) 
    THEN 'clarity_and_expectations_training'
    WHEN 'overwhelm' = ANY(struggle_responses) OR 'workload' = ANY(struggle_responses)
    THEN 'time_management_and_prioritization'
    WHEN 'skills' = ANY(struggle_responses) OR 'knowledge' = ANY(struggle_responses)  
    THEN 'technical_skill_development'
    WHEN 'pressure' = ANY(struggle_responses)
    THEN 'stress_management_and_resilience'
  END as development_pathway
```

### 🔄 **Implementation Architecture**

#### **Phase 1: Database Layer Enhancement**
```sql
-- Create sophisticated insight generation functions
CREATE OR REPLACE FUNCTION generate_competence_insights(
  p_employee_id UUID,
  p_quarter_id UUID
) RETURNS JSON AS $$
DECLARE
  insight_data JSON;
BEGIN
  -- Aggregate scores, responses, and patterns
  WITH comprehensive_analysis AS (
    -- Score analysis
    SELECT score_patterns.*,
    -- Response consistency analysis  
           consensus_analysis.*,
    -- Evidence confidence scoring
           confidence_metrics.*,
    -- Cross-attribute pattern detection
           meta_patterns.*,
    -- Development pathway mapping  
           development_recommendations.*
    FROM competence_score_analysis score_patterns
    CROSS JOIN response_consensus_analysis consensus_analysis  
    CROSS JOIN evidence_confidence_metrics confidence_metrics
    CROSS JOIN competence_meta_patterns meta_patterns
    CROSS JOIN development_pathway_mapping development_recommendations
    WHERE employee_id = p_employee_id AND quarter_id = p_quarter_id
  )
  SELECT json_build_object(
    'competence_insights', array_agg(insights),
    'confidence_level', avg_confidence,
    'development_priority', top_development_need,
    'leadership_indicators', leadership_signals,
    'coaching_recommendations', specific_actions
  ) INTO insight_data
  FROM comprehensive_analysis;
  
  RETURN insight_data;
END;
$$ LANGUAGE plpgsql;
```

#### **Phase 2: API Layer with Rich Response Analysis**
```typescript
// API endpoint: /api/analytics/competence/[employeeId]/[quarterId]
interface CompetenceInsightResponse {
  attribute_breakdown: {
    reliability: AttributeDetailedAnalysis;
    accountability: AttributeDetailedAnalysis;  
    quality_of_work: AttributeDetailedAnalysis;
  };
  
  meta_insights: {
    cross_attribute_patterns: string[];
    execution_style: 'clarity_seeker' | 'independent_executor' | 'capacity_constrained';
    leadership_potential: 'execution_leader' | 'high_pressure_leader' | 'developing' | 'individual_contributor';
  };
  
  evidence_quality: {
    overall_confidence: 'high' | 'moderate' | 'low';
    evaluator_consensus: 'strong' | 'partial' | 'conflicted';
    example_richness: number; // 0-100 based on detailed examples provided
  };
  
  development_roadmap: {
    immediate_focus: string[];
    coaching_approach: string;
    stretch_opportunities: string[];
    success_metrics: string[];
  };
  
  validation_flags: {
    score_response_mismatches: string[];
    potential_blind_spots: string[];
    discussion_topics: string[];
  };
}
```

#### **Phase 3: Frontend Competence Tab with Rich Insights**
- **Left Panel**: Clustered bar chart with Self/Peer/Manager scores
- **Right Panel**: Multi-section insights display:
  - **Key Patterns** (cross-attribute themes)
  - **Leadership Indicators** (coaching, systems, pressure performance)  
  - **Development Focus** (specific, actionable recommendations)
  - **Evidence Quality** (confidence indicators and validation flags)
  - **Success Contexts** (when they excel vs struggle)

### ✅ **Success Metrics for Advanced Algorithm**
1. **Pattern Detection Accuracy**: 85%+ correlation between response patterns and generated insights
2. **Cross-Evaluator Validation**: Insights flagged when evaluator responses conflict significantly
3. **Actionability**: Each insight includes specific, measurable development recommendations  
4. **Evidence Quality**: Confidence scoring accurately reflects response depth and consistency
5. **Manager Validation**: 90%+ of generated insights deemed accurate and useful by managers

### 🎯 **Next Steps for Implementation Review**

This represents a **qualitative data analysis engine** that goes far beyond simple score thresholds. The algorithm now incorporates:

✅ **Cross-evaluator response consistency analysis**  
✅ **Score-to-response validation (failure detection)**  
✅ **Evidence confidence scoring based on example provision**  
✅ **Situation-specific pattern recognition**  
✅ **Cross-attribute meta-pattern detection**  
✅ **Leadership potential identification through teaching/systems indicators**  
✅ **Root cause analysis and development pathway mapping**  
✅ **Coaching recommendation generation based on response combinations**

### 🤔 **Implementation Complexity Assessment**

**High Complexity Areas:**
- **SQL Pattern Matching**: Complex queries across multiple response tables
- **Response Parsing**: Handling multi-select arrays and text analysis  
- **Pattern Recognition**: Cross-attribute theme detection algorithms
- **Confidence Scoring**: Evidence quality assessment logic

**Moderate Complexity Areas:**  
- **API Layer**: Rich data structures and response formatting
- **Frontend Display**: Multi-section insight visualization
- **Database Functions**: JSON aggregation and analysis logic

### 📊 **Sample Output Preview**
```json
{
  "competence_meta_insights": {
    "execution_style": "clarity_seeker",
    "cross_attribute_patterns": [
      "Consistently excels when expectations are explicit and stakes are manageable",
      "Struggles with ambiguous requirements across all competence areas"
    ],
    "leadership_potential": "developing",
    "evidence_confidence": "high"
  },
  "development_roadmap": {
    "immediate_focus": ["Ambiguity tolerance training", "Expectation clarification systems"],
    "coaching_approach": "Structure-to-flexibility progression",
    "success_metrics": ["Performance in unclear requirement situations", "Proactive clarification requests"]
  },
  "validation_flags": {
    "score_response_mismatches": [],
    "evaluator_consensus": "strong",
    "discussion_topics": ["Growth opportunities in high-ambiguity projects"]
  }
}
```

This algorithm design transforms your sophisticated survey system into an **intelligent coaching recommendation engine**. Ready to proceed with implementation?