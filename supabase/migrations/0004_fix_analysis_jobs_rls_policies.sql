-- Migration 0004: Fix Analysis Jobs RLS Policies
-- Purpose: Replace placeholder policies with proper role-based access control
-- Date: February 1, 2025
-- Risk Level: LOW - Policy refinement only, no data modification

-- =============================================
-- ANALYSIS JOBS RLS POLICY REFINEMENT
-- =============================================

-- This migration replaces the placeholder analysis_jobs RLS policies
-- with proper role-based access control that aligns with the application's
-- security model and multi-tenancy requirements.

-- Drop existing placeholder policies
DROP POLICY IF EXISTS "Users can view their own analysis jobs" ON analysis_jobs;
DROP POLICY IF EXISTS "Users can insert their own analysis jobs" ON analysis_jobs;
DROP POLICY IF EXISTS "Users can update their own analysis jobs" ON analysis_jobs;

-- =============================================
-- PROPER ANALYSIS JOBS RLS POLICIES
-- =============================================

-- SELECT Policy: Self-access + Admin oversight + Service role
CREATE POLICY "analysis_jobs_select_policy" ON analysis_jobs
FOR SELECT USING (
  -- Self-access: Users can view analysis jobs for their own evaluations
  EXISTS (
    SELECT 1 FROM public.people p
    JOIN public.profiles pr ON p.email = pr.email
    WHERE pr.id = auth.uid()
      AND p.id = analysis_jobs.evaluatee_id
      AND p.company_id IS NOT NULL
  )
  OR 
  -- Admin access: HR admins and super admins can view jobs in their company context
  EXISTS (
    SELECT 1 FROM public.people p
    JOIN public.profiles pr ON p.email = pr.email
    JOIN public.people evaluatee ON evaluatee.id = analysis_jobs.evaluatee_id
    WHERE pr.id = auth.uid()
      AND p.jwt_role IN ('hr_admin', 'super_admin')
      AND (
        p.jwt_role = 'super_admin' 
        OR p.company_id = evaluatee.company_id
      )
  )
  OR
  -- Service role access: For webhook updates (bypasses user-level restrictions)
  auth.role() = 'service_role'
);

-- INSERT Policy: Self-creation + Admin creation + Service role
CREATE POLICY "analysis_jobs_insert_policy" ON analysis_jobs
FOR INSERT WITH CHECK (
  -- Self-creation: Users can create analysis jobs for their own evaluations
  EXISTS (
    SELECT 1 FROM public.people p
    JOIN public.profiles pr ON p.email = pr.email
    WHERE pr.id = auth.uid()
      AND p.id = analysis_jobs.evaluatee_id
      AND p.company_id IS NOT NULL
  )
  OR 
  -- Admin creation: HR admins and super admins can create jobs for employees
  EXISTS (
    SELECT 1 FROM public.people p
    JOIN public.profiles pr ON p.email = pr.email
    JOIN public.people evaluatee ON evaluatee.id = analysis_jobs.evaluatee_id
    WHERE pr.id = auth.uid()
      AND p.jwt_role IN ('hr_admin', 'super_admin')
      AND (
        p.jwt_role = 'super_admin' 
        OR p.company_id = evaluatee.company_id
      )
  )
  OR
  -- Service role access: For automated job creation
  auth.role() = 'service_role'
);

-- UPDATE Policy: Status updates by service + Admin management
CREATE POLICY "analysis_jobs_update_policy" ON analysis_jobs
FOR UPDATE USING (
  -- Service role: Can update job status and results (webhook operations)
  auth.role() = 'service_role'
  OR
  -- Admin management: HR admins and super admins can manage jobs
  EXISTS (
    SELECT 1 FROM public.people p
    JOIN public.profiles pr ON p.email = pr.email
    JOIN public.people evaluatee ON evaluatee.id = analysis_jobs.evaluatee_id
    WHERE pr.id = auth.uid()
      AND p.jwt_role IN ('hr_admin', 'super_admin')
      AND (
        p.jwt_role = 'super_admin' 
        OR p.company_id = evaluatee.company_id
      )
  )
) WITH CHECK (
  -- Ensure updates maintain company context integrity
  EXISTS (
    SELECT 1 FROM public.people evaluatee 
    WHERE evaluatee.id = analysis_jobs.evaluatee_id
      AND evaluatee.company_id IS NOT NULL
  )
);

-- DELETE Policy: Admin cleanup only
CREATE POLICY "analysis_jobs_delete_policy" ON analysis_jobs
FOR DELETE USING (
  -- Admin deletion: Only HR admins and super admins can delete jobs
  EXISTS (
    SELECT 1 FROM public.people p
    JOIN public.profiles pr ON p.email = pr.email
    JOIN public.people evaluatee ON evaluatee.id = analysis_jobs.evaluatee_id
    WHERE pr.id = auth.uid()
      AND p.jwt_role IN ('hr_admin', 'super_admin')
      AND (
        p.jwt_role = 'super_admin' 
        OR p.company_id = evaluatee.company_id
      )
  )
  OR
  -- Service role: For automated cleanup
  auth.role() = 'service_role'
);

-- =============================================
-- POLICY COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON POLICY "analysis_jobs_select_policy" ON analysis_jobs IS 
'Allows users to view AI analysis jobs for their own evaluations, admins to view jobs within their company scope, and service role for webhook operations';

COMMENT ON POLICY "analysis_jobs_insert_policy" ON analysis_jobs IS 
'Allows users to create analysis jobs for themselves, admins to create jobs for employees in their company, and service role for automated creation';

COMMENT ON POLICY "analysis_jobs_update_policy" ON analysis_jobs IS 
'Allows service role to update job status/results via webhooks, and admins to manage jobs within their company scope';

COMMENT ON POLICY "analysis_jobs_delete_policy" ON analysis_jobs IS 
'Restricts deletion to admins within company scope and service role for automated cleanup';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- These queries can be used to verify the policies work correctly
-- (Run these manually after migration to test access patterns)

/*
-- Test self-access (run as regular user)
-- Should only return jobs for the authenticated user's evaluations
SELECT id, evaluatee_id, status FROM analysis_jobs;

-- Test admin access (run as hr_admin)
-- Should return all jobs for employees in the admin's company
SELECT aj.id, aj.evaluatee_id, p.name, aj.status 
FROM analysis_jobs aj
JOIN people p ON aj.evaluatee_id = p.id;

-- Test super admin access (run as super_admin)
-- Should return all jobs across all companies
SELECT aj.id, aj.evaluatee_id, p.name, p.company_id, aj.status 
FROM analysis_jobs aj
JOIN people p ON aj.evaluatee_id = p.id;
*/

-- Add helpful comment
COMMENT ON TABLE analysis_jobs IS 'AI analysis job tracking with role-based access: self-access for employees, company-scoped for admins, global for super_admin, service_role for webhooks';
