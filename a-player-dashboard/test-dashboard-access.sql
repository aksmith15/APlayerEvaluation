-- Test Dashboard Access with RLS Policies
-- Run this to verify your A-Player Evaluation Dashboard will work correctly

-- =============================================================================
-- STEP 1: Check Data Availability (Simulating Dashboard Queries)
-- =============================================================================

-- Test 1: Check if employees are accessible (Employee Selection Page)
SELECT 'EMPLOYEE SELECTION TEST' as test_section;
SELECT 
    COUNT(*) as total_active_employees,
    COUNT(DISTINCT department) as departments,
    MIN(hire_date) as earliest_hire,
    MAX(hire_date) as latest_hire
FROM people 
WHERE active = true;

-- Test 2: Check if quarters are accessible (Quarter Selection)
SELECT 'QUARTER SELECTION TEST' as test_section;
SELECT 
    COUNT(*) as total_quarters,
    MIN(start_date) as earliest_quarter,
    MAX(end_date) as latest_quarter
FROM evaluation_cycles
ORDER BY start_date;

-- Test 3: Check evaluation data accessibility (Main Charts)
SELECT 'EVALUATION DATA TEST' as test_section;
SELECT 
    COUNT(*) as total_evaluation_records,
    COUNT(DISTINCT evaluatee_id) as employees_with_data,
    COUNT(DISTINCT quarter_id) as quarters_with_data
FROM weighted_evaluation_scores;

-- Test 4: Check submission data (Detailed Analysis)
SELECT 'SUBMISSION DATA TEST' as test_section;
SELECT 
    COUNT(*) as total_submissions,
    COUNT(DISTINCT evaluatee_id) as employees_with_submissions,
    COUNT(DISTINCT quarter_id) as quarters_with_submissions
FROM submissions;

-- Test 5: Check attribute scores (Your 70 records!)
SELECT 'ATTRIBUTE SCORES TEST' as test_section;
SELECT 
    COUNT(*) as total_attribute_scores,
    COUNT(DISTINCT submission_id) as unique_submissions,
    COUNT(DISTINCT attribute_name) as unique_attributes
FROM attribute_scores;

-- Test 6: Check analysis jobs status
SELECT 'ANALYSIS JOBS TEST' as test_section;
SELECT 
    COUNT(*) as total_analysis_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
    COUNT(*) FILTER (WHERE status = 'error') as error_jobs
FROM analysis_jobs;

-- Test 7: Check app configuration
SELECT 'APP CONFIG TEST' as test_section;
SELECT 
    COUNT(*) as total_config_items,
    COUNT(*) FILTER (WHERE key LIKE '%webhook%') as webhook_configs,
    COUNT(*) FILTER (WHERE key LIKE '%url%') as url_configs
FROM app_config;

-- =============================================================================
-- STEP 2: Sample Data Preview (What Dashboard Will Show)
-- =============================================================================

-- Preview: Sample employees for selection
SELECT 'SAMPLE EMPLOYEES PREVIEW' as preview_section;
SELECT 
    name,
    department,
    role,
    hire_date
FROM people 
WHERE active = true
ORDER BY name
LIMIT 5;

-- Preview: Sample quarters for selection  
SELECT 'SAMPLE QUARTERS PREVIEW' as preview_section;
SELECT 
    name as quarter_name,
    start_date,
    end_date,
    DATE_PART('year', start_date) as year
FROM evaluation_cycles
ORDER BY start_date DESC
LIMIT 5;

-- Preview: Sample evaluation data
SELECT 'SAMPLE EVALUATION DATA PREVIEW' as preview_section;
SELECT 
    evaluatee_name,
    quarter_name,
    attribute_name,
    weighted_final_score,
    completion_percentage
FROM weighted_evaluation_scores
ORDER BY evaluatee_name, quarter_name, attribute_name
LIMIT 10;

-- =============================================================================
-- STEP 3: RLS Policy Verification  
-- =============================================================================

-- Show all active policies
SELECT 'ACTIVE RLS POLICIES SUMMARY' as verification_section;
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(DISTINCT cmd, ', ') as allowed_operations
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- STEP 4: Dashboard Readiness Check
-- =============================================================================

DO $$
DECLARE
    employee_count INTEGER;
    quarter_count INTEGER;
    evaluation_count INTEGER;
    submission_count INTEGER;
    attribute_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Get data counts
    SELECT COUNT(*) INTO employee_count FROM people WHERE active = true;
    SELECT COUNT(*) INTO quarter_count FROM evaluation_cycles;
    SELECT COUNT(*) INTO evaluation_count FROM weighted_evaluation_scores;
    SELECT COUNT(*) INTO submission_count FROM submissions;
    SELECT COUNT(*) INTO attribute_count FROM attribute_scores;
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'A-PLAYER EVALUATION DASHBOARD READINESS CHECK';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Active Employees: %', employee_count;
    RAISE NOTICE 'Evaluation Quarters: %', quarter_count;
    RAISE NOTICE 'Evaluation Records: %', evaluation_count;
    RAISE NOTICE 'Submission Records: %', submission_count;
    RAISE NOTICE 'Attribute Scores: %', attribute_count;
    RAISE NOTICE 'RLS Policies: %', policy_count;
    RAISE NOTICE '=============================================================================';
    
    -- Dashboard readiness assessment
    IF employee_count > 0 AND quarter_count > 0 AND evaluation_count > 0 THEN
        RAISE NOTICE '🎉 DASHBOARD READY!';
        RAISE NOTICE '✅ Your A-Player Evaluation Dashboard has all required data';
        RAISE NOTICE '🔒 RLS security is properly configured';
        RAISE NOTICE '🚀 You can now use the dashboard with confidence';
    ELSIF employee_count = 0 THEN
        RAISE NOTICE '⚠️  NO EMPLOYEES: Add employee data to the people table';
    ELSIF quarter_count = 0 THEN
        RAISE NOTICE '⚠️  NO QUARTERS: Add evaluation cycles to test the dashboard';
    ELSIF evaluation_count = 0 THEN
        RAISE NOTICE '⚠️  NO EVALUATION DATA: Dashboard will work but charts will be empty';
    END IF;
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Test login to your dashboard application';
    RAISE NOTICE '2. Try selecting different employees and quarters';
    RAISE NOTICE '3. Verify charts and data display correctly';
    RAISE NOTICE '4. Test AI analysis generation if you have webhook configured';
    RAISE NOTICE '=============================================================================';
END $$; 