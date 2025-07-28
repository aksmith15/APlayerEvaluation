-- Fix Empty Analytics Views Issue
-- Problem: Views exist but are empty after internal survey transition
-- Solution: Recreate views with proper CASCADE and correct data relationships
-- Date: January 25, 2025

-- Step 1: Investigate current view definitions
SELECT 'STEP 1: Current View Definitions' as step;

-- Check what the current weighted_evaluation_scores view looks like
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname IN ('weighted_evaluation_scores', 'quarter_final_scores');

-- Step 2: Check if views are returning data
SELECT 'STEP 2: Current View Data Check' as step;

SELECT 'weighted_evaluation_scores count:' as info, COUNT(*) as record_count
FROM weighted_evaluation_scores;

SELECT 'quarter_final_scores count:' as info, COUNT(*) as record_count  
FROM quarter_final_scores;

-- Step 3: Investigate underlying data that should feed the views
SELECT 'STEP 3: Underlying Data Investigation' as step;

-- Check submissions data
SELECT 'submissions count:' as info, COUNT(*) as record_count
FROM submissions;

-- Check attribute_scores data  
SELECT 'attribute_scores count:' as info, COUNT(*) as record_count
FROM attribute_scores;

-- Check if we have the Kolbe Q2 2025 data specifically
SELECT 'Kolbe Q2 2025 submissions:' as info, COUNT(*) as record_count
FROM submissions s
JOIN people p ON s.evaluatee_id = p.id  
JOIN evaluation_cycles ec ON s.quarter_id = ec.id
WHERE p.name ILIKE '%kolbe%' 
AND ec.name ILIKE '%Q2%' AND ec.name ILIKE '%2025%';

-- Step 4: Drop and recreate views with CASCADE to handle dependencies
SELECT 'STEP 4: Recreating Views' as step;

-- Drop views with CASCADE to handle dependencies
DROP VIEW IF EXISTS quarter_final_scores CASCADE;
DROP VIEW IF EXISTS weighted_evaluation_scores CASCADE;

-- Recreate weighted_evaluation_scores view with corrected logic
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
        ats.score,
        s.created_at
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

-- Recreate quarter_final_scores view  
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

-- Step 5: Grant permissions
GRANT SELECT ON weighted_evaluation_scores TO anon, authenticated;
GRANT SELECT ON quarter_final_scores TO anon, authenticated;

-- Step 6: Test the recreated views
SELECT 'STEP 5: Testing Recreated Views' as step;

SELECT 'NEW weighted_evaluation_scores count:' as info, COUNT(*) as record_count
FROM weighted_evaluation_scores;

SELECT 'NEW quarter_final_scores count:' as info, COUNT(*) as record_count  
FROM quarter_final_scores;

-- Step 7: Test specific Kolbe Q2 2025 data
SELECT 'STEP 6: Kolbe Q2 2025 Test Data' as step;
SELECT 
    evaluatee_name, 
    quarter_name, 
    attribute_name, 
    manager_score, 
    peer_score, 
    self_score, 
    weighted_final_score
FROM weighted_evaluation_scores 
WHERE evaluatee_name ILIKE '%kolbe%' 
AND quarter_name ILIKE '%Q2%' AND quarter_name ILIKE '%2025%'
ORDER BY attribute_name
LIMIT 10;

-- Step 8: Check quarterly trend data for Kolbe
SELECT 'STEP 7: Kolbe Q2 2025 Quarterly Data' as step;
SELECT 
    evaluatee_name,
    quarter_name,
    final_quarter_score,
    completion_percentage,
    total_submissions
FROM quarter_final_scores
WHERE evaluatee_name ILIKE '%kolbe%' 
AND quarter_name ILIKE '%Q2%' AND quarter_name ILIKE '%2025%';

-- Final summary
SELECT 'SUMMARY: View Recreation Complete' as step;
SELECT 
    'Total employees in weighted_evaluation_scores:' as metric,
    COUNT(DISTINCT evaluatee_id) as value
FROM weighted_evaluation_scores
UNION ALL
SELECT 
    'Total quarters in quarter_final_scores:' as metric,
    COUNT(DISTINCT quarter_id) as value
FROM quarter_final_scores; 