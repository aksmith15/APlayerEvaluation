-- Populate profiles table with existing people data
-- This creates the authentication bridge between auth.users and people table

-- Step 1: Check if any profiles already exist
SELECT 'Current profiles count:' as status, COUNT(*) as count FROM profiles;

-- Step 2: Check people table structure
SELECT 'Active people count:' as status, COUNT(*) as count FROM people WHERE active = true;

-- Step 3: Show sample data to verify the mapping
SELECT 
  'Sample people data:' as status,
  id, email, name, company_id 
FROM people 
WHERE active = true 
LIMIT 3;

-- Step 4: Check auth.users to see what IDs actually exist
SELECT 'Auth users check:' as status, COUNT(*) as count FROM auth.users;
SELECT 'Sample auth users:' as status, id, email FROM auth.users LIMIT 3;

-- Step 5: Try to match people to auth.users by email
SELECT 
  'Email matching check:' as status,
  p.email as people_email,
  au.id as auth_user_id,
  p.id as people_id
FROM people p
LEFT JOIN auth.users au ON au.email = p.email
WHERE p.active = true
LIMIT 5;

-- Step 6: Insert profiles using auth.users.id (the correct approach)
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  default_company_id,
  is_active,
  created_at,
  updated_at
)
SELECT 
  au.id,                          -- Use auth.users.id (the correct FK reference)
  p.email,                        -- Email from people table
  p.name,                         -- Map people.name → profiles.full_name
  p.company_id,                   -- Set default company
  true,                           -- Set as active
  p.created_at,                   -- Use people creation date
  now()                           -- Set updated_at to now
FROM people p
JOIN auth.users au ON au.email = p.email  -- Link by email match
WHERE p.active = true
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr WHERE pr.id = au.id
  )  -- Only insert if profile doesn't already exist
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  default_company_id = EXCLUDED.default_company_id,
  updated_at = now();

-- Step 5: Verify the results
SELECT 
  'Profiles after insert:' as status,
  COUNT(*) as count
FROM profiles;

-- Step 6: Check the mapping worked correctly
SELECT 
  'Verification:' as status,
  p.email as people_email,
  pr.email as profile_email,
  p.name as people_name,
  pr.full_name as profile_full_name,
  p.company_id as people_company,
  pr.default_company_id as profile_company
FROM people p
JOIN profiles pr ON p.id = pr.id
WHERE p.active = true
LIMIT 5;
