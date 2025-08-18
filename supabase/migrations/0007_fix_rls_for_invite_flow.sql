-- Migration: Fix RLS policies to allow invite flow provisioning
-- The current policies are too restrictive for service role operations during invite acceptance
-- Date: February 1, 2025

-- Add service role policies for invite provisioning
-- These allow edge functions to create/update records during invite acceptance

-- 1. Profiles: Allow service role to insert/update during provisioning
CREATE POLICY "profiles_service_role_provisioning" ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. People: Allow service role to insert/update during provisioning  
CREATE POLICY "people_service_role_provisioning" ON public.people
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Company memberships: Allow service role to insert/update during provisioning
CREATE POLICY "company_memberships_service_role_provisioning" ON public.company_memberships
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Invites: Allow service role to select/update during provisioning
CREATE POLICY "invites_service_role_access" ON public.invites
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Companies: Allow service role to read company data during provisioning
CREATE POLICY "companies_service_role_read" ON public.companies
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON POLICY "profiles_service_role_provisioning" ON public.profiles IS 'Allow edge functions to create/update profiles during invite acceptance';
COMMENT ON POLICY "people_service_role_provisioning" ON public.people IS 'Allow edge functions to create/update people records during invite acceptance';
COMMENT ON POLICY "company_memberships_service_role_provisioning" ON public.company_memberships IS 'Allow edge functions to create/update memberships during invite acceptance';
COMMENT ON POLICY "invites_service_role_access" ON public.invites IS 'Allow edge functions to access invites during acceptance flow';
COMMENT ON POLICY "companies_service_role_read" ON public.companies IS 'Allow edge functions to read company data during invite acceptance';

-- Test query to verify policies are working
SELECT 
  'RLS policies for invite flow' as status,
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%service_role%' THEN '✅ Service role policy'
    ELSE '📋 Regular policy'
  END as policy_type
FROM pg_policies 
WHERE tablename IN ('profiles', 'people', 'company_memberships', 'invites', 'companies')
  AND schemaname = 'public'
ORDER BY tablename, policyname;
