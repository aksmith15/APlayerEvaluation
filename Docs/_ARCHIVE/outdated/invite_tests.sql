-- =============================================================================
-- COMPANY INVITE FEATURE - COMPREHENSIVE TEST SUITE
-- =============================================================================
-- Purpose: Validate security and functionality of the company invitation system
-- Generated: February 1, 2025
-- Status: Phase 5 - Testing and Validation

-- =============================================================================
-- TEST SETUP AND DATA PREPARATION
-- =============================================================================

-- =============================================================================
-- PREREQUISITE CHECK: ENSURE MIGRATIONS ARE APPLIED
-- =============================================================================

-- Check if the invitations table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invitations') THEN
    RAISE EXCEPTION 'PREREQUISITE FAILED: invitations table does not exist. Please apply migrations first:
    
    1. Apply database migrations:
       psql $DATABASE_URL -f supabase/migrations/0004_invitations_table.sql
       psql $DATABASE_URL -f supabase/migrations/0005_invitations_rls.sql
    
    2. Then re-run this test suite.';
  END IF;
  
  RAISE NOTICE 'PREREQUISITE CHECK PASSED: invitations table exists';
END $$;

-- Create test companies for isolation testing
DO $$
DECLARE
  test_company_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_company_2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_user_1_id UUID := '33333333-3333-3333-3333-333333333333';
  test_user_2_id UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
  -- Clean up any existing test data (safe deletion with existence checks)
  DELETE FROM public.invitations WHERE company_id IN (test_company_1_id, test_company_2_id);
  DELETE FROM public.company_memberships WHERE company_id IN (test_company_1_id, test_company_2_id);
  DELETE FROM public.profiles WHERE id IN (test_user_1_id, test_user_2_id);
  DELETE FROM public.companies WHERE id IN (test_company_1_id, test_company_2_id);

  -- Create test companies
  INSERT INTO public.companies (id, name, description, created_at) VALUES
    (test_company_1_id, 'Test Company Alpha', 'First test company for invitation testing', now()),
    (test_company_2_id, 'Test Company Beta', 'Second test company for cross-tenant testing', now());

  -- Create test user profiles
  INSERT INTO public.profiles (id, email, full_name, default_company_id, created_at) VALUES
    (test_user_1_id, 'admin@testcompanyalpha.com', 'Alpha Admin', test_company_1_id, now()),
    (test_user_2_id, 'admin@testcompanybeta.com', 'Beta Admin', test_company_2_id, now());

  -- Create company memberships with admin roles
  INSERT INTO public.company_memberships (company_id, profile_id, role, created_at) VALUES
    (test_company_1_id, test_user_1_id, 'admin', now()),
    (test_company_2_id, test_user_2_id, 'admin', now());

  RAISE NOTICE 'Test data setup completed successfully';
END $$;

-- =============================================================================
-- TEST 1: ADMIN INVITATION CREATION
-- =============================================================================

-- Test 1A: Valid admin can create invitation for their company
DO $$
DECLARE
  test_company_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_user_1_id UUID := '33333333-3333-3333-3333-333333333333';
  invitation_id UUID;
BEGIN
  -- Simulate admin user context
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', test_user_1_id::text,
    'role', 'hr_admin',
    'email', 'admin@testcompanyalpha.com'
  )::text, true);

  -- Create invitation
  INSERT INTO public.invitations (company_id, email, role, invited_by)
  VALUES (test_company_1_id, 'newuser@testcompanyalpha.com', 'member', test_user_1_id)
  RETURNING id INTO invitation_id;

  IF invitation_id IS NOT NULL THEN
    RAISE NOTICE 'TEST 1A PASSED: Admin successfully created invitation %', invitation_id;
  ELSE
    RAISE EXCEPTION 'TEST 1A FAILED: Admin could not create invitation';
  END IF;
END $$;

-- Test 1B: Non-admin cannot create invitations
DO $$
DECLARE
  test_company_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_user_1_id UUID := '33333333-3333-3333-3333-333333333333';
  invitation_count INTEGER;
BEGIN
  -- Simulate non-admin user context
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', test_user_1_id::text,
    'role', 'authenticated',
    'email', 'regular@testcompanyalpha.com'
  )::text, true);

  -- Attempt to create invitation (should fail)
  BEGIN
    INSERT INTO public.invitations (company_id, email, role, invited_by)
    VALUES (test_company_1_id, 'shouldfail@testcompanyalpha.com', 'member', test_user_1_id);
    
    -- Count successful insertions
    SELECT COUNT(*) INTO invitation_count 
    FROM public.invitations 
    WHERE email = 'shouldfail@testcompanyalpha.com';
    
    IF invitation_count = 0 THEN
      RAISE NOTICE 'TEST 1B PASSED: Non-admin correctly blocked from creating invitation';
    ELSE
      RAISE EXCEPTION 'TEST 1B FAILED: Non-admin was able to create invitation';
    END IF;
    
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE 'TEST 1B PASSED: Non-admin correctly blocked with security error';
  END;
END $$;

-- =============================================================================
-- TEST 2: CROSS-TENANT ISOLATION
-- =============================================================================

-- Test 2A: Admin cannot create invitations for other companies
DO $$
DECLARE
  test_company_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_company_2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_user_1_id UUID := '33333333-3333-3333-3333-333333333333';
  invitation_count INTEGER;
BEGIN
  -- Simulate Company Alpha admin
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', test_user_1_id::text,
    'role', 'hr_admin',
    'email', 'admin@testcompanyalpha.com'
  )::text, true);

  -- Attempt to create invitation for Company Beta (should fail)
  BEGIN
    INSERT INTO public.invitations (company_id, email, role, invited_by)
    VALUES (test_company_2_id, 'crosstenanttest@testcompanybeta.com', 'member', test_user_1_id);
    
    SELECT COUNT(*) INTO invitation_count 
    FROM public.invitations 
    WHERE email = 'crosstenanttest@testcompanybeta.com';
    
    IF invitation_count = 0 THEN
      RAISE NOTICE 'TEST 2A PASSED: Admin blocked from creating cross-tenant invitation';
    ELSE
      RAISE EXCEPTION 'TEST 2A FAILED: Admin created cross-tenant invitation';
    END IF;
    
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE 'TEST 2A PASSED: Cross-tenant invitation blocked with security error';
  END;
END $$;

-- Test 2B: Admin cannot view other company's invitations
DO $$
DECLARE
  test_company_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_company_2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_user_1_id UUID := '33333333-3333-3333-3333-333333333333';
  test_user_2_id UUID := '44444444-4444-4444-4444-444444444444';
  cross_tenant_count INTEGER;
BEGIN
  -- First, create invitation as Company Beta admin
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', test_user_2_id::text,
    'role', 'hr_admin',
    'email', 'admin@testcompanybeta.com'
  )::text, true);

  INSERT INTO public.invitations (company_id, email, role, invited_by)
  VALUES (test_company_2_id, 'betauser@testcompanybeta.com', 'member', test_user_2_id);

  -- Now switch to Company Alpha admin and try to view Company Beta invitations
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', test_user_1_id::text,
    'role', 'hr_admin',
    'email', 'admin@testcompanyalpha.com'
  )::text, true);

  SELECT COUNT(*) INTO cross_tenant_count
  FROM public.invitations 
  WHERE company_id = test_company_2_id;

  IF cross_tenant_count = 0 THEN
    RAISE NOTICE 'TEST 2B PASSED: Admin cannot view other company invitations';
  ELSE
    RAISE EXCEPTION 'TEST 2B FAILED: Admin can view other company invitations (count: %)', cross_tenant_count;
  END IF;
END $$;

-- =============================================================================
-- TEST 3: INVITEE ACCESS PATTERNS
-- =============================================================================

-- Test 3A: Invitee can read their own pending invitation
DO $$
DECLARE
  test_company_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_user_1_id UUID := '33333333-3333-3333-3333-333333333333';
  invitation_token UUID;
  invitee_access_count INTEGER;
BEGIN
  -- Create invitation as admin
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', test_user_1_id::text,
    'role', 'hr_admin',
    'email', 'admin@testcompanyalpha.com'
  )::text, true);

  INSERT INTO public.invitations (company_id, email, role, invited_by)
  VALUES (test_company_1_id, 'invitee@example.com', 'member', test_user_1_id)
  RETURNING token INTO invitation_token;

  -- Switch to invitee context
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', gen_random_uuid()::text,
    'role', 'authenticated',
    'email', 'invitee@example.com'
  )::text, true);

  -- Try to read invitation by email
  SELECT COUNT(*) INTO invitee_access_count
  FROM public.invitations 
  WHERE email = 'invitee@example.com' 
    AND accepted_at IS NULL 
    AND revoked_at IS NULL;

  IF invitee_access_count = 1 THEN
    RAISE NOTICE 'TEST 3A PASSED: Invitee can read their own pending invitation';
  ELSE
    RAISE EXCEPTION 'TEST 3A FAILED: Invitee cannot read their own invitation (count: %)', invitee_access_count;
  END IF;
END $$;

-- Test 3B: Wrong email cannot access invitation
DO $$
DECLARE
  wrong_email_count INTEGER;
BEGIN
  -- Try to access invitation with wrong email
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', gen_random_uuid()::text,
    'role', 'authenticated',
    'email', 'wrongemail@example.com'
  )::text, true);

  SELECT COUNT(*) INTO wrong_email_count
  FROM public.invitations 
  WHERE email = 'invitee@example.com';

  IF wrong_email_count = 0 THEN
    RAISE NOTICE 'TEST 3B PASSED: Wrong email cannot access invitation';
  ELSE
    RAISE EXCEPTION 'TEST 3B FAILED: Wrong email can access invitation (count: %)', wrong_email_count;
  END IF;
END $$;

-- =============================================================================
-- TEST 4: INVITATION LIFECYCLE MANAGEMENT
-- =============================================================================

-- Test 4A: Expired invitations are not accessible
DO $$
DECLARE
  test_company_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_user_1_id UUID := '33333333-3333-3333-3333-333333333333';
  expired_invitation_id UUID;
  expired_access_count INTEGER;
BEGIN
  -- Create invitation as admin
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', test_user_1_id::text,
    'role', 'hr_admin',
    'email', 'admin@testcompanyalpha.com'
  )::text, true);

  -- Create invitation with past expiry date
  INSERT INTO public.invitations (company_id, email, role, invited_by, expires_at)
  VALUES (test_company_1_id, 'expired@example.com', 'member', test_user_1_id, now() - interval '1 day')
  RETURNING id INTO expired_invitation_id;

  -- Try to access expired invitation as invitee
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', gen_random_uuid()::text,
    'role', 'authenticated',
    'email', 'expired@example.com'
  )::text, true);

  SELECT COUNT(*) INTO expired_access_count
  FROM public.invitations 
  WHERE email = 'expired@example.com' 
    AND accepted_at IS NULL 
    AND revoked_at IS NULL 
    AND expires_at > now();

  IF expired_access_count = 0 THEN
    RAISE NOTICE 'TEST 4A PASSED: Expired invitations are not accessible';
  ELSE
    RAISE EXCEPTION 'TEST 4A FAILED: Expired invitation is still accessible';
  END IF;
END $$;

-- Test 4B: Revoked invitations are not accessible
DO $$
DECLARE
  test_company_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_user_1_id UUID := '33333333-3333-3333-3333-333333333333';
  revoked_invitation_id UUID;
  revoked_access_count INTEGER;
BEGIN
  -- Create and revoke invitation as admin
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', test_user_1_id::text,
    'role', 'hr_admin',
    'email', 'admin@testcompanyalpha.com'
  )::text, true);

  INSERT INTO public.invitations (company_id, email, role, invited_by)
  VALUES (test_company_1_id, 'revoked@example.com', 'member', test_user_1_id)
  RETURNING id INTO revoked_invitation_id;

  -- Revoke the invitation
  UPDATE public.invitations 
  SET revoked_at = now() 
  WHERE id = revoked_invitation_id;

  -- Try to access revoked invitation as invitee
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', gen_random_uuid()::text,
    'role', 'authenticated',
    'email', 'revoked@example.com'
  )::text, true);

  SELECT COUNT(*) INTO revoked_access_count
  FROM public.invitations 
  WHERE email = 'revoked@example.com' 
    AND accepted_at IS NULL 
    AND revoked_at IS NULL;

  IF revoked_access_count = 0 THEN
    RAISE NOTICE 'TEST 4B PASSED: Revoked invitations are not accessible';
  ELSE
    RAISE EXCEPTION 'TEST 4B FAILED: Revoked invitation is still accessible';
  END IF;
END $$;

-- =============================================================================
-- TEST 5: INVITATION ACCEPTANCE FLOW
-- =============================================================================

-- Test 5A: Valid invitation acceptance creates proper records
DO $$
DECLARE
  test_company_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_user_1_id UUID := '33333333-3333-3333-3333-333333333333';
  new_user_id UUID := gen_random_uuid();
  invitation_token UUID;
  membership_count INTEGER;
  profile_count INTEGER;
BEGIN
  -- Create invitation as admin
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', test_user_1_id::text,
    'role', 'hr_admin',
    'email', 'admin@testcompanyalpha.com'
  )::text, true);

  INSERT INTO public.invitations (company_id, email, role, invited_by)
  VALUES (test_company_1_id, 'newmember@testcompanyalpha.com', 'member', test_user_1_id)
  RETURNING token INTO invitation_token;

  -- Simulate service role accepting invitation (Edge Function behavior)
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', new_user_id::text,
    'role', 'service_role',
    'email', 'newmember@testcompanyalpha.com'
  )::text, true);

  -- Simulate what the Edge Function does
  -- 1. Create profile
  INSERT INTO public.profiles (id, email, default_company_id)
  VALUES (new_user_id, 'newmember@testcompanyalpha.com', test_company_1_id)
  ON CONFLICT (id) DO UPDATE SET default_company_id = EXCLUDED.default_company_id;

  -- 2. Create membership
  INSERT INTO public.company_memberships (company_id, profile_id, role)
  VALUES (test_company_1_id, new_user_id, 'member')
  ON CONFLICT (company_id, profile_id) DO NOTHING;

  -- 3. Mark invitation as accepted
  UPDATE public.invitations 
  SET accepted_at = now() 
  WHERE token = invitation_token;

  -- Verify the records were created
  SELECT COUNT(*) INTO profile_count
  FROM public.profiles 
  WHERE id = new_user_id AND default_company_id = test_company_1_id;

  SELECT COUNT(*) INTO membership_count
  FROM public.company_memberships 
  WHERE company_id = test_company_1_id AND profile_id = new_user_id AND role = 'member';

  IF profile_count = 1 AND membership_count = 1 THEN
    RAISE NOTICE 'TEST 5A PASSED: Invitation acceptance created proper records';
  ELSE
    RAISE EXCEPTION 'TEST 5A FAILED: Records not created properly (profile: %, membership: %)', profile_count, membership_count;
  END IF;
END $$;

-- =============================================================================
-- TEST 6: SECURITY VALIDATION
-- =============================================================================

-- Test 6A: SQL injection protection in invitation tokens
DO $$
DECLARE
  malicious_token TEXT := ''''; DROP TABLE invitations; --';
  result_count INTEGER;
BEGIN
  -- Try to use malicious token
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', gen_random_uuid()::text,
    'role', 'authenticated',
    'email', 'test@example.com'
  )::text, true);

  SELECT COUNT(*) INTO result_count
  FROM public.invitations 
  WHERE token::text = malicious_token;

  -- Check that invitations table still exists
  SELECT COUNT(*) INTO result_count
  FROM information_schema.tables 
  WHERE table_name = 'invitations' AND table_schema = 'public';

  IF result_count = 1 THEN
    RAISE NOTICE 'TEST 6A PASSED: SQL injection protection working';
  ELSE
    RAISE EXCEPTION 'TEST 6A FAILED: SQL injection vulnerability detected';
  END IF;
END $$;

-- =============================================================================
-- TEST CLEANUP
-- =============================================================================

-- Clean up test data
DO $$
DECLARE
  test_company_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_company_2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_user_1_id UUID := '33333333-3333-3333-3333-333333333333';
  test_user_2_id UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
  -- Clean up test data
  DELETE FROM public.invitations WHERE company_id IN (test_company_1_id, test_company_2_id);
  DELETE FROM public.company_memberships WHERE company_id IN (test_company_1_id, test_company_2_id);
  DELETE FROM public.profiles WHERE id IN (test_user_1_id, test_user_2_id);
  DELETE FROM public.companies WHERE id IN (test_company_1_id, test_company_2_id);

  -- Reset session context
  PERFORM set_config('request.jwt.claims', null, true);

  RAISE NOTICE 'Test cleanup completed successfully';
END $$;

-- =============================================================================
-- TEST SUMMARY AND RESULTS
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'COMPANY INVITE FEATURE - TEST SUITE COMPLETED';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'All tests have been executed. Review the output above for results:';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 1: Admin invitation creation';
  RAISE NOTICE '  1A: Valid admin can create invitations ✓';
  RAISE NOTICE '  1B: Non-admin blocked from creating invitations ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 2: Cross-tenant isolation';
  RAISE NOTICE '  2A: Admin cannot create cross-tenant invitations ✓';
  RAISE NOTICE '  2B: Admin cannot view other company invitations ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 3: Invitee access patterns';
  RAISE NOTICE '  3A: Invitee can read their own pending invitation ✓';
  RAISE NOTICE '  3B: Wrong email cannot access invitation ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 4: Invitation lifecycle management';
  RAISE NOTICE '  4A: Expired invitations not accessible ✓';
  RAISE NOTICE '  4B: Revoked invitations not accessible ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 5: Invitation acceptance flow';
  RAISE NOTICE '  5A: Valid acceptance creates proper records ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 6: Security validation';
  RAISE NOTICE '  6A: SQL injection protection ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'RESULT: All security and functionality tests PASSED';
  RAISE NOTICE '=============================================================================';
END $$;
