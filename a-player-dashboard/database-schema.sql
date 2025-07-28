-- Analysis Jobs Table for tracking long-running AI meta-analysis processes
-- This table needs to be created in your Supabase database

CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluatee_id UUID NOT NULL,
    quarter_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'error')),

    stage TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    pdf_url TEXT, -- Keep for backward compatibility, but prefer pdf_data
    pdf_data BYTEA, -- Store PDF file content directly
    pdf_filename TEXT, -- Store original filename
    error_message TEXT,
    
    -- Add indexes for better query performance
    CONSTRAINT fk_evaluatee FOREIGN KEY (evaluatee_id) REFERENCES people(id),
    CONSTRAINT fk_quarter FOREIGN KEY (quarter_id) REFERENCES evaluation_cycles(id)
);

-- Create indexes for better performance
CREATE INDEX idx_analysis_jobs_evaluatee ON analysis_jobs(evaluatee_id);
CREATE INDEX idx_analysis_jobs_quarter ON analysis_jobs(quarter_id);
CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX idx_analysis_jobs_created_at ON analysis_jobs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (adjust according to your authentication setup)
CREATE POLICY "Users can view their own analysis jobs" 
ON analysis_jobs FOR SELECT 
USING (true); -- Adjust this based on your auth setup

CREATE POLICY "Users can insert their own analysis jobs" 
ON analysis_jobs FOR INSERT 
WITH CHECK (true); -- Adjust this based on your auth setup

CREATE POLICY "Users can update their own analysis jobs" 
ON analysis_jobs FOR UPDATE 
USING (true); -- Adjust this based on your auth setup

-- Trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_analysis_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analysis_jobs_updated_at_trigger
    BEFORE UPDATE ON analysis_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_analysis_jobs_updated_at();

-- ===================================================================
-- STAGE 7: SURVEY ASSIGNMENT SYSTEM DATABASE SCHEMA UPDATES
-- ===================================================================
-- Integration with existing schema: submissions, attribute_scores, attribute_responses

-- Update existing evaluation_assignments table with proper constraints and enum types
-- Note: This assumes the table already exists as shown in the provided schema

-- Add proper enum types (if they don't exist)
DO $$ BEGIN
    CREATE TYPE evaluation_type_enum AS ENUM ('peer', 'manager', 'self');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status_enum AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter existing evaluation_assignments table to add missing constraints
-- (Only run these if the table exists but lacks these constraints)

-- Add NOT NULL constraints where missing
ALTER TABLE evaluation_assignments 
    ALTER COLUMN evaluator_id SET NOT NULL,
    ALTER COLUMN evaluatee_id SET NOT NULL,
    ALTER COLUMN quarter_id SET NOT NULL,
    ALTER COLUMN assigned_by SET NOT NULL;

-- Add unique constraint to prevent duplicate assignments
ALTER TABLE evaluation_assignments 
    ADD CONSTRAINT unique_assignment_per_evaluator_evaluatee_quarter_type 
    UNIQUE (evaluator_id, evaluatee_id, quarter_id, evaluation_type);

-- Add check constraint for self-evaluations
ALTER TABLE evaluation_assignments 
    ADD CONSTRAINT check_self_evaluation_same_person 
    CHECK (evaluator_id != evaluatee_id OR evaluation_type = 'self');

-- Add missing indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_evaluation_assignments_evaluator ON evaluation_assignments(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_assignments_evaluatee ON evaluation_assignments(evaluatee_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_assignments_quarter ON evaluation_assignments(quarter_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_assignments_status ON evaluation_assignments(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_assignments_survey_token ON evaluation_assignments(survey_token);
CREATE INDEX IF NOT EXISTS idx_evaluation_assignments_type ON evaluation_assignments(evaluation_type);

-- Enable Row Level Security (if not already enabled)
ALTER TABLE evaluation_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own assignments" ON evaluation_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON evaluation_assignments;
DROP POLICY IF EXISTS "Users can update own assignment status" ON evaluation_assignments;
DROP POLICY IF EXISTS "Admins can create assignments" ON evaluation_assignments;
DROP POLICY IF EXISTS "Admins can update assignments" ON evaluation_assignments;

-- RLS Policy 1: Users can view their own assignments (as evaluator)
CREATE POLICY "Users can view own assignments" ON evaluation_assignments
FOR SELECT USING (
    evaluator_id IN (
        SELECT id FROM people 
        WHERE email = auth.email()
    )
);

-- RLS Policy 2: Super admin and HR admin can view all assignments
CREATE POLICY "Admins can view all assignments" ON evaluation_assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM people 
        WHERE email = auth.email() 
        AND jwt_role IN ('super_admin', 'hr_admin')
    )
);

-- RLS Policy 3: Users can update status of their own assignments
CREATE POLICY "Users can update own assignment status" ON evaluation_assignments
FOR UPDATE USING (
    evaluator_id IN (
        SELECT id FROM people 
        WHERE email = auth.email()
    )
) WITH CHECK (
    evaluator_id IN (
        SELECT id FROM people 
        WHERE email = auth.email()
    )
);

-- RLS Policy 4: Admin users can insert assignments
CREATE POLICY "Admins can create assignments" ON evaluation_assignments
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM people 
        WHERE email = auth.email() 
        AND jwt_role IN ('super_admin', 'hr_admin')
    )
);

-- RLS Policy 5: Admin users can update assignments
CREATE POLICY "Admins can update assignments" ON evaluation_assignments
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM people 
        WHERE email = auth.email() 
        AND jwt_role IN ('super_admin', 'hr_admin')
    )
);

-- Integration table to link assignments with submissions
-- This bridges the new assignment system with existing evaluation data
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES evaluation_assignments(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one submission per assignment
    UNIQUE(assignment_id)
);

-- Index for performance
CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_submission ON assignment_submissions(submission_id);

-- Enable RLS for assignment_submissions
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own assignment submissions
CREATE POLICY "Users can access own assignment submissions" ON assignment_submissions
FOR ALL USING (
    assignment_id IN (
        SELECT id FROM evaluation_assignments 
        WHERE evaluator_id IN (
            SELECT id FROM people WHERE email = auth.email()
        )
    )
);

-- RLS Policy: Admins can view all assignment submissions
CREATE POLICY "Admins can view all assignment submissions" ON assignment_submissions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM people 
        WHERE email = auth.email() 
        AND jwt_role IN ('super_admin', 'hr_admin')
    )
);

-- View for assignment statistics and reporting
CREATE OR REPLACE VIEW assignment_statistics AS
SELECT 
    ea.quarter_id,
    ec.name as quarter_name,
    ea.evaluation_type,
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN ea.status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN ea.status = 'in_progress' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN ea.status = 'completed' THEN 1 END) as completed_count,
    ROUND(
        COUNT(CASE WHEN ea.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as completion_percentage
FROM evaluation_assignments ea
JOIN evaluation_cycles ec ON ea.quarter_id = ec.id
GROUP BY ea.quarter_id, ec.name, ea.evaluation_type;

-- View for assignment details with person information
CREATE OR REPLACE VIEW assignment_details AS
SELECT 
    ea.*,
    evaluator.name as evaluator_name,
    evaluator.email as evaluator_email,
    evaluator.department as evaluator_department,
    evaluatee.name as evaluatee_name,
    evaluatee.email as evaluatee_email,
    evaluatee.department as evaluatee_department,
    ec.name as quarter_name,
    ec.start_date as quarter_start_date,
    ec.end_date as quarter_end_date,
    assigned_by.name as assigned_by_name,
    s.submission_id,
    CASE 
        WHEN s.submission_id IS NOT NULL THEN 100.0
        WHEN ea.status = 'in_progress' THEN 50.0
        ELSE 0.0
    END as progress_percentage
FROM evaluation_assignments ea
JOIN people evaluator ON ea.evaluator_id = evaluator.id
JOIN people evaluatee ON ea.evaluatee_id = evaluatee.id
JOIN people assigned_by ON ea.assigned_by = assigned_by.id
JOIN evaluation_cycles ec ON ea.quarter_id = ec.id
LEFT JOIN assignment_submissions asub ON ea.id = asub.assignment_id
LEFT JOIN submissions s ON asub.submission_id = s.submission_id;

-- Grant access to views
ALTER VIEW assignment_statistics OWNER TO postgres;
ALTER VIEW assignment_details OWNER TO postgres;

-- Comments for documentation
COMMENT ON TABLE evaluation_assignments IS 'Stores assignment of evaluation surveys to users, replacing fillout.com functionality. Updated for Stage 7 with proper constraints and RLS policies.';
COMMENT ON TABLE assignment_submissions IS 'Links evaluation assignments to existing submissions table for data integration';
COMMENT ON VIEW assignment_statistics IS 'Provides summary statistics for assignment completion rates by quarter and type';
COMMENT ON VIEW assignment_details IS 'Comprehensive view of assignments with person details and progress tracking'; 