-- ===================================================================
-- PERSONA CLASSIFICATION SYSTEM
-- ===================================================================
-- Purpose: Implement employee persona classification based on core group performance
-- Dependencies: Core group scoring system (Stage 9)
-- Stage: 10.1 - Persona Classification Algorithm

-- ===================================================================
-- PERSONA CLASSIFICATION FUNCTION
-- ===================================================================
-- Classifies employees into performance personas based on H/M/L core group scores

CREATE OR REPLACE FUNCTION classify_employee_persona(
    input_evaluatee_id UUID,
    input_quarter_id UUID
)
RETURNS TABLE (
    evaluatee_id UUID,
    evaluatee_name VARCHAR(255),
    quarter_id UUID,
    quarter_name VARCHAR(100),
    persona_type TEXT,
    persona_description TEXT,
    competence_level CHAR(1),
    character_level CHAR(1), 
    curiosity_level CHAR(1),
    competence_score NUMERIC,
    character_score NUMERIC,
    curiosity_score NUMERIC,
    overall_performance_level TEXT,
    development_priority TEXT,
    coaching_focus TEXT[],
    stretch_assignments TEXT[],
    risk_factors TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    comp_score NUMERIC;
    char_score NUMERIC;
    cur_score NUMERIC;
    comp_level CHAR(1);
    char_level CHAR(1);
    cur_level CHAR(1);
    low_count INTEGER := 0;
    persona TEXT;
    description TEXT;
    performance_level TEXT;
    dev_priority TEXT;
    coaching TEXT[];
    stretch TEXT[];
    risks TEXT[];
    emp_name VARCHAR(255);
    quarter_name VARCHAR(100);
BEGIN
    -- Get core group scores for the employee
    SELECT 
        cgs.evaluatee_name,
        cgs.quarter_name,
        MAX(CASE WHEN cgs.core_group = 'competence' THEN cgs.weighted_score END),
        MAX(CASE WHEN cgs.core_group = 'character' THEN cgs.weighted_score END),
        MAX(CASE WHEN cgs.core_group = 'curiosity' THEN cgs.weighted_score END)
    INTO 
        emp_name,
        quarter_name,
        comp_score,
        char_score,
        cur_score
    FROM core_group_scores cgs
    WHERE cgs.evaluatee_id = input_evaluatee_id 
      AND cgs.quarter_id = input_quarter_id
    GROUP BY cgs.evaluatee_id, cgs.evaluatee_name, cgs.quarter_name;

    -- Return empty if no data found
    IF comp_score IS NULL OR char_score IS NULL OR cur_score IS NULL THEN
        RETURN;
    END IF;

    -- Convert scores to H/M/L levels
    comp_level := CASE 
        WHEN comp_score >= 8.0 THEN 'H'
        WHEN comp_score >= 6.0 THEN 'M'
        ELSE 'L'
    END;
    
    char_level := CASE 
        WHEN char_score >= 8.0 THEN 'H'
        WHEN char_score >= 6.0 THEN 'M'
        ELSE 'L'
    END;
    
    cur_level := CASE 
        WHEN cur_score >= 8.0 THEN 'H'
        WHEN cur_score >= 6.0 THEN 'M'
        ELSE 'L'
    END;

    -- Count number of L ratings to determine At-Risk status first
    low_count := 0;
    IF comp_level = 'L' THEN low_count := low_count + 1; END IF;
    IF char_level = 'L' THEN low_count := low_count + 1; END IF;
    IF cur_level = 'L' THEN low_count := low_count + 1; END IF;

    -- Classify persona based on H/M/L pattern (following image logic exactly)
    IF low_count >= 2 THEN
        -- At-Risk: L in >= 2 clusters
        persona := 'At-Risk';
        description := 'Performance concerns across multiple areas. Requires formal improvement plan and intensive support.';
        performance_level := 'Below Standards';
        dev_priority := 'Performance Improvement';
        coaching := ARRAY['Basic skills assessment', 'Performance planning', 'Regular check-ins'];
        stretch := ARRAY['Skills training', 'Basic project assignments', 'Guided practice'];
        risks := ARRAY['Performance termination', 'Team impact', 'Quality concerns'];
        
    ELSIF comp_level = 'H' AND char_level = 'H' AND cur_level = 'H' THEN
        -- A-Player: H/H/H
        persona := 'A-Player';
        description := 'Triple-high performer excelling across all strategic areas. Ready for senior leadership roles and complex challenges.';
        performance_level := 'Exceptional';
        dev_priority := 'Strategic Leadership';
        coaching := ARRAY['Executive presence', 'Strategic thinking', 'Succession planning'];
        stretch := ARRAY['Cross-functional leadership', 'Board interaction', 'M&A leadership', 'Crisis management'];
        risks := ARRAY['Potential flight risk', 'Overconfidence'];
        
    ELSIF comp_level = 'H' AND char_level = 'H' AND cur_level IN ('M', 'L') THEN
        -- Adaptive Leader: H/H/M or H/H/L
        persona := 'Adaptive Leader';
        description := 'Strong competence and character with growth opportunity in curiosity. Excellent for team leadership roles.';
        performance_level := 'High';
        dev_priority := 'Innovation & Growth Mindset';
        coaching := ARRAY['Creative problem solving', 'Change leadership', 'Innovation facilitation'];
        stretch := ARRAY['Innovation projects', 'Process improvement leadership', 'Cross-department initiatives'];
        risks := ARRAY['May resist change', 'Could become stagnant'];
        
    ELSIF comp_level = 'H' AND char_level IN ('M', 'L') AND cur_level = 'H' THEN
        -- Adaptable Veteran: H/M/H or H/L/H  
        persona := 'Adaptable Veteran';
        description := 'Technical expert with high competence and curiosity but needs character development for leadership advancement.';
        performance_level := 'High';
        dev_priority := 'Leadership & Interpersonal Skills';
        coaching := ARRAY['Communication skills', 'Team leadership', 'Emotional intelligence'];
        stretch := ARRAY['Team lead roles', 'Mentoring assignments', 'Cross-functional collaboration'];
        risks := ARRAY['Interpersonal conflicts', 'Limited influence'];
        
    ELSIF comp_level IN ('M', 'L') AND char_level = 'H' AND cur_level = 'H' THEN
        -- Sharp & Eager Sprout: M/H/H or L/H/H
        persona := 'Sharp & Eager Sprout';
        description := 'High potential in character and curiosity but needs execution fundamentals. Great candidate for structured development.';
        performance_level := 'High Potential';
        dev_priority := 'Execution & Reliability';
        coaching := ARRAY['Project management', 'Quality standards', 'Accountability systems'];
        stretch := ARRAY['Structured projects', 'Process ownership', 'Quality initiatives'];
        risks := ARRAY['Execution gaps', 'Reliability concerns'];
        
    ELSIF comp_level = 'H' AND char_level = 'M' AND cur_level = 'M' THEN
        -- Reliable Contributor: H/M/M
        persona := 'Reliable Contributor';
        description := 'Solid backbone with excellent execution. Coach on influence and creativity to unlock higher potential.';
        performance_level := 'Solid';
        dev_priority := 'Influence & Innovation';
        coaching := ARRAY['Influence skills', 'Creative thinking', 'Leadership presence'];
        stretch := ARRAY['Subject matter expert roles', 'Training delivery', 'Best practice development'];
        risks := ARRAY['Limited growth trajectory', 'Underutilized potential'];
        
    ELSIF comp_level = 'M' AND char_level = 'H' AND cur_level = 'M' THEN
        -- Collaborative Specialist: M/H/M
        persona := 'Collaborative Specialist';
        description := 'Go-to teammate with strong interpersonal skills. Boost ownership and accountability for advancement.';
        performance_level := 'Solid';
        dev_priority := 'Ownership & Accountability';
        coaching := ARRAY['Accountability frameworks', 'Decision making', 'Initiative taking'];
        stretch := ARRAY['Project ownership', 'Team coordination', 'Process improvement'];
        risks := ARRAY['Lacks initiative', 'Dependent on others'];
        
    ELSIF comp_level = 'M' AND char_level = 'M' AND cur_level = 'H' THEN
        -- Visionary Soloist: M/M/H
        persona := 'Visionary Soloist';
        description := 'Idea generator with strong curiosity. Build reliability and teamwork skills for greater impact.';
        performance_level := 'Solid';
        dev_priority := 'Execution & Collaboration';
        coaching := ARRAY['Team collaboration', 'Execution discipline', 'Follow-through systems'];
        stretch := ARRAY['Innovation teams', 'Research projects', 'Strategy development'];
        risks := ARRAY['Poor execution', 'Team friction'];
        
    ELSE
        -- Fallback for any unmatched patterns (like M/L/M, M/M/M, etc.)
        -- These are solid performers with specific development needs
        persona := 'Developing Contributor';
        description := 'Solid performer with targeted development opportunities. Focus on strengthening specific core areas.';
        performance_level := 'Solid';
        dev_priority := 'Targeted Skill Development';
        coaching := ARRAY['Skill gap analysis', 'Focused development plan', 'Regular progress reviews'];
        stretch := ARRAY['Skill-building projects', 'Cross-training opportunities', 'Mentoring support'];
        risks := ARRAY['Inconsistent performance', 'Development stagnation'];
    END IF;

    -- Return the classification result
    RETURN QUERY
    SELECT 
        input_evaluatee_id,
        emp_name,
        input_quarter_id,
        quarter_name,
        persona,
        description,
        comp_level,
        char_level,
        cur_level,
        comp_score,
        char_score,
        cur_score,
        performance_level,
        dev_priority,
        coaching,
        stretch,
        risks;
END;
$$;

-- ===================================================================
-- BATCH PERSONA CLASSIFICATION FUNCTION
-- ===================================================================
-- Classifies all employees in a quarter for admin/manager views

CREATE OR REPLACE FUNCTION classify_all_personas_in_quarter(
    input_quarter_id UUID
)
RETURNS TABLE (
    evaluatee_id UUID,
    evaluatee_name VARCHAR(255),
    quarter_id UUID,
    quarter_name VARCHAR(100),
    persona_type TEXT,
    persona_description TEXT,
    competence_level CHAR(1),
    character_level CHAR(1),
    curiosity_level CHAR(1),
    competence_score NUMERIC,
    character_score NUMERIC,
    curiosity_score NUMERIC,
    overall_performance_level TEXT,
    development_priority TEXT,
    coaching_focus TEXT[],
    stretch_assignments TEXT[],
    risk_factors TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    employee_record RECORD;
BEGIN
    -- Loop through all employees with core group data in the quarter
    FOR employee_record IN 
        SELECT DISTINCT cgs.evaluatee_id
        FROM core_group_scores cgs
        WHERE cgs.quarter_id = input_quarter_id
    LOOP
        -- Classify each employee and return results
        RETURN QUERY
        SELECT * FROM classify_employee_persona(employee_record.evaluatee_id, input_quarter_id);
    END LOOP;
END;
$$;

-- ===================================================================
-- PERSONA DISTRIBUTION ANALYSIS FUNCTION
-- ===================================================================
-- Provides persona distribution statistics for organizational insights

CREATE OR REPLACE FUNCTION analyze_persona_distribution(
    input_quarter_id UUID
)
RETURNS TABLE (
    quarter_id UUID,
    quarter_name VARCHAR(100),
    persona_type TEXT,
    employee_count INTEGER,
    percentage NUMERIC,
    avg_competence_score NUMERIC,
    avg_character_score NUMERIC,
    avg_curiosity_score NUMERIC,
    performance_level TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH persona_data AS (
        SELECT * FROM classify_all_personas_in_quarter(input_quarter_id)
    ),
    persona_stats AS (
        SELECT 
            pd.quarter_id,
            pd.quarter_name,
            pd.persona_type,
            COUNT(*)::INTEGER as employee_count,
            AVG(pd.competence_score) as avg_competence_score,
            AVG(pd.character_score) as avg_character_score,
            AVG(pd.curiosity_score) as avg_curiosity_score,
            pd.overall_performance_level
        FROM persona_data pd
        GROUP BY pd.quarter_id, pd.quarter_name, pd.persona_type, pd.overall_performance_level
    ),
    total_employees AS (
        SELECT 
            p_stats.quarter_id, 
            SUM(p_stats.employee_count) as total_count
        FROM persona_stats p_stats
        GROUP BY p_stats.quarter_id
    )
    SELECT 
        ps.quarter_id,
        ps.quarter_name,
        ps.persona_type,
        ps.employee_count,
        ROUND((ps.employee_count * 100.0 / te.total_count), 2) as percentage,
        ROUND(ps.avg_competence_score, 2) as avg_competence_score,
        ROUND(ps.avg_character_score, 2) as avg_character_score,
        ROUND(ps.avg_curiosity_score, 2) as avg_curiosity_score,
        ps.overall_performance_level
    FROM persona_stats ps
    JOIN total_employees te ON ps.quarter_id = te.quarter_id
    ORDER BY ps.employee_count DESC;
END;
$$;

-- ===================================================================
-- GRANT PERMISSIONS
-- ===================================================================

GRANT EXECUTE ON FUNCTION classify_employee_persona(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION classify_all_personas_in_quarter(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION analyze_persona_distribution(UUID) TO anon, authenticated;

-- ===================================================================
-- TEST THE PERSONA CLASSIFICATION SYSTEM
-- ===================================================================

SELECT 'Testing Persona Classification System:' as info;

-- Test individual employee classification
WITH sample_employee AS (
    SELECT DISTINCT evaluatee_id, quarter_id 
    FROM core_group_scores 
    LIMIT 1
)
SELECT 
    'Individual Classification Test:' as test_type,
    persona_type,
    competence_level || '/' || character_level || '/' || curiosity_level as hml_pattern,
    overall_performance_level,
    development_priority
FROM sample_employee se
CROSS JOIN LATERAL classify_employee_persona(se.evaluatee_id, se.quarter_id);

-- Test quarter distribution
WITH sample_quarter AS (
    SELECT DISTINCT quarter_id 
    FROM core_group_scores 
    LIMIT 1
)
SELECT 
    'Persona Distribution Test:' as test_type,
    persona_type,
    employee_count,
    percentage || '%' as distribution,
    performance_level
FROM sample_quarter sq
CROSS JOIN LATERAL analyze_persona_distribution(sq.quarter_id)
LIMIT 5;

SELECT 'SUCCESS: Persona classification system operational!' as status;