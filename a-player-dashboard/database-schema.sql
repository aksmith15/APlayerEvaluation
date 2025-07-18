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

CREATE TRIGGER trigger_update_analysis_jobs_updated_at
    BEFORE UPDATE ON analysis_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_analysis_jobs_updated_at();

-- Migration script to add new columns to existing table
-- Run this if you already have the analysis_jobs table:
/*
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS pdf_data BYTEA;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS pdf_filename TEXT;
*/ 