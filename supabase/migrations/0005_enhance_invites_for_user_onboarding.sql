-- Migration: Enhance invites table for complete user onboarding
-- Date: February 1, 2025
-- Purpose: Add fields needed for user registration during invite acceptance

-- Add new columns to invites table for enhanced user onboarding
ALTER TABLE public.invites 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS jwt_role TEXT,
ADD COLUMN IF NOT EXISTS inviter_name TEXT;

-- Add constraint for jwt_role to match people table constraint
ALTER TABLE public.invites 
ADD CONSTRAINT check_invite_jwt_role 
CHECK (jwt_role IS NULL OR jwt_role = ANY (ARRAY['hr_admin'::text, 'super_admin'::text]));

-- Add comments for new columns
COMMENT ON COLUMN public.invites.position IS 'Job title/position for the invited user (e.g., "Software Engineer", "Manager")';
COMMENT ON COLUMN public.invites.jwt_role IS 'Optional admin role to assign (hr_admin or super_admin) - only super_admin can set this';
COMMENT ON COLUMN public.invites.inviter_name IS 'Display name of the person who sent the invitation';

-- Update table comment to reflect new functionality
COMMENT ON TABLE public.invites IS 'Single-use invitation tokens for company access with complete user onboarding - supports new user registration during invite acceptance';

-- Create index on jwt_role for performance (optional but helpful)
CREATE INDEX IF NOT EXISTS idx_invites_jwt_role ON public.invites(jwt_role) WHERE jwt_role IS NOT NULL;

-- Verify migration
SELECT 
    'Migration completed' as status,
    COUNT(*) as existing_invites_count,
    COUNT(CASE WHEN position IS NOT NULL THEN 1 END) as invites_with_position,
    COUNT(CASE WHEN jwt_role IS NOT NULL THEN 1 END) as invites_with_jwt_role,
    COUNT(CASE WHEN inviter_name IS NOT NULL THEN 1 END) as invites_with_inviter_name
FROM public.invites;
