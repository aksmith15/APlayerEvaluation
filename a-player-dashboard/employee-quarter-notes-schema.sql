-- Employee Quarter Notes Table Schema
-- This table stores quarterly notes for employees, editable by managers
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- STEP 1: Create the employee_quarter_notes table
-- =============================================================================

CREATE TABLE employee_quarter_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    quarter_id UUID NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    notes TEXT DEFAULT '' NOT NULL,
    created_by UUID REFERENCES people(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one note record per employee per quarter
    UNIQUE(employee_id, quarter_id)
);

-- =============================================================================
-- STEP 2: Create indexes for better performance
-- =============================================================================

CREATE INDEX idx_employee_quarter_notes_employee ON employee_quarter_notes(employee_id);
CREATE INDEX idx_employee_quarter_notes_quarter ON employee_quarter_notes(quarter_id);
CREATE INDEX idx_employee_quarter_notes_created_by ON employee_quarter_notes(created_by);
CREATE INDEX idx_employee_quarter_notes_updated_at ON employee_quarter_notes(updated_at);

-- =============================================================================
-- STEP 3: Enable Row Level Security (RLS)
-- =============================================================================

ALTER TABLE employee_quarter_notes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: Create RLS Policies for Access Control
-- =============================================================================

-- Policy 1: Allow users to view notes for employees they can access
CREATE POLICY "Allow viewing notes for accessible employees" 
ON employee_quarter_notes FOR SELECT 
USING (
  employee_id IN (
    SELECT id FROM people WHERE 
    (auth.jwt() ->> 'role' = 'hr_admin') OR 
    (auth.jwt() ->> 'role' = 'super_admin') OR 
    (id = auth.uid())
  )
);

-- Policy 2: Allow HR admins and super admins to create notes
CREATE POLICY "Allow admins to create employee notes" 
ON employee_quarter_notes FOR INSERT 
WITH CHECK (
  (auth.jwt() ->> 'role' = 'hr_admin') OR 
  (auth.jwt() ->> 'role' = 'super_admin')
);

-- Policy 3: Allow HR admins and super admins to update notes
CREATE POLICY "Allow admins to update employee notes" 
ON employee_quarter_notes FOR UPDATE 
USING (
  (auth.jwt() ->> 'role' = 'hr_admin') OR 
  (auth.jwt() ->> 'role' = 'super_admin')
);

-- Policy 4: Allow HR admins and super admins to delete notes
CREATE POLICY "Allow admins to delete employee notes" 
ON employee_quarter_notes FOR DELETE 
USING (
  (auth.jwt() ->> 'role' = 'hr_admin') OR 
  (auth.jwt() ->> 'role' = 'super_admin')
);

-- =============================================================================
-- STEP 5: Create automatic updated_at trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_employee_quarter_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_quarter_notes_updated_at
    BEFORE UPDATE ON employee_quarter_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_quarter_notes_updated_at();

-- =============================================================================
-- STEP 6: Add profile_picture_url column to people table (if not exists)
-- =============================================================================

-- Add the profile picture URL column to the existing people table
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'people' 
        AND column_name = 'profile_picture_url'
    ) THEN
        ALTER TABLE people ADD COLUMN profile_picture_url TEXT;
    END IF;
END $$;

-- =============================================================================
-- STEP 7: Create Supabase Storage bucket for profile pictures (Manual Step)
-- =============================================================================

-- NOTE: This needs to be done in the Supabase Storage UI or via API:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a new bucket named: "profile-picture"
-- 3. Set bucket to "Public" for easy access
-- 4. Set file size limit to 5MB
-- 5. Allow file types: image/jpeg, image/png, image/webp

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if table was created successfully
SELECT 'employee_quarter_notes table created' as status,
       COUNT(*) as record_count 
FROM employee_quarter_notes;

-- Check if people table has profile_picture_url column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'people' 
AND column_name = 'profile_picture_url';

-- Check RLS policies
SELECT tablename, policyname, cmd as command_type
FROM pg_policies 
WHERE tablename = 'employee_quarter_notes'
ORDER BY policyname; 