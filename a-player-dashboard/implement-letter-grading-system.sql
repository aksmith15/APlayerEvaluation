-- A-Player Letter Grading System Implementation Script
-- Run these SQL commands in your Supabase SQL Editor step by step

-- Step 1: Create letter grade conversion function (from the original script)
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

-- Step 2: Update existing weighted_evaluation_scores view to include letter grades
CREATE OR REPLACE VIEW weighted_evaluation_scores AS
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

-- Step 3: Update quarter_final_scores view to include letter grades
CREATE OR REPLACE VIEW quarter_final_scores AS
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

-- Step 4: Test the letter grading system
-- Run this query to see letter grades for existing data
SELECT 
    evaluatee_name,
    quarter_name,
    final_quarter_score,
    final_quarter_grade,
    CASE 
        WHEN final_quarter_grade IN ('A', 'B') THEN '🌟 A-Player'
        WHEN final_quarter_grade = 'C' THEN '✅ Solid'
        WHEN final_quarter_grade = 'D' THEN '⚠️ Needs Improvement'
        ELSE '❌ Requires Action'
    END as performance_tier
FROM quarter_final_scores
ORDER BY quarter_name DESC, final_quarter_score DESC;

-- Step 5: Grant permissions
GRANT SELECT ON weighted_evaluation_scores TO anon, authenticated;
GRANT SELECT ON quarter_final_scores TO anon, authenticated;

-- Verification queries
-- Check if letter grades are working
SELECT 
    'Letter Grade Test' as test_name,
    get_letter_grade(9.5) as grade_9_5,
    get_letter_grade(7.8) as grade_7_8,
    get_letter_grade(6.2) as grade_6_2,
    get_letter_grade(4.5) as grade_4_5,
    get_letter_grade(2.1) as grade_2_1; 