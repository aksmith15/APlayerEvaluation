# Row Level Security (RLS) Policies

**Generated:** August 15, 2025  
**Database:** PostgreSQL 15.8 (Supabase)  
**RLS Status:** Comprehensive multi-tenant isolation implemented

## Overview

This A-Player Evaluation System implements **comprehensive Row Level Security** to enforce multi-tenant data isolation. All tenant-scoped tables have RLS enabled with policies that restrict access based on company membership and user roles.

## RLS Architecture

### Multi-Tenancy Pattern
All tenant tables follow this foundational RLS pattern:

```sql
-- Standard tenant isolation policy template
CREATE POLICY "tenant_isolation_policy" ON {table_name}
FOR ALL USING (
  company_id IN (
    SELECT cm.company_id 
    FROM company_memberships cm
    JOIN profiles p ON cm.profile_id = p.id
    WHERE p.id = auth.uid() AND cm.is_active = true
  )
);
```

### Role-Based Access Control
Additional policies layer role-based access on top of tenant isolation:

```sql
-- Admin access pattern
CREATE POLICY "admin_access_policy" ON {table_name}
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships cm
    JOIN profiles p ON cm.profile_id = p.id
    WHERE p.id = auth.uid() 
      AND cm.company_id = {table_name}.company_id
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = true
  )
);
```

## Tables with RLS Enabled

### 🏢 Multi-Tenancy Core Tables

#### `companies`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `companies_member_access` - Users can view companies they belong to
  - `companies_admin_management` - Owners/admins can manage company details

#### `profiles` 
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `profiles_self_access` - Users can manage their own profile
  - `profiles_company_visibility` - Company members can view colleague profiles

#### `company_memberships`
- **RLS Enabled:** ✅ Yes  
- **Policies:**
  - `memberships_company_scoped` - Users see memberships in their companies
  - `memberships_admin_management` - Admins can manage company memberships

#### `invites`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `invites_company_scoped` - Invites scoped to user's companies
  - `invites_admin_creation` - Admins can create/manage invites

### 👥 People & Evaluation Tables

#### `people`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `people_company_access` - Standard company scoping
  - `people_self_access` - Users can view their own people record
  - `people_admin_management` - HR admins can manage all company people

#### `evaluation_cycles`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `cycles_company_scoped` - Evaluation cycles scoped to company
  - `cycles_admin_management` - Admins can create/manage cycles

#### `evaluation_assignments`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `assignments_company_scoped` - Standard company scoping
  - `assignments_participant_access` - Evaluators/evaluatees can view their assignments
  - `assignments_admin_management` - Admins can create/manage assignments

### 📊 Survey Data Tables

#### `submissions`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `submissions_company_scoped` - Standard company scoping
  - `submissions_participant_access` - Evaluators can view their submissions
  - `submissions_evaluatee_visibility` - Evaluatees can view submissions about them
  - `submissions_admin_access` - Admins have full access

#### `attribute_responses`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `responses_company_scoped` - Standard company scoping
  - `responses_submission_linked` - Access via submission relationship
  - `responses_admin_access` - Admin oversight

#### `attribute_scores`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `scores_company_scoped` - Standard company scoping
  - `scores_submission_linked` - Access via submission relationship

### 📈 Analytics Tables

#### `weighted_evaluation_scores`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `weighted_scores_company_scoped` - Standard company scoping
  - `weighted_scores_self_access` - Users can view their own scores
  - `weighted_scores_admin_access` - Admins have full visibility

#### `core_group_calculations`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `core_group_company_scoped` - Company-scoped calculations
  - `core_group_read_access` - All company members can view

#### `persona_classifications`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `personas_company_scoped` - Standard company scoping
  - `personas_self_access` - Users can view their own classification
  - `personas_admin_access` - Admins can view all classifications

### ⚙️ System Tables

#### `analysis_jobs`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `analysis_jobs_self_access` - Users can view jobs for themselves
  - `analysis_jobs_admin_oversight` - Admins can view all company jobs
  - `analysis_jobs_service_role` - Service role for webhook operations
  - `analysis_jobs_user_creation` - Users can create jobs for themselves
  - `analysis_jobs_admin_management` - Admins can manage all jobs

#### `attribute_weights`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `weights_company_scoped` - Company-specific weight configurations
  - `weights_admin_management` - Admins can configure weights

#### `app_config`
- **RLS Enabled:** ✅ Yes
- **Policies:**
  - `config_company_scoped` - Company-specific configuration
  - `config_admin_management` - Admin-only configuration management

## Special Access Patterns

### Service Role Access
Webhook operations and AI processing require bypass capabilities:

```sql
-- Service role bypass pattern
CREATE POLICY "service_role_access" ON {table_name}
FOR ALL TO service_role
USING (true);
```

### Self-Access Pattern
Users accessing their own data:

```sql
-- Self-access pattern for people table
CREATE POLICY "people_self_access" ON people
FOR SELECT USING (
  id IN (
    SELECT p.id FROM people p
    JOIN profiles pr ON pr.email = p.email
    WHERE pr.id = auth.uid()
  )
);
```

### Cross-Table Access Validation
Some policies validate access via related tables:

```sql
-- Submission access via assignment relationship
CREATE POLICY "submissions_assignment_linked" ON submissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM evaluation_assignments ea
    WHERE ea.evaluator_id = submissions.evaluator_id
      AND ea.evaluatee_id = submissions.evaluatee_id
      AND ea.quarter_id = submissions.quarter_id
      AND ea.evaluation_type = submissions.evaluation_type
      -- Plus standard company membership check
  )
);
```

## Security Features

### Tenant Isolation
- **Complete Separation:** No cross-company data leakage possible
- **Company Membership Enforcement:** All access requires active membership
- **Role-Based Layering:** Additional restrictions based on user roles

### Access Control Hierarchy
1. **Service Role:** Full access for system operations
2. **Company Owners:** Full access within their company
3. **Company Admins:** Management access within their company  
4. **Company Members:** Standard access within their company
5. **Viewers:** Read-only access within their company

### Data Protection
- **No Anonymous Access:** All policies require authentication
- **Active Membership Required:** Deactivated users lose access immediately
- **Granular Permissions:** Different access levels per table and operation

## Testing RLS Policies

### Validation Queries
Test tenant isolation:

```sql
-- Test 1: Verify no cross-company access
SET ROLE authenticated;
SELECT jwt_claim_role('auth.uid', '00000000-0000-0000-0000-000000000001');
-- Should only see data for user's companies

-- Test 2: Verify admin access
-- Admin should see all company data, member should see limited data

-- Test 3: Verify self-access
-- Users should always see their own data regardless of role
```

### Common RLS Debugging
```sql
-- Enable RLS debugging
SET row_security = on;
SET log_statement = 'all';

-- Test specific policy
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM people WHERE company_id = 'test-company-id';
```

## Implementation Notes

### Performance Considerations
- All RLS policies use indexed columns (`company_id`, `auth.uid()`)
- Complex policies may impact query performance
- Regular ANALYZE recommended for optimal query plans

### Development vs Production
- **Development:** RLS can be temporarily disabled for testing
- **Production:** RLS must ALWAYS be enabled
- **Staging:** Should mirror production RLS exactly

### Migration Strategy
- New tables MUST have RLS enabled from creation
- Existing tables backfilled before enabling RLS
- Test policies thoroughly before deployment

---

🔗 **Related Documentation:**
- [Supabase_Database_Structure.md](../Supabase_Database_Structure.md) - Complete schema details
- [grants.md](./grants.md) - Database privileges and roles
- [overview.md](./overview.md) - Database structure overview