-- Create Analytics Views for Internal Survey Data Aggregation
-- Purpose: Create weighted_evaluation_scores and quarter_final_scores views
-- Issue: Employee Analytics showing no data for internal survey submissions
-- Date: January 25, 2025

-- Drop existing views if they exist (for clean recreation)
DROP VIEW IF EXISTS weighted_evaluation_scores;
DROP VIEW IF EXISTS quarter_final_scores;

-- Create weighted_evaluation_scores view
-- This view aggregates attribute scores by evaluation type and calculates weighted scores
CREATE OR REPLACE VIEW weighted_evaluation_scores AS
WITH evaluation_data AS (
    SELECT 
        s.evaluatee_id,
        evaluatee.name as evaluatee_name,
        s.quarter_id,
        ec.name as quarter_name,
        ec.start_date as quarter_start_date,
        ec.end_date as quarter_end_date,
        ats.attribute_name,
        s.evaluation_type,
        ats.score
    FROM attribute_scores ats
    JOIN submissions s ON ats.submission_id = s.submission_id
    JOIN people evaluatee ON s.evaluatee_id = evaluatee.id
    JOIN evaluation_cycles ec ON s.quarter_id = ec.id
    WHERE evaluatee.active = true
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

-- Create quarter_final_scores view  
-- This view provides quarterly aggregated scores for trend analysis
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
    avg_completion_percentage as completion_percentage,
    peer_count,
    manager_count,
    self_count,
    peer_count + manager_count + self_count as total_submissions,
    -- Meets minimum requirements if has at least manager and one other type
    (manager_count > 0 AND (peer_count > 0 OR self_count > 0)) as meets_minimum_requirements
FROM quarterly_data;

-- Grant permissions
GRANT SELECT ON weighted_evaluation_scores TO anon, authenticated;
GRANT SELECT ON quarter_final_scores TO anon, authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weighted_evaluation_scores_evaluatee_quarter 
ON weighted_evaluation_scores(evaluatee_id, quarter_id);

CREATE INDEX IF NOT EXISTS idx_quarter_final_scores_evaluatee 
ON quarter_final_scores(evaluatee_id);

CREATE INDEX IF NOT EXISTS idx_quarter_final_scores_quarter_start 
ON quarter_final_scores(quarter_start_date);

-- Add comments for documentation
COMMENT ON VIEW weighted_evaluation_scores IS 
'Aggregates internal survey attribute scores by evaluation type with weighted calculations. Used by Employee Analytics charts.';

COMMENT ON VIEW quarter_final_scores IS 
'Provides quarterly aggregated performance scores for trend analysis. Used by Employee Analytics trend charts.';

-- Test the views with sample data
SELECT 'TESTING: weighted_evaluation_scores view' as test_step;
SELECT COUNT(*) as total_records, 
       COUNT(DISTINCT evaluatee_id) as unique_employees,
       COUNT(DISTINCT quarter_id) as unique_quarters
FROM weighted_evaluation_scores;

SELECT 'TESTING: quarter_final_scores view' as test_step;
SELECT COUNT(*) as total_records,
       COUNT(DISTINCT evaluatee_id) as unique_employees, 
       COUNT(DISTINCT quarter_id) as unique_quarters
FROM quarter_final_scores;

-- Test specific case: Kolbe Smith Q2 2025
SELECT 'TESTING: Kolbe Smith Q2 2025 data' as test_step;
SELECT evaluatee_name, quarter_name, attribute_name, manager_score, peer_score, self_score, weighted_final_score
FROM weighted_evaluation_scores 
WHERE evaluatee_name ILIKE '%kolbe%' 
AND quarter_name ILIKE '%Q2%' AND quarter_name ILIKE '%2025%'
LIMIT 5; 