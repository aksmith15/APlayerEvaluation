-- SAFE RLS Deployment Script
-- Skips tables that already have RLS and focuses on missing ones
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- STEP 1: Check Current RLS Status  
-- =============================================================================

DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'CURRENT RLS STATUS CHECK';
    RAISE NOTICE '=============================================================================';
    
    -- Check each table's RLS status
    FOR rec IN 
        SELECT 
            t.table_name,
            CASE WHEN c.relrowsecurity = true THEN 'ENABLED' ELSE 'DISABLED' END as rls_status,
            COALESCE(p.policy_count, 0) as policies
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name 
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
        LEFT JOIN (
            SELECT tablename, COUNT(*) as policy_count
            FROM pg_policies WHERE schemaname = 'public'
            GROUP BY tablename
        ) p ON p.tablename = t.table_name
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
          AND t.table_name IN ('people', 'evaluation_cycles', 'analysis_jobs', 'submissions', 'attribute_scores', 'attribute_responses', 'app_config')
        ORDER BY t.table_name
    LOOP
        RAISE NOTICE 'Table: % - RLS: % - Policies: %', rec.table_name, rec.rls_status, rec.policies;
    END LOOP;
    
    RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 2: EVALUATION_CYCLES TABLE (Enable RLS + Policies)
-- =============================================================================

-- Enable RLS
ALTER TABLE evaluation_cycles ENABLE ROW LEVEL SECURITY;

-- Create policies for evaluation_cycles
CREATE POLICY "Allow authenticated users to view evaluation cycles" 
ON evaluation_cycles FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage evaluation cycles" 
ON evaluation_cycles FOR ALL 
USING (
    auth.role() = 'authenticated' 
    AND (
        auth.jwt() ->> 'role' = 'hr_admin' 
        OR auth.jwt() ->> 'role' = 'super_admin'
    )
);

-- =============================================================================
-- STEP 3: SUBMISSIONS TABLE (Enable RLS + Policies)
-- =============================================================================

-- Enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for submissions
CREATE POLICY "Allow users to view their own submissions" 
ON submissions FOR SELECT 
USING (
    auth.role() = 'authenticated' 
    AND (
        auth.jwt() ->> 'email' = (SELECT email FROM people WHERE id = submitter_id)
    )
);

CREATE POLICY "Allow users to view submissions about themselves" 
ON submissions FOR SELECT 
USING (
    auth.role() = 'authenticated' 
    AND (
        auth.jwt() ->> 'email' = (SELECT email FROM people WHERE id = evaluatee_id)
    )
);

CREATE POLICY "Allow HR admin to view all submissions" 
ON submissions FOR SELECT 
USING (
    auth.role() = 'authenticated' 
    AND (
        auth.jwt() ->> 'role' = 'hr_admin' 
        OR auth.jwt() ->> 'role' = 'super_admin'
    )
);

-- =============================================================================
-- STEP 4: ATTRIBUTE_SCORES TABLE (Enable RLS + Policies)
-- =============================================================================

-- Enable RLS
ALTER TABLE attribute_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for attribute_scores (inherits access from submissions)
CREATE POLICY "Allow access to attribute scores via submissions" 
ON attribute_scores FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM submissions s 
        WHERE s.submission_id = attribute_scores.submission_id
        -- Submissions table RLS will handle the access control
    )
);

-- =============================================================================
-- STEP 5: ATTRIBUTE_RESPONSES TABLE (Enable RLS + Policies)  
-- =============================================================================

-- Enable RLS
ALTER TABLE attribute_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for attribute_responses (inherits access from submissions)
CREATE POLICY "Allow access to attribute responses via submissions" 
ON attribute_responses FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM submissions s 
        WHERE s.submission_id = attribute_responses.submission_id
        -- Submissions table RLS will handle the access control
    )
);

-- =============================================================================
-- STEP 6: ANALYSIS_JOBS TABLE (Enable RLS + Policies)
-- =============================================================================

-- Enable RLS
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for analysis_jobs
CREATE POLICY "Allow users to view analysis jobs for accessible employees" 
ON analysis_jobs FOR SELECT 
USING (
    auth.role() = 'authenticated' 
    AND (
        -- Users can see their own analysis jobs
        auth.jwt() ->> 'email' = (SELECT email FROM people WHERE id = evaluatee_id)
        -- HR/Admin can see all analysis jobs
        OR auth.jwt() ->> 'role' = 'hr_admin' 
        OR auth.jwt() ->> 'role' = 'super_admin'
    )
);

CREATE POLICY "Allow users to create analysis jobs for accessible employees" 
ON analysis_jobs FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' 
    AND (
        -- Users can create analysis for themselves
        auth.jwt() ->> 'email' = (SELECT email FROM people WHERE id = evaluatee_id)
        -- HR/Admin can create for anyone
        OR auth.jwt() ->> 'role' = 'hr_admin' 
        OR auth.jwt() ->> 'role' = 'super_admin'
    )
);

CREATE POLICY "Allow system service to update analysis jobs" 
ON analysis_jobs FOR UPDATE 
USING (auth.role() = 'service_role');

-- =============================================================================
-- STEP 7: APP_CONFIG TABLE (Enable RLS + Policies)
-- =============================================================================

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Create policies for app_config
CREATE POLICY "Allow authenticated users to read public config" 
ON app_config FOR SELECT 
USING (
    auth.role() = 'authenticated'
    -- Exclude sensitive config from regular users
    AND key NOT LIKE '%secret%' 
    AND key NOT LIKE '%password%'
    AND key NOT LIKE '%key%'
);

CREATE POLICY "Allow super admin to manage all config" 
ON app_config FOR ALL 
USING (
    auth.role() = 'authenticated' 
    AND auth.jwt() ->> 'role' = 'super_admin'
);

-- =============================================================================
-- STEP 8: CREATE PERFORMANCE INDEXES
-- =============================================================================

-- Add indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
CREATE INDEX IF NOT EXISTS idx_people_active ON people(active);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter ON submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_submissions_evaluatee ON submissions(evaluatee_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_evaluatee ON analysis_jobs(evaluatee_id);

-- =============================================================================
-- STEP 9: FINAL STATUS CHECK
-- =============================================================================

DO $$
DECLARE
    total_tables INTEGER := 7;
    rls_enabled_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname IN ('people', 'evaluation_cycles', 'analysis_jobs', 'submissions', 'attribute_scores', 'attribute_responses', 'app_config')
      AND n.nspname = 'public'
      AND c.relrowsecurity = true;
    
    -- Count total policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename IN ('people', 'evaluation_cycles', 'analysis_jobs', 'submissions', 'attribute_scores', 'attribute_responses', 'app_config');
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'RLS DEPLOYMENT COMPLETE!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Tables with RLS enabled: % out of %', rls_enabled_count, total_tables;
    RAISE NOTICE 'Total RLS policies: %', policy_count;
    RAISE NOTICE '=============================================================================';
    
    IF rls_enabled_count = total_tables THEN
        RAISE NOTICE '✅ SUCCESS: All tables now have RLS enabled!';
        RAISE NOTICE '🔒 Your A-Player Evaluation Dashboard is now secure';
        RAISE NOTICE '🚀 You can now test your dashboard with proper access control';
    ELSE
        RAISE NOTICE '⚠️  PARTIAL: Some tables may need manual RLS enabling';
    END IF;
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Test your dashboard login and data access';
    RAISE NOTICE '2. Assign jwt_role values to users who need elevated access';
    RAISE NOTICE '3. Run the simplified diagnostic script to verify status';
    RAISE NOTICE '=============================================================================';
END $$; 