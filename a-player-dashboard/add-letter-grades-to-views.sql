-- Add A-Player Letter Grading System to Database Views
-- This script enhances existing views with letter grade calculations
-- Based on the A-Player grade scale: A (8.5-10), B (7.0-8.49), C (5.5-6.99), D (4.0-5.49), F (0-3.99)

-- Create letter grade conversion function
CREATE OR REPLACE FUNCTION get_letter_grade(score DECIMAL)
RETURNS TEXT AS $$
BEGIN
  -- Handle edge cases
  IF score IS NULL OR score < 0 OR score > 10 THEN
    RETURN 'F';
  END IF;
  
  -- A-Player Grade Scale
  IF score >= 8.5 THEN
    RETURN 'A';
  ELSIF score >= 7.0 THEN
    RETURN 'B';
  ELSIF score >= 5.5 THEN
    RETURN 'C';
  ELSIF score >= 4.0 THEN
    RETURN 'D';
  ELSE
    RETURN 'F';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update weighted_evaluation_scores view to include letter grades
-- Drop existing view first to avoid column structure conflicts
DROP VIEW IF EXISTS weighted_evaluation_scores CASCADE;

CREATE VIEW weighted_evaluation_scores AS
WITH evaluation_data AS (
    SELECT 
        sub.evaluatee_id,
        ppl.name as evaluatee_name,
        sub.quarter_id,
        qtr.name as quarter_name,
        qtr.start_date as quarter_start_date,
        qtr.end_date as quarter_end_date,
        attr_scores.attribute_name,
        attr_scores.score,
        sub.evaluation_type
    FROM submissions sub
    JOIN attribute_scores attr_scores ON sub.submission_id = attr_scores.submission_id
    JOIN people ppl ON sub.evaluatee_id = ppl.id
    JOIN evaluation_cycles qtr ON sub.quarter_id = qtr.id
    WHERE ppl.active = true
),
aggregated_scores AS (
    SELECT 
        evaluatee_id,
        evaluatee_name,
        quarter_id,
        quarter_name,
        quarter_start_date,
        quarter_end_date,
        attribute_name,
        AVG(CASE WHEN evaluation_type = 'manager' THEN score END) as manager_score,
        AVG(CASE WHEN evaluation_type = 'peer' THEN score END) as peer_score,
        AVG(CASE WHEN evaluation_type = 'self' THEN score END) as self_score,
        COUNT(CASE WHEN evaluation_type = 'manager' THEN 1 END) > 0 as has_manager_eval,
        COUNT(CASE WHEN evaluation_type = 'peer' THEN 1 END) > 0 as has_peer_eval,
        COUNT(CASE WHEN evaluation_type = 'self' THEN 1 END) > 0 as has_self_eval
    FROM evaluation_data
    GROUP BY evaluatee_id, evaluatee_name, quarter_id, quarter_name, quarter_start_date, quarter_end_date, attribute_name
)
SELECT 
    evaluatee_id,
    evaluatee_name,
    quarter_id,
    quarter_name,
    quarter_start_date::text as quarter_start_date,
    quarter_end_date::text as quarter_end_date,
    attribute_name,
    COALESCE(manager_score, 0) as manager_score,
    COALESCE(peer_score, 0) as peer_score,
    COALESCE(self_score, 0) as self_score,
    -- Calculate weighted final score: Manager 55% + Peer 35% + Self 10%
    ROUND(
        COALESCE(manager_score, 0) * 0.55 + 
        COALESCE(peer_score, 0) * 0.35 + 
        COALESCE(self_score, 0) * 0.10, 
        2
    ) as weighted_final_score,
    -- A-Player Letter Grading System
    get_letter_grade(
        ROUND(
            COALESCE(manager_score, 0) * 0.55 + 
            COALESCE(peer_score, 0) * 0.35 + 
            COALESCE(self_score, 0) * 0.10, 
            2
        )
    ) as weighted_final_grade,
    get_letter_grade(COALESCE(manager_score, 0)) as manager_grade,
    get_letter_grade(COALESCE(peer_score, 0)) as peer_grade,
    get_letter_grade(COALESCE(self_score, 0)) as self_grade,
    has_manager_eval,
    has_peer_eval,
    has_self_eval,
    -- Calculate completion percentage
    CASE 
        WHEN has_manager_eval AND has_peer_eval AND has_self_eval THEN 100.0
        WHEN (has_manager_eval AND has_peer_eval) OR (has_manager_eval AND has_self_eval) OR (has_peer_eval AND has_self_eval) THEN 66.7
        WHEN has_manager_eval OR has_peer_eval OR has_self_eval THEN 33.3
        ELSE 0.0
    END as completion_percentage
FROM aggregated_scores;

-- Update quarter_final_scores view to include letter grades
-- Drop existing view first to avoid column structure conflicts
DROP VIEW IF EXISTS quarter_final_scores CASCADE;

CREATE VIEW quarter_final_scores AS
WITH quarterly_data AS (
    SELECT 
        evaluatee_id,
        evaluatee_name,
        quarter_id,
        quarter_name,
        quarter_start_date,
        quarter_end_date,
        AVG(weighted_final_score) as avg_weighted_score,
        SUM(weighted_final_score) as total_weighted_score,
        COUNT(*) as attributes_count,
        AVG(completion_percentage) as avg_completion_percentage,
        COUNT(CASE WHEN has_manager_eval THEN 1 END) as manager_count,
        COUNT(CASE WHEN has_peer_eval THEN 1 END) as peer_count,
        COUNT(CASE WHEN has_self_eval THEN 1 END) as self_count
    FROM weighted_evaluation_scores
    GROUP BY evaluatee_id, evaluatee_name, quarter_id, quarter_name, quarter_start_date, quarter_end_date
)
SELECT 
    evaluatee_id,
    evaluatee_name,
    quarter_id,
    quarter_name,
    quarter_start_date,
    quarter_end_date,
    total_weighted_score,
    -- Calculate total weight (sum of weights for non-zero scores)
    CASE 
        WHEN manager_count > 0 AND peer_count > 0 AND self_count > 0 THEN attributes_count * 1.0  -- Full weight
        WHEN manager_count > 0 AND peer_count > 0 THEN attributes_count * 0.9  -- Missing self
        WHEN manager_count > 0 AND self_count > 0 THEN attributes_count * 0.65  -- Missing peer
        WHEN peer_count > 0 AND self_count > 0 THEN attributes_count * 0.45  -- Missing manager
        WHEN manager_count > 0 THEN attributes_count * 0.55  -- Only manager
        WHEN peer_count > 0 THEN attributes_count * 0.35  -- Only peer
        WHEN self_count > 0 THEN attributes_count * 0.10  -- Only self
        ELSE 0
    END as total_weight,
    attributes_count,
    -- Calculate final quarter score (average of weighted scores)
    ROUND(avg_weighted_score, 2) as final_quarter_score,
    -- A-Player Letter Grading System - Quarter Grade
    get_letter_grade(ROUND(avg_weighted_score, 2)) as final_quarter_grade,
    avg_completion_percentage as completion_percentage,
    peer_count,
    manager_count,
    self_count,
    peer_count + manager_count + self_count as total_submissions,
    -- Meets minimum requirements if has at least manager and one other type
    (manager_count > 0 AND (peer_count > 0 OR self_count > 0)) as meets_minimum_requirements
FROM quarterly_data;

-- Create grade distribution view for analytics
DROP VIEW IF EXISTS grade_distribution CASCADE;

CREATE VIEW grade_distribution AS
WITH grade_counts AS (
    SELECT 
        quarter_id,
        quarter_name,
        final_quarter_grade as grade,
        COUNT(*) as count
    FROM quarter_final_scores
    WHERE final_quarter_score IS NOT NULL
    GROUP BY quarter_id, quarter_name, final_quarter_grade
),
quarter_totals AS (
    SELECT 
        quarter_id,
        quarter_name,
        COUNT(*) as total_people
    FROM quarter_final_scores
    WHERE final_quarter_score IS NOT NULL
    GROUP BY quarter_id, quarter_name
)
SELECT 
    gc.quarter_id,
    gc.quarter_name,
    gc.grade,
    gc.count,
    qt.total_people,
    ROUND((gc.count::DECIMAL / qt.total_people) * 100, 1) as percentage
FROM grade_counts gc
JOIN quarter_totals qt ON gc.quarter_id = qt.quarter_id
ORDER BY gc.quarter_name, 
    CASE gc.grade 
        WHEN 'A' THEN 1 
        WHEN 'B' THEN 2 
        WHEN 'C' THEN 3 
        WHEN 'D' THEN 4 
        WHEN 'F' THEN 5 
    END;

-- Create A-Player performance summary view
DROP VIEW IF EXISTS a_player_summary CASCADE;

CREATE VIEW a_player_summary AS
SELECT 
    evaluatee_id,
    evaluatee_name,
    quarter_id,
    quarter_name,
    final_quarter_score,
    final_quarter_grade,
    -- A-Player status (Grade A or B, which is 7.0+ score)
    CASE 
        WHEN final_quarter_grade IN ('A', 'B') THEN true
        ELSE false
    END as is_a_player,
    -- Performance tier classification
    CASE 
        WHEN final_quarter_grade = 'A' THEN 'A-Player - Exceptional'
        WHEN final_quarter_grade = 'B' THEN 'High Performer'
        WHEN final_quarter_grade = 'C' THEN 'Solid Contributor'
        WHEN final_quarter_grade = 'D' THEN 'Needs Improvement'
        WHEN final_quarter_grade = 'F' THEN 'Requires Action'
        ELSE 'Not Evaluated'
    END as performance_tier,
    completion_percentage,
    meets_minimum_requirements
FROM quarter_final_scores
ORDER BY quarter_name DESC, final_quarter_score DESC;

-- Grant permissions for new views
GRANT SELECT ON grade_distribution TO anon, authenticated;
GRANT SELECT ON a_player_summary TO anon, authenticated;

-- Update permissions for modified views
GRANT SELECT ON weighted_evaluation_scores TO anon, authenticated;
GRANT SELECT ON quarter_final_scores TO anon, authenticated;

-- Note: Indexes cannot be created on views, only on tables and materialized views
-- The underlying tables (submissions, attribute_scores, people, evaluation_cycles) should have appropriate indexes

-- Add comment documentation
COMMENT ON FUNCTION get_letter_grade IS 'Convert numeric score (0-10) to A-Player letter grade: A (8.5-10), B (7.0-8.49), C (5.5-6.99), D (4.0-5.49), F (0-3.99)';
COMMENT ON VIEW grade_distribution IS 'Letter grade distribution statistics by quarter for organizational performance analytics';
COMMENT ON VIEW a_player_summary IS 'A-Player performance summary with grade-based classification and performance tiers'; 