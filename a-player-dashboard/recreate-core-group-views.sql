-- ===================================================================
-- RECREATE ALL CORE GROUP VIEWS
-- ===================================================================
-- Purpose: Recreate all core group views now that functions work properly

-- Drop any existing views first to ensure clean rebuild
DROP VIEW IF EXISTS core_group_scores CASCADE;
DROP VIEW IF EXISTS core_group_scores_with_consensus CASCADE;
DROP VIEW IF EXISTS core_group_summary CASCADE;
DROP VIEW IF EXISTS quarter_core_group_trends CASCADE;

-- ===================================================================
-- CORE GROUP SCORES VIEW
-- ===================================================================
-- Main view for accessing core group data for all employees/quarters

CREATE VIEW core_group_scores AS
WITH base_data AS (
    SELECT DISTINCT 
        wes.evaluatee_id,
        wes.quarter_id
    FROM weighted_evaluation_scores wes
)
SELECT 
    bd.evaluatee_id,
    cgs.evaluatee_name,
    bd.quarter_id,
    cgs.quarter_name,
    ec.start_date::text as quarter_start_date,
    ec.end_date::text as quarter_end_date,
    cgs.core_group,
    cgs.manager_avg_score,
    cgs.peer_avg_score,
    cgs.self_avg_score,
    cgs.weighted_score,
    cgs.attribute_count,
    cgs.completion_percentage,
    NOW() as calculated_at
FROM base_data bd
CROSS JOIN LATERAL calculate_core_group_scores(bd.evaluatee_id, bd.quarter_id) cgs
JOIN evaluation_cycles ec ON bd.quarter_id = ec.id
WHERE cgs.weighted_score > 0
ORDER BY cgs.evaluatee_name, cgs.quarter_name, 
    CASE cgs.core_group 
        WHEN 'competence' THEN 1 
        WHEN 'character' THEN 2 
        WHEN 'curiosity' THEN 3 
        ELSE 4 
    END;

-- ===================================================================
-- CORE GROUP SCORES WITH CONSENSUS VIEW
-- ===================================================================
-- Enhanced view including consensus analysis metrics

CREATE VIEW core_group_scores_with_consensus AS
WITH base_data AS (
    SELECT DISTINCT 
        wes.evaluatee_id,
        wes.quarter_id
    FROM weighted_evaluation_scores wes
)
SELECT 
    bd.evaluatee_id,
    cgs.evaluatee_name,
    bd.quarter_id,
    cgs.quarter_name,
    ec.start_date::text as quarter_start_date,
    ec.end_date::text as quarter_end_date,
    cgs.core_group,
    cgs.manager_avg_score,
    cgs.peer_avg_score,
    cgs.self_avg_score,
    cgs.weighted_score,
    cgs.attribute_count,
    cgs.completion_percentage,
    cgs.self_vs_others_gap,
    cgs.manager_vs_peer_gap,
    cgs.consensus_variance,
    NOW() as calculated_at
FROM base_data bd
CROSS JOIN LATERAL calculate_core_group_scores_with_consensus(bd.evaluatee_id, bd.quarter_id) cgs
JOIN evaluation_cycles ec ON bd.quarter_id = ec.id
WHERE cgs.weighted_score > 0
ORDER BY cgs.evaluatee_name, cgs.quarter_name, 
    CASE cgs.core_group 
        WHEN 'competence' THEN 1 
        WHEN 'character' THEN 2 
        WHEN 'curiosity' THEN 3 
        ELSE 4 
    END;

-- ===================================================================
-- CORE GROUP SUMMARY VIEW
-- ===================================================================
-- Summarized view for dashboard overview

CREATE VIEW core_group_summary AS
SELECT 
    cgs.evaluatee_id,
    cgs.evaluatee_name,
    cgs.quarter_id,
    cgs.quarter_name,
    cgs.quarter_start_date,
    cgs.quarter_end_date,
    -- Overall performance metrics
    ROUND(AVG(cgs.weighted_score), 2) as overall_weighted_score,
    ROUND(AVG(cgs.manager_avg_score), 2) as overall_manager_score,
    ROUND(AVG(cgs.peer_avg_score), 2) as overall_peer_score,
    ROUND(AVG(cgs.self_avg_score), 2) as overall_self_score,
    -- Core group breakdown
    ROUND(AVG(CASE WHEN cgs.core_group = 'competence' THEN cgs.weighted_score END), 2) as competence_score,
    ROUND(AVG(CASE WHEN cgs.core_group = 'character' THEN cgs.weighted_score END), 2) as character_score,
    ROUND(AVG(CASE WHEN cgs.core_group = 'curiosity' THEN cgs.weighted_score END), 2) as curiosity_score,
    -- Completion metrics
    ROUND(AVG(cgs.completion_percentage), 2) as overall_completion_percentage,
    SUM(cgs.attribute_count) as total_attributes_evaluated,
    COUNT(DISTINCT cgs.core_group) as core_groups_evaluated,
    cgs.calculated_at
FROM core_group_scores cgs
GROUP BY 
    cgs.evaluatee_id, 
    cgs.evaluatee_name, 
    cgs.quarter_id, 
    cgs.quarter_name,
    cgs.quarter_start_date,
    cgs.quarter_end_date,
    cgs.calculated_at
ORDER BY cgs.evaluatee_name, cgs.quarter_name;

-- ===================================================================
-- QUARTER CORE GROUP TRENDS VIEW
-- ===================================================================
-- Historical trend analysis across quarters

CREATE VIEW quarter_core_group_trends AS
WITH quarter_scores AS (
    SELECT 
        cgs.evaluatee_id,
        cgs.evaluatee_name,
        cgs.quarter_id,
        cgs.quarter_name,
        cgs.quarter_start_date::date as quarter_start_date,
        cgs.core_group,
        cgs.weighted_score,
        ROW_NUMBER() OVER (
            PARTITION BY cgs.evaluatee_id, cgs.core_group 
            ORDER BY cgs.quarter_start_date::date
        ) as quarter_sequence
    FROM core_group_scores cgs
    WHERE cgs.weighted_score > 0
),
trend_analysis AS (
    SELECT 
        qs.*,
        LAG(qs.weighted_score) OVER (
            PARTITION BY qs.evaluatee_id, qs.core_group 
            ORDER BY qs.quarter_start_date
        ) as previous_quarter_score,
        LEAD(qs.weighted_score) OVER (
            PARTITION BY qs.evaluatee_id, qs.core_group 
            ORDER BY qs.quarter_start_date
        ) as next_quarter_score
    FROM quarter_scores qs
)
SELECT 
    ta.evaluatee_id,
    ta.evaluatee_name,
    ta.quarter_id,
    ta.quarter_name,
    ta.quarter_start_date,
    ta.core_group,
    ta.weighted_score as current_score,
    ta.previous_quarter_score,
    ta.next_quarter_score,
    ta.quarter_sequence,
    -- Trend calculations
    CASE 
        WHEN ta.previous_quarter_score IS NOT NULL THEN
            ROUND(ta.weighted_score - ta.previous_quarter_score, 2)
        ELSE NULL
    END as quarter_over_quarter_change,
    CASE 
        WHEN ta.previous_quarter_score IS NOT NULL THEN
            CASE 
                WHEN ta.weighted_score > ta.previous_quarter_score + 0.5 THEN 'improving'
                WHEN ta.weighted_score < ta.previous_quarter_score - 0.5 THEN 'declining'
                ELSE 'stable'
            END
        ELSE 'first_quarter'
    END as trend_direction,
    -- Performance classification
    CASE 
        WHEN ta.weighted_score >= 8.0 THEN 'high'
        WHEN ta.weighted_score >= 6.0 THEN 'medium'
        ELSE 'low'
    END as performance_level
FROM trend_analysis ta
ORDER BY ta.evaluatee_name, ta.core_group, ta.quarter_start_date;

-- ===================================================================
-- GRANT PERMISSIONS
-- ===================================================================

GRANT SELECT ON core_group_scores TO anon, authenticated;
GRANT SELECT ON core_group_scores_with_consensus TO anon, authenticated;
GRANT SELECT ON core_group_summary TO anon, authenticated;
GRANT SELECT ON quarter_core_group_trends TO anon, authenticated;

-- ===================================================================
-- TEST ALL VIEWS
-- ===================================================================

SELECT 'Testing all core group views:' as status;

-- Test core_group_scores
SELECT 'core_group_scores' as view_name, COUNT(*) as record_count 
FROM core_group_scores;

-- Test core_group_scores_with_consensus  
SELECT 'core_group_scores_with_consensus' as view_name, COUNT(*) as record_count 
FROM core_group_scores_with_consensus;

-- Test core_group_summary
SELECT 'core_group_summary' as view_name, COUNT(*) as record_count 
FROM core_group_summary;

-- Test quarter_core_group_trends
SELECT 'quarter_core_group_trends' as view_name, COUNT(*) as record_count 
FROM quarter_core_group_trends;

-- Show sample data from main view
SELECT 'Sample core group data:' as info;
SELECT 
    evaluatee_name,
    quarter_name,
    core_group,
    weighted_score,
    attribute_count
FROM core_group_scores 
LIMIT 6;

SELECT 'SUCCESS: All core group views recreated!' as status;