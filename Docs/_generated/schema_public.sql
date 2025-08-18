

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."assignment_status_enum" AS ENUM (
    'pending',
    'in_progress',
    'completed'
);


ALTER TYPE "public"."assignment_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."company_role" AS ENUM (
    'owner',
    'admin',
    'member',
    'viewer'
);


ALTER TYPE "public"."company_role" OWNER TO "postgres";


CREATE TYPE "public"."evaluation_type_enum" AS ENUM (
    'peer',
    'manager',
    'self'
);


ALTER TYPE "public"."evaluation_type_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."analyze_persona_distribution"("input_quarter_id" "uuid") RETURNS TABLE("quarter_id" "uuid", "quarter_name" character varying, "persona_type" "text", "employee_count" integer, "percentage" numeric, "avg_competence_score" numeric, "avg_character_score" numeric, "avg_curiosity_score" numeric, "performance_level" "text")
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."analyze_persona_distribution"("input_quarter_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_all_core_group_scores"("input_quarter_id" "uuid") RETURNS TABLE("evaluatee_id" "uuid", "evaluatee_name" "text", "quarter_id" "uuid", "quarter_name" "text", "core_group" "text", "manager_avg_score" numeric, "peer_avg_score" numeric, "self_avg_score" numeric, "weighted_score" numeric, "attribute_count" integer, "completion_percentage" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH core_group_data AS (
        SELECT 
            wes.evaluatee_id,
            wes.evaluatee_name,
            wes.quarter_id,
            wes.quarter_name,
            get_core_group_for_attribute(wes.attribute_name) as core_group,
            wes.manager_score,
            wes.peer_score,
            wes.self_score,
            wes.weighted_final_score,
            wes.has_manager_eval,
            wes.has_peer_eval,
            wes.has_self_eval
        FROM weighted_evaluation_scores wes
        WHERE wes.quarter_id = input_quarter_id
          AND get_core_group_for_attribute(wes.attribute_name) != 'unknown'
    ),
    aggregated_core_groups AS (
        SELECT 
            cgd.evaluatee_id,
            cgd.evaluatee_name,
            cgd.quarter_id,
            cgd.quarter_name,
            cgd.core_group,
            -- Calculate averages only from non-zero scores
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.manager_score > 0 THEN cgd.manager_score 
                        ELSE NULL 
                    END
                ), 2
            ) as manager_avg_score,
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.peer_score > 0 THEN cgd.peer_score 
                        ELSE NULL 
                    END
                ), 2
            ) as peer_avg_score,
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.self_score > 0 THEN cgd.self_score 
                        ELSE NULL 
                    END
                ), 2
            ) as self_avg_score,
            -- Calculate weighted average score
            ROUND(
                AVG(
                    CASE 
                        WHEN cgd.weighted_final_score > 0 THEN cgd.weighted_final_score 
                        ELSE NULL 
                    END
                ), 2
            ) as weighted_score,
            -- Count of attributes in this core group
            COUNT(*) as attribute_count,
            -- Calculate completion percentage
            ROUND(
                (COUNT(CASE WHEN cgd.has_manager_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_peer_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_self_eval THEN 1 END)) * 100.0 / (COUNT(*) * 3),
                2
            ) as completion_percentage
        FROM core_group_data cgd
        GROUP BY cgd.evaluatee_id, cgd.evaluatee_name, cgd.quarter_id, cgd.quarter_name, cgd.core_group
    )
    SELECT 
        acg.evaluatee_id,
        acg.evaluatee_name,
        acg.quarter_id,
        acg.quarter_name,
        acg.core_group,
        COALESCE(acg.manager_avg_score, 0) as manager_avg_score,
        COALESCE(acg.peer_avg_score, 0) as peer_avg_score,
        COALESCE(acg.self_avg_score, 0) as self_avg_score,
        COALESCE(acg.weighted_score, 0) as weighted_score,
        acg.attribute_count,
        COALESCE(acg.completion_percentage, 0) as completion_percentage
    FROM aggregated_core_groups acg
    ORDER BY 
        acg.evaluatee_name,
        CASE acg.core_group 
            WHEN 'competence' THEN 1 
            WHEN 'character' THEN 2 
            WHEN 'curiosity' THEN 3 
            ELSE 4 
        END;
END;
$$;


ALTER FUNCTION "public"."calculate_all_core_group_scores"("input_quarter_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_all_core_group_scores"("input_quarter_id" "uuid") IS 'Batch calculation of core group scores for all employees in a specific quarter. 
Optimized for quarterly reporting and team analytics.';



CREATE OR REPLACE FUNCTION "public"."calculate_core_group_scores"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") RETURNS TABLE("evaluatee_id" "uuid", "evaluatee_name" character varying, "quarter_id" "uuid", "quarter_name" character varying, "core_group" "text", "manager_avg_score" numeric, "peer_avg_score" numeric, "self_avg_score" numeric, "weighted_score" numeric, "attribute_count" integer, "completion_percentage" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH core_group_data AS (
        SELECT 
            wes.evaluatee_id,
            wes.evaluatee_name::VARCHAR(255),
            wes.quarter_id,
            wes.quarter_name::VARCHAR(100),
            get_core_group_for_attribute(wes.attribute_name) as core_group,
            wes.manager_score,
            wes.peer_score,
            wes.self_score,
            wes.weighted_final_score,
            wes.has_manager_eval,
            wes.has_peer_eval,
            wes.has_self_eval
        FROM weighted_evaluation_scores wes
        WHERE wes.evaluatee_id = input_evaluatee_id
          AND wes.quarter_id = input_quarter_id
          AND get_core_group_for_attribute(wes.attribute_name) != 'unknown'
    ),
    aggregated_core_groups AS (
        SELECT 
            cgd.evaluatee_id,
            cgd.evaluatee_name,
            cgd.quarter_id,
            cgd.quarter_name,
            cgd.core_group,
            ROUND(AVG(CASE WHEN cgd.manager_score > 0 THEN cgd.manager_score ELSE NULL END), 2) as manager_avg_score,
            ROUND(AVG(CASE WHEN cgd.peer_score > 0 THEN cgd.peer_score ELSE NULL END), 2) as peer_avg_score,
            ROUND(AVG(CASE WHEN cgd.self_score > 0 THEN cgd.self_score ELSE NULL END), 2) as self_avg_score,
            ROUND(AVG(CASE WHEN cgd.weighted_final_score > 0 THEN cgd.weighted_final_score ELSE NULL END), 2) as weighted_score,
            COUNT(*)::INTEGER as attribute_count,  -- CAST TO INTEGER
            ROUND(
                (COUNT(CASE WHEN cgd.has_manager_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_peer_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_self_eval THEN 1 END)) * 100.0 / (COUNT(*) * 3),
                2
            ) as completion_percentage
        FROM core_group_data cgd
        GROUP BY cgd.evaluatee_id, cgd.evaluatee_name, cgd.quarter_id, cgd.quarter_name, cgd.core_group
    )
    SELECT 
        acg.evaluatee_id,
        acg.evaluatee_name,
        acg.quarter_id,
        acg.quarter_name,
        acg.core_group,
        COALESCE(acg.manager_avg_score, 0) as manager_avg_score,
        COALESCE(acg.peer_avg_score, 0) as peer_avg_score,
        COALESCE(acg.self_avg_score, 0) as self_avg_score,
        COALESCE(acg.weighted_score, 0) as weighted_score,
        acg.attribute_count,
        COALESCE(acg.completion_percentage, 0) as completion_percentage
    FROM aggregated_core_groups acg
    ORDER BY 
        CASE acg.core_group 
            WHEN 'competence' THEN 1 
            WHEN 'character' THEN 2 
            WHEN 'curiosity' THEN 3 
            ELSE 4 
        END;
END;
$$;


ALTER FUNCTION "public"."calculate_core_group_scores"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_core_group_scores_with_consensus"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") RETURNS TABLE("evaluatee_id" "uuid", "evaluatee_name" character varying, "quarter_id" "uuid", "quarter_name" character varying, "core_group" "text", "manager_avg_score" numeric, "peer_avg_score" numeric, "self_avg_score" numeric, "weighted_score" numeric, "attribute_count" integer, "completion_percentage" numeric, "self_vs_others_gap" numeric, "manager_vs_peer_gap" numeric, "consensus_variance" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH core_group_data AS (
        SELECT 
            wes.evaluatee_id,
            wes.evaluatee_name::VARCHAR(255),
            wes.quarter_id,
            wes.quarter_name::VARCHAR(100),
            get_core_group_for_attribute(wes.attribute_name) as core_group,
            wes.manager_score,
            wes.peer_score,
            wes.self_score,
            wes.weighted_final_score,
            wes.has_manager_eval,
            wes.has_peer_eval,
            wes.has_self_eval
        FROM weighted_evaluation_scores wes
        WHERE wes.evaluatee_id = input_evaluatee_id
          AND wes.quarter_id = input_quarter_id
          AND get_core_group_for_attribute(wes.attribute_name) != 'unknown'
    ),
    aggregated_core_groups AS (
        SELECT 
            cgd.evaluatee_id,
            cgd.evaluatee_name,
            cgd.quarter_id,
            cgd.quarter_name,
            cgd.core_group,
            ROUND(AVG(CASE WHEN cgd.manager_score > 0 THEN cgd.manager_score ELSE NULL END), 2) as manager_avg_score,
            ROUND(AVG(CASE WHEN cgd.peer_score > 0 THEN cgd.peer_score ELSE NULL END), 2) as peer_avg_score,
            ROUND(AVG(CASE WHEN cgd.self_score > 0 THEN cgd.self_score ELSE NULL END), 2) as self_avg_score,
            ROUND(AVG(CASE WHEN cgd.weighted_final_score > 0 THEN cgd.weighted_final_score ELSE NULL END), 2) as weighted_score,
            COUNT(*)::INTEGER as attribute_count,  -- CAST TO INTEGER
            ROUND(
                (COUNT(CASE WHEN cgd.has_manager_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_peer_eval THEN 1 END) + 
                 COUNT(CASE WHEN cgd.has_self_eval THEN 1 END)) * 100.0 / (COUNT(*) * 3),
                2
            ) as completion_percentage
        FROM core_group_data cgd
        GROUP BY cgd.evaluatee_id, cgd.evaluatee_name, cgd.quarter_id, cgd.quarter_name, cgd.core_group
    )
    SELECT 
        acg.evaluatee_id,
        acg.evaluatee_name,
        acg.quarter_id,
        acg.quarter_name,
        acg.core_group,
        COALESCE(acg.manager_avg_score, 0) as manager_avg_score,
        COALESCE(acg.peer_avg_score, 0) as peer_avg_score,
        COALESCE(acg.self_avg_score, 0) as self_avg_score,
        COALESCE(acg.weighted_score, 0) as weighted_score,
        acg.attribute_count,
        COALESCE(acg.completion_percentage, 0) as completion_percentage,
        ROUND(ABS(COALESCE(acg.self_avg_score, 0) - ((COALESCE(acg.manager_avg_score, 0) + COALESCE(acg.peer_avg_score, 0)) / 2.0)), 2) as self_vs_others_gap,
        ROUND(ABS(COALESCE(acg.manager_avg_score, 0) - COALESCE(acg.peer_avg_score, 0)), 2) as manager_vs_peer_gap,
        ROUND(
            CASE 
                WHEN acg.manager_avg_score IS NOT NULL AND acg.peer_avg_score IS NOT NULL AND acg.self_avg_score IS NOT NULL THEN
                    POWER(acg.manager_avg_score - acg.weighted_score, 2) + 
                    POWER(acg.peer_avg_score - acg.weighted_score, 2) + 
                    POWER(acg.self_avg_score - acg.weighted_score, 2)
                ELSE 0
            END,
            2
        ) as consensus_variance
    FROM aggregated_core_groups acg
    ORDER BY 
        CASE acg.core_group 
            WHEN 'competence' THEN 1 
            WHEN 'character' THEN 2 
            WHEN 'curiosity' THEN 3 
            ELSE 4 
        END;
END;
$$;


ALTER FUNCTION "public"."calculate_core_group_scores_with_consensus"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_overall_weighted_score"("evaluatee_id_param" "uuid", "quarter_id_param" "uuid", "env" character varying DEFAULT 'production'::character varying) RETURNS numeric
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  total_weighted_score DECIMAL := 0;
  total_weight DECIMAL := 0;
  final_score DECIMAL;
BEGIN
  -- Calculate sum of weighted scores and total weights
  SELECT 
    SUM(calculate_weighted_attribute_score(
      wes.attribute_name,
      wes.manager_score,
      wes.peer_score,
      wes.self_score,
      env
    )),
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
$$;


ALTER FUNCTION "public"."calculate_overall_weighted_score"("evaluatee_id_param" "uuid", "quarter_id_param" "uuid", "env" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_weighted_attribute_score"("attr_name" character varying, "manager_score" numeric, "peer_score" numeric, "self_score" numeric, "env" character varying DEFAULT 'production'::character varying) RETURNS numeric
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_weighted_attribute_score"("attr_name" character varying, "manager_score" numeric, "peer_score" numeric, "self_score" numeric, "env" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_evaluation_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  assigned_counts RECORD;
  completed_counts RECORD;
  is_complete BOOLEAN := FALSE;
  completion_record RECORD;
BEGIN
  -- Get assigned evaluation counts for this evaluatee/quarter
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'self'), 0) as self_assigned,
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'manager'), 0) as manager_assigned,
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'peer'), 0) as peer_assigned
  INTO assigned_counts
  FROM evaluation_assignments 
  WHERE evaluatee_id = NEW.evaluatee_id 
  AND quarter_id = NEW.quarter_id
  AND status IN ('pending', 'in_progress', 'completed'); -- Only count active assignments
  
  -- Get completed submission counts for this evaluatee/quarter
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'self'), 0) as self_completed,
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'manager'), 0) as manager_completed,
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'peer'), 0) as peer_completed
  INTO completed_counts
  FROM submissions 
  WHERE evaluatee_id = NEW.evaluatee_id 
  AND quarter_id = NEW.quarter_id
  AND submission_time IS NOT NULL; -- Only count actually submitted
  
  -- Check if all assigned evaluations are complete
  is_complete := (completed_counts.self_completed >= assigned_counts.self_assigned) AND
                 (completed_counts.manager_completed >= assigned_counts.manager_assigned) AND
                 (completed_counts.peer_completed >= assigned_counts.peer_assigned);
  
  -- Get current completion record if it exists
  SELECT * INTO completion_record
  FROM evaluation_completion_status
  WHERE evaluatee_id = NEW.evaluatee_id AND quarter_id = NEW.quarter_id;
  
  -- Update or insert completion status
  INSERT INTO evaluation_completion_status (
    evaluatee_id, 
    quarter_id,
    self_assigned_count,
    manager_assigned_count,
    total_peer_assigned,
    self_completed,
    manager_completed, 
    peer_completed_count,
    all_evaluations_complete,
    first_submission_at,
    last_submission_at,
    completion_detected_at
  ) VALUES (
    NEW.evaluatee_id,
    NEW.quarter_id,
    assigned_counts.self_assigned,
    assigned_counts.manager_assigned,
    assigned_counts.peer_assigned,
    completed_counts.self_completed >= assigned_counts.self_assigned,
    completed_counts.manager_completed >= assigned_counts.manager_assigned,
    completed_counts.peer_completed,
    is_complete,
    CASE WHEN completion_record.first_submission_at IS NULL THEN NEW.submission_time ELSE completion_record.first_submission_at END,
    NEW.submission_time,
    CASE WHEN is_complete AND NOT COALESCE(completion_record.all_evaluations_complete, FALSE) THEN NOW() ELSE completion_record.completion_detected_at END
  )
  ON CONFLICT (evaluatee_id, quarter_id) 
  DO UPDATE SET 
    self_assigned_count = assigned_counts.self_assigned,
    manager_assigned_count = assigned_counts.manager_assigned,
    total_peer_assigned = assigned_counts.peer_assigned,
    self_completed = completed_counts.self_completed >= assigned_counts.self_assigned,
    manager_completed = completed_counts.manager_completed >= assigned_counts.manager_assigned,
    peer_completed_count = completed_counts.peer_completed,
    all_evaluations_complete = is_complete,
    last_submission_at = NEW.submission_time,
    completion_detected_at = CASE 
      WHEN is_complete AND NOT evaluation_completion_status.all_evaluations_complete 
      THEN NOW() 
      ELSE evaluation_completion_status.completion_detected_at 
    END,
    updated_at = NOW();
  
  -- If just completed and not yet triggered, start AI analysis
  IF is_complete AND NOT COALESCE(completion_record.ai_analysis_triggered, FALSE) THEN
    RAISE NOTICE 'All evaluations complete for evaluatee % in quarter %. Triggering AI analysis...', NEW.evaluatee_id, NEW.quarter_id;
    PERFORM trigger_attribute_ai_analysis(NEW.evaluatee_id, NEW.quarter_id);
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_evaluation_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_evaluation_completion_manual"("p_evaluatee_id" "uuid", "p_quarter_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  assigned_counts RECORD;
  completed_counts RECORD;
  is_complete BOOLEAN := FALSE;
  completion_record RECORD;
BEGIN
  -- Get assigned evaluation counts
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'self'), 0) as self_assigned,
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'manager'), 0) as manager_assigned,
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'peer'), 0) as peer_assigned
  INTO assigned_counts
  FROM evaluation_assignments 
  WHERE evaluatee_id = p_evaluatee_id 
  AND quarter_id = p_quarter_id
  AND status IN ('pending', 'in_progress', 'completed');
  
  -- Get completed submission counts
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'self'), 0) as self_completed,
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'manager'), 0) as manager_completed,
    COALESCE(COUNT(*) FILTER (WHERE evaluation_type = 'peer'), 0) as peer_completed
  INTO completed_counts
  FROM submissions 
  WHERE evaluatee_id = p_evaluatee_id 
  AND quarter_id = p_quarter_id
  AND submission_time IS NOT NULL;
  
  -- Check completion
  is_complete := (completed_counts.self_completed >= assigned_counts.self_assigned) AND
                 (completed_counts.manager_completed >= assigned_counts.manager_assigned) AND
                 (completed_counts.peer_completed >= assigned_counts.peer_assigned);
  
  -- Get current record
  SELECT * INTO completion_record
  FROM evaluation_completion_status
  WHERE evaluatee_id = p_evaluatee_id AND quarter_id = p_quarter_id;
  
  -- Update completion status
  INSERT INTO evaluation_completion_status (
    evaluatee_id, quarter_id, self_assigned_count, manager_assigned_count, total_peer_assigned,
    self_completed, manager_completed, peer_completed_count, all_evaluations_complete
  ) VALUES (
    p_evaluatee_id, p_quarter_id, assigned_counts.self_assigned, assigned_counts.manager_assigned, 
    assigned_counts.peer_assigned, completed_counts.self_completed >= assigned_counts.self_assigned,
    completed_counts.manager_completed >= assigned_counts.manager_assigned, completed_counts.peer_completed, is_complete
  )
  ON CONFLICT (evaluatee_id, quarter_id) 
  DO UPDATE SET 
    self_assigned_count = assigned_counts.self_assigned,
    manager_assigned_count = assigned_counts.manager_assigned,
    total_peer_assigned = assigned_counts.peer_assigned,
    self_completed = completed_counts.self_completed >= assigned_counts.self_assigned,
    manager_completed = completed_counts.manager_completed >= assigned_counts.manager_assigned,
    peer_completed_count = completed_counts.peer_completed,
    all_evaluations_complete = is_complete,
    updated_at = NOW();
    
  -- Trigger AI analysis if just completed
  IF is_complete AND NOT COALESCE(completion_record.ai_analysis_triggered, FALSE) THEN
    PERFORM trigger_attribute_ai_analysis(p_evaluatee_id, p_quarter_id);
  END IF;
END;
$$;


ALTER FUNCTION "public"."check_evaluation_completion_manual"("p_evaluatee_id" "uuid", "p_quarter_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."classify_all_personas_in_quarter"("input_quarter_id" "uuid") RETURNS TABLE("evaluatee_id" "uuid", "evaluatee_name" character varying, "quarter_id" "uuid", "quarter_name" character varying, "persona_type" "text", "persona_description" "text", "competence_level" character, "character_level" character, "curiosity_level" character, "competence_score" numeric, "character_score" numeric, "curiosity_score" numeric, "overall_performance_level" "text", "development_priority" "text", "coaching_focus" "text"[], "stretch_assignments" "text"[], "risk_factors" "text"[])
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."classify_all_personas_in_quarter"("input_quarter_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."classify_employee_persona"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") RETURNS TABLE("evaluatee_id" "uuid", "evaluatee_name" character varying, "quarter_id" "uuid", "quarter_name" character varying, "persona_type" "text", "persona_description" "text", "competence_level" character, "character_level" character, "curiosity_level" character, "competence_score" numeric, "character_score" numeric, "curiosity_score" numeric, "overall_performance_level" "text", "development_priority" "text", "coaching_focus" "text"[], "stretch_assignments" "text"[], "risk_factors" "text"[])
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."classify_employee_persona"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_invites"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  WITH deleted AS (
    DELETE FROM public.invites 
    WHERE expires_at < now() - interval '30 days'
      AND claimed_at IS NULL
    RETURNING id
  )
  SELECT count(*)::INTEGER FROM deleted;
$$;


ALTER FUNCTION "public"."cleanup_expired_invites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_assignment_safe"("p_evaluator_id" "uuid", "p_evaluatee_id" "uuid", "p_quarter_id" "uuid", "p_evaluation_type" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    assignment_id UUID;
    current_user_people_id UUID;
BEGIN
    -- Get the current user's people table ID safely
    SELECT get_current_user_people_id() INTO current_user_people_id;
    
    -- Create the assignment with the correct people table ID
    INSERT INTO evaluation_assignments (
        evaluator_id,
        evaluatee_id,
        quarter_id,
        evaluation_type,
        status,
        assigned_by
    ) VALUES (
        p_evaluator_id,
        p_evaluatee_id,
        p_quarter_id,
        p_evaluation_type::evaluation_type_enum,
        'pending'::assignment_status_enum,
        current_user_people_id
    )
    RETURNING id INTO assignment_id;
    
    RETURN assignment_id;
END;
$$;


ALTER FUNCTION "public"."create_assignment_safe"("p_evaluator_id" "uuid", "p_evaluatee_id" "uuid", "p_quarter_id" "uuid", "p_evaluation_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_company_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_company_id UUID;
  current_user_email TEXT;
BEGIN
  -- Get current user's email from auth.users
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- If no email found, return null
  IF current_user_email IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get company_id from people table using email
  SELECT company_id INTO user_company_id
  FROM public.people 
  WHERE email = current_user_email;
  
  -- Return the company_id (may be null if user not found in people table)
  RETURN user_company_id;
END;
$$;


ALTER FUNCTION "public"."current_company_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_company_id"() IS 'Returns users company_id from people table (fixed from broken profiles table lookup)';



CREATE OR REPLACE FUNCTION "public"."debug_assignment_status_auth"("assignment_uuid" "uuid") RETURNS TABLE("check_name" "text", "result" boolean, "details" "jsonb", "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    auth_email TEXT := auth.email();
    jwt_email TEXT := auth.jwt() ->> 'email';
    auth_uid TEXT := auth.uid()::TEXT;
BEGIN
    -- Check 1: Basic authentication
    RETURN QUERY
    SELECT 
        'authentication_status'::TEXT,
        (auth_email IS NOT NULL AND auth_uid IS NOT NULL),
        jsonb_build_object(
            'auth_email', auth_email,
            'jwt_email', jwt_email,
            'auth_uid', auth_uid,
            'session_active', (auth.uid() IS NOT NULL)
        ),
        CASE 
            WHEN auth_email IS NULL THEN 'User not authenticated - please log in again'
            ELSE 'Authentication OK'
        END;
    
    -- Check 2: Assignment exists and details
    RETURN QUERY
    SELECT 
        'assignment_details'::TEXT,
        EXISTS(SELECT 1 FROM evaluation_assignments WHERE id = assignment_uuid),
        (
            SELECT jsonb_build_object(
                'assignment_id', ea.id,
                'evaluator_id', ea.evaluator_id,
                'evaluator_email', p.email,
                'evaluator_name', p.name,
                'current_status', ea.status,
                'assignment_exists', true
            )
            FROM evaluation_assignments ea
            JOIN people p ON ea.evaluator_id = p.id
            WHERE ea.id = assignment_uuid
        ),
        CASE 
            WHEN NOT EXISTS(SELECT 1 FROM evaluation_assignments WHERE id = assignment_uuid) 
            THEN 'Assignment not found - check assignment ID'
            ELSE 'Assignment found'
        END;
    
    -- Check 3: Email matching (case-sensitive)
    RETURN QUERY
    SELECT 
        'email_match_exact'::TEXT,
        EXISTS(
            SELECT 1 FROM evaluation_assignments ea
            JOIN people p ON ea.evaluator_id = p.id
            WHERE ea.id = assignment_uuid AND p.email = auth_email
        ),
        jsonb_build_object(
            'auth_email', auth_email,
            'assignment_evaluator_email', (
                SELECT p.email FROM evaluation_assignments ea
                JOIN people p ON ea.evaluator_id = p.id
                WHERE ea.id = assignment_uuid
            ),
            'exact_match', EXISTS(
                SELECT 1 FROM evaluation_assignments ea
                JOIN people p ON ea.evaluator_id = p.id
                WHERE ea.id = assignment_uuid AND p.email = auth_email
            )
        ),
        'Check if emails match exactly (case-sensitive)';
    
    -- Check 4: Email matching (case-insensitive)
    RETURN QUERY
    SELECT 
        'email_match_case_insensitive'::TEXT,
        EXISTS(
            SELECT 1 FROM evaluation_assignments ea
            JOIN people p ON ea.evaluator_id = p.id
            WHERE ea.id = assignment_uuid AND LOWER(p.email) = LOWER(auth_email)
        ),
        jsonb_build_object(
            'auth_email_lower', LOWER(auth_email),
            'assignment_evaluator_email_lower', (
                SELECT LOWER(p.email) FROM evaluation_assignments ea
                JOIN people p ON ea.evaluator_id = p.id
                WHERE ea.id = assignment_uuid
            ),
            'case_insensitive_match', EXISTS(
                SELECT 1 FROM evaluation_assignments ea
                JOIN people p ON ea.evaluator_id = p.id
                WHERE ea.id = assignment_uuid AND LOWER(p.email) = LOWER(auth_email)
            )
        ),
        CASE 
            WHEN EXISTS(
                SELECT 1 FROM evaluation_assignments ea
                JOIN people p ON ea.evaluator_id = p.id
                WHERE ea.id = assignment_uuid AND LOWER(p.email) = LOWER(auth_email)
            ) THEN 'Case-insensitive match found - should work with new policy'
            ELSE 'No email match found - check user identity'
        END;
    
    -- Check 5: Admin status
    RETURN QUERY
    SELECT 
        'admin_status'::TEXT,
        EXISTS(SELECT 1 FROM people WHERE LOWER(email) = LOWER(auth_email) AND jwt_role IN ('super_admin', 'hr_admin')),
        jsonb_build_object(
            'is_admin_in_people', EXISTS(SELECT 1 FROM people WHERE LOWER(email) = LOWER(auth_email) AND jwt_role IN ('super_admin', 'hr_admin')),
            'jwt_role', auth.jwt() ->> 'role',
            'user_role_in_people', (SELECT jwt_role FROM people WHERE LOWER(email) = LOWER(auth_email))
        ),
        CASE 
            WHEN EXISTS(SELECT 1 FROM people WHERE LOWER(email) = LOWER(auth_email) AND jwt_role IN ('super_admin', 'hr_admin'))
            THEN 'User has admin privileges - can update any assignment'
            ELSE 'User is not admin - can only update own assignments'
        END;
    
    -- Check 6: Final RLS policy simulation
    RETURN QUERY
    SELECT 
        'rls_policy_simulation'::TEXT,
        (
            -- Simulate the actual RLS policy logic
            EXISTS(
                SELECT 1 FROM evaluation_assignments ea
                WHERE ea.id = assignment_uuid 
                AND (
                    ea.evaluator_id IN (
                        SELECT id FROM people 
                        WHERE LOWER(email) = LOWER(auth_email)
                    )
                    OR
                    EXISTS (
                        SELECT 1 FROM people 
                        WHERE LOWER(email) = LOWER(auth_email) 
                        AND jwt_role IN ('super_admin', 'hr_admin')
                    )
                )
            )
        ),
        jsonb_build_object(
            'policy_result', 'See result column',
            'policy_logic', 'Case-insensitive email match OR admin status'
        ),
        CASE 
            WHEN EXISTS(
                SELECT 1 FROM evaluation_assignments ea
                WHERE ea.id = assignment_uuid 
                AND (
                    ea.evaluator_id IN (
                        SELECT id FROM people 
                        WHERE LOWER(email) = LOWER(auth_email)
                    )
                    OR
                    EXISTS (
                        SELECT 1 FROM people 
                        WHERE LOWER(email) = LOWER(auth_email) 
                        AND jwt_role IN ('super_admin', 'hr_admin')
                    )
                )
            ) THEN 'RLS policy should ALLOW update'
            ELSE 'RLS policy will BLOCK update - authentication issue'
        END;

END;
$$;


ALTER FUNCTION "public"."debug_assignment_status_auth"("assignment_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."debug_assignment_status_auth"("assignment_uuid" "uuid") IS 'Debug function for troubleshooting assignment status update authentication issues. 
Usage: SELECT * FROM debug_assignment_status_auth(''assignment-uuid-here'');';



CREATE OR REPLACE FUNCTION "public"."enforce_company_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- On INSERT: Auto-populate company_id if not provided
  IF TG_OP = 'INSERT' THEN
    IF NEW.company_id IS NULL THEN
      NEW.company_id := public.current_company_id();
      
      -- Raise error if user has no default company set
      IF NEW.company_id IS NULL THEN
        RAISE EXCEPTION 'Cannot determine company context. User must have a default_company_id set.';
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- On UPDATE: Prevent company_id changes (immutability)
  IF TG_OP = 'UPDATE' THEN
    IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
      RAISE EXCEPTION 'company_id is immutable and cannot be changed after creation';
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END $$;


ALTER FUNCTION "public"."enforce_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invite_token"() RETURNS "text"
    LANGUAGE "sql"
    AS $$
  SELECT replace(gen_random_uuid()::TEXT, '-', '') || replace(gen_random_uuid()::TEXT, '-', '');
$$;


ALTER FUNCTION "public"."generate_invite_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_attribute_weight"("attr_name" character varying, "env" character varying DEFAULT 'production'::character varying) RETURNS numeric
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."get_attribute_weight"("attr_name" character varying, "env" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_company_role"("target_company_id" "uuid") RETURNS "public"."company_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT m.role
  FROM public.company_memberships m
  WHERE m.company_id = target_company_id 
    AND m.profile_id = auth.uid()
$$;


ALTER FUNCTION "public"."get_company_role"("target_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_core_group_for_attribute"("attribute_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    -- Convert to lowercase and trim for consistent matching
    CASE LOWER(TRIM(attribute_name))
        -- COMPETENCE GROUP (Execution & Delivery)
        WHEN 'reliability' THEN RETURN 'competence';
        WHEN 'accountability for action' THEN RETURN 'competence';
        WHEN 'accountability' THEN RETURN 'competence';  -- Short form
        WHEN 'quality of work' THEN RETURN 'competence';
        WHEN 'quality' THEN RETURN 'competence';  -- Short form
        
        -- CHARACTER GROUP (Leadership & Interpersonal)
        WHEN 'leadership' THEN RETURN 'character';
        WHEN 'communication skills' THEN RETURN 'character';
        WHEN 'communication' THEN RETURN 'character';  -- Short form
        WHEN 'teamwork' THEN RETURN 'character';
        
        -- CURIOSITY GROUP (Growth & Innovation)
        WHEN 'problem solving ability' THEN RETURN 'curiosity';
        WHEN 'problem_solving' THEN RETURN 'curiosity';  -- Underscore form
        WHEN 'problem solving' THEN RETURN 'curiosity';  -- Space form
        WHEN 'adaptability' THEN RETURN 'curiosity';
        WHEN 'taking initiative' THEN RETURN 'curiosity';
        WHEN 'initiative' THEN RETURN 'curiosity';  -- Short form
        WHEN 'continuous improvement' THEN RETURN 'curiosity';
        WHEN 'continuous_improvement' THEN RETURN 'curiosity';  -- Underscore form
        
        ELSE RETURN 'unknown';
    END CASE;
END;
$$;


ALTER FUNCTION "public"."get_core_group_for_attribute"("attribute_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_company_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT p.company_id
  FROM public.people p
  WHERE p.email = auth.jwt() ->> 'email'
  LIMIT 1
$$;


ALTER FUNCTION "public"."get_current_user_company_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_company_id"() IS 'Gets current user company_id from people table using JWT email';



CREATE OR REPLACE FUNCTION "public"."get_current_user_people_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_people_id UUID;
    user_email TEXT;
BEGIN
    -- Get current user's email from JWT
    SELECT auth.email() INTO user_email;
    
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found';
    END IF;
    
    -- Look up the people table ID for this email
    SELECT id INTO user_people_id 
    FROM people 
    WHERE email = user_email 
    AND active = true;
    
    IF user_people_id IS NULL THEN
        RAISE EXCEPTION 'No active people record found for email: %', user_email;
    END IF;
    
    RETURN user_people_id;
END;
$$;


ALTER FUNCTION "public"."get_current_user_people_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_letter_grade"("score" numeric) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Handle edge cases
  IF score IS NULL OR score < 0 OR score > 10 THEN
    RETURN 'F';
  END IF;
  
  -- A-Player Grade Scale
  IF score >= 8.5 THEN
    RETURN 'A';
  ELSIF score >= 7.0 THEN
    RETURN 'B';
  ELSIF score >= 5.5 THEN
    RETURN 'C';
  ELSIF score >= 4.0 THEN
    RETURN 'D';
  ELSE
    RETURN 'F';
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_letter_grade"("score" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_letter_grade"("score" numeric) IS 'Convert numeric score (0-10) to A-Player letter grade: A (8.5-10), B (7.0-8.49), C (5.5-6.99), D (4.0-5.49), F (0-3.99)';



CREATE OR REPLACE FUNCTION "public"."get_people_id_from_auth"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT p.id
  FROM public.people p
  JOIN auth.users u ON u.email = p.email
  WHERE u.id = auth.uid()
    AND p.active = true
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_people_id_from_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_company_from_auth"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT p.company_id
  FROM public.people p
  JOIN auth.users u ON u.email = p.email
  WHERE u.id = auth.uid()
    AND p.active = true
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_company_from_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_auth_user_jwt_claims"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get user profile from people table
  SELECT role INTO user_profile
  FROM public.people 
  WHERE email = NEW.email;
  
  -- Set JWT claims based on role in people table
  IF user_profile.role IS NOT NULL THEN
    -- Determine JWT role based on database role
    IF user_profile.role ILIKE '%admin%' OR user_profile.role ILIKE '%super%' THEN
      NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', 'super_admin');
      NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', 'super_admin');
    ELSIF user_profile.role ILIKE '%hr%' THEN
      NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', 'hr_admin');
      NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', 'hr_admin');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_auth_user_jwt_claims"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'role') IN ('super_admin', 'hr_admin'),
    false
  )
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check JWT claims first
  IF auth.jwt() ->> 'role' IN ('super_admin', 'hr_admin', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Fallback to jwt_role column in people table (NOT role column)
  IF EXISTS (
    SELECT 1 FROM people 
    WHERE email = auth.email() 
    AND jwt_role IN ('super_admin', 'hr_admin', 'admin')
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_company_admin"("target_company_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.people p
    WHERE p.id = auth.uid()
      AND p.company_id = target_company_id
      AND p.jwt_role IN ('super_admin', 'hr_admin')
      AND p.active = true
  );
$$;


ALTER FUNCTION "public"."is_company_admin"("target_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_company_member"("target_company_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.company_memberships m
    WHERE m.company_id = target_company_id 
      AND m.profile_id = auth.uid()
  )
$$;


ALTER FUNCTION "public"."is_company_member"("target_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_current_user_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.people p
    JOIN auth.users u ON u.email = p.email
    WHERE u.id = auth.uid()
      AND p.jwt_role IN ('super_admin', 'hr_admin')
      AND p.active = true
  );
$$;


ALTER FUNCTION "public"."is_current_user_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_email_already_invited"("target_company_id" "uuid", "target_email" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invites
    WHERE company_id = target_company_id
      AND email = lower(trim(target_email))
      AND claimed_at IS NULL
      AND revoked_at IS NULL
      AND expires_at > now()
  );
$$;


ALTER FUNCTION "public"."is_email_already_invited"("target_company_id" "uuid", "target_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_people_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.people p 
    WHERE p.email = auth.jwt() ->> 'email'
      AND p.jwt_role = 'super_admin'
  )
$$;


ALTER FUNCTION "public"."is_people_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"("c_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'role') IN ('super_admin', 'hr_admin'),
    false
  ) AND EXISTS (
    SELECT 1 FROM public.company_memberships cm
    WHERE cm.company_id = c_id AND cm.profile_id = auth.uid()
  )
$$;


ALTER FUNCTION "public"."is_super_admin"("c_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin_for_company"("target_company_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.people p
    WHERE p.email = auth.jwt() ->> 'email'
      AND p.company_id = target_company_id
      AND p.jwt_role = 'super_admin'
      AND p.active = true
  )
$$;


ALTER FUNCTION "public"."is_super_admin_for_company"("target_company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_super_admin_for_company"("target_company_id" "uuid") IS 'Checks if current user is super_admin for specified company';



CREATE OR REPLACE FUNCTION "public"."is_super_admin_jwt_only"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'role') IN ('super_admin', 'hr_admin'),
    false
  )
$$;


ALTER FUNCTION "public"."is_super_admin_jwt_only"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_completion_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  target_evaluatee_id UUID;
  target_quarter_id UUID;
  dummy_record RECORD;
BEGIN
  -- Handle different trigger scenarios (INSERT, UPDATE, DELETE)
  IF TG_OP = 'DELETE' THEN
    target_evaluatee_id := OLD.evaluatee_id;
    target_quarter_id := OLD.quarter_id;
  ELSE
    target_evaluatee_id := NEW.evaluatee_id;
    target_quarter_id := NEW.quarter_id;
  END IF;
  
  -- Create a dummy submission record to trigger the completion check
  SELECT 
    target_evaluatee_id as evaluatee_id,
    target_quarter_id as quarter_id,
    NOW() as submission_time
  INTO dummy_record;
  
  -- Call the completion check function manually
  PERFORM check_evaluation_completion_manual(target_evaluatee_id, target_quarter_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."recalculate_completion_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_invite_token"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := public.generate_invite_token();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_invite_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_jwt_claims"("user_email" "text", "user_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update the auth.users table with custom claims
  UPDATE auth.users 
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_role)
  WHERE email = user_email;
  
  -- Also update raw_user_meta_data for user metadata
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_role)
  WHERE email = user_email;
END;
$$;


ALTER FUNCTION "public"."set_user_jwt_claims"("user_email" "text", "user_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."switch_company"("target_company_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  membership_role public.company_role;
  company_info JSON;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify user is a member of the target company
  SELECT role INTO membership_role
  FROM public.company_memberships
  WHERE company_id = target_company_id 
    AND profile_id = auth.uid();
    
  IF membership_role IS NULL THEN
    RAISE EXCEPTION 'Access denied: You are not a member of this company';
  END IF;
  
  -- Update user's default company
  UPDATE public.profiles
  SET default_company_id = target_company_id,
      updated_at = now()
  WHERE id = auth.uid();
  
  -- Get company information to return
  SELECT json_build_object(
    'id', c.id,
    'name', c.name,
    'slug', c.slug,
    'role', membership_role
  ) INTO company_info
  FROM public.companies c
  WHERE c.id = target_company_id;
  
  -- Return success response with company info
  RETURN json_build_object(
    'success', true,
    'message', 'Company context switched successfully',
    'company', company_info
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END $$;


ALTER FUNCTION "public"."switch_company"("target_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_assignment_rls_debug"() RETURNS TABLE("current_email" "text", "jwt_role" "text", "jwt_user_metadata_role" "text", "people_table_role" "text", "people_table_jwt_role" "text", "can_insert_test" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.email()::text as current_email,
        auth.jwt() ->> 'role' as jwt_role,
        auth.jwt() -> 'user_metadata' ->> 'role' as jwt_user_metadata_role,
        p.role as people_table_role,
        p.jwt_role as people_table_jwt_role,
        (
            (auth.jwt() ->> 'role' = 'super_admin') OR 
            (auth.jwt() ->> 'role' = 'hr_admin') OR
            (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
            (auth.jwt() -> 'user_metadata' ->> 'role' = 'hr_admin') OR
            EXISTS (
                SELECT 1 FROM people 
                WHERE email = auth.email() 
                AND jwt_role IN ('super_admin', 'hr_admin')
            )
        ) as can_insert_test
    FROM people p
    WHERE p.email = auth.email();
END;
$$;


ALTER FUNCTION "public"."test_assignment_rls_debug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_attribute_scores_rls_debug"() RETURNS TABLE("table_name" "text", "current_user_email" "text", "current_user_id" "text", "user_role" "text", "can_insert_scores" boolean, "can_insert_responses" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'debug_info'::text,
        auth.email()::text,
        COALESCE((SELECT id::text FROM people WHERE email = auth.email()), 'not_found')::text,
        COALESCE((SELECT jwt_role::text FROM people WHERE email = auth.email()), 'no_role')::text,
        -- Test if user can insert to attribute_scores
        (SELECT COUNT(*) > 0 FROM attribute_scores WHERE false)::boolean, -- This will test policy without actually inserting
        -- Test if user can insert to attribute_responses  
        (SELECT COUNT(*) > 0 FROM attribute_responses WHERE false)::boolean; -- This will test policy without actually inserting
END;
$$;


ALTER FUNCTION "public"."test_attribute_scores_rls_debug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_submissions_rls_debug"() RETURNS TABLE("current_email" "text", "current_user_id" "uuid", "jwt_role" "text", "people_table_role" "text", "can_insert_submission" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.email()::text as current_email,
        p.id as current_user_id,
        auth.jwt() ->> 'role' as jwt_role,
        p.jwt_role as people_table_role,
        (
            -- Can insert if user exists in people table
            p.id IS NOT NULL
            OR
            -- Or if admin
            EXISTS (
                SELECT 1 FROM people p2
                WHERE p2.email = auth.email() 
                AND p2.jwt_role IN ('super_admin', 'hr_admin')
            )
            OR
            (auth.jwt() ->> 'role' = 'super_admin') OR 
            (auth.jwt() ->> 'role' = 'hr_admin')
        ) as can_insert_submission
    FROM people p
    WHERE p.email = auth.email();
END;
$$;


ALTER FUNCTION "public"."test_submissions_rls_debug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_attribute_ai_analysis"("p_evaluatee_id" "uuid", "p_quarter_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Mark as triggered to prevent duplicate triggers
  UPDATE evaluation_completion_status 
  SET 
    ai_analysis_triggered = TRUE,
    ai_triggered_at = NOW(),
    updated_at = NOW()
  WHERE evaluatee_id = p_evaluatee_id 
  AND quarter_id = p_quarter_id;
  
  -- Log the trigger event
  RAISE NOTICE 'AI analysis triggered for evaluatee % in quarter % - webhook implementation pending', p_evaluatee_id, p_quarter_id;
  
  -- TODO: Implement actual webhook triggers in Stage 13.2
  -- This function will be enhanced to:
  -- 1. Generate webhook payloads for each attribute
  -- 2. Send webhooks to n8n endpoints  
  -- 3. Create webhook log entries
  -- 4. Initialize pending AI insight records
END;
$$;


ALTER FUNCTION "public"."trigger_attribute_ai_analysis"("p_evaluatee_id" "uuid", "p_quarter_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_employee_quarter_notes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_employee_quarter_notes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."attribute_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "attribute_name" character varying(100) NOT NULL,
    "score" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" NOT NULL,
    CONSTRAINT "attribute_scores_score_check" CHECK ((("score" >= 1) AND ("score" <= 10)))
);


ALTER TABLE "public"."attribute_scores" OWNER TO "postgres";


COMMENT ON TABLE "public"."attribute_scores" IS 'Stores attribute scores with RLS policies allowing users to manage their own evaluation scores';



CREATE TABLE IF NOT EXISTS "public"."evaluation_cycles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" NOT NULL
);


ALTER TABLE "public"."evaluation_cycles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."people" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "role" character varying(100),
    "active" boolean DEFAULT true,
    "person_description" "text",
    "manager_notes" "text",
    "department" character varying(100),
    "hire_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "jwt_role" "text",
    "profile_picture_url" "text",
    "company_id" "uuid" NOT NULL,
    CONSTRAINT "check_jwt_role" CHECK ((("jwt_role" IS NULL) OR ("jwt_role" = ANY (ARRAY['hr_admin'::"text", 'super_admin'::"text"]))))
);


ALTER TABLE "public"."people" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "submission_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_time" timestamp with time zone DEFAULT "now"(),
    "submitter_id" "uuid" NOT NULL,
    "evaluatee_id" "uuid" NOT NULL,
    "evaluation_type" character varying(50) NOT NULL,
    "quarter_id" "uuid" NOT NULL,
    "raw_json" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" NOT NULL,
    CONSTRAINT "submissions_evaluation_type_check" CHECK ((("evaluation_type")::"text" = ANY ((ARRAY['peer'::character varying, 'manager'::character varying, 'self'::character varying])::"text"[])))
);


ALTER TABLE "public"."submissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."submissions" IS 'Survey submission records with RLS policies for secure access control. Updated to support Stage 7 survey assignment system.';



CREATE OR REPLACE VIEW "public"."weighted_evaluation_scores" AS
 WITH "evaluation_data" AS (
         SELECT "sub"."evaluatee_id",
            "ppl"."name" AS "evaluatee_name",
            "sub"."quarter_id",
            "qtr"."name" AS "quarter_name",
            "qtr"."start_date" AS "quarter_start_date",
            "qtr"."end_date" AS "quarter_end_date",
            "attr_scores"."attribute_name",
            "attr_scores"."score",
            "sub"."evaluation_type"
           FROM ((("public"."submissions" "sub"
             JOIN "public"."attribute_scores" "attr_scores" ON (("sub"."submission_id" = "attr_scores"."submission_id")))
             JOIN "public"."people" "ppl" ON (("sub"."evaluatee_id" = "ppl"."id")))
             JOIN "public"."evaluation_cycles" "qtr" ON (("sub"."quarter_id" = "qtr"."id")))
          WHERE ("ppl"."active" = true)
        ), "aggregated_scores" AS (
         SELECT "evaluation_data"."evaluatee_id",
            "evaluation_data"."evaluatee_name",
            "evaluation_data"."quarter_id",
            "evaluation_data"."quarter_name",
            "evaluation_data"."quarter_start_date",
            "evaluation_data"."quarter_end_date",
            "evaluation_data"."attribute_name",
            "avg"(
                CASE
                    WHEN (("evaluation_data"."evaluation_type")::"text" = 'manager'::"text") THEN "evaluation_data"."score"
                    ELSE NULL::integer
                END) AS "manager_score",
            "avg"(
                CASE
                    WHEN (("evaluation_data"."evaluation_type")::"text" = 'peer'::"text") THEN "evaluation_data"."score"
                    ELSE NULL::integer
                END) AS "peer_score",
            "avg"(
                CASE
                    WHEN (("evaluation_data"."evaluation_type")::"text" = 'self'::"text") THEN "evaluation_data"."score"
                    ELSE NULL::integer
                END) AS "self_score",
            ("count"(
                CASE
                    WHEN (("evaluation_data"."evaluation_type")::"text" = 'manager'::"text") THEN 1
                    ELSE NULL::integer
                END) > 0) AS "has_manager_eval",
            ("count"(
                CASE
                    WHEN (("evaluation_data"."evaluation_type")::"text" = 'peer'::"text") THEN 1
                    ELSE NULL::integer
                END) > 0) AS "has_peer_eval",
            ("count"(
                CASE
                    WHEN (("evaluation_data"."evaluation_type")::"text" = 'self'::"text") THEN 1
                    ELSE NULL::integer
                END) > 0) AS "has_self_eval"
           FROM "evaluation_data"
          GROUP BY "evaluation_data"."evaluatee_id", "evaluation_data"."evaluatee_name", "evaluation_data"."quarter_id", "evaluation_data"."quarter_name", "evaluation_data"."quarter_start_date", "evaluation_data"."quarter_end_date", "evaluation_data"."attribute_name"
        )
 SELECT "evaluatee_id",
    "evaluatee_name",
    "quarter_id",
    "quarter_name",
    ("quarter_start_date")::"text" AS "quarter_start_date",
    ("quarter_end_date")::"text" AS "quarter_end_date",
    "attribute_name",
    COALESCE("manager_score", (0)::numeric) AS "manager_score",
    COALESCE("peer_score", (0)::numeric) AS "peer_score",
    COALESCE("self_score", (0)::numeric) AS "self_score",
    "round"((((COALESCE("manager_score", (0)::numeric) * 0.55) + (COALESCE("peer_score", (0)::numeric) * 0.35)) + (COALESCE("self_score", (0)::numeric) * 0.10)), 2) AS "weighted_final_score",
    "public"."get_letter_grade"("round"((((COALESCE("manager_score", (0)::numeric) * 0.55) + (COALESCE("peer_score", (0)::numeric) * 0.35)) + (COALESCE("self_score", (0)::numeric) * 0.10)), 2)) AS "weighted_final_grade",
    "public"."get_letter_grade"(COALESCE("manager_score", (0)::numeric)) AS "manager_grade",
    "public"."get_letter_grade"(COALESCE("peer_score", (0)::numeric)) AS "peer_grade",
    "public"."get_letter_grade"(COALESCE("self_score", (0)::numeric)) AS "self_grade",
    "has_manager_eval",
    "has_peer_eval",
    "has_self_eval",
        CASE
            WHEN ("has_manager_eval" AND "has_peer_eval" AND "has_self_eval") THEN 100.0
            WHEN (("has_manager_eval" AND "has_peer_eval") OR ("has_manager_eval" AND "has_self_eval") OR ("has_peer_eval" AND "has_self_eval")) THEN 66.7
            WHEN ("has_manager_eval" OR "has_peer_eval" OR "has_self_eval") THEN 33.3
            ELSE 0.0
        END AS "completion_percentage"
   FROM "aggregated_scores";


ALTER VIEW "public"."weighted_evaluation_scores" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."quarter_final_scores" AS
 WITH "quarterly_data" AS (
         SELECT "weighted_evaluation_scores"."evaluatee_id",
            "weighted_evaluation_scores"."evaluatee_name",
            "weighted_evaluation_scores"."quarter_id",
            "weighted_evaluation_scores"."quarter_name",
            "weighted_evaluation_scores"."quarter_start_date",
            "weighted_evaluation_scores"."quarter_end_date",
            "avg"("weighted_evaluation_scores"."weighted_final_score") AS "avg_weighted_score",
            "sum"("weighted_evaluation_scores"."weighted_final_score") AS "total_weighted_score",
            "count"(*) AS "attributes_count",
            "avg"("weighted_evaluation_scores"."completion_percentage") AS "avg_completion_percentage",
            "count"(
                CASE
                    WHEN "weighted_evaluation_scores"."has_manager_eval" THEN 1
                    ELSE NULL::integer
                END) AS "manager_count",
            "count"(
                CASE
                    WHEN "weighted_evaluation_scores"."has_peer_eval" THEN 1
                    ELSE NULL::integer
                END) AS "peer_count",
            "count"(
                CASE
                    WHEN "weighted_evaluation_scores"."has_self_eval" THEN 1
                    ELSE NULL::integer
                END) AS "self_count"
           FROM "public"."weighted_evaluation_scores"
          GROUP BY "weighted_evaluation_scores"."evaluatee_id", "weighted_evaluation_scores"."evaluatee_name", "weighted_evaluation_scores"."quarter_id", "weighted_evaluation_scores"."quarter_name", "weighted_evaluation_scores"."quarter_start_date", "weighted_evaluation_scores"."quarter_end_date"
        )
 SELECT "evaluatee_id",
    "evaluatee_name",
    "quarter_id",
    "quarter_name",
    "quarter_start_date",
    "quarter_end_date",
    "total_weighted_score",
        CASE
            WHEN (("manager_count" > 0) AND ("peer_count" > 0) AND ("self_count" > 0)) THEN (("attributes_count")::numeric * 1.0)
            WHEN (("manager_count" > 0) AND ("peer_count" > 0)) THEN (("attributes_count")::numeric * 0.9)
            WHEN (("manager_count" > 0) AND ("self_count" > 0)) THEN (("attributes_count")::numeric * 0.65)
            WHEN (("peer_count" > 0) AND ("self_count" > 0)) THEN (("attributes_count")::numeric * 0.45)
            WHEN ("manager_count" > 0) THEN (("attributes_count")::numeric * 0.55)
            WHEN ("peer_count" > 0) THEN (("attributes_count")::numeric * 0.35)
            WHEN ("self_count" > 0) THEN (("attributes_count")::numeric * 0.10)
            ELSE (0)::numeric
        END AS "total_weight",
    "attributes_count",
    "round"("avg_weighted_score", 2) AS "final_quarter_score",
    "public"."get_letter_grade"("round"("avg_weighted_score", 2)) AS "final_quarter_grade",
    "avg_completion_percentage" AS "completion_percentage",
    "peer_count",
    "manager_count",
    "self_count",
    (("peer_count" + "manager_count") + "self_count") AS "total_submissions",
    (("manager_count" > 0) AND (("peer_count" > 0) OR ("self_count" > 0))) AS "meets_minimum_requirements"
   FROM "quarterly_data";


ALTER VIEW "public"."quarter_final_scores" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."a_player_summary" AS
 SELECT "evaluatee_id",
    "evaluatee_name",
    "quarter_id",
    "quarter_name",
    "final_quarter_score",
    "final_quarter_grade",
        CASE
            WHEN ("final_quarter_grade" = ANY (ARRAY['A'::"text", 'B'::"text"])) THEN true
            ELSE false
        END AS "is_a_player",
        CASE
            WHEN ("final_quarter_grade" = 'A'::"text") THEN 'A-Player - Exceptional'::"text"
            WHEN ("final_quarter_grade" = 'B'::"text") THEN 'High Performer'::"text"
            WHEN ("final_quarter_grade" = 'C'::"text") THEN 'Solid Contributor'::"text"
            WHEN ("final_quarter_grade" = 'D'::"text") THEN 'Needs Improvement'::"text"
            WHEN ("final_quarter_grade" = 'F'::"text") THEN 'Requires Action'::"text"
            ELSE 'Not Evaluated'::"text"
        END AS "performance_tier",
    "completion_percentage",
    "meets_minimum_requirements"
   FROM "public"."quarter_final_scores"
  ORDER BY "quarter_name" DESC, "final_quarter_score" DESC;


ALTER VIEW "public"."a_player_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."a_player_summary" IS 'A-Player performance summary with grade-based classification and performance tiers';



CREATE TABLE IF NOT EXISTS "public"."analysis_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evaluatee_id" "uuid" NOT NULL,
    "quarter_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "stage" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "pdf_url" "text",
    "error_message" "text",
    "pdf_data" "bytea",
    "pdf_filename" "text",
    "company_id" "uuid" NOT NULL,
    CONSTRAINT "analysis_jobs_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'error'::character varying])::"text"[])))
);


ALTER TABLE "public"."analysis_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "id" integer NOT NULL,
    "key" character varying(255) NOT NULL,
    "value" "text" NOT NULL,
    "environment" character varying(50) DEFAULT 'production'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."app_config_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."app_config_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."app_config_id_seq" OWNED BY "public"."app_config"."id";



CREATE TABLE IF NOT EXISTS "public"."assignment_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assignment_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluation_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evaluator_id" "uuid" NOT NULL,
    "evaluatee_id" "uuid" NOT NULL,
    "quarter_id" "uuid" NOT NULL,
    "evaluation_type" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "assigned_by" "uuid" NOT NULL,
    "assigned_at" timestamp without time zone DEFAULT "now"(),
    "completed_at" timestamp without time zone,
    "survey_token" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "company_id" "uuid" NOT NULL,
    CONSTRAINT "check_self_evaluation_same_person" CHECK ((("evaluator_id" <> "evaluatee_id") OR ("evaluation_type" = 'self'::"text"))),
    CONSTRAINT "evaluation_assignments_evaluation_type_check" CHECK (("evaluation_type" = ANY (ARRAY['peer'::"text", 'manager'::"text", 'self'::"text"]))),
    CONSTRAINT "evaluation_assignments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."evaluation_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."evaluation_assignments" IS 'Assignment tracking table - triggers to evaluation_completion_status have been disabled to fix survey completion issues';



CREATE OR REPLACE VIEW "public"."assignment_details" AS
 SELECT "ea"."id",
    "ea"."evaluator_id",
    "ea"."evaluatee_id",
    "ea"."quarter_id",
    "ea"."evaluation_type",
    "ea"."status",
    "ea"."assigned_by",
    "ea"."assigned_at",
    "ea"."completed_at",
    "ea"."survey_token",
    "ea"."created_at",
    "evaluator"."name" AS "evaluator_name",
    "evaluator"."email" AS "evaluator_email",
    "evaluator"."department" AS "evaluator_department",
    "evaluatee"."name" AS "evaluatee_name",
    "evaluatee"."email" AS "evaluatee_email",
    "evaluatee"."department" AS "evaluatee_department",
    "ec"."name" AS "quarter_name",
    "ec"."start_date" AS "quarter_start_date",
    "ec"."end_date" AS "quarter_end_date",
    "assigned_by"."name" AS "assigned_by_name",
    "s"."submission_id",
        CASE
            WHEN ("s"."submission_id" IS NOT NULL) THEN 100.0
            WHEN ("ea"."status" = 'in_progress'::"text") THEN 50.0
            ELSE 0.0
        END AS "progress_percentage"
   FROM (((((("public"."evaluation_assignments" "ea"
     JOIN "public"."people" "evaluator" ON (("ea"."evaluator_id" = "evaluator"."id")))
     JOIN "public"."people" "evaluatee" ON (("ea"."evaluatee_id" = "evaluatee"."id")))
     JOIN "public"."people" "assigned_by" ON (("ea"."assigned_by" = "assigned_by"."id")))
     JOIN "public"."evaluation_cycles" "ec" ON (("ea"."quarter_id" = "ec"."id")))
     LEFT JOIN "public"."assignment_submissions" "asub" ON (("ea"."id" = "asub"."assignment_id")))
     LEFT JOIN "public"."submissions" "s" ON (("asub"."submission_id" = "s"."submission_id")));


ALTER VIEW "public"."assignment_details" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."assignment_statistics" AS
 SELECT "ea"."quarter_id",
    "ec"."name" AS "quarter_name",
    "ea"."evaluation_type",
    "count"(*) AS "total_assignments",
    "count"(
        CASE
            WHEN ("ea"."status" = 'pending'::"text") THEN 1
            ELSE NULL::integer
        END) AS "pending_count",
    "count"(
        CASE
            WHEN ("ea"."status" = 'in_progress'::"text") THEN 1
            ELSE NULL::integer
        END) AS "in_progress_count",
    "count"(
        CASE
            WHEN ("ea"."status" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "completed_count",
    "round"(((("count"(
        CASE
            WHEN ("ea"."status" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END))::numeric * 100.0) / ("count"(*))::numeric), 2) AS "completion_percentage"
   FROM ("public"."evaluation_assignments" "ea"
     JOIN "public"."evaluation_cycles" "ec" ON (("ea"."quarter_id" = "ec"."id")))
  GROUP BY "ea"."quarter_id", "ec"."name", "ea"."evaluation_type";


ALTER VIEW "public"."assignment_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attribute_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "attribute_name" character varying(100) NOT NULL,
    "question_id" character varying(50),
    "question_text" "text" NOT NULL,
    "response_type" character varying(50),
    "response_value" "jsonb",
    "score_context" integer,
    "attribute_score_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attribute_responses" OWNER TO "postgres";


COMMENT ON TABLE "public"."attribute_responses" IS 'Stores attribute responses with RLS policies allowing users to manage their own evaluation responses';



CREATE OR REPLACE VIEW "public"."submission_summary" AS
 SELECT "s"."submission_id",
    "s"."submission_time",
    "submitter"."name" AS "submitter_name",
    "submitter"."email" AS "submitter_email",
    "evaluatee"."name" AS "evaluatee_name",
    "evaluatee"."email" AS "evaluatee_email",
    "s"."evaluation_type",
    "ec"."name" AS "quarter_name",
    "ec"."start_date",
    "ec"."end_date"
   FROM ((("public"."submissions" "s"
     JOIN "public"."people" "submitter" ON (("s"."submitter_id" = "submitter"."id")))
     JOIN "public"."people" "evaluatee" ON (("s"."evaluatee_id" = "evaluatee"."id")))
     JOIN "public"."evaluation_cycles" "ec" ON (("s"."quarter_id" = "ec"."id")));


ALTER VIEW "public"."submission_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."attribute_score_summary" AS
 SELECT "scores"."id",
    "scores"."submission_id",
    "scores"."attribute_name",
    "scores"."score",
    "ss"."submitter_name",
    "ss"."evaluatee_name",
    "ss"."evaluation_type",
    "ss"."quarter_name",
    "scores"."created_at"
   FROM ("public"."attribute_scores" "scores"
     JOIN "public"."submission_summary" "ss" ON (("scores"."submission_id" = "ss"."submission_id")));


ALTER VIEW "public"."attribute_score_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attribute_weights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attribute_name" character varying(100) NOT NULL,
    "weight" numeric(3,2) DEFAULT 1.0 NOT NULL,
    "description" "text",
    "environment" character varying(20) DEFAULT 'production'::character varying NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" NOT NULL,
    CONSTRAINT "valid_environment" CHECK ((("environment")::"text" = ANY ((ARRAY['production'::character varying, 'development'::character varying, 'testing'::character varying])::"text"[]))),
    CONSTRAINT "weight_range" CHECK ((("weight" >= 0.1) AND ("weight" <= 5.0)))
);


ALTER TABLE "public"."attribute_weights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" GENERATED ALWAYS AS ("regexp_replace"("regexp_replace"("lower"(TRIM(BOTH FROM "name")), '[^a-z0-9\s-]'::"text", ''::"text", 'g'::"text"), '\s+'::"text", '-'::"text", 'g'::"text")) STORED,
    "description" "text",
    "website" "text",
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "companies_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "public"."company_role" DEFAULT 'member'::"public"."company_role" NOT NULL,
    "invited_by" "uuid",
    "invited_at" timestamp with time zone DEFAULT "now"(),
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company_memberships" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."core_group_scores" AS
 WITH "base_data" AS (
         SELECT DISTINCT "wes"."evaluatee_id",
            "wes"."quarter_id"
           FROM "public"."weighted_evaluation_scores" "wes"
        )
 SELECT "bd"."evaluatee_id",
    "cgs"."evaluatee_name",
    "bd"."quarter_id",
    "cgs"."quarter_name",
    ("ec"."start_date")::"text" AS "quarter_start_date",
    ("ec"."end_date")::"text" AS "quarter_end_date",
    "cgs"."core_group",
    "cgs"."manager_avg_score",
    "cgs"."peer_avg_score",
    "cgs"."self_avg_score",
    "cgs"."weighted_score",
    "cgs"."attribute_count",
    "cgs"."completion_percentage",
    "now"() AS "calculated_at"
   FROM (("base_data" "bd"
     CROSS JOIN LATERAL "public"."calculate_core_group_scores"("bd"."evaluatee_id", "bd"."quarter_id") "cgs"("evaluatee_id", "evaluatee_name", "quarter_id", "quarter_name", "core_group", "manager_avg_score", "peer_avg_score", "self_avg_score", "weighted_score", "attribute_count", "completion_percentage"))
     JOIN "public"."evaluation_cycles" "ec" ON (("bd"."quarter_id" = "ec"."id")))
  WHERE ("cgs"."weighted_score" > (0)::numeric)
  ORDER BY "cgs"."evaluatee_name", "cgs"."quarter_name",
        CASE "cgs"."core_group"
            WHEN 'competence'::"text" THEN 1
            WHEN 'character'::"text" THEN 2
            WHEN 'curiosity'::"text" THEN 3
            ELSE 4
        END;


ALTER VIEW "public"."core_group_scores" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."core_group_scores_with_consensus" AS
 WITH "base_data" AS (
         SELECT DISTINCT "wes"."evaluatee_id",
            "wes"."quarter_id"
           FROM "public"."weighted_evaluation_scores" "wes"
        )
 SELECT "bd"."evaluatee_id",
    "cgs"."evaluatee_name",
    "bd"."quarter_id",
    "cgs"."quarter_name",
    ("ec"."start_date")::"text" AS "quarter_start_date",
    ("ec"."end_date")::"text" AS "quarter_end_date",
    "cgs"."core_group",
    "cgs"."manager_avg_score",
    "cgs"."peer_avg_score",
    "cgs"."self_avg_score",
    "cgs"."weighted_score",
    "cgs"."attribute_count",
    "cgs"."completion_percentage",
    "cgs"."self_vs_others_gap",
    "cgs"."manager_vs_peer_gap",
    "cgs"."consensus_variance",
    "now"() AS "calculated_at"
   FROM (("base_data" "bd"
     CROSS JOIN LATERAL "public"."calculate_core_group_scores_with_consensus"("bd"."evaluatee_id", "bd"."quarter_id") "cgs"("evaluatee_id", "evaluatee_name", "quarter_id", "quarter_name", "core_group", "manager_avg_score", "peer_avg_score", "self_avg_score", "weighted_score", "attribute_count", "completion_percentage", "self_vs_others_gap", "manager_vs_peer_gap", "consensus_variance"))
     JOIN "public"."evaluation_cycles" "ec" ON (("bd"."quarter_id" = "ec"."id")))
  WHERE ("cgs"."weighted_score" > (0)::numeric)
  ORDER BY "cgs"."evaluatee_name", "cgs"."quarter_name",
        CASE "cgs"."core_group"
            WHEN 'competence'::"text" THEN 1
            WHEN 'character'::"text" THEN 2
            WHEN 'curiosity'::"text" THEN 3
            ELSE 4
        END;


ALTER VIEW "public"."core_group_scores_with_consensus" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."core_group_summary" AS
 SELECT "evaluatee_id",
    "evaluatee_name",
    "quarter_id",
    "quarter_name",
    "quarter_start_date",
    "quarter_end_date",
    "round"("avg"("weighted_score"), 2) AS "overall_weighted_score",
    "round"("avg"("manager_avg_score"), 2) AS "overall_manager_score",
    "round"("avg"("peer_avg_score"), 2) AS "overall_peer_score",
    "round"("avg"("self_avg_score"), 2) AS "overall_self_score",
    "round"("avg"(
        CASE
            WHEN ("core_group" = 'competence'::"text") THEN "weighted_score"
            ELSE NULL::numeric
        END), 2) AS "competence_score",
    "round"("avg"(
        CASE
            WHEN ("core_group" = 'character'::"text") THEN "weighted_score"
            ELSE NULL::numeric
        END), 2) AS "character_score",
    "round"("avg"(
        CASE
            WHEN ("core_group" = 'curiosity'::"text") THEN "weighted_score"
            ELSE NULL::numeric
        END), 2) AS "curiosity_score",
    "round"("avg"("completion_percentage"), 2) AS "overall_completion_percentage",
    "sum"("attribute_count") AS "total_attributes_evaluated",
    "count"(DISTINCT "core_group") AS "core_groups_evaluated",
    "calculated_at"
   FROM "public"."core_group_scores" "cgs"
  GROUP BY "evaluatee_id", "evaluatee_name", "quarter_id", "quarter_name", "quarter_start_date", "quarter_end_date", "calculated_at"
  ORDER BY "evaluatee_name", "quarter_name";


ALTER VIEW "public"."core_group_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_quarter_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "quarter_id" "uuid" NOT NULL,
    "notes" "text" DEFAULT ''::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" NOT NULL
);


ALTER TABLE "public"."employee_quarter_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluation_completion_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evaluatee_id" "uuid" NOT NULL,
    "quarter_id" "uuid" NOT NULL,
    "self_assigned_count" integer DEFAULT 0,
    "manager_assigned_count" integer DEFAULT 0,
    "total_peer_assigned" integer DEFAULT 0,
    "self_completed" boolean DEFAULT false,
    "manager_completed" boolean DEFAULT false,
    "peer_completed_count" integer DEFAULT 0,
    "all_evaluations_complete" boolean DEFAULT false,
    "ai_analysis_triggered" boolean DEFAULT false,
    "ai_analysis_completed" boolean DEFAULT false,
    "first_submission_at" timestamp with time zone,
    "last_submission_at" timestamp with time zone,
    "completion_detected_at" timestamp with time zone,
    "ai_triggered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_counts" CHECK ((("self_assigned_count" >= 0) AND ("manager_assigned_count" >= 0) AND ("total_peer_assigned" >= 0) AND ("peer_completed_count" >= 0)))
);


ALTER TABLE "public"."evaluation_completion_status" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."grade_distribution" AS
 WITH "grade_counts" AS (
         SELECT "quarter_final_scores"."quarter_id",
            "quarter_final_scores"."quarter_name",
            "quarter_final_scores"."final_quarter_grade" AS "grade",
            "count"(*) AS "count"
           FROM "public"."quarter_final_scores"
          WHERE ("quarter_final_scores"."final_quarter_score" IS NOT NULL)
          GROUP BY "quarter_final_scores"."quarter_id", "quarter_final_scores"."quarter_name", "quarter_final_scores"."final_quarter_grade"
        ), "quarter_totals" AS (
         SELECT "quarter_final_scores"."quarter_id",
            "quarter_final_scores"."quarter_name",
            "count"(*) AS "total_people"
           FROM "public"."quarter_final_scores"
          WHERE ("quarter_final_scores"."final_quarter_score" IS NOT NULL)
          GROUP BY "quarter_final_scores"."quarter_id", "quarter_final_scores"."quarter_name"
        )
 SELECT "gc"."quarter_id",
    "gc"."quarter_name",
    "gc"."grade",
    "gc"."count",
    "qt"."total_people",
    "round"(((("gc"."count")::numeric / ("qt"."total_people")::numeric) * (100)::numeric), 1) AS "percentage"
   FROM ("grade_counts" "gc"
     JOIN "quarter_totals" "qt" ON (("gc"."quarter_id" = "qt"."quarter_id")))
  ORDER BY "gc"."quarter_name",
        CASE "gc"."grade"
            WHEN 'A'::"text" THEN 1
            WHEN 'B'::"text" THEN 2
            WHEN 'C'::"text" THEN 3
            WHEN 'D'::"text" THEN 4
            WHEN 'F'::"text" THEN 5
            ELSE NULL::integer
        END;


ALTER VIEW "public"."grade_distribution" OWNER TO "postgres";


COMMENT ON VIEW "public"."grade_distribution" IS 'Letter grade distribution statistics by quarter for organizational performance analytics';



CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."company_role" DEFAULT 'member'::"public"."company_role" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "accepted_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "accept_before_expiry" CHECK ((("accepted_at" IS NULL) OR ("accepted_at" <= "expires_at"))),
    CONSTRAINT "invitations_email_check" CHECK ((("length"(TRIM(BOTH FROM "email")) > 0) AND ("email" ~ '^[^@]+@[^@]+\.[^@]+$'::"text"))),
    CONSTRAINT "no_accept_and_revoke" CHECK ((("accepted_at" IS NULL) OR ("revoked_at" IS NULL))),
    CONSTRAINT "valid_expiry_date" CHECK (("expires_at" > "created_at"))
);

ALTER TABLE ONLY "public"."invitations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role_to_assign" "public"."company_role" DEFAULT 'member'::"public"."company_role" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "claimed_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invites_email_check" CHECK (("email" ~ '^[^@]+@[^@]+\.[^@]+$'::"text"))
);


ALTER TABLE "public"."invites" OWNER TO "postgres";


COMMENT ON TABLE "public"."invites" IS 'Single-use invitation tokens for company access - uses Supabase generateLink pattern';



COMMENT ON COLUMN "public"."invites"."role_to_assign" IS 'Company role to assign when invite is accepted';



COMMENT ON COLUMN "public"."invites"."token" IS 'Secure single-use token for invite acceptance';



COMMENT ON COLUMN "public"."invites"."created_by" IS 'References people.id of the user who created the invite';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "default_company_id" "uuid",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "locale" "text" DEFAULT 'en'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_seen_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."quarter_core_group_trends" AS
 WITH "quarter_scores" AS (
         SELECT "cgs"."evaluatee_id",
            "cgs"."evaluatee_name",
            "cgs"."quarter_id",
            "cgs"."quarter_name",
            ("cgs"."quarter_start_date")::"date" AS "quarter_start_date",
            "cgs"."core_group",
            "cgs"."weighted_score",
            "row_number"() OVER (PARTITION BY "cgs"."evaluatee_id", "cgs"."core_group" ORDER BY ("cgs"."quarter_start_date")::"date") AS "quarter_sequence"
           FROM "public"."core_group_scores" "cgs"
          WHERE ("cgs"."weighted_score" > (0)::numeric)
        ), "trend_analysis" AS (
         SELECT "qs"."evaluatee_id",
            "qs"."evaluatee_name",
            "qs"."quarter_id",
            "qs"."quarter_name",
            "qs"."quarter_start_date",
            "qs"."core_group",
            "qs"."weighted_score",
            "qs"."quarter_sequence",
            "lag"("qs"."weighted_score") OVER (PARTITION BY "qs"."evaluatee_id", "qs"."core_group" ORDER BY "qs"."quarter_start_date") AS "previous_quarter_score",
            "lead"("qs"."weighted_score") OVER (PARTITION BY "qs"."evaluatee_id", "qs"."core_group" ORDER BY "qs"."quarter_start_date") AS "next_quarter_score"
           FROM "quarter_scores" "qs"
        )
 SELECT "evaluatee_id",
    "evaluatee_name",
    "quarter_id",
    "quarter_name",
    "quarter_start_date",
    "core_group",
    "weighted_score" AS "current_score",
    "previous_quarter_score",
    "next_quarter_score",
    "quarter_sequence",
        CASE
            WHEN ("previous_quarter_score" IS NOT NULL) THEN "round"(("weighted_score" - "previous_quarter_score"), 2)
            ELSE NULL::numeric
        END AS "quarter_over_quarter_change",
        CASE
            WHEN ("previous_quarter_score" IS NOT NULL) THEN
            CASE
                WHEN ("weighted_score" > ("previous_quarter_score" + 0.5)) THEN 'improving'::"text"
                WHEN ("weighted_score" < ("previous_quarter_score" - 0.5)) THEN 'declining'::"text"
                ELSE 'stable'::"text"
            END
            ELSE 'first_quarter'::"text"
        END AS "trend_direction",
        CASE
            WHEN ("weighted_score" >= 8.0) THEN 'high'::"text"
            WHEN ("weighted_score" >= 6.0) THEN 'medium'::"text"
            ELSE 'low'::"text"
        END AS "performance_level"
   FROM "trend_analysis" "ta"
  ORDER BY "evaluatee_name", "core_group", "quarter_start_date";


ALTER VIEW "public"."quarter_core_group_trends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evaluatee_id" "uuid" NOT NULL,
    "quarter_id" "uuid" NOT NULL,
    "report_type" character varying(50) NOT NULL,
    "pdf_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid",
    "webhook_url" "text" NOT NULL,
    "payload" "jsonb",
    "response_status" integer,
    "response_body" "text",
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_config" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."app_config_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."analysis_jobs"
    ADD CONSTRAINT "analysis_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_assignment_id_key" UNIQUE ("assignment_id");



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attribute_responses"
    ADD CONSTRAINT "attribute_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attribute_scores"
    ADD CONSTRAINT "attribute_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attribute_weights"
    ADD CONSTRAINT "attribute_weights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."company_memberships"
    ADD CONSTRAINT "company_memberships_company_id_profile_id_key" UNIQUE ("company_id", "profile_id");



ALTER TABLE ONLY "public"."company_memberships"
    ADD CONSTRAINT "company_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_quarter_notes"
    ADD CONSTRAINT "employee_quarter_notes_employee_id_quarter_id_key" UNIQUE ("employee_id", "quarter_id");



ALTER TABLE ONLY "public"."employee_quarter_notes"
    ADD CONSTRAINT "employee_quarter_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_assignments"
    ADD CONSTRAINT "evaluation_assignments_evaluator_id_evaluatee_id_quarter_id_key" UNIQUE ("evaluator_id", "evaluatee_id", "quarter_id", "evaluation_type");



ALTER TABLE ONLY "public"."evaluation_assignments"
    ADD CONSTRAINT "evaluation_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_completion_status"
    ADD CONSTRAINT "evaluation_completion_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_cycles"
    ADD CONSTRAINT "evaluation_cycles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_company_id_email_claimed_at_key" UNIQUE ("company_id", "email", "claimed_at") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("submission_id");



ALTER TABLE ONLY "public"."evaluation_assignments"
    ADD CONSTRAINT "unique_assignment_per_evaluator_evaluatee_quarter_type" UNIQUE ("evaluator_id", "evaluatee_id", "quarter_id", "evaluation_type");



ALTER TABLE ONLY "public"."attribute_weights"
    ADD CONSTRAINT "unique_attribute_per_environment" UNIQUE ("attribute_name", "environment");



ALTER TABLE ONLY "public"."attribute_responses"
    ADD CONSTRAINT "unique_attribute_response_per_question" UNIQUE ("submission_id", "attribute_name", "question_id");



COMMENT ON CONSTRAINT "unique_attribute_response_per_question" ON "public"."attribute_responses" IS 'Ensures one response per question per attribute per submission - required for survey upsert operations';



ALTER TABLE ONLY "public"."attribute_scores"
    ADD CONSTRAINT "unique_attribute_score_per_submission" UNIQUE ("submission_id", "attribute_name");



COMMENT ON CONSTRAINT "unique_attribute_score_per_submission" ON "public"."attribute_scores" IS 'Ensures one score per attribute per submission - required for survey upsert operations';



ALTER TABLE ONLY "public"."evaluation_completion_status"
    ADD CONSTRAINT "unique_completion_status" UNIQUE ("evaluatee_id", "quarter_id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "unique_invitation_token" UNIQUE ("token");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_analysis_jobs_company_id" ON "public"."analysis_jobs" USING "btree" ("company_id");



CREATE INDEX "idx_analysis_jobs_created_at" ON "public"."analysis_jobs" USING "btree" ("created_at");



CREATE INDEX "idx_analysis_jobs_evaluatee" ON "public"."analysis_jobs" USING "btree" ("evaluatee_id");



CREATE INDEX "idx_analysis_jobs_evaluatee_id" ON "public"."analysis_jobs" USING "btree" ("evaluatee_id");



CREATE INDEX "idx_analysis_jobs_quarter_id" ON "public"."analysis_jobs" USING "btree" ("quarter_id");



CREATE INDEX "idx_analysis_jobs_status" ON "public"."analysis_jobs" USING "btree" ("status");



CREATE INDEX "idx_assignment_submissions_assignment" ON "public"."assignment_submissions" USING "btree" ("assignment_id");



CREATE INDEX "idx_assignment_submissions_submission" ON "public"."assignment_submissions" USING "btree" ("submission_id");



CREATE INDEX "idx_attribute_responses_attribute" ON "public"."attribute_responses" USING "btree" ("attribute_name");



CREATE INDEX "idx_attribute_responses_submission" ON "public"."attribute_responses" USING "btree" ("submission_id");



CREATE INDEX "idx_attribute_responses_submission_attribute_question" ON "public"."attribute_responses" USING "btree" ("submission_id", "attribute_name", "question_id");



CREATE INDEX "idx_attribute_scores_attribute" ON "public"."attribute_scores" USING "btree" ("attribute_name");



CREATE INDEX "idx_attribute_scores_company_id" ON "public"."attribute_scores" USING "btree" ("company_id");



CREATE INDEX "idx_attribute_scores_evaluatee_quarter" ON "public"."attribute_scores" USING "btree" ("submission_id") WHERE ("score" > 0);



CREATE INDEX "idx_attribute_scores_submission" ON "public"."attribute_scores" USING "btree" ("submission_id");



CREATE INDEX "idx_attribute_scores_submission_attribute" ON "public"."attribute_scores" USING "btree" ("submission_id", "attribute_name");



CREATE INDEX "idx_attribute_weights_company_id" ON "public"."attribute_weights" USING "btree" ("company_id");



CREATE INDEX "idx_companies_active" ON "public"."companies" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_companies_created_at" ON "public"."companies" USING "btree" ("created_at");



CREATE INDEX "idx_companies_name" ON "public"."companies" USING "btree" ("name");



CREATE INDEX "idx_companies_slug" ON "public"."companies" USING "btree" ("slug");



CREATE INDEX "idx_company_memberships_company" ON "public"."company_memberships" USING "btree" ("company_id");



CREATE INDEX "idx_company_memberships_profile" ON "public"."company_memberships" USING "btree" ("profile_id");



CREATE INDEX "idx_company_memberships_role" ON "public"."company_memberships" USING "btree" ("company_id", "role");



CREATE INDEX "idx_completion_status_ai_triggered" ON "public"."evaluation_completion_status" USING "btree" ("ai_analysis_triggered");



CREATE INDEX "idx_completion_status_complete" ON "public"."evaluation_completion_status" USING "btree" ("all_evaluations_complete");



CREATE INDEX "idx_completion_status_evaluatee_quarter" ON "public"."evaluation_completion_status" USING "btree" ("evaluatee_id", "quarter_id");



CREATE INDEX "idx_completion_status_updated" ON "public"."evaluation_completion_status" USING "btree" ("updated_at");



CREATE INDEX "idx_ea_company_id" ON "public"."evaluation_assignments" USING "btree" ("company_id");



CREATE INDEX "idx_employee_quarter_notes_created_by" ON "public"."employee_quarter_notes" USING "btree" ("created_by");



CREATE INDEX "idx_employee_quarter_notes_employee" ON "public"."employee_quarter_notes" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_quarter_notes_quarter" ON "public"."employee_quarter_notes" USING "btree" ("quarter_id");



CREATE INDEX "idx_employee_quarter_notes_updated_at" ON "public"."employee_quarter_notes" USING "btree" ("updated_at");



CREATE INDEX "idx_eqn_company_id" ON "public"."employee_quarter_notes" USING "btree" ("company_id");



CREATE INDEX "idx_evaluation_assignments_evaluatee" ON "public"."evaluation_assignments" USING "btree" ("evaluatee_id");



CREATE INDEX "idx_evaluation_assignments_evaluator" ON "public"."evaluation_assignments" USING "btree" ("evaluator_id");



CREATE INDEX "idx_evaluation_assignments_quarter" ON "public"."evaluation_assignments" USING "btree" ("quarter_id");



CREATE INDEX "idx_evaluation_assignments_status" ON "public"."evaluation_assignments" USING "btree" ("status");



CREATE INDEX "idx_evaluation_assignments_survey_token" ON "public"."evaluation_assignments" USING "btree" ("survey_token");



CREATE INDEX "idx_evaluation_assignments_type" ON "public"."evaluation_assignments" USING "btree" ("evaluation_type");



CREATE INDEX "idx_evaluation_cycles_company_id" ON "public"."evaluation_cycles" USING "btree" ("company_id");



CREATE INDEX "idx_evaluation_cycles_dates" ON "public"."evaluation_cycles" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_invitations_admin_view" ON "public"."invitations" USING "btree" ("company_id", "created_at" DESC) WHERE (("accepted_at" IS NULL) AND ("revoked_at" IS NULL));



CREATE INDEX "idx_invitations_company_id" ON "public"."invitations" USING "btree" ("company_id");



CREATE INDEX "idx_invitations_email" ON "public"."invitations" USING "btree" ("email");



CREATE INDEX "idx_invitations_invited_by" ON "public"."invitations" USING "btree" ("invited_by");



CREATE INDEX "idx_invitations_status" ON "public"."invitations" USING "btree" ("company_id", "accepted_at", "revoked_at", "expires_at");



CREATE INDEX "idx_invites_company_id" ON "public"."invites" USING "btree" ("company_id", "created_at" DESC);



CREATE INDEX "idx_invites_email" ON "public"."invites" USING "btree" ("company_id", "email") WHERE ("claimed_at" IS NULL);



CREATE INDEX "idx_invites_expires_at" ON "public"."invites" USING "btree" ("expires_at") WHERE ("claimed_at" IS NULL);



CREATE INDEX "idx_invites_token" ON "public"."invites" USING "btree" ("token") WHERE ("claimed_at" IS NULL);



CREATE INDEX "idx_people_active" ON "public"."people" USING "btree" ("active");



CREATE INDEX "idx_people_company_id" ON "public"."people" USING "btree" ("company_id");



CREATE INDEX "idx_people_email" ON "public"."people" USING "btree" ("email");



CREATE INDEX "idx_people_jwt_role" ON "public"."people" USING "btree" ("jwt_role");



CREATE INDEX "idx_profiles_active" ON "public"."profiles" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_profiles_default_company" ON "public"."profiles" USING "btree" ("default_company_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_last_seen" ON "public"."profiles" USING "btree" ("last_seen_at");



CREATE INDEX "idx_reports_evaluatee_quarter" ON "public"."reports" USING "btree" ("evaluatee_id", "quarter_id");



CREATE INDEX "idx_submissions_company_id" ON "public"."submissions" USING "btree" ("company_id");



CREATE INDEX "idx_submissions_evaluatee" ON "public"."submissions" USING "btree" ("evaluatee_id");



CREATE INDEX "idx_submissions_evaluatee_quarter" ON "public"."submissions" USING "btree" ("evaluatee_id", "quarter_id");



CREATE INDEX "idx_submissions_evaluation_type" ON "public"."submissions" USING "btree" ("evaluation_type");



CREATE INDEX "idx_submissions_submitter" ON "public"."submissions" USING "btree" ("submitter_id");



CREATE INDEX "idx_weighted_eval_scores_evaluatee_quarter" ON "public"."attribute_scores" USING "btree" ("submission_id") INCLUDE ("attribute_name", "score");



CREATE OR REPLACE TRIGGER "analysis_jobs_enforce_company_id" BEFORE INSERT OR UPDATE ON "public"."analysis_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_company_id"();



CREATE OR REPLACE TRIGGER "attribute_scores_enforce_company_id" BEFORE INSERT OR UPDATE ON "public"."attribute_scores" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_company_id"();



CREATE OR REPLACE TRIGGER "attribute_weights_enforce_company_id" BEFORE INSERT OR UPDATE ON "public"."attribute_weights" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_company_id"();



CREATE OR REPLACE TRIGGER "companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "company_memberships_updated_at" BEFORE UPDATE ON "public"."company_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "completion_status_updated_at" BEFORE UPDATE ON "public"."evaluation_completion_status" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "employee_quarter_notes_enforce_company_id" BEFORE INSERT OR UPDATE ON "public"."employee_quarter_notes" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_company_id"();



CREATE OR REPLACE TRIGGER "evaluation_assignments_enforce_company_id" BEFORE INSERT OR UPDATE ON "public"."evaluation_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_company_id"();



CREATE OR REPLACE TRIGGER "evaluation_completion_trigger" AFTER INSERT OR UPDATE ON "public"."submissions" FOR EACH ROW WHEN (("new"."submission_time" IS NOT NULL)) EXECUTE FUNCTION "public"."check_evaluation_completion"();



CREATE OR REPLACE TRIGGER "evaluation_cycles_enforce_company_id" BEFORE INSERT OR UPDATE ON "public"."evaluation_cycles" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_company_id"();



CREATE OR REPLACE TRIGGER "people_enforce_company_id" BEFORE INSERT OR UPDATE ON "public"."people" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_company_id"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_invite_token_trigger" BEFORE INSERT ON "public"."invites" FOR EACH ROW EXECUTE FUNCTION "public"."set_invite_token"();



CREATE OR REPLACE TRIGGER "submissions_enforce_company_id" BEFORE INSERT OR UPDATE ON "public"."submissions" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_company_id"();



CREATE OR REPLACE TRIGGER "trigger_update_employee_quarter_notes_updated_at" BEFORE UPDATE ON "public"."employee_quarter_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_employee_quarter_notes_updated_at"();



CREATE OR REPLACE TRIGGER "update_analysis_jobs_updated_at" BEFORE UPDATE ON "public"."analysis_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_invitations_updated_at_trigger" BEFORE UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."evaluation_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("submission_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attribute_responses"
    ADD CONSTRAINT "attribute_responses_attribute_score_id_fkey" FOREIGN KEY ("attribute_score_id") REFERENCES "public"."attribute_scores"("id");



ALTER TABLE ONLY "public"."attribute_responses"
    ADD CONSTRAINT "attribute_responses_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("submission_id");



ALTER TABLE ONLY "public"."attribute_scores"
    ADD CONSTRAINT "attribute_scores_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("submission_id");



ALTER TABLE ONLY "public"."attribute_weights"
    ADD CONSTRAINT "attribute_weights_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."people"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."company_memberships"
    ADD CONSTRAINT "company_memberships_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_memberships"
    ADD CONSTRAINT "company_memberships_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."company_memberships"
    ADD CONSTRAINT "company_memberships_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_quarter_notes"
    ADD CONSTRAINT "employee_quarter_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."employee_quarter_notes"
    ADD CONSTRAINT "employee_quarter_notes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_quarter_notes"
    ADD CONSTRAINT "employee_quarter_notes_quarter_id_fkey" FOREIGN KEY ("quarter_id") REFERENCES "public"."evaluation_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluation_assignments"
    ADD CONSTRAINT "evaluation_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."evaluation_assignments"
    ADD CONSTRAINT "evaluation_assignments_evaluatee_id_fkey" FOREIGN KEY ("evaluatee_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."evaluation_assignments"
    ADD CONSTRAINT "evaluation_assignments_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."evaluation_assignments"
    ADD CONSTRAINT "evaluation_assignments_quarter_id_fkey" FOREIGN KEY ("quarter_id") REFERENCES "public"."evaluation_cycles"("id");



ALTER TABLE ONLY "public"."evaluation_completion_status"
    ADD CONSTRAINT "evaluation_completion_status_evaluatee_id_fkey" FOREIGN KEY ("evaluatee_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluation_completion_status"
    ADD CONSTRAINT "evaluation_completion_status_quarter_id_fkey" FOREIGN KEY ("quarter_id") REFERENCES "public"."evaluation_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analysis_jobs"
    ADD CONSTRAINT "fk_analysis_jobs_company_id" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attribute_scores"
    ADD CONSTRAINT "fk_attribute_scores_company_id" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attribute_weights"
    ADD CONSTRAINT "fk_attribute_weights_company_id" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_quarter_notes"
    ADD CONSTRAINT "fk_employee_quarter_notes_company_id" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluation_assignments"
    ADD CONSTRAINT "fk_evaluation_assignments_company_id" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluation_cycles"
    ADD CONSTRAINT "fk_evaluation_cycles_company_id" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "fk_people_company_id" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "fk_submissions_company_id" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_default_company_id_fkey" FOREIGN KEY ("default_company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_evaluatee_id_fkey" FOREIGN KEY ("evaluatee_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_quarter_id_fkey" FOREIGN KEY ("quarter_id") REFERENCES "public"."evaluation_cycles"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_evaluatee_id_fkey" FOREIGN KEY ("evaluatee_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_quarter_id_fkey" FOREIGN KEY ("quarter_id") REFERENCES "public"."evaluation_cycles"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("submission_id");



CREATE POLICY "Admins can create assignments" ON "public"."evaluation_assignments" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'hr_admin'::"text") OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'super_admin'::"text") OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'hr_admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))));



CREATE POLICY "Admins can manage all attribute responses" ON "public"."attribute_responses" USING ((EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"]))))));



CREATE POLICY "Admins can manage all attribute scores" ON "public"."attribute_scores" USING ((EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"]))))));



CREATE POLICY "Admins can manage all submissions" ON "public"."submissions" USING (((EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"]))))) OR (("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'hr_admin'::"text")));



CREATE POLICY "Admins can update assignments" ON "public"."evaluation_assignments" FOR UPDATE USING (((("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'hr_admin'::"text") OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'super_admin'::"text") OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'hr_admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))));



CREATE POLICY "Admins can view all assignments" ON "public"."evaluation_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"]))))));



CREATE POLICY "Admins can view all submissions" ON "public"."submissions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"]))))) OR (("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'hr_admin'::"text")));



CREATE POLICY "Allow HR admin to view all employees" ON "public"."people" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("auth"."jwt"() ->> 'role'::"text") = 'hr_admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text"))));



CREATE POLICY "Allow HR admin to view all submissions" ON "public"."submissions" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("auth"."jwt"() ->> 'role'::"text") = 'hr_admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text"))));



CREATE POLICY "Allow access to attribute responses via submissions" ON "public"."attribute_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."submissions" "s"
  WHERE ("s"."submission_id" = "attribute_responses"."submission_id"))));



CREATE POLICY "Allow access to attribute scores via submissions" ON "public"."attribute_scores" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."submissions" "s"
  WHERE ("s"."submission_id" = "attribute_scores"."submission_id"))));



CREATE POLICY "Allow admins to manage evaluation cycles" ON "public"."evaluation_cycles" USING ((("auth"."role"() = 'authenticated'::"text") AND ((("auth"."jwt"() ->> 'role'::"text") = 'hr_admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text"))));



CREATE POLICY "Allow authenticated users to read public config" ON "public"."app_config" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("key")::"text" !~~ '%secret%'::"text") AND (("key")::"text" !~~ '%password%'::"text") AND (("key")::"text" !~~ '%key%'::"text")));



CREATE POLICY "Allow authenticated users to view active employees" ON "public"."people" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("active" = true)));



CREATE POLICY "Allow authenticated users to view evaluation cycles" ON "public"."evaluation_cycles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow super admin to manage all config" ON "public"."app_config" USING ((("auth"."role"() = 'authenticated'::"text") AND (("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text")));



CREATE POLICY "Allow system service to update analysis jobs" ON "public"."analysis_jobs" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow users to create analysis jobs for accessible employees" ON "public"."analysis_jobs" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ((("auth"."jwt"() ->> 'email'::"text") = (( SELECT "people"."email"
   FROM "public"."people"
  WHERE ("people"."id" = "analysis_jobs"."evaluatee_id")))::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'hr_admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text"))));



CREATE POLICY "Allow users to view analysis jobs for accessible employees" ON "public"."analysis_jobs" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("auth"."jwt"() ->> 'email'::"text") = (( SELECT "people"."email"
   FROM "public"."people"
  WHERE ("people"."id" = "analysis_jobs"."evaluatee_id")))::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'hr_admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text"))));



CREATE POLICY "Allow users to view submissions about themselves" ON "public"."submissions" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("auth"."jwt"() ->> 'email'::"text") = (( SELECT "people"."email"
   FROM "public"."people"
  WHERE ("people"."id" = "submissions"."evaluatee_id")))::"text")));



CREATE POLICY "Allow users to view their own profile" ON "public"."people" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("auth"."jwt"() ->> 'email'::"text") = ("email")::"text")));



CREATE POLICY "Allow users to view their own submissions" ON "public"."submissions" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("auth"."jwt"() ->> 'email'::"text") = (( SELECT "people"."email"
   FROM "public"."people"
  WHERE ("people"."id" = "submissions"."submitter_id")))::"text")));



CREATE POLICY "JWT only update people profiles" ON "public"."people" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text", 'admin'::"text"])));



CREATE POLICY "Users can access own assignment submissions" ON "public"."assignment_submissions" USING (("assignment_id" IN ( SELECT "evaluation_assignments"."id"
   FROM "public"."evaluation_assignments"
  WHERE ("evaluation_assignments"."evaluator_id" IN ( SELECT "people"."id"
           FROM "public"."people"
          WHERE (("people"."email")::"text" = "auth"."email"()))))));



CREATE POLICY "Users can create attribute responses" ON "public"."attribute_responses" FOR INSERT WITH CHECK ((("submission_id" IN ( SELECT "submissions"."submission_id"
   FROM "public"."submissions"
  WHERE ("submissions"."submitter_id" IN ( SELECT "people"."id"
           FROM "public"."people"
          WHERE (("people"."email")::"text" = "auth"."email"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))));



CREATE POLICY "Users can create attribute scores" ON "public"."attribute_scores" FOR INSERT WITH CHECK ((("submission_id" IN ( SELECT "submissions"."submission_id"
   FROM "public"."submissions"
  WHERE ("submissions"."submitter_id" IN ( SELECT "people"."id"
           FROM "public"."people"
          WHERE (("people"."email")::"text" = "auth"."email"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))));



CREATE POLICY "Users can create submissions" ON "public"."submissions" FOR INSERT WITH CHECK ((("submitter_id" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE (("people"."email")::"text" = "auth"."email"()))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"]))))) OR (("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'hr_admin'::"text")));



CREATE POLICY "Users can update own assignment status v2" ON "public"."evaluation_assignments" FOR UPDATE USING ((("evaluator_id" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE ("lower"(("people"."email")::"text") = "lower"("auth"."email"())))) OR ("evaluator_id" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE ("lower"(("people"."email")::"text") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE (("lower"(("people"."email")::"text") = "lower"("auth"."email"())) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"]))))) OR (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))) WITH CHECK ((("evaluator_id" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE ("lower"(("people"."email")::"text") = "lower"("auth"."email"())))) OR ("evaluator_id" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE ("lower"(("people"."email")::"text") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE (("lower"(("people"."email")::"text") = "lower"("auth"."email"())) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"]))))) OR (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"]))));



COMMENT ON POLICY "Users can update own assignment status v2" ON "public"."evaluation_assignments" IS 'Enhanced RLS policy for assignment status updates with case-insensitive email matching and admin fallbacks. 
Fixes Issue #031 where users could not update assignment status due to authentication context mismatches.';



CREATE POLICY "Users can update own attribute responses" ON "public"."attribute_responses" FOR UPDATE USING ((("submission_id" IN ( SELECT "submissions"."submission_id"
   FROM "public"."submissions"
  WHERE ("submissions"."submitter_id" IN ( SELECT "people"."id"
           FROM "public"."people"
          WHERE (("people"."email")::"text" = "auth"."email"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))));



CREATE POLICY "Users can update own attribute scores" ON "public"."attribute_scores" FOR UPDATE USING ((("submission_id" IN ( SELECT "submissions"."submission_id"
   FROM "public"."submissions"
  WHERE ("submissions"."submitter_id" IN ( SELECT "people"."id"
           FROM "public"."people"
          WHERE (("people"."email")::"text" = "auth"."email"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))));



CREATE POLICY "Users can update own submissions" ON "public"."submissions" FOR UPDATE USING ((("submitter_id" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE (("people"."email")::"text" = "auth"."email"()))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))));



CREATE POLICY "Users can view completion status for accessible employees" ON "public"."evaluation_completion_status" FOR SELECT USING ((("evaluatee_id" IN ( SELECT DISTINCT "evaluation_assignments"."evaluatee_id"
   FROM "public"."evaluation_assignments"
  WHERE ("evaluation_assignments"."evaluator_id" IN ( SELECT "people"."id"
           FROM "public"."people"
          WHERE ("lower"(("people"."email")::"text") = "lower"("auth"."email"())))))) OR ("evaluatee_id" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE ("lower"(("people"."email")::"text") = "lower"("auth"."email"())))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE (("lower"(("people"."email")::"text") = "lower"("auth"."email"())) AND ("people"."jwt_role" = ANY (ARRAY['hr_admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "Users can view own assignments" ON "public"."evaluation_assignments" FOR SELECT USING (("evaluator_id" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE (("people"."email")::"text" = "auth"."email"()))));



CREATE POLICY "Users can view own attribute responses" ON "public"."attribute_responses" FOR SELECT USING ((("submission_id" IN ( SELECT "submissions"."submission_id"
   FROM "public"."submissions"
  WHERE (("submissions"."submitter_id" IN ( SELECT "people"."id"
           FROM "public"."people"
          WHERE (("people"."email")::"text" = "auth"."email"()))) OR ("submissions"."evaluatee_id" IN ( SELECT "people"."id"
           FROM "public"."people"
          WHERE (("people"."email")::"text" = "auth"."email"())))))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))));



CREATE POLICY "Users can view own attribute scores" ON "public"."attribute_scores" FOR SELECT USING ((("submission_id" IN ( SELECT "submissions"."submission_id"
   FROM "public"."submissions"
  WHERE (("submissions"."submitter_id" IN ( SELECT "people"."id"
           FROM "public"."people"
          WHERE (("people"."email")::"text" = "auth"."email"()))) OR ("submissions"."evaluatee_id" IN ( SELECT "people"."id"
           FROM "public"."people"
          WHERE (("people"."email")::"text" = "auth"."email"())))))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))));



CREATE POLICY "Users can view own submissions" ON "public"."submissions" FOR SELECT USING ((("submitter_id" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE (("people"."email")::"text" = "auth"."email"()))) OR ("evaluatee_id" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE (("people"."email")::"text" = "auth"."email"()))) OR (EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))));



ALTER TABLE "public"."analysis_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignment_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attribute_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attribute_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_people_robust_access" ON "public"."companies" USING (((EXISTS ( SELECT 1
   FROM "public"."people" "p"
  WHERE (("p"."company_id" = "companies"."id") AND ("p"."id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."people" "p"
  WHERE (("p"."company_id" = "companies"."id") AND (("p"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text"))))) OR (("id" = '00000000-0000-0000-0000-000000000001'::"uuid") AND ("auth"."role"() = 'authenticated'::"text"))));



CREATE POLICY "company_admins_can_create_invites" ON "public"."invites" FOR INSERT WITH CHECK ((("company_id" = "public"."get_user_company_from_auth"()) AND "public"."is_current_user_admin"()));



CREATE POLICY "company_admins_can_update_invites" ON "public"."invites" FOR UPDATE USING ((("company_id" = "public"."get_user_company_from_auth"()) AND "public"."is_current_user_admin"())) WITH CHECK ((("company_id" = "public"."get_user_company_from_auth"()) AND "public"."is_current_user_admin"()));



CREATE POLICY "company_admins_can_view_invites" ON "public"."invites" FOR SELECT USING ((("company_id" = "public"."get_user_company_from_auth"()) AND "public"."is_current_user_admin"()));



ALTER TABLE "public"."company_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_quarter_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluation_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluation_cycles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invitations_invitee_read" ON "public"."invitations" FOR SELECT USING ((("lower"("email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) AND ("accepted_at" IS NULL) AND ("revoked_at" IS NULL) AND ("expires_at" > "now"())));



CREATE POLICY "invitations_service_role" ON "public"."invitations" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "invitations_super_admin_delete" ON "public"."invitations" FOR DELETE USING ("public"."is_super_admin_for_company"("company_id"));



COMMENT ON POLICY "invitations_super_admin_delete" ON "public"."invitations" IS 'Only super_admin users can delete invitations for their company';



CREATE POLICY "invitations_super_admin_insert" ON "public"."invitations" FOR INSERT WITH CHECK (("public"."is_super_admin_for_company"("company_id") AND ("company_id" = "public"."get_current_user_company_id"()) AND ("invited_by" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text")) AND ("people"."active" = true))))));



COMMENT ON POLICY "invitations_super_admin_insert" ON "public"."invitations" IS 'Only super_admin users can create invitations for their company';



CREATE POLICY "invitations_super_admin_select" ON "public"."invitations" FOR SELECT USING ("public"."is_super_admin_for_company"("company_id"));



COMMENT ON POLICY "invitations_super_admin_select" ON "public"."invitations" IS 'Only super_admin users can view invitations for their company';



CREATE POLICY "invitations_super_admin_update" ON "public"."invitations" FOR UPDATE USING ("public"."is_super_admin_for_company"("company_id")) WITH CHECK ("public"."is_super_admin_for_company"("company_id"));



COMMENT ON POLICY "invitations_super_admin_update" ON "public"."invitations" IS 'Only super_admin users can update invitations for their company';



ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "legacy_company_temp_access" ON "public"."companies" USING ((("id" = '00000000-0000-0000-0000-000000000001'::"uuid") AND ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "memberships_company_access" ON "public"."company_memberships" USING ((EXISTS ( SELECT 1
   FROM "public"."company_memberships" "m"
  WHERE (("m"."company_id" = "company_memberships"."company_id") AND ("m"."profile_id" = "auth"."uid"())))));



CREATE POLICY "notes_jwt_role_access" ON "public"."employee_quarter_notes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = "auth"."email"()) AND ("people"."jwt_role" = ANY (ARRAY['super_admin'::"text", 'hr_admin'::"text"]))))));



ALTER TABLE "public"."people" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "people_service_role_access" ON "public"."people" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_self_and_company_access" ON "public"."profiles" USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."company_memberships" "m1"
     JOIN "public"."company_memberships" "m2" ON (("m1"."company_id" = "m2"."company_id")))
  WHERE (("m1"."profile_id" = "auth"."uid"()) AND ("m2"."profile_id" = "profiles"."id"))))));



CREATE POLICY "public_can_view_by_token" ON "public"."invites" FOR SELECT USING ((("claimed_at" IS NULL) AND ("revoked_at" IS NULL) AND ("expires_at" > "now"())));



ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."analyze_persona_distribution"("input_quarter_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."analyze_persona_distribution"("input_quarter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."analyze_persona_distribution"("input_quarter_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_all_core_group_scores"("input_quarter_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_all_core_group_scores"("input_quarter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_all_core_group_scores"("input_quarter_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_core_group_scores"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_core_group_scores"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_core_group_scores"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_core_group_scores_with_consensus"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_core_group_scores_with_consensus"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_core_group_scores_with_consensus"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_overall_weighted_score"("evaluatee_id_param" "uuid", "quarter_id_param" "uuid", "env" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_overall_weighted_score"("evaluatee_id_param" "uuid", "quarter_id_param" "uuid", "env" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_overall_weighted_score"("evaluatee_id_param" "uuid", "quarter_id_param" "uuid", "env" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_weighted_attribute_score"("attr_name" character varying, "manager_score" numeric, "peer_score" numeric, "self_score" numeric, "env" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_weighted_attribute_score"("attr_name" character varying, "manager_score" numeric, "peer_score" numeric, "self_score" numeric, "env" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_weighted_attribute_score"("attr_name" character varying, "manager_score" numeric, "peer_score" numeric, "self_score" numeric, "env" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_evaluation_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_evaluation_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_evaluation_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_evaluation_completion_manual"("p_evaluatee_id" "uuid", "p_quarter_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_evaluation_completion_manual"("p_evaluatee_id" "uuid", "p_quarter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_evaluation_completion_manual"("p_evaluatee_id" "uuid", "p_quarter_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."classify_all_personas_in_quarter"("input_quarter_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."classify_all_personas_in_quarter"("input_quarter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."classify_all_personas_in_quarter"("input_quarter_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."classify_employee_persona"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."classify_employee_persona"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."classify_employee_persona"("input_evaluatee_id" "uuid", "input_quarter_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_invites"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_invites"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_invites"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_assignment_safe"("p_evaluator_id" "uuid", "p_evaluatee_id" "uuid", "p_quarter_id" "uuid", "p_evaluation_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_assignment_safe"("p_evaluator_id" "uuid", "p_evaluatee_id" "uuid", "p_quarter_id" "uuid", "p_evaluation_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_assignment_safe"("p_evaluator_id" "uuid", "p_evaluatee_id" "uuid", "p_quarter_id" "uuid", "p_evaluation_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_assignment_status_auth"("assignment_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."debug_assignment_status_auth"("assignment_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_assignment_status_auth"("assignment_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invite_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invite_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invite_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_attribute_weight"("attr_name" character varying, "env" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_attribute_weight"("attr_name" character varying, "env" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_attribute_weight"("attr_name" character varying, "env" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_role"("target_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_role"("target_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_role"("target_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_core_group_for_attribute"("attribute_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_core_group_for_attribute"("attribute_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_core_group_for_attribute"("attribute_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_people_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_people_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_people_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_letter_grade"("score" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."get_letter_grade"("score" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_letter_grade"("score" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_people_id_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_people_id_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_people_id_from_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_company_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_company_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_company_from_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_auth_user_jwt_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_auth_user_jwt_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_auth_user_jwt_claims"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_company_admin"("target_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_company_admin"("target_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_company_admin"("target_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_company_member"("target_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_company_member"("target_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_company_member"("target_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_email_already_invited"("target_company_id" "uuid", "target_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_email_already_invited"("target_company_id" "uuid", "target_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_email_already_invited"("target_company_id" "uuid", "target_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_people_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_people_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_people_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"("c_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"("c_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"("c_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin_for_company"("target_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin_for_company"("target_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin_for_company"("target_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin_jwt_only"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin_jwt_only"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin_jwt_only"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_completion_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_completion_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_completion_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_invite_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_invite_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_invite_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_jwt_claims"("user_email" "text", "user_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_jwt_claims"("user_email" "text", "user_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_jwt_claims"("user_email" "text", "user_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."switch_company"("target_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."switch_company"("target_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."switch_company"("target_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."test_assignment_rls_debug"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_assignment_rls_debug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_assignment_rls_debug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_attribute_scores_rls_debug"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_attribute_scores_rls_debug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_attribute_scores_rls_debug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_submissions_rls_debug"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_submissions_rls_debug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_submissions_rls_debug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_attribute_ai_analysis"("p_evaluatee_id" "uuid", "p_quarter_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_attribute_ai_analysis"("p_evaluatee_id" "uuid", "p_quarter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_attribute_ai_analysis"("p_evaluatee_id" "uuid", "p_quarter_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_employee_quarter_notes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_employee_quarter_notes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_employee_quarter_notes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."attribute_scores" TO "anon";
GRANT ALL ON TABLE "public"."attribute_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."attribute_scores" TO "service_role";



GRANT ALL ON TABLE "public"."evaluation_cycles" TO "anon";
GRANT ALL ON TABLE "public"."evaluation_cycles" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_cycles" TO "service_role";



GRANT ALL ON TABLE "public"."people" TO "anon";
GRANT ALL ON TABLE "public"."people" TO "authenticated";
GRANT ALL ON TABLE "public"."people" TO "service_role";



GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";



GRANT ALL ON TABLE "public"."weighted_evaluation_scores" TO "anon";
GRANT ALL ON TABLE "public"."weighted_evaluation_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."weighted_evaluation_scores" TO "service_role";



GRANT ALL ON TABLE "public"."quarter_final_scores" TO "anon";
GRANT ALL ON TABLE "public"."quarter_final_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."quarter_final_scores" TO "service_role";



GRANT ALL ON TABLE "public"."a_player_summary" TO "anon";
GRANT ALL ON TABLE "public"."a_player_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."a_player_summary" TO "service_role";



GRANT ALL ON TABLE "public"."analysis_jobs" TO "anon";
GRANT ALL ON TABLE "public"."analysis_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."analysis_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."app_config" TO "anon";
GRANT ALL ON TABLE "public"."app_config" TO "authenticated";
GRANT ALL ON TABLE "public"."app_config" TO "service_role";



GRANT ALL ON SEQUENCE "public"."app_config_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."app_config_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."app_config_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_submissions" TO "anon";
GRANT ALL ON TABLE "public"."assignment_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."evaluation_assignments" TO "anon";
GRANT ALL ON TABLE "public"."evaluation_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_details" TO "anon";
GRANT ALL ON TABLE "public"."assignment_details" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_details" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_statistics" TO "anon";
GRANT ALL ON TABLE "public"."assignment_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."attribute_responses" TO "anon";
GRANT ALL ON TABLE "public"."attribute_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."attribute_responses" TO "service_role";



GRANT ALL ON TABLE "public"."submission_summary" TO "anon";
GRANT ALL ON TABLE "public"."submission_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."submission_summary" TO "service_role";



GRANT ALL ON TABLE "public"."attribute_score_summary" TO "anon";
GRANT ALL ON TABLE "public"."attribute_score_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."attribute_score_summary" TO "service_role";



GRANT ALL ON TABLE "public"."attribute_weights" TO "anon";
GRANT ALL ON TABLE "public"."attribute_weights" TO "authenticated";
GRANT ALL ON TABLE "public"."attribute_weights" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_memberships" TO "anon";
GRANT ALL ON TABLE "public"."company_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."company_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."core_group_scores" TO "anon";
GRANT ALL ON TABLE "public"."core_group_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."core_group_scores" TO "service_role";



GRANT ALL ON TABLE "public"."core_group_scores_with_consensus" TO "anon";
GRANT ALL ON TABLE "public"."core_group_scores_with_consensus" TO "authenticated";
GRANT ALL ON TABLE "public"."core_group_scores_with_consensus" TO "service_role";



GRANT ALL ON TABLE "public"."core_group_summary" TO "anon";
GRANT ALL ON TABLE "public"."core_group_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."core_group_summary" TO "service_role";



GRANT ALL ON TABLE "public"."employee_quarter_notes" TO "anon";
GRANT ALL ON TABLE "public"."employee_quarter_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_quarter_notes" TO "service_role";



GRANT ALL ON TABLE "public"."evaluation_completion_status" TO "anon";
GRANT ALL ON TABLE "public"."evaluation_completion_status" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_completion_status" TO "service_role";



GRANT ALL ON TABLE "public"."grade_distribution" TO "anon";
GRANT ALL ON TABLE "public"."grade_distribution" TO "authenticated";
GRANT ALL ON TABLE "public"."grade_distribution" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."invites" TO "anon";
GRANT ALL ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."quarter_core_group_trends" TO "anon";
GRANT ALL ON TABLE "public"."quarter_core_group_trends" TO "authenticated";
GRANT ALL ON TABLE "public"."quarter_core_group_trends" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
