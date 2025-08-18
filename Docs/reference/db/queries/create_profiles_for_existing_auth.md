# Query: create_profiles_for_existing_auth

## Description
Create profiles for the 4 existing auth users
This will allow immediate login for: user1, user2, user3, user4

## SQL
```sql
-- Create profiles for the 4 existing auth users
-- This will allow immediate login for: user1, user2, user3, user4

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
  au.id,                          -- Use auth.users.id (correct FK reference)
  p.email,                        -- Email from people table
  p.name,                         -- Map people.name â†’ profiles.full_name
  p.company_id,                   -- Set default company
  true,                           -- Set as active
  p.created_at,                   -- Use people creation date
  now()                           -- Set updated_at to now
FROM people p
JOIN auth.users au ON au.email = p.email  -- Link by email match
WHERE p.active = true
  AND au.email IN (
    'user1@example.com',
    'user2@example.com', 
    'user3@example.com',
    'user4@example.com'
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  default_company_id = EXCLUDED.default_company_id,
  updated_at = now();

-- Verify the profiles were created
SELECT 
  'Profiles created for existing auth users:' as status,
  COUNT(*) as count
FROM profiles;

-- Show the mapping
SELECT 
  'Profile verification:' as status,
  pr.id as profile_id,
  pr.email as profile_email,
  pr.full_name as profile_name,
  pr.default_company_id as company_id,
  p.jwt_role
FROM profiles pr
JOIN people p ON p.email = pr.email
ORDER BY pr.email;

```
