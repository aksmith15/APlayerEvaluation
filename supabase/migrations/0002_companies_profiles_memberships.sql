-- Migration 0002: Company Infrastructure Foundation
-- Purpose: Create core multi-tenancy tables and functions
-- Date: February 1, 2025
-- Risk Level: LOW - New tables only, no existing data modification

-- =============================================
-- MULTI-TENANCY FOUNDATION SETUP
-- =============================================

-- This migration establishes the foundational infrastructure for multi-tenancy:
-- 1. Companies table for tenant isolation
-- 2. Enhanced profiles table (extends auth.users)
-- 3. Company memberships with role-based access
-- 4. Core utility functions for tenant management
-- 5. Company switching capabilities

-- =============================================
-- ENUM TYPES
-- =============================================

-- Company role enumeration for role-based access control
CREATE TYPE IF NOT EXISTS public.company_role AS ENUM (
  'owner',    -- Full access, can manage company settings and memberships
  'admin',    -- Administrative access, can manage data and users
  'member',   -- Standard access, can view and edit assigned data
  'viewer'    -- Read-only access to company data
);

-- =============================================
-- COMPANIES TABLE
-- =============================================

-- Core tenant table - each company represents an isolated tenant
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company identification
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  
  -- URL-friendly slug automatically generated from name
  slug TEXT GENERATED ALWAYS AS (
    regexp_replace(
      regexp_replace(lower(trim(name)), '[^a-z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  ) STORED UNIQUE,
  
  -- Optional company metadata
  description TEXT,
  website TEXT,
  logo_url TEXT,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Soft delete support (for future use)
  deleted_at TIMESTAMPTZ NULL
);

-- Add helpful comment
COMMENT ON TABLE public.companies IS 'Core tenant table - each company represents an isolated data environment';
COMMENT ON COLUMN public.companies.slug IS 'URL-friendly identifier automatically generated from company name';

-- =============================================
-- PROFILES TABLE
-- =============================================

-- Enhanced user profiles extending Supabase auth.users
-- This table bridges auth.users with our multi-tenant system
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Primary key references auth.users for tight integration
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User identification (cached from auth.users for performance)
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Multi-tenancy integration
  default_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  
  -- User preferences and metadata
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en',
  
  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Account status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ
);

-- Add helpful comments
COMMENT ON TABLE public.profiles IS 'Enhanced user profiles bridging auth.users with multi-tenant system';
COMMENT ON COLUMN public.profiles.default_company_id IS 'Users primary company context for session management';

-- =============================================
-- COMPANY MEMBERSHIPS TABLE
-- =============================================

-- Junction table managing user-company relationships with roles
CREATE TABLE IF NOT EXISTS public.company_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core relationship
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Role-based access control
  role public.company_role NOT NULL DEFAULT 'member',
  
  -- Membership metadata
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ DEFAULT now(),
  
  -- Audit timestamps  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure one membership per user per company
  UNIQUE(company_id, profile_id)
);

-- Add helpful comments
COMMENT ON TABLE public.company_memberships IS 'User-company relationships with role-based access control';
COMMENT ON COLUMN public.company_memberships.role IS 'Defines user permissions within the company context';

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_active ON public.companies(deleted_at) WHERE deleted_at IS NULL;

-- Profiles table indexes  
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_default_company ON public.profiles(default_company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen_at);

-- Company memberships indexes (critical for RLS performance)
CREATE INDEX IF NOT EXISTS idx_company_memberships_profile ON public.company_memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_company ON public.company_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_role ON public.company_memberships(company_id, role);
CREATE INDEX IF NOT EXISTS idx_company_memberships_active ON public.company_memberships(profile_id, company_id) 
  WHERE created_at IS NOT NULL;

-- =============================================
-- CORE UTILITY FUNCTIONS
-- =============================================

-- Function to get current user's active company ID
-- This is used throughout the system for tenant scoping
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID 
LANGUAGE SQL 
STABLE
SECURITY DEFINER
AS $$
  SELECT p.default_company_id 
  FROM public.profiles p 
  WHERE p.id = auth.uid()
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.current_company_id() IS 'Returns the current users active company ID for tenant scoping';

-- Function to check if user is member of a specific company
CREATE OR REPLACE FUNCTION public.is_company_member(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE  
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.company_memberships m
    WHERE m.company_id = target_company_id 
      AND m.profile_id = auth.uid()
  )
$$;

-- Function to get user's role in a specific company
CREATE OR REPLACE FUNCTION public.get_company_role(target_company_id UUID)
RETURNS public.company_role
LANGUAGE SQL
STABLE
SECURITY DEFINER  
AS $$
  SELECT m.role
  FROM public.company_memberships m
  WHERE m.company_id = target_company_id 
    AND m.profile_id = auth.uid()
$$;

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

-- Generic function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER 
LANGUAGE PLPGSQL 
AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END $$;

-- Trigger function to enforce company_id auto-population and immutability
CREATE OR REPLACE FUNCTION public.enforce_company_id()
RETURNS TRIGGER 
LANGUAGE PLPGSQL 
AS $$
BEGIN
  -- On INSERT: Auto-populate company_id if not provided
  IF TG_OP = 'INSERT' THEN
    IF NEW.company_id IS NULL THEN
      NEW.company_id := public.current_company_id();
      
      -- Raise error if user has no default company set
      IF NEW.company_id IS NULL THEN
        RAISE EXCEPTION 'Cannot determine company context. User must have a default_company_id set.';
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- On UPDATE: Prevent company_id changes (immutability)
  IF TG_OP = 'UPDATE' THEN
    IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
      RAISE EXCEPTION 'company_id is immutable and cannot be changed after creation';
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END $$;

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

-- Add updated_at triggers to maintain audit trail
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles  
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER company_memberships_updated_at
  BEFORE UPDATE ON public.company_memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- COMPANY SWITCHING RPC
-- =============================================

-- Secure function to switch user's active company context
CREATE OR REPLACE FUNCTION public.switch_company(target_company_id UUID)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  membership_role public.company_role;
  company_info JSON;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify user is a member of the target company
  SELECT role INTO membership_role
  FROM public.company_memberships
  WHERE company_id = target_company_id 
    AND profile_id = auth.uid();
    
  IF membership_role IS NULL THEN
    RAISE EXCEPTION 'Access denied: You are not a member of this company';
  END IF;
  
  -- Update user's default company
  UPDATE public.profiles
  SET default_company_id = target_company_id,
      updated_at = now()
  WHERE id = auth.uid();
  
  -- Get company information to return
  SELECT json_build_object(
    'id', c.id,
    'name', c.name,
    'slug', c.slug,
    'role', membership_role
  ) INTO company_info
  FROM public.companies c
  WHERE c.id = target_company_id;
  
  -- Return success response with company info
  RETURN json_build_object(
    'success', true,
    'message', 'Company context switched successfully',
    'company', company_info
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END $$;

-- Add helpful comment
COMMENT ON FUNCTION public.switch_company(UUID) IS 'Securely switch users active company context with membership validation';

-- =============================================
-- ROW LEVEL SECURITY (Basic Setup)
-- =============================================

-- Enable RLS on core tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

-- Companies: Users can only see companies they are members of
CREATE POLICY "companies_member_access" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships m
      WHERE m.company_id = companies.id
        AND m.profile_id = auth.uid()
    )
  );

-- Profiles: Users can see their own profile and profiles of company members
CREATE POLICY "profiles_self_and_company_access" ON public.profiles
  FOR ALL USING (
    -- Users can always see their own profile
    profiles.id = auth.uid()
    OR
    -- Users can see profiles of members in their companies
    EXISTS (
      SELECT 1 FROM public.company_memberships m1
      INNER JOIN public.company_memberships m2 ON m1.company_id = m2.company_id
      WHERE m1.profile_id = auth.uid()
        AND m2.profile_id = profiles.id
    )
  );

-- Company memberships: Users can see memberships for their companies
CREATE POLICY "memberships_company_access" ON public.company_memberships
  FOR ALL USING (
    -- Users can see memberships in companies they belong to
    EXISTS (
      SELECT 1 FROM public.company_memberships m
      WHERE m.company_id = company_memberships.company_id
        AND m.profile_id = auth.uid()
    )
  );

-- =============================================
-- GRANTS AND PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_memberships TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_company(UUID) TO authenticated;

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Create the "Legacy Company" for existing data migration
-- This ensures all existing data can be properly scoped
INSERT INTO public.companies (id, name, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Legacy Company',
  'Default company for existing data during multi-tenancy migration'
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- VALIDATION QUERIES
-- =============================================

-- Verify tables were created successfully
/*
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('companies', 'profiles', 'company_memberships') 
    THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('companies', 'profiles', 'company_memberships')
ORDER BY table_name;
*/

-- Verify functions were created
/*
SELECT 
  routine_name,
  routine_type,
  '✅ Created' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'current_company_id', 
    'is_company_member', 
    'get_company_role',
    'switch_company',
    'set_updated_at',
    'enforce_company_id'
  )
ORDER BY routine_name;
*/

-- Verify RLS is enabled
/*
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'profiles', 'company_memberships')
ORDER BY tablename;
*/

-- =============================================
-- ROLLBACK PLAN
-- =============================================

-- To rollback this migration:
/*
-- Drop RLS policies
DROP POLICY IF EXISTS "companies_member_access" ON public.companies;
DROP POLICY IF EXISTS "profiles_self_and_company_access" ON public.profiles;
DROP POLICY IF EXISTS "memberships_company_access" ON public.company_memberships;

-- Disable RLS
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS company_memberships_updated_at ON public.company_memberships;

-- Drop functions
DROP FUNCTION IF EXISTS public.switch_company(UUID);
DROP FUNCTION IF EXISTS public.get_company_role(UUID);
DROP FUNCTION IF EXISTS public.is_company_member(UUID);
DROP FUNCTION IF EXISTS public.current_company_id();
DROP FUNCTION IF EXISTS public.enforce_company_id();
DROP FUNCTION IF EXISTS public.set_updated_at();

-- Drop tables (in dependency order)
DROP TABLE IF EXISTS public.company_memberships;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.companies;

-- Drop enum type
DROP TYPE IF EXISTS public.company_role;
*/

-- =============================================
-- END OF MIGRATION 0002
-- =============================================

-- This completes the company infrastructure foundation.
-- The system now has:
-- ✅ Companies table for tenant isolation
-- ✅ Enhanced profiles extending auth.users
-- ✅ Company memberships with role-based access
-- ✅ Core utility functions for tenant management
-- ✅ Basic RLS policies for data protection
-- ✅ Legacy Company created for data migration

-- Next migration: 0003_add_company_id_and_backfill.sql
