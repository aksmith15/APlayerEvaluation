# Query: debug_auth_users

## Description
Debug: Check if auth.users table has any records
This will help us understand the authentication setup

## SQL
```sql
-- Debug: Check if auth.users table has any records
-- This will help us understand the authentication setup

-- Step 1: Check if auth.users table exists and has records
SELECT 'Auth users count:' as status, COUNT(*) as count FROM auth.users;

-- Step 2: Show sample auth.users if any exist
SELECT 'Sample auth users:' as status, id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 3: Check if any emails match between people and auth.users
SELECT 
    'Email match analysis:' as status,
    COUNT(p.email) as people_emails,
    COUNT(au.email) as matching_auth_emails
FROM people p
LEFT JOIN auth.users au ON au.email = p.email
WHERE p.active = true;

-- Step 4: Show specific email matches/mismatches
SELECT 
    'Email matching details:' as status,
    p.email as people_email,
    CASE 
        WHEN au.id IS NOT NULL THEN 'HAS_AUTH_USER'
        ELSE 'NO_AUTH_USER'
    END as auth_status,
    p.name as people_name,
    p.jwt_role
FROM people p
LEFT JOIN auth.users au ON au.email = p.email
WHERE p.active = true
ORDER BY auth_status DESC, p.email;

-- Step 5: Show what we need to create
SELECT 
    'Users needing auth accounts:' as status,
    COUNT(*) as count
FROM people p
LEFT JOIN auth.users au ON au.email = p.email
WHERE p.active = true 
  AND au.id IS NULL;

```
