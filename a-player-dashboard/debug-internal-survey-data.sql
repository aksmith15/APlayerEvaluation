-- Diagnostic script to investigate internal survey data visibility issue
-- Issue: Kolbe Smith Q2 2025 evaluation data exists but not showing in Employee Analytics
-- Date: January 25, 2025

-- Step 1: Check if target user exists and get their ID
SELECT 'STEP 1: User Verification' as step;
SELECT id, name, email, department 
FROM people 
WHERE name ILIKE '%kolbe%' OR email ILIKE '%kolbe%';

-- Step 2: Check Q2 2025 quarter info
SELECT 'STEP 2: Quarter Verification' as step;
SELECT id, name, start_date, end_date 
FROM evaluation_cycles 
WHERE name ILIKE '%Q2%' AND name ILIKE '%2025%';

-- Step 3: Check if we have submissions for this user/quarter combination
SELECT 'STEP 3: Submissions Check' as step;
SELECT 
    s.submission_id,
    s.submitter_id,
    s.evaluatee_id,
    s.evaluation_type,
    s.quarter_id,
    s.created_at,
    evaluatee.name as evaluatee_name,
    submitter.name as submitter_name,
    ec.name as quarter_name
FROM submissions s
JOIN people evaluatee ON s.evaluatee_id = evaluatee.id
JOIN people submitter ON s.submitter_id = submitter.id
JOIN evaluation_cycles ec ON s.quarter_id = ec.id
WHERE evaluatee.name ILIKE '%kolbe%' 
AND ec.name ILIKE '%Q2%' AND ec.name ILIKE '%2025%';

-- Step 4: Check attribute scores for this user/quarter
SELECT 'STEP 4: Attribute Scores Check' as step;
SELECT 
    ats.id,
    ats.submission_id,
    ats.attribute_name,
    ats.score,
    ats.created_at,
    s.evaluation_type,
    evaluatee.name as evaluatee_name,
    ec.name as quarter_name
FROM attribute_scores ats
JOIN submissions s ON ats.submission_id = s.submission_id
JOIN people evaluatee ON s.evaluatee_id = evaluatee.id
JOIN evaluation_cycles ec ON s.quarter_id = ec.id
WHERE evaluatee.name ILIKE '%kolbe%' 
AND ec.name ILIKE '%Q2%' AND ec.name ILIKE '%2025%'
ORDER BY ats.attribute_name, s.evaluation_type;

-- Step 5: Check if weighted_evaluation_scores view/table exists
SELECT 'STEP 5: Analytics Views Check' as step;
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name IN ('weighted_evaluation_scores', 'quarter_final_scores');

-- Step 6: If weighted_evaluation_scores exists, check if it has data for our user
SELECT 'STEP 6: Analytics Data Check' as step;
-- Note: This query will fail if the view doesn't exist
/*
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
AND quarter_name ILIKE '%Q2%' AND quarter_name ILIKE '%2025%';
*/

-- Step 7: Manual aggregation to see what the data should look like
SELECT 'STEP 7: Manual Data Aggregation' as step;
WITH user_quarter_data AS (
    SELECT 
        s.evaluatee_id,
        evaluatee.name as evaluatee_name,
        s.quarter_id,
        ec.name as quarter_name,
        ec.start_date as quarter_start_date,
        ec.end_date as quarter_end_date,
        ats.attribute_name,
        CASE WHEN s.evaluation_type = 'manager' THEN ats.score ELSE NULL END as manager_score,
        CASE WHEN s.evaluation_type = 'peer' THEN ats.score ELSE NULL END as peer_score,
        CASE WHEN s.evaluation_type = 'self' THEN ats.score ELSE NULL END as self_score
    FROM attribute_scores ats
    JOIN submissions s ON ats.submission_id = s.submission_id
    JOIN people evaluatee ON s.evaluatee_id = evaluatee.id
    JOIN evaluation_cycles ec ON s.quarter_id = ec.id
    WHERE evaluatee.name ILIKE '%kolbe%' 
    AND ec.name ILIKE '%Q2%' AND ec.name ILIKE '%2025%'
)
SELECT 
    evaluatee_name,
    quarter_name,
    attribute_name,
    MAX(manager_score) as manager_score,
    MAX(peer_score) as peer_score,
    MAX(self_score) as self_score,
    -- Calculate weighted score: Manager 55% + Peer 35% + Self 10%
    ROUND(
        COALESCE(MAX(manager_score), 0) * 0.55 + 
        COALESCE(MAX(peer_score), 0) * 0.35 + 
        COALESCE(MAX(self_score), 0) * 0.10, 
        2
    ) as calculated_weighted_score
FROM user_quarter_data
GROUP BY evaluatee_name, quarter_name, quarter_start_date, quarter_end_date, attribute_name
ORDER BY attribute_name;

-- Step 8: Check evaluation assignments for this user/quarter
SELECT 'STEP 8: Assignment Check' as step;
SELECT 
    ea.id,
    ea.evaluation_type,
    ea.status,
    evaluator.name as evaluator_name,
    evaluatee.name as evaluatee_name,
    ec.name as quarter_name,
    ea.assigned_at,
    ea.completed_at
FROM evaluation_assignments ea
JOIN people evaluator ON ea.evaluator_id = evaluator.id
JOIN people evaluatee ON ea.evaluatee_id = evaluatee.id
JOIN evaluation_cycles ec ON ea.quarter_id = ec.id
WHERE evaluatee.name ILIKE '%kolbe%' 
AND ec.name ILIKE '%Q2%' AND ec.name ILIKE '%2025%'; 