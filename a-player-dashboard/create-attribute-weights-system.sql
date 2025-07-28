-- Customizable Attribute Weighting System
-- Allows administrators to configure attribute importance weights based on company needs
-- This enhances the A-Player grading system with company-specific priorities

-- Create attribute_weights table for storing customizable weights
CREATE TABLE IF NOT EXISTS attribute_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_name VARCHAR(100) NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.0, -- Weight multiplier (e.g., 1.0 = normal, 2.0 = double importance)
  description TEXT, -- Optional description of why this weight was chosen
  environment VARCHAR(20) NOT NULL DEFAULT 'production',
  created_by UUID REFERENCES people(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_attribute_per_environment UNIQUE(attribute_name, environment),
  CONSTRAINT weight_range CHECK (weight >= 0.1 AND weight <= 5.0), -- Reasonable weight range
  CONSTRAINT valid_environment CHECK (environment IN ('production', 'development', 'testing'))
);

-- Insert your company's current weights as the default configuration
INSERT INTO attribute_weights (attribute_name, weight, description, environment) VALUES
('Accountability for Action', 2.0, 'Highest priority - Critical for company success', 'production'),
('Reliability', 1.9, 'Nearly as important - Foundation of trust', 'production'),
('Quality of Work', 1.9, 'Essential for delivering excellent results', 'production'),
('Taking Initiative', 1.8, 'Important for growth and innovation', 'production'),
('Adaptability', 1.8, 'Critical in fast-changing environment', 'production'),
('Problem Solving Ability', 1.7, 'Important for overcoming challenges', 'production'),
('Teamwork', 1.6, 'Essential for collaboration', 'production'),
('Continuous Improvement', 1.5, 'Important for long-term success', 'production'),
('Communication Skills', 1.5, 'Foundation for effective work', 'production'),
('Leadership', 1.4, 'Valuable but not critical for all roles', 'production')
ON CONFLICT (attribute_name, environment) DO NOTHING;

-- Create function to get attribute weight (with fallback to 1.0)
CREATE OR REPLACE FUNCTION get_attribute_weight(attr_name VARCHAR, env VARCHAR DEFAULT 'production')
RETURNS DECIMAL AS $$
DECLARE
  weight_value DECIMAL;
BEGIN
  SELECT weight INTO weight_value 
  FROM attribute_weights 
  WHERE attribute_name = attr_name 
    AND environment = env;
  
  -- Return weight if found, otherwise default to 1.0
  RETURN COALESCE(weight_value, 1.0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to calculate weighted attribute score
CREATE OR REPLACE FUNCTION calculate_weighted_attribute_score(
  attr_name VARCHAR,
  manager_score DECIMAL,
  peer_score DECIMAL,
  self_score DECIMAL,
  env VARCHAR DEFAULT 'production'
)
RETURNS DECIMAL AS $$
DECLARE
  base_weighted_score DECIMAL;
  attribute_weight DECIMAL;
  final_weighted_score DECIMAL;
BEGIN
  -- Calculate base weighted score (Manager 55% + Peer 35% + Self 10%)
  base_weighted_score := (
    COALESCE(manager_score, 0) * 0.55 + 
    COALESCE(peer_score, 0) * 0.35 + 
    COALESCE(self_score, 0) * 0.10
  );
  
  -- Get attribute importance weight
  attribute_weight := get_attribute_weight(attr_name, env);
  
  -- Apply attribute weight to the base score
  final_weighted_score := base_weighted_score * attribute_weight;
  
  RETURN ROUND(final_weighted_score, 3);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to calculate overall weighted final score across all attributes
CREATE OR REPLACE FUNCTION calculate_overall_weighted_score(
  evaluatee_id_param UUID,
  quarter_id_param UUID,
  env VARCHAR DEFAULT 'production'
)
RETURNS DECIMAL AS $$
DECLARE
  total_weighted_score DECIMAL := 0;
  total_weight DECIMAL := 0;
  final_score DECIMAL;
BEGIN
  -- Calculate sum of weighted scores and total weights from the base weighted_evaluation_scores view
  SELECT 
    SUM(wes.weighted_final_score * get_attribute_weight(wes.attribute_name, env)),
    SUM(get_attribute_weight(wes.attribute_name, env))
  INTO total_weighted_score, total_weight
  FROM weighted_evaluation_scores wes
  WHERE wes.evaluatee_id = evaluatee_id_param
    AND wes.quarter_id = quarter_id_param;
  
  -- Calculate normalized final score (divide by total weight to normalize back to 1-10 scale)
  IF total_weight > 0 THEN
    final_score := total_weighted_score / total_weight;
  ELSE
    final_score := 0;
  END IF;
  
  RETURN ROUND(final_score, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create updated weighted evaluation scores view with custom weights
CREATE OR REPLACE VIEW weighted_evaluation_scores_with_custom_weights AS
WITH evaluation_data AS (
    SELECT 
        sub.evaluatee_id,
        ppl.name as evaluatee_name,
        sub.quarter_id,
        qtr.name as quarter_name,
        qtr.start_date as quarter_start_date,
        qtr.end_date as quarter_end_date,
        attr_scores.attribute_name,
        attr_scores.score,
        sub.evaluation_type
    FROM submissions sub
    JOIN attribute_scores attr_scores ON sub.submission_id = attr_scores.submission_id
    JOIN people ppl ON sub.evaluatee_id = ppl.id
    JOIN evaluation_cycles qtr ON sub.quarter_id = qtr.id
    WHERE ppl.active = true
),
aggregated_scores AS (
    SELECT 
        evaluatee_id,
        evaluatee_name,
        quarter_id,
        quarter_name,
        quarter_start_date,
        quarter_end_date,
        attribute_name,
        AVG(CASE WHEN evaluation_type = 'manager' THEN score END) as manager_score,
        AVG(CASE WHEN evaluation_type = 'peer' THEN score END) as peer_score,
        AVG(CASE WHEN evaluation_type = 'self' THEN score END) as self_score,
        COUNT(CASE WHEN evaluation_type = 'manager' THEN 1 END) > 0 as has_manager_eval,
        COUNT(CASE WHEN evaluation_type = 'peer' THEN 1 END) > 0 as has_peer_eval,
        COUNT(CASE WHEN evaluation_type = 'self' THEN 1 END) > 0 as has_self_eval
    FROM evaluation_data
    GROUP BY evaluatee_id, evaluatee_name, quarter_id, quarter_name, quarter_start_date, quarter_end_date, attribute_name
)
SELECT 
    evaluatee_id,
    evaluatee_name,
    quarter_id,
    quarter_name,
    quarter_start_date::text as quarter_start_date,
    quarter_end_date::text as quarter_end_date,
    attribute_name,
    COALESCE(manager_score, 0) as manager_score,
    COALESCE(peer_score, 0) as peer_score,
    COALESCE(self_score, 0) as self_score,
    -- Base weighted final score (original calculation)
    ROUND(
        COALESCE(manager_score, 0) * 0.55 + 
        COALESCE(peer_score, 0) * 0.35 + 
        COALESCE(self_score, 0) * 0.10, 
        2
    ) as base_weighted_score,
    -- Attribute importance weight
    get_attribute_weight(attribute_name) as attribute_weight,
    -- Custom weighted score (base score * attribute weight)
    calculate_weighted_attribute_score(
        attribute_name,
        COALESCE(manager_score, 0),
        COALESCE(peer_score, 0),
        COALESCE(self_score, 0)
    ) as custom_weighted_score,
    -- Letter grades for base and custom weighted scores
    get_letter_grade(
        ROUND(
            COALESCE(manager_score, 0) * 0.55 + 
            COALESCE(peer_score, 0) * 0.35 + 
            COALESCE(self_score, 0) * 0.10, 
            2
        )
    ) as base_weighted_grade,
    get_letter_grade(
        calculate_weighted_attribute_score(
            attribute_name,
            COALESCE(manager_score, 0),
            COALESCE(peer_score, 0),
            COALESCE(self_score, 0)
        )
    ) as custom_weighted_grade,
    has_manager_eval,
    has_peer_eval,
    has_self_eval,
    -- Calculate completion percentage
    CASE 
        WHEN has_manager_eval AND has_peer_eval AND has_self_eval THEN 100.0
        WHEN (has_manager_eval AND has_peer_eval) OR (has_manager_eval AND has_self_eval) OR (has_peer_eval AND has_self_eval) THEN 66.7
        WHEN has_manager_eval OR has_peer_eval OR has_self_eval THEN 33.3
        ELSE 0.0
    END as completion_percentage
FROM aggregated_scores;

-- Create updated quarter final scores view with custom weights
CREATE OR REPLACE VIEW quarter_final_scores_with_custom_weights AS
SELECT 
    evaluatee_id,
    evaluatee_name,
    quarter_id,
    quarter_name,
    quarter_start_date,
    quarter_end_date,
    -- Original calculation for backward compatibility
    AVG(base_weighted_score) as avg_base_weighted_score,
    -- Custom weighted calculation
    calculate_overall_weighted_score(evaluatee_id, quarter_id) as final_quarter_score_custom_weighted,
    get_letter_grade(calculate_overall_weighted_score(evaluatee_id, quarter_id)) as final_quarter_grade_custom_weighted,
    -- Statistics
    COUNT(*) as attributes_count,
    AVG(completion_percentage) as avg_completion_percentage,
    COUNT(CASE WHEN has_manager_eval THEN 1 END) as manager_count,
    COUNT(CASE WHEN has_peer_eval THEN 1 END) as peer_count,
    COUNT(CASE WHEN has_self_eval THEN 1 END) as self_count,
    COUNT(CASE WHEN has_manager_eval THEN 1 END) + 
    COUNT(CASE WHEN has_peer_eval THEN 1 END) + 
    COUNT(CASE WHEN has_self_eval THEN 1 END) as total_submissions,
    -- Meets minimum requirements
    (COUNT(CASE WHEN has_manager_eval THEN 1 END) > 0 AND 
     (COUNT(CASE WHEN has_peer_eval THEN 1 END) > 0 OR COUNT(CASE WHEN has_self_eval THEN 1 END) > 0)) as meets_minimum_requirements
FROM weighted_evaluation_scores_with_custom_weights
GROUP BY evaluatee_id, evaluatee_name, quarter_id, quarter_name, quarter_start_date, quarter_end_date
ORDER BY quarter_name DESC, final_quarter_score_custom_weighted DESC;

-- Create RLS policies for attribute_weights table
ALTER TABLE attribute_weights ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins and HR admins can view and manage all weights
CREATE POLICY "Admins can manage attribute weights" ON attribute_weights
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM people 
    WHERE email = auth.email() 
    AND jwt_role IN ('super_admin', 'hr_admin')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM people 
    WHERE email = auth.email() 
    AND jwt_role IN ('super_admin', 'hr_admin')
  )
);

-- Policy: All authenticated users can view current production weights (read-only)
CREATE POLICY "Users can view production weights" ON attribute_weights
FOR SELECT USING (
  environment = 'production' 
  AND auth.role() = 'authenticated'
);

-- Grant permissions
GRANT SELECT ON weighted_evaluation_scores_with_custom_weights TO anon, authenticated;
GRANT SELECT ON quarter_final_scores_with_custom_weights TO anon, authenticated;
GRANT SELECT ON attribute_weights TO anon, authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attribute_weights_name ON attribute_weights(attribute_name);
CREATE INDEX IF NOT EXISTS idx_attribute_weights_environment ON attribute_weights(environment);
CREATE INDEX IF NOT EXISTS idx_weighted_scores_custom_evaluatee_quarter ON weighted_evaluation_scores_with_custom_weights(evaluatee_id, quarter_id);

-- Add documentation comments
COMMENT ON TABLE attribute_weights IS 'Configurable weights for performance attributes allowing companies to prioritize attributes based on their specific needs';
COMMENT ON FUNCTION get_attribute_weight IS 'Get the importance weight for a specific attribute (default 1.0 if not configured)';
COMMENT ON FUNCTION calculate_weighted_attribute_score IS 'Calculate weighted score for an attribute incorporating both evaluation type weights (manager/peer/self) and attribute importance weights';
COMMENT ON FUNCTION calculate_overall_weighted_score IS 'Calculate overall weighted final score across all attributes for an employee in a specific quarter';
COMMENT ON VIEW weighted_evaluation_scores_with_custom_weights IS 'Enhanced evaluation scores view with custom attribute weighting based on company priorities';
COMMENT ON VIEW quarter_final_scores_with_custom_weights IS 'Quarter-level performance scores with custom attribute weighting for company-specific priorities'; 