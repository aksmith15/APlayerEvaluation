-- ===================================================================
-- STAGE 9.1: CORE GROUP SCORING SYSTEM - DATABASE VIEWS
-- ===================================================================
-- Purpose: Create database views that provide easy access to core group data
-- using the calculation functions for API integration and performance optimization

-- ===================================================================
-- DROP EXISTING VIEWS TO AVOID TYPE CONFLICTS
-- ===================================================================

DROP VIEW IF EXISTS core_group_scores CASCADE;
DROP VIEW IF EXISTS core_group_scores_with_consensus CASCADE;
DROP VIEW IF EXISTS core_group_summary CASCADE;
DROP VIEW IF EXISTS quarter_core_group_trends CASCADE;

-- ===================================================================
-- VIEW 1: Core Group Scores (Main View)
-- ===================================================================
-- Primary view for core group data - compatible with existing patterns

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
    -- Add timestamp for tracking
    NOW() as calculated_at
FROM base_data bd
CROSS JOIN LATERAL calculate_core_group_scores(bd.evaluatee_id, bd.quarter_id) cgs
JOIN evaluation_cycles ec ON bd.quarter_id = ec.id
WHERE cgs.weighted_score > 0; -- Only include records with actual data

-- ===================================================================
-- VIEW 2: Core Group Scores with Consensus Metrics
-- ===================================================================
-- Enhanced view including consensus analysis for detailed insights

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
    -- Consensus metrics
    cgs.self_vs_others_gap,
    cgs.manager_vs_peer_gap,
    cgs.consensus_variance,
    -- Calculated insights flags
    CASE 
        WHEN cgs.self_vs_others_gap > 1.5 THEN true 
        ELSE false 
    END as has_self_awareness_gap,
    CASE 
        WHEN cgs.manager_vs_peer_gap > 1.0 THEN true 
        ELSE false 
    END as has_evaluator_disagreement,
    CASE 
        WHEN cgs.weighted_score >= 8.0 THEN 'high'
        WHEN cgs.weighted_score >= 6.0 THEN 'medium'
        ELSE 'low'
    END as performance_level,
    -- Add timestamp for tracking
    NOW() as calculated_at
FROM base_data bd
CROSS JOIN LATERAL calculate_core_group_scores_with_consensus(bd.evaluatee_id, bd.quarter_id) cgs
JOIN evaluation_cycles ec ON bd.quarter_id = ec.id
WHERE cgs.weighted_score > 0; -- Only include records with actual data

-- ===================================================================
-- VIEW 3: Core Group Summary (Aggregated View)
-- ===================================================================
-- Summarized view for dashboard overview and quick analytics

CREATE VIEW core_group_summary AS
SELECT 
    evaluatee_id,
    evaluatee_name,
    quarter_id,
    quarter_name,
    quarter_start_date,
    quarter_end_date,
    -- Overall core group metrics
    ROUND(AVG(weighted_score), 2) as overall_score,
    ROUND(AVG(completion_percentage), 2) as overall_completion,
    -- Individual core group scores
    ROUND(AVG(CASE WHEN core_group = 'competence' THEN weighted_score END), 2) as competence_score,
    ROUND(AVG(CASE WHEN core_group = 'character' THEN weighted_score END), 2) as character_score,
    ROUND(AVG(CASE WHEN core_group = 'curiosity' THEN weighted_score END), 2) as curiosity_score,
    -- Performance classification
    CASE 
        WHEN AVG(weighted_score) >= 8.0 THEN 'high_performer'
        WHEN AVG(weighted_score) >= 6.0 THEN 'solid_performer'
        ELSE 'developing_performer'
    END as performance_classification,
    -- Core group balance analysis
    CASE 
        WHEN GREATEST(
            AVG(CASE WHEN core_group = 'competence' THEN weighted_score END),
            AVG(CASE WHEN core_group = 'character' THEN weighted_score END),
            AVG(CASE WHEN core_group = 'curiosity' THEN weighted_score END)
        ) - LEAST(
            AVG(CASE WHEN core_group = 'competence' THEN weighted_score END),
            AVG(CASE WHEN core_group = 'character' THEN weighted_score END),
            AVG(CASE WHEN core_group = 'curiosity' THEN weighted_score END)
        ) <= 1.0 THEN 'balanced'
        ELSE 'unbalanced'
    END as core_group_balance,
    -- Count metrics
    COUNT(*) as total_core_groups,
    COUNT(CASE WHEN weighted_score >= 8.0 THEN 1 END) as high_performing_groups,
    COUNT(CASE WHEN weighted_score < 6.0 THEN 1 END) as development_groups
FROM core_group_scores
GROUP BY 
    evaluatee_id, evaluatee_name, quarter_id, quarter_name, 
    quarter_start_date, quarter_end_date;

-- ===================================================================
-- VIEW 4: Quarter Core Group Trends
-- ===================================================================
-- Historical trend analysis for core groups across quarters

CREATE VIEW quarter_core_group_trends AS
WITH quarterly_scores AS (
    SELECT 
        evaluatee_id,
        evaluatee_name,
        quarter_id,
        quarter_name,
        quarter_start_date,
        quarter_end_date,
        core_group,
        weighted_score,
        -- Add quarter ordering for trend calculation
        ROW_NUMBER() OVER (
            PARTITION BY evaluatee_id, core_group 
            ORDER BY quarter_start_date
        ) as quarter_sequence
    FROM core_group_scores
),
trend_calculations AS (
    SELECT 
        qs.*,
        -- Calculate trend from previous quarter
        LAG(weighted_score) OVER (
            PARTITION BY evaluatee_id, core_group 
            ORDER BY quarter_start_date
        ) as previous_quarter_score,
        -- Calculate moving average (3 quarters)
        AVG(weighted_score) OVER (
            PARTITION BY evaluatee_id, core_group 
            ORDER BY quarter_start_date 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) as moving_avg_3q
    FROM quarterly_scores qs
)
SELECT 
    evaluatee_id,
    evaluatee_name,
    quarter_id,
    quarter_name,
    quarter_start_date,
    quarter_end_date,
    core_group,
    weighted_score,
    previous_quarter_score,
    ROUND(moving_avg_3q, 2) as moving_avg_3q,
    -- Trend calculation
    CASE 
        WHEN previous_quarter_score IS NULL THEN 'new'
        WHEN weighted_score > previous_quarter_score + 0.5 THEN 'improving'
        WHEN weighted_score < previous_quarter_score - 0.5 THEN 'declining'
        ELSE 'stable'
    END as trend_direction,
    ROUND(
        CASE 
            WHEN previous_quarter_score IS NOT NULL AND previous_quarter_score > 0 
            THEN ((weighted_score - previous_quarter_score) / previous_quarter_score) * 100 
            ELSE 0 
        END, 
        2
    ) as trend_percentage,
    quarter_sequence
FROM trend_calculations;

-- ===================================================================
-- MATERIALIZED VIEW FOR PERFORMANCE (Optional)
-- ===================================================================
-- For high-performance scenarios, consider materializing the main view

-- CREATE MATERIALIZED VIEW core_group_scores_materialized AS
-- SELECT * FROM core_group_scores;

-- CREATE UNIQUE INDEX idx_core_group_scores_mat_pk 
-- ON core_group_scores_materialized(evaluatee_id, quarter_id, core_group);

-- CREATE INDEX idx_core_group_scores_mat_quarter 
-- ON core_group_scores_materialized(quarter_id);

-- CREATE INDEX idx_core_group_scores_mat_evaluatee 
-- ON core_group_scores_materialized(evaluatee_id);

-- ===================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===================================================================

-- Optimize the underlying weighted_evaluation_scores queries
CREATE INDEX IF NOT EXISTS idx_weighted_eval_scores_evaluatee_quarter 
ON attribute_scores(submission_id) 
INCLUDE (attribute_name, score);

-- ===================================================================
-- GRANT PERMISSIONS
-- ===================================================================

-- Grant access to views for application users
GRANT SELECT ON core_group_scores TO anon, authenticated;
GRANT SELECT ON core_group_scores_with_consensus TO anon, authenticated;
GRANT SELECT ON core_group_summary TO anon, authenticated;
GRANT SELECT ON quarter_core_group_trends TO anon, authenticated;

-- ===================================================================
-- VIEW COMMENTS FOR DOCUMENTATION
-- ===================================================================

COMMENT ON VIEW core_group_scores IS 
'Primary view for core group performance data. Groups individual evaluation attributes into 
three strategic performance sectors: Competence (Execution & Delivery), Character (Leadership & Interpersonal), 
and Curiosity (Growth & Innovation). Compatible with existing weighted_evaluation_scores patterns.';

COMMENT ON VIEW core_group_scores_with_consensus IS 
'Enhanced core group view including consensus metrics for evaluator alignment analysis. 
Provides self-awareness gap detection, evaluator disagreement identification, and performance classification.';

COMMENT ON VIEW core_group_summary IS 
'Aggregated core group view providing overall performance metrics, balance analysis, and 
classification for dashboard overview and executive reporting.';

COMMENT ON VIEW quarter_core_group_trends IS 
'Historical trend analysis for core group performance across quarters. Includes trend direction, 
percentage changes, and moving averages for performance trajectory analysis.';

-- ===================================================================
-- TESTING QUERIES (COMMENTED OUT FOR PRODUCTION)
-- ===================================================================

/*
-- Test basic core group scores view
SELECT * FROM core_group_scores 
WHERE evaluatee_name = 'Test Employee' 
ORDER BY quarter_start_date DESC, core_group;

-- Test consensus metrics
SELECT 
    evaluatee_name,
    quarter_name,
    core_group,
    weighted_score,
    self_vs_others_gap,
    has_self_awareness_gap,
    performance_level
FROM core_group_scores_with_consensus 
WHERE has_self_awareness_gap = true;

-- Test summary view
SELECT 
    evaluatee_name,
    quarter_name,
    overall_score,
    competence_score,
    character_score,
    curiosity_score,
    performance_classification,
    core_group_balance
FROM core_group_summary
ORDER BY overall_score DESC;

-- Test trends
SELECT 
    evaluatee_name,
    quarter_name,
    core_group,
    weighted_score,
    trend_direction,
    trend_percentage
FROM quarter_core_group_trends
WHERE trend_direction = 'improving'
ORDER BY trend_percentage DESC;
*/