-- Simplified Database Diagnostic Script
-- This will show you what tables actually exist vs what's expected

-- =============================================================================
-- STEP 1: Show ALL tables that exist in your database
-- =============================================================================

SELECT 'EXISTING TABLES IN YOUR DATABASE' as section;

SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_type = 'BASE TABLE' THEN '✅ Table (can have RLS)'
        WHEN table_type = 'VIEW' THEN '📊 View (RLS on base tables)'
        ELSE '❓ Unknown'
    END as type_info
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_type, table_name;

-- =============================================================================
-- STEP 2: Check which expected tables are missing
-- =============================================================================

SELECT 'EXPECTED vs ACTUAL TABLE STATUS' as section;

WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'people', 
        'weighted_evaluation_scores', 
        'quarter_final_scores', 
        'analysis_jobs', 
        'evaluation_cycles',
        'submissions',
        'attribute_scores',
        'attribute_responses'
    ]) as table_name
),
existing_tables AS (
    SELECT table_name
    FROM information_schema.tables 
    WHERE table_schema = 'public'
)
SELECT 
    e.table_name,
    CASE 
        WHEN ex.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM expected_tables e
LEFT JOIN existing_tables ex ON e.table_name = ex.table_name
ORDER BY 
    CASE WHEN ex.table_name IS NOT NULL THEN 0 ELSE 1 END,
    e.table_name;

-- =============================================================================
-- STEP 3: Count records in existing tables (that we expect)
-- =============================================================================

SELECT 'RECORD COUNTS IN EXISTING EXPECTED TABLES' as section;

DO $$
DECLARE
    rec record;
    table_count integer;
    sql_query text;
BEGIN
    FOR rec IN 
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
          AND t.table_name IN (
            'people', 'weighted_evaluation_scores', 'quarter_final_scores', 
            'analysis_jobs', 'evaluation_cycles', 'submissions', 
            'attribute_scores', 'attribute_responses'
          )
    LOOP
        sql_query := 'SELECT COUNT(*) FROM ' || rec.table_name;
        EXECUTE sql_query INTO table_count;
        RAISE NOTICE 'Table: % - Records: %', rec.table_name, table_count;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 4: Show current RLS status for existing tables
-- =============================================================================

SELECT 'RLS STATUS FOR EXISTING TABLES' as section;

SELECT 
    t.table_name,
    CASE 
        WHEN c.relrowsecurity = true THEN '🔒 RLS ENABLED'
        ELSE '🔓 RLS DISABLED'
    END as rls_status,
    COALESCE(p.policy_count, 0) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name 
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
) p ON p.tablename = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- =============================================================================
-- STEP 5: Show any existing policies
-- =============================================================================

SELECT 'EXISTING RLS POLICIES' as section;

SELECT 
    tablename,
    policyname,
    cmd as command_type,
    permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- SUMMARY
-- =============================================================================

DO $$
DECLARE
    existing_count integer;
    missing_count integer;
    total_expected integer := 8;
BEGIN
    SELECT COUNT(*) INTO existing_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
      AND t.table_name IN (
        'people', 'weighted_evaluation_scores', 'quarter_final_scores', 
        'analysis_jobs', 'evaluation_cycles', 'submissions', 
        'attribute_scores', 'attribute_responses'
      );
    
    missing_count := total_expected - existing_count;
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'DATABASE DIAGNOSTIC SUMMARY';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Expected tables: %', total_expected;
    RAISE NOTICE 'Existing tables: %', existing_count;
    RAISE NOTICE 'Missing tables: %', missing_count;
    RAISE NOTICE '================================================================';
    
    IF missing_count > 0 THEN
        RAISE NOTICE '⚠️  ACTION REQUIRED:';
        RAISE NOTICE '• You are missing % key tables', missing_count;
        RAISE NOTICE '• Check the table status above to see which ones';
        RAISE NOTICE '• You may need to run your database schema creation scripts';
        RAISE NOTICE '• Some tables might be named differently than expected';
    ELSE
        RAISE NOTICE '✅ All expected tables exist!';
        RAISE NOTICE '• Ready to implement RLS policies';
        RAISE NOTICE '• Check RLS status above to see current security state';
    END IF;
    
    RAISE NOTICE '================================================================';
END $$; 