-- ===================================================================
-- DEBUG PERSONA DATA AVAILABILITY
-- ===================================================================
-- Check if data exists for persona classification

-- 1. Find your employee ID and current quarter ID
SELECT 'Employee and Quarter Info:' as debug_step;
SELECT 
    p.id as employee_id,
    p.name as employee_name,
    q.quarter_id,
    q.quarter_name,
    q.quarter_start_date,
    q.quarter_end_date
FROM people p
CROSS JOIN (SELECT DISTINCT quarter_id, quarter_name, quarter_start_date, quarter_end_date FROM quarter_final_scores) q
WHERE p.name ILIKE '%Kolbe%'
  AND q.quarter_name = 'Q2 2025'
ORDER BY p.name, q.quarter_start_date DESC;

-- 2. Check if core group scores exist (prerequisite for personas)
SELECT 'Core Group Scores Check:' as debug_step;
SELECT 
    cgs.evaluatee_id,
    cgs.evaluatee_name,
    cgs.quarter_name,
    cgs.core_group,
    cgs.weighted_score,
    cgs.completion_percentage
FROM core_group_scores cgs
WHERE cgs.evaluatee_name ILIKE '%Kolbe%'
  AND cgs.quarter_name = 'Q2 2025'
ORDER BY cgs.core_group;

-- 3. Test persona classification with your specific IDs
SELECT 'Persona Classification Test:' as debug_step;
WITH employee_quarter AS (
    SELECT 
        p.id as emp_id,
        q.quarter_id as qtr_id
    FROM people p
    CROSS JOIN (SELECT DISTINCT quarter_id, quarter_name FROM quarter_final_scores) q
    WHERE p.name ILIKE '%Kolbe%'
      AND q.quarter_name = 'Q2 2025'
    LIMIT 1
)
SELECT 
    cp.persona_type,
    cp.competence_level || '/' || cp.character_level || '/' || cp.curiosity_level as hml_pattern,
    cp.overall_performance_level,
    cp.development_priority
FROM employee_quarter eq
CROSS JOIN LATERAL classify_employee_persona(eq.emp_id, eq.qtr_id) cp;

-- 4. Check weighted evaluation scores (raw data)
SELECT 'Raw Evaluation Data Check:' as debug_step;
SELECT 
    wes.evaluatee_name,
    wes.quarter_name,
    COUNT(*) as total_scores,
    COUNT(DISTINCT wes.attribute_name) as unique_attributes,
    AVG(wes.weighted_score) as avg_weighted_score
FROM weighted_evaluation_scores wes
WHERE wes.evaluatee_name ILIKE '%Kolbe%'
  AND wes.quarter_name = 'Q2 2025'
GROUP BY wes.evaluatee_name, wes.quarter_name;

-- 5. Check if any evaluation data exists at all
SELECT 'Any Evaluation Data:' as debug_step;
SELECT 
    COUNT(*) as total_evaluations,
    COUNT(DISTINCT evaluatee_name) as unique_employees,
    COUNT(DISTINCT quarter_name) as unique_quarters
FROM weighted_evaluation_scores
WHERE evaluatee_name ILIKE '%Kolbe%';

SELECT 'Debug complete - check results above' as status;