-- =============================================================================
-- PHASE 0: SELF-DISCOVERY QUERIES
-- =============================================================================
-- Purpose: Determine facts from DB + code for Company Invite feature implementation
-- Generated: February 1, 2025

-- =============================================================================
-- 1. AUTH IDENTITY MAPPING DISCOVERY
-- =============================================================================

-- Query 1A: Check existing table structures and relationships
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'people', 'company_memberships', 'companies')
ORDER BY table_name, ordinal_position;

-- Query 1B: Check for existing helper functions
SELECT 
    routine_name,
    routine_type,
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('current_company_id', 'is_company_member', 'get_company_role', 'is_super_admin', 'is_admin');

-- Query 1C: Check RLS status on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls as has_rls
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================================================
-- 2. ADMIN SOURCE DISCOVERY
-- =============================================================================

-- Query 2A: Check people table structure for admin flags
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'people'
    AND column_name ~ '(admin|role|permission)';

-- Query 2B: Sample people data to understand admin patterns (if table exists)
SELECT 
    id,
    email,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='people' AND column_name='is_super_admin') 
         THEN is_super_admin ELSE NULL END as is_super_admin,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='people' AND column_name='is_admin') 
         THEN is_admin ELSE NULL END as is_admin,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='people' AND column_name='role') 
         THEN role ELSE NULL END as role,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='people' AND column_name='jwt_role') 
         THEN jwt_role ELSE NULL END as jwt_role,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='people' AND column_name='permissions') 
         THEN permissions ELSE NULL END as permissions
FROM people 
LIMIT 5;

-- =============================================================================
-- 3. COMPANY CONTEXT DISCOVERY  
-- =============================================================================

-- Query 3A: Check company_role enum values
SELECT 
    enumlabel 
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'company_role';

-- Query 3B: Check profiles table default_company_id usage
SELECT 
    COUNT(*) as total_profiles,
    COUNT(default_company_id) as profiles_with_default_company,
    COUNT(DISTINCT default_company_id) as unique_companies_as_default
FROM profiles;

-- Query 3C: Check company_memberships structure and sample data
SELECT 
    COUNT(*) as total_memberships,
    COUNT(DISTINCT company_id) as unique_companies,
    COUNT(DISTINCT profile_id) as unique_profiles,
    role,
    COUNT(*) as role_count
FROM company_memberships
GROUP BY role;

-- =============================================================================
-- 4. EXISTING RLS POLICIES INVENTORY
-- =============================================================================

-- Query 4A: Get all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- 5. INVITATIONS TABLE EXISTENCE CHECK
-- =============================================================================

-- Query 5A: Check if invitations table already exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'invitations'
ORDER BY ordinal_position;

-- Query 5B: Check for similar invitation/invite tables
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name ~ '(invite|invitation)';

-- =============================================================================
-- 6. INDEX DISCOVERY FOR PERFORMANCE
-- =============================================================================

-- Query 6A: Check existing indexes on key tables
SELECT 
    t.relname as table_name,
    i.relname as index_name,
    a.attname as column_name,
    ix.indisunique as is_unique
FROM pg_class t,
     pg_class i,
     pg_index ix,
     pg_attribute a
WHERE t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname IN ('profiles', 'company_memberships', 'people', 'companies')
ORDER BY t.relname, i.relname;

-- =============================================================================
-- 7. CONSTRAINTS AND FOREIGN KEYS
-- =============================================================================

-- Query 7A: Check foreign key constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('profiles', 'company_memberships', 'people')
ORDER BY tc.table_name, tc.constraint_name;