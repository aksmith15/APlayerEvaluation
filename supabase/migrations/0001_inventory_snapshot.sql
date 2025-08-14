-- Migration 0001: Database Inventory Snapshot
-- Purpose: Document current state before multi-tenancy implementation
-- Date: February 1, 2025
-- Risk Level: READ-ONLY - No schema changes

-- =============================================
-- CURRENT DATABASE STATE DOCUMENTATION
-- =============================================

-- This migration serves as a comprehensive snapshot of the database
-- state before implementing multi-tenancy and security enhancements.
-- All queries in this migration are READ-ONLY for documentation purposes.

-- Database: A-Player Evaluations System
-- Total Tables: 13
-- Total Data Rows: 61 (weighted_evaluation_scores: 51, attribute_weights: 10)
-- Current Tenant State: Single tenant (all data belongs to one organization)

-- =============================================
-- TABLE INVENTORY SUMMARY
-- =============================================

-- TENANT-SCOPED TABLES (Will receive company_id):
-- - people (0 rows) - Core employee records
-- - evaluation_cycles (0 rows) - Quarterly evaluation periods  
-- - weighted_evaluation_scores (51 rows) - Performance scores and grades
-- - attribute_weights (10 rows) - Attribute weighting configuration
-- - evaluation_assignments (0 rows) - Survey assignment tracking
-- - employee_quarter_notes (0 rows) - Quarterly notes and feedback
-- - analysis_jobs (0 rows) - AI analysis job tracking
-- - core_group_calculations (0 rows) - Core group analytics
-- - core_group_breakdown (0 rows) - Detailed core group data
-- - quarterly_trends (0 rows) - Historical trend analysis
-- - attribute_responses (0 rows) - Individual survey responses
-- - persona_classifications (0 rows) - Employee persona analysis

-- GLOBAL REFERENCE TABLES (No company_id needed):
-- - app_config (0 rows) - System-wide configuration

-- =============================================
-- CURRENT SCHEMA STRUCTURE
-- =============================================

-- Key relationships identified:
-- people.id -> weighted_evaluation_scores.evaluatee_id (Many evaluations per person)
-- evaluation_cycles.id -> weighted_evaluation_scores.quarter_id (Many scores per quarter)
-- people.id -> evaluation_assignments.evaluator_id (Many assignments as evaluator)
-- people.id -> evaluation_assignments.evaluatee_id (Many assignments as evaluatee)
-- evaluation_cycles.id -> evaluation_assignments.quarter_id (Many assignments per quarter)

-- =============================================
-- SAMPLE DATA STRUCTURE (weighted_evaluation_scores)
-- =============================================

-- Column structure of primary data table:
-- evaluatee_id: UUID (FK to people)
-- evaluatee_name: TEXT
-- quarter_id: UUID (FK to evaluation_cycles)  
-- quarter_name: TEXT (e.g., "Q2 2025")
-- quarter_start_date: DATE
-- quarter_end_date: DATE
-- attribute_name: TEXT (e.g., "accountability")
-- manager_score: NUMERIC (e.g., 6.5)
-- peer_score: NUMERIC (e.g., 7.5)
-- self_score: NUMERIC (e.g., 6.0)
-- weighted_final_score: NUMERIC (e.g., 6.8)
-- weighted_final_grade: TEXT (e.g., "C")
-- manager_grade: TEXT (e.g., "C")
-- peer_grade: TEXT (e.g., "B")
-- self_grade: TEXT (e.g., "C")
-- has_manager_eval: BOOLEAN
-- has_peer_eval: BOOLEAN
-- has_self_eval: BOOLEAN
-- completion_percentage: NUMERIC

-- =============================================
-- SAMPLE DATA STRUCTURE (attribute_weights)
-- =============================================

-- Column structure of configuration table:
-- id: UUID (PK)
-- attribute_name: TEXT (e.g., "Continuous Improvement")
-- weight: NUMERIC (e.g., 1.1)
-- description: TEXT (e.g., "Important for long-term success")
-- environment: TEXT (e.g., "production")
-- created_by: UUID (nullable)
-- created_at: TIMESTAMPTZ
-- updated_at: TIMESTAMPTZ

-- =============================================
-- CURRENT AUTHENTICATION INTEGRATION
-- =============================================

-- Current auth system:
-- - Uses Supabase auth.users table
-- - JWT-based authentication with roles
-- - Basic RLS may exist on some tables
-- - Integration with people table via email matching

-- =============================================
-- MIGRATION READINESS ASSESSMENT
-- =============================================

-- Data Volume Assessment: LOW RISK
-- - Largest table: 51 rows (weighted_evaluation_scores)
-- - Second largest: 10 rows (attribute_weights)
-- - All other tables: 0 rows
-- - Total migration impact: <100 rows across all tables

-- Schema Complexity Assessment: LOW RISK
-- - Clean, consistent naming conventions
-- - Well-defined foreign key relationships
-- - Minimal custom functions or triggers to migrate
-- - Standard UUID primary keys throughout

-- Business Impact Assessment: LOW RISK
-- - Single tenant current state simplifies migration
-- - Small dataset allows for quick rollback if needed
-- - Production system but manageable downtime window
-- - Clear data ownership (all belongs to "Legacy Company")

-- =============================================
-- NEXT MIGRATION PLAN
-- =============================================

-- Migration 0002: Company Infrastructure
-- - Create companies table
-- - Create profiles table (enhanced auth.users)
-- - Create company_memberships table with roles
-- - Create core functions (current_company_id, enforce_company_id)
-- - Create company_role enum type

-- Migration 0003: Tenant Key Propagation  
-- - Add company_id to all tenant-scoped tables
-- - Backfill with Legacy Company ID
-- - Add indexes for performance
-- - Set NOT NULL constraints

-- Migration 0004: Row Level Security
-- - Enable RLS on all tenant tables
-- - Create company-scoped access policies
-- - Test positive and negative access scenarios
-- - Add switch_company RPC function

-- Migration 0005: Security Hardening
-- - Add missing foreign key constraints
-- - Implement updated_at triggers
-- - Add unique constraints where needed
-- - Optimize indexes for performance

-- Migration 0006: Final Validation
-- - Comprehensive data integrity checks
-- - Performance validation
-- - Security audit
-- - Production readiness verification

-- =============================================
-- ASSUMPTIONS AND RISK MITIGATION
-- =============================================

-- Key Assumptions:
-- 1. All current data belongs to one "Legacy Company"
-- 2. Current users will be assigned to Legacy Company initially
-- 3. Application can handle transparent company_id auto-population
-- 4. RLS policies will not break existing application queries
-- 5. Performance impact will be minimal due to proper indexing

-- Risk Mitigation Strategies:
-- 1. Full database backup before each migration step
-- 2. Staged rollout with ability to rollback at each step
-- 3. Comprehensive testing in staging environment
-- 4. Blue-green deployment strategy for production
-- 5. Monitoring and alerting for performance regressions

-- =============================================
-- ROLLBACK PLAN FOR THIS MIGRATION
-- =============================================

-- This migration is READ-ONLY documentation and requires no rollback.
-- However, subsequent migrations can reference this baseline state
-- if full rollback to pre-multi-tenancy state is required.

-- Full system rollback would involve:
-- 1. Restore from backup taken before Migration 0002
-- 2. OR sequentially reverse migrations 0006 → 0002
-- 3. Verify application functionality restored
-- 4. Update monitoring and alerting systems

-- =============================================
-- VALIDATION QUERIES
-- =============================================

-- These queries can be run to verify current state matches documentation:

-- Count all tables and rows
/*
SELECT 
  'Total Tables' as metric,
  COUNT(*) as value
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
  'Tables with Data' as metric,
  COUNT(*) as value
FROM (
  SELECT schemaname, tablename
  FROM pg_stat_user_tables
  WHERE n_live_tup > 0
) t

UNION ALL

SELECT 
  'Total Rows Across All Tables' as metric,
  COALESCE(SUM(n_live_tup), 0) as value
FROM pg_stat_user_tables;
*/

-- Verify key tables exist
/*
SELECT 
  table_name,
  COALESCE(
    (SELECT n_live_tup 
     FROM pg_stat_user_tables 
     WHERE relname = table_name), 0
  ) as row_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
*/

-- =============================================
-- END OF MIGRATION 0001
-- =============================================

-- This completes the inventory snapshot migration.
-- The database is now documented and ready for multi-tenancy implementation.
-- Next migration: 0002_companies_profiles_memberships.sql
