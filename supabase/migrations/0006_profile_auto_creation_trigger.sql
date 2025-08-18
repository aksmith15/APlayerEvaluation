-- Migration: Add trigger to auto-create profiles when auth users are created
-- This reduces race conditions in the invite flow
-- Date: February 1, 2025

-- Create function to auto-create profiles
CREATE OR REPLACE FUNCTION public.ensure_profile_on_signup()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a basic profile record for the new auth user
  INSERT INTO public.profiles (id, email, full_name, is_active)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    true
  )
  ON CONFLICT (id) DO NOTHING; -- Safe to ignore if already exists
  
  RETURN NEW;
END $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.ensure_profile_on_signup();

-- Add helpful comment
COMMENT ON FUNCTION public.ensure_profile_on_signup() IS 'Auto-creates a basic profile record when auth users are created, reducing race conditions in invite flow';

-- Test the trigger by checking current state
SELECT 
  'Profile trigger installed' as status,
  COUNT(*) as auth_users_count,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count
FROM auth.users;
