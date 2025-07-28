-- Verify User Authorization Setup
-- Run this to check if your user is properly configured for assignment creation

-- Step 1: Check your current authentication
SELECT 
    'Current Auth User' as source,
    auth.email() as email,
    auth.uid() as auth_uuid;

-- Step 2: Check if you exist in people table
SELECT 
    'People Table Record' as source,
    email,
    id as people_uuid,
    name,
    role,
    jwt_role,
    department,
    active,
    created_at
FROM people 
WHERE email = auth.email();

-- Step 3: Check for any email mismatches (case sensitivity, etc.)
SELECT 
    'Potential Email Matches' as source,
    email,
    id,
    jwt_role,
    active,
    CASE 
        WHEN email = auth.email() THEN 'EXACT MATCH'
        WHEN LOWER(email) = LOWER(auth.email()) THEN 'CASE MISMATCH'
        ELSE 'NO MATCH'
    END as match_type
FROM people 
WHERE LOWER(email) = LOWER(auth.email())
   OR email LIKE '%' || split_part(auth.email(), '@', 1) || '%';

-- Step 4: Check assignment creation permissions
SELECT 
    'Assignment Creation Permission' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM people 
            WHERE email = auth.email() 
            AND jwt_role IN ('super_admin', 'hr_admin')
            AND active = true
        ) THEN '✅ CAN CREATE ASSIGNMENTS'
        WHEN EXISTS (
            SELECT 1 FROM people 
            WHERE email = auth.email() 
            AND active = true
        ) THEN '⚠️ USER EXISTS BUT WRONG ROLE: ' || (
            SELECT jwt_role FROM people WHERE email = auth.email() LIMIT 1
        )
        ELSE '❌ USER NOT FOUND IN PEOPLE TABLE'
    END as permission_status;

-- Step 5: If you need to fix your user record, here are the commands:

-- OPTION 1: If you don't exist in people table, create record:
/*
INSERT INTO people (
    id, 
    email, 
    name, 
    role, 
    jwt_role, 
    department, 
    active
) VALUES (
    gen_random_uuid(),
    'kolbes@ridgelineei.com',  -- Replace with your email
    'Kolbe Smith',             -- Replace with your name  
    'CEO',                     -- Replace with your title
    'super_admin',             -- This gives assignment creation access
    'Executive',               -- Replace with your department
    true
);
*/

-- OPTION 2: If you exist but have wrong jwt_role, update it:
/*
UPDATE people 
SET jwt_role = 'super_admin'  -- or 'hr_admin'
WHERE email = 'kolbes@ridgelineei.com';  -- Replace with your email
*/

-- Step 6: Test the safe user lookup function
SELECT get_current_user_people_id() as your_people_table_id;

-- Step 7: Verify everything is working
SELECT 
    'Final Verification' as test,
    auth.email() as auth_email,
    p.email as people_email,
    p.id as people_id,
    p.jwt_role,
    CASE 
        WHEN p.jwt_role IN ('super_admin', 'hr_admin') THEN '✅ READY TO CREATE ASSIGNMENTS'
        ELSE '❌ INSUFFICIENT PERMISSIONS'
    END as assignment_access
FROM people p
WHERE p.email = auth.email(); 