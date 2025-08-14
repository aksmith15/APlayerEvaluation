# Project Cleanup Plan

**Date**: February 1, 2025  
**Purpose**: Remove unused files and reduce project clutter before implementing tenancy fixes

## 🎯 Cleanup Categories

### 1. Old SQL Migration Files (Safe to Remove)
These appear to be one-off migration files that have likely been applied:

**Root Directory SQL Files:**
- `check_people_rls.sql` - Debug file
- `comprehensive_invite_system_fix.sql` - Applied migration
- `create_new_invite_system.sql` - Applied migration  
- `diagnose_company_access.sql` - Debug file
- `eliminate_profiles_migration.sql` - Migration (not applied per profiles_table_decision.md)
- `enhance_invitation_admin_security.sql` - Applied migration
- `FINAL_DATABASE_FIX.sql` - Applied migration
- `fix_companies_rls_*.sql` (multiple) - Applied RLS fixes
- `fix_invite_*.sql` (multiple) - Applied invite fixes
- `fix_missing_people_record.sql` - Applied fix
- `fix_people_rls_policies.sql` - Applied fix
- `manual_migration_script.sql` - Applied migration
- `manual_sql_fix.sql` - Applied fix

**Dashboard SQL Files:**
- `add-letter-grades-to-views.sql` - Applied feature
- `create-analytics-views.sql` - Applied feature
- `create-attribute-weights-system.sql` - Applied feature
- `create-core-group-*.sql` (multiple) - Applied features
- `create-persona-classification-system.sql` - Applied feature
- `debug-*.sql` (multiple) - Debug files
- `employee-quarter-notes-schema.sql` - Applied schema
- `fix-*.sql` (multiple) - Applied fixes
- `implement-letter-grading-system.sql` - Applied feature
- `recreate-core-group-views.sql` - Applied migration
- `verify-user-authorization.sql` - Debug file

### 2. Session Handoff & Summary Files (Safe to Remove)
These are development session summaries:

- `ai-insights-session-handoff.md`
- `async-analysis-implementation-summary.md`
- `current-progress-summary.md`
- `persistence-implementation-summary.md`
- `session-handoff-summary.md`
- `testing-session-summary.md`

### 3. Test/Debug Files (Safe to Remove)
- `frontend_auth_debug.js`
- `manual_resend_test.js`
- `test_basic_function.js`
- `test_companies_access.js`
- `test_db_debug.js`
- `test_resend_api.js`

### 4. Documentation Files (Consider Removing)
- `check_resend_domain.md` - Email setup notes
- `check_supabase_secrets.md` - Setup notes
- `deploy_email_function.md` - Email setup
- `production_email_setup_plan.md` - Email setup
- `simplified-n8n-workflow.md` - Workflow notes

### 5. Migration/Script Directories (Consolidate)
- `migrations/proposals/` - Contains only `000_NO_MIGRATIONS_NEEDED.sql`
- `scripts/` (root) - Contains old migration scripts
- `src/` (root) - Contains only disabled test file

## 🧹 Cleanup Actions

### Phase 1: Remove SQL Migration Files
