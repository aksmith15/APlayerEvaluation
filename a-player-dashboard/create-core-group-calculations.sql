-- ===================================================================
-- STAGE 9.1: CORE GROUP SCORING SYSTEM - DATABASE FUNCTIONS
-- ===================================================================
-- Purpose: Implement core group calculation functions that group individual
-- evaluation attributes into three strategic performance sectors

-- Core Group Mapping:
-- 🎯 COMPETENCE (Execution & Delivery): Reliability, Accountability for Action, Quality of Work
-- 👥 CHARACTER (Leadership & Interpersonal): Leadership, Communication Skills, Teamwork
-- 🚀 CURIOSITY (Growth & Innovation): Problem Solving Ability, Adaptability, Taking Initiative, Continuous Improvement

-- ===================================================================
-- HELPER FUNCTION: Get Core Group for Attribute
-- ===================================================================

CREATE OR REPLACE FUNCTION get_core_group_for_attribute(attribute_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    CASE 
        -- Competence Group (Execution & Delivery)
        WHEN attribute_name IN ('Reliability', 'Accountability for Action', 'Quality of Work') THEN
            RETURN 'competence';
        
        -- Character Group (Leadership & Interpersonal)
        WHEN attribute_name IN ('Leadership', 'Communication Skills', 'Teamwork') THEN
            RETURN 'character';
        
        -- Curiosity Group (Growth & Innovation)
        WHEN attribute_name IN ('Problem Solving Ability', 'Adaptability', 'Taking Initiative', 'Continuous Improvement') THEN
            RETURN 'curiosity';
        
        ELSE
            RETURN 'unknown';
    END CASE;
END;
$$;

-- ===================================================================
-- CORE FUNCTION: Calculate Core Group Scores
-- ===================================================================

CREATE OR REPLACE FUNCTION calculate_core_group_scores(
    input_evaluatee_id UUID,
    input_quarter_id UUID
)
RETURNS TABLE (
    evaluatee_id UUID,
    evaluatee_name TEXT,
    quarter_id UUID,
    quarter_name TEXT,
    core_group TEXT,
    manager_avg_score NUMERIC,
    peer_avg_score NUMERIC,
    self_avg_score NUMERIC,
    weighted_score NUMERIC,
    attribute_count INTEGER,
    completion_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH core_group_data AS (
        SELECT 
            wes.evaluatee_id,
            wes.evaluatee_name,
            wes.quarter_id,
            wes.quarter_name,
            get_core_group_for_attribute(wes.attribute_name) as core_group,
            wes.manager_score,
            wes.peer_score,
            wes.self_score,
            wes.weighted_final_score,
            wes.has_manager_eval,
            wes.has_peer_eval,
            wes.has_self_eval
        FROM weighted_evaluation_scores wes
        WHERE wes.evaluatee_id = input_evaluatee_id
          AND wes.quarter_id = input_quarter_id
          AND get_core_group_for_attribute(wes.attribute_name) != 'unknown'
    ),
    aggregated_core_groups AS (
        SELECT 
            cgd.evaluatee_id,
            cgd.evaluatee_name,
            cgd.quarter_id,
            cgd.quarter_name,
            cgd.core_group,
            -- Calculate averages only from non-zero scores (null handling)
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.manager_score > 0 THEN cgd.manager_score 
                        ELSE NULL 
                    END
                ), 2
            ) as manager_avg_score,
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.peer_score > 0 THEN cgd.peer_score 
                        ELSE NULL 
                    END
                ), 2
            ) as peer_avg_score,
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.self_score > 0 THEN cgd.self_score 
                        ELSE NULL 
                    END
                ), 2
            ) as self_avg_score,
            -- Calculate weighted average score
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.weighted_final_score > 0 THEN cgd.weighted_final_score 
                        ELSE NULL 
                    END
                ), 2
            ) as weighted_score,
            -- Count of attributes in this core group
            COUNT(*) as attribute_count,
            -- Calculate completion percentage
            ROUND(
                (COUNT(CASE WHEN cgd.has_manager_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_peer_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_self_eval THEN 1 END)) * 100.0 / (COUNT(*) * 3),
                2
            ) as completion_percentage
        FROM core_group_data cgd
        GROUP BY cgd.evaluatee_id, cgd.evaluatee_name, cgd.quarter_id, cgd.quarter_name, cgd.core_group
    )
    SELECT 
        acg.evaluatee_id,
        acg.evaluatee_name,
        acg.quarter_id,
        acg.quarter_name,
        acg.core_group,
        COALESCE(acg.manager_avg_score, 0) as manager_avg_score,
        COALESCE(acg.peer_avg_score, 0) as peer_avg_score,
        COALESCE(acg.self_avg_score, 0) as self_avg_score,
        COALESCE(acg.weighted_score, 0) as weighted_score,
        acg.attribute_count,
        COALESCE(acg.completion_percentage, 0) as completion_percentage
    FROM aggregated_core_groups acg
    ORDER BY 
        CASE acg.core_group 
            WHEN 'competence' THEN 1 
            WHEN 'character' THEN 2 
            WHEN 'curiosity' THEN 3 
            ELSE 4 
        END;
END;
$$;

-- ===================================================================
-- ENHANCED FUNCTION: Calculate Core Group Scores with Consensus Metrics
-- ===================================================================

CREATE OR REPLACE FUNCTION calculate_core_group_scores_with_consensus(
    input_evaluatee_id UUID,
    input_quarter_id UUID
)
RETURNS TABLE (
    evaluatee_id UUID,
    evaluatee_name TEXT,
    quarter_id UUID,
    quarter_name TEXT,
    core_group TEXT,
    manager_avg_score NUMERIC,
    peer_avg_score NUMERIC,
    self_avg_score NUMERIC,
    weighted_score NUMERIC,
    attribute_count INTEGER,
    completion_percentage NUMERIC,
    -- Consensus metrics
    self_vs_others_gap NUMERIC,
    manager_vs_peer_gap NUMERIC,
    consensus_variance NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH core_group_data AS (
        SELECT 
            wes.evaluatee_id,
            wes.evaluatee_name,
            wes.quarter_id,
            wes.quarter_name,
            get_core_group_for_attribute(wes.attribute_name) as core_group,
            wes.manager_score,
            wes.peer_score,
            wes.self_score,
            wes.weighted_final_score,
            wes.has_manager_eval,
            wes.has_peer_eval,
            wes.has_self_eval
        FROM weighted_evaluation_scores wes
        WHERE wes.evaluatee_id = input_evaluatee_id
          AND wes.quarter_id = input_quarter_id
          AND get_core_group_for_attribute(wes.attribute_name) != 'unknown'
    ),
    aggregated_core_groups AS (
        SELECT 
            cgd.evaluatee_id,
            cgd.evaluatee_name,
            cgd.quarter_id,
            cgd.quarter_name,
            cgd.core_group,
            -- Calculate averages only from non-zero scores
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.manager_score > 0 THEN cgd.manager_score 
                        ELSE NULL 
                    END
                ), 2
            ) as manager_avg_score,
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.peer_score > 0 THEN cgd.peer_score 
                        ELSE NULL 
                    END
                ), 2
            ) as peer_avg_score,
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.self_score > 0 THEN cgd.self_score 
                        ELSE NULL 
                    END
                ), 2
            ) as self_avg_score,
            -- Calculate weighted average score
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.weighted_final_score > 0 THEN cgd.weighted_final_score 
                        ELSE NULL 
                    END
                ), 2
            ) as weighted_score,
            -- Count of attributes in this core group
            COUNT(*) as attribute_count,
            -- Calculate completion percentage
            ROUND(
                (COUNT(CASE WHEN cgd.has_manager_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_peer_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_self_eval THEN 1 END)) * 100.0 / (COUNT(*) * 3),
                2
            ) as completion_percentage
        FROM core_group_data cgd
        GROUP BY cgd.evaluatee_id, cgd.evaluatee_name, cgd.quarter_id, cgd.quarter_name, cgd.core_group
    )
    SELECT 
        acg.evaluatee_id,
        acg.evaluatee_name,
        acg.quarter_id,
        acg.quarter_name,
        acg.core_group,
        COALESCE(acg.manager_avg_score, 0) as manager_avg_score,
        COALESCE(acg.peer_avg_score, 0) as peer_avg_score,
        COALESCE(acg.self_avg_score, 0) as self_avg_score,
        COALESCE(acg.weighted_score, 0) as weighted_score,
        acg.attribute_count,
        COALESCE(acg.completion_percentage, 0) as completion_percentage,
        -- Consensus metrics calculations
        ROUND(
            ABS(COALESCE(acg.self_avg_score, 0) - 
                ((COALESCE(acg.manager_avg_score, 0) + COALESCE(acg.peer_avg_score, 0)) / 2.0)),
            2
        ) as self_vs_others_gap,
        ROUND(
            ABS(COALESCE(acg.manager_avg_score, 0) - COALESCE(acg.peer_avg_score, 0)),
            2
        ) as manager_vs_peer_gap,
        ROUND(
            CASE 
                WHEN acg.manager_avg_score IS NOT NULL AND acg.peer_avg_score IS NOT NULL AND acg.self_avg_score IS NOT NULL THEN
                    POWER(acg.manager_avg_score - acg.weighted_score, 2) + 
                    POWER(acg.peer_avg_score - acg.weighted_score, 2) + 
                    POWER(acg.self_avg_score - acg.weighted_score, 2)
                ELSE 0
            END,
            2
        ) as consensus_variance
    FROM aggregated_core_groups acg
    ORDER BY 
        CASE acg.core_group 
            WHEN 'competence' THEN 1 
            WHEN 'character' THEN 2 
            WHEN 'curiosity' THEN 3 
            ELSE 4 
        END;
END;
$$;

-- ===================================================================
-- BATCH FUNCTION: Calculate Core Group Scores for Multiple Employees
-- ===================================================================

CREATE OR REPLACE FUNCTION calculate_all_core_group_scores(
    input_quarter_id UUID
)
RETURNS TABLE (
    evaluatee_id UUID,
    evaluatee_name TEXT,
    quarter_id UUID,
    quarter_name TEXT,
    core_group TEXT,
    manager_avg_score NUMERIC,
    peer_avg_score NUMERIC,
    self_avg_score NUMERIC,
    weighted_score NUMERIC,
    attribute_count INTEGER,
    completion_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH core_group_data AS (
        SELECT 
            wes.evaluatee_id,
            wes.evaluatee_name,
            wes.quarter_id,
            wes.quarter_name,
            get_core_group_for_attribute(wes.attribute_name) as core_group,
            wes.manager_score,
            wes.peer_score,
            wes.self_score,
            wes.weighted_final_score,
            wes.has_manager_eval,
            wes.has_peer_eval,
            wes.has_self_eval
        FROM weighted_evaluation_scores wes
        WHERE wes.quarter_id = input_quarter_id
          AND get_core_group_for_attribute(wes.attribute_name) != 'unknown'
    ),
    aggregated_core_groups AS (
        SELECT 
            cgd.evaluatee_id,
            cgd.evaluatee_name,
            cgd.quarter_id,
            cgd.quarter_name,
            cgd.core_group,
            -- Calculate averages only from non-zero scores
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.manager_score > 0 THEN cgd.manager_score 
                        ELSE NULL 
                    END
                ), 2
            ) as manager_avg_score,
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.peer_score > 0 THEN cgd.peer_score 
                        ELSE NULL 
                    END
                ), 2
            ) as peer_avg_score,
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.self_score > 0 THEN cgd.self_score 
                        ELSE NULL 
                    END
                ), 2
            ) as self_avg_score,
            -- Calculate weighted average score
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.weighted_final_score > 0 THEN cgd.weighted_final_score 
                        ELSE NULL 
                    END
                ), 2
            ) as weighted_score,
            -- Count of attributes in this core group
            COUNT(*) as attribute_count,
            -- Calculate completion percentage
            ROUND(
                (COUNT(CASE WHEN cgd.has_manager_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_peer_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_self_eval THEN 1 END)) * 100.0 / (COUNT(*) * 3),
                2
            ) as completion_percentage
        FROM core_group_data cgd
        GROUP BY cgd.evaluatee_id, cgd.evaluatee_name, cgd.quarter_id, cgd.quarter_name, cgd.core_group
    )
    SELECT 
        acg.evaluatee_id,
        acg.evaluatee_name,
        acg.quarter_id,
        acg.quarter_name,
        acg.core_group,
        COALESCE(acg.manager_avg_score, 0) as manager_avg_score,
        COALESCE(acg.peer_avg_score, 0) as peer_avg_score,
        COALESCE(acg.self_avg_score, 0) as self_avg_score,
        COALESCE(acg.weighted_score, 0) as weighted_score,
        acg.attribute_count,
        COALESCE(acg.completion_percentage, 0) as completion_percentage
    FROM aggregated_core_groups acg
    ORDER BY 
        acg.evaluatee_name,
        CASE acg.core_group 
            WHEN 'competence' THEN 1 
            WHEN 'character' THEN 2 
            WHEN 'curiosity' THEN 3 
            ELSE 4 
        END;
END;
$$;

-- ===================================================================
-- CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===================================================================

-- Index on weighted_evaluation_scores view (if not already exists)
-- Note: These will be materialized as needed since we can't index views directly

-- Instead, optimize the underlying tables
CREATE INDEX IF NOT EXISTS idx_attribute_scores_evaluatee_quarter 
ON attribute_scores(submission_id) 
WHERE score > 0;

-- Add comment with performance notes
COMMENT ON FUNCTION calculate_core_group_scores(UUID, UUID) IS 
'Calculate core group scores (competence, character, curiosity) for a specific employee and quarter. 
Optimized for real-time dashboard queries with proper null handling and weighted calculations.';

COMMENT ON FUNCTION calculate_core_group_scores_with_consensus(UUID, UUID) IS 
'Enhanced core group calculation including consensus metrics for evaluator alignment analysis. 
Provides self-awareness gap analysis and variance calculations.';

COMMENT ON FUNCTION calculate_all_core_group_scores(UUID) IS 
'Batch calculation of core group scores for all employees in a specific quarter. 
Optimized for quarterly reporting and team analytics.';

COMMENT ON FUNCTION get_core_group_for_attribute(TEXT) IS 
'Helper function to map individual performance attributes to core group categories. 
Immutable function for consistent grouping across all calculations.';

-- ===================================================================
-- TESTING QUERIES (COMMENTED OUT FOR PRODUCTION)
-- ===================================================================

/*
-- Test core group mapping
SELECT 
    attribute_name,
    get_core_group_for_attribute(attribute_name) as core_group
FROM (
    VALUES 
        ('Reliability'),
        ('Accountability for Action'),
        ('Quality of Work'),
        ('Leadership'),
        ('Communication Skills'),
        ('Teamwork'),
        ('Problem Solving Ability'),
        ('Adaptability'),
        ('Taking Initiative'),
        ('Continuous Improvement')
) AS attrs(attribute_name);

-- Test function with real data (replace with actual UUIDs)
SELECT * FROM calculate_core_group_scores(
    'REPLACE_WITH_REAL_EVALUATEE_ID'::UUID,
    'REPLACE_WITH_REAL_QUARTER_ID'::UUID
);
*/