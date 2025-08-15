# Database Cleanup & Normalization Plan

**Generated:** February 1, 2025  
**Database:** A-Player Evaluations System  
**Purpose:** Strategic plan for multi-tenancy implementation and security enhancement

## Executive Summary

This document outlines a comprehensive plan to transform the A-Player Evaluations database from single-tenant to secure multi-tenant architecture with minimal application changes. The transformation will be implemented in carefully staged migrations with full rollback capabilities.

## Current State Analysis

### Database Overview
- **Total Tables:** 13
- **Current Data Volume:** 61 rows across 2 active tables
- **Primary Tables with Data:**
  - `weighted_evaluation_scores` (51 rows)
  - `attribute_weights` (10 rows)
- **Risk Level:** LOW - All tables under 1000 rows
- **Current Auth Integration:** Basic Supabase auth with JWT roles

### Key Findings
1. **Single Tenant Current State** - All data belongs to one logical tenant
2. **Clean Schema** - Well-designed table structure with consistent naming
3. **Low Data Volume** - Migration risk is minimal due to small dataset
4. **Active System** - Production system with ongoing usage
5. **Existing RLS Infrastructure** - Some tables may have basic RLS already

## 1. Naming Conventions & Standards

### Table Naming Convention
- **Current:** ✅ Already follows `snake_case` convention
- **Standard:** `snake_case` (no changes needed)
- **Examples:** `people`, `evaluation_cycles`, `weighted_evaluation_scores`

### Column Naming Convention  
- **Current:** ✅ Consistent `snake_case` usage
- **Standard:** `snake_case` with descriptive names
- **Foreign Key Pattern:** `{entity}_id` (e.g., `evaluatee_id`, `quarter_id`)
- **Timestamp Pattern:** `created_at`, `updated_at`

### Key Standards
- **Primary Keys:** `id` UUID with `gen_random_uuid()` default
- **Tenant Keys:** `company_id` UUID NOT NULL with FK to `companies(id)`
- **Timestamps:** `created_at`, `updated_at` with automatic triggers
- **Soft Deletes:** `deleted_at` timestamp (implement if needed)

## 2. Multi-Tenancy Architecture Strategy

### 2.1 Tenant Scoping Classification

#### **Tenant-Scoped Tables** (Require `company_id`)
All tables representing business data that should be isolated by company:

| Table Name | Rows | Tenant Key Strategy | Migration Priority |
|------------|------|--------------------|--------------------|
| `people` | 0 | Add `company_id` | HIGH - Core entity |
| `evaluation_cycles` | 0 | Add `company_id` | HIGH - Core entity |
| `weighted_evaluation_scores` | 51 | Add `company_id` | HIGH - Has data |
| `attribute_weights` | 10 | Add `company_id` | HIGH - Has data |
| `evaluation_assignments` | 0 | Add `company_id` | MEDIUM - Survey system |
| `employee_quarter_notes` | 0 | Add `company_id` | MEDIUM - Notes system |
| `analysis_jobs` | 0 | Add `company_id` | MEDIUM - AI analysis |
| `core_group_calculations` | 0 | Add `company_id` | MEDIUM - Analytics |
| `core_group_breakdown` | 0 | Add `company_id` | MEDIUM - Analytics |
| `quarterly_trends` | 0 | Add `company_id` | MEDIUM - Analytics |
| `attribute_responses` | 0 | Add `company_id` | MEDIUM - Survey data |
| `persona_classifications` | 0 | Add `company_id` | LOW - Future feature |

#### **Global Reference Tables** (No `company_id`)
Tables containing system-wide configuration or reference data:

| Table Name | Justification | Access Pattern |
|------------|---------------|----------------|
| `app_config` | System configuration shared across all companies | Global read access |

### 2.2 Multi-Tenancy Implementation Strategy

#### **Approach: Database-Level Enforcement with RLS**
- **Tenant Key:** `company_id` UUID column in all tenant tables
- **Auto-Population:** Database triggers automatically set `company_id`
- **Immutability:** Triggers prevent `company_id` changes after insert
- **Access Control:** Row Level Security (RLS) policies enforce visibility
- **App Changes:** Minimal - database handles tenant scoping transparently

## 3. Company & Membership Architecture

### 3.1 Core Multi-Tenancy Tables

#### **companies** Table
```sql
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT GENERATED ALWAYS AS (
    regexp_replace(lower(name), '\W+', '-', 'g')
  ) STORED UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### **profiles** Table (Enhanced auth.users)
```sql  
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  default_company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### **company_memberships** Table
```sql
CREATE TABLE public.company_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, profile_id)
);

CREATE TYPE public.company_role AS ENUM ('owner','admin','member','viewer');
```

### 3.2 Company Context Functions

#### **current_company_id()** Function
```sql
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID LANGUAGE SQL STABLE AS $$
  SELECT p.default_company_id 
  FROM public.profiles p 
  WHERE p.id = auth.uid()
$$;
```

#### **enforce_company_id()** Trigger Function
```sql
CREATE OR REPLACE FUNCTION public.enforce_company_id()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.company_id IS NULL THEN
      NEW.company_id := public.current_company_id();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
      RAISE EXCEPTION 'company_id is immutable';
    END IF;
  END IF;
  RETURN NEW;
END $$;
```

## 4. Row Level Security (RLS) Strategy

### 4.1 RLS Policy Template
For each tenant-scoped table, implement these policies:

```sql
-- Enable RLS
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view data from their company
CREATE POLICY "{table_name}_select_same_company"
ON public.{table_name} FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_memberships m
    WHERE m.company_id = {table_name}.company_id
      AND m.profile_id = auth.uid()
  )
);

-- INSERT: Users can only insert data for their current company  
CREATE POLICY "{table_name}_insert_same_company"
ON public.{table_name} FOR INSERT
WITH CHECK (public.current_company_id() = company_id);

-- UPDATE: Users can only update data in their company
CREATE POLICY "{table_name}_update_same_company"
ON public.{table_name} FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.company_memberships m
    WHERE m.company_id = {table_name}.company_id
      AND m.profile_id = auth.uid()
      AND m.role IN ('owner','admin','member')
  )
)
WITH CHECK (public.current_company_id() = company_id);

-- DELETE: Only owners/admins can delete data
CREATE POLICY "{table_name}_delete_admins_only"
ON public.{table_name} FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.company_memberships m
    WHERE m.company_id = {table_name}.company_id
      AND m.profile_id = auth.uid()
      AND m.role IN ('owner','admin')
  )
);
```

### 4.2 Company Switching RPC

```sql
CREATE OR REPLACE FUNCTION public.switch_company(target_company UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE company_id = target_company AND profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of that company';
  END IF;

  UPDATE public.profiles
  SET default_company_id = target_company
  WHERE id = auth.uid();
END $$;

REVOKE ALL ON FUNCTION public.switch_company(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.switch_company(UUID) TO authenticated;
```

## 5. Index Strategy

### 5.1 Required Indexes for Multi-Tenancy

#### **Core Company Indexes**
```sql
-- Company membership lookups (critical for RLS performance)
CREATE INDEX idx_company_memberships_profile ON public.company_memberships(profile_id);
CREATE INDEX idx_company_memberships_company ON public.company_memberships(company_id);

-- Profile default company lookups
CREATE INDEX idx_profiles_default_company ON public.profiles(default_company_id);
```

#### **Tenant Data Indexes**
For each tenant-scoped table, add:
```sql
-- Core tenant filtering index (critical for RLS performance)
CREATE INDEX idx_{table_name}_company_id ON public.{table_name}(company_id);

-- Composite indexes for common queries
CREATE INDEX idx_{table_name}_company_created ON public.{table_name}(company_id, created_at);
```

#### **Existing Foreign Key Indexes**
Ensure all foreign keys have supporting indexes:
```sql
-- Example: weighted_evaluation_scores
CREATE INDEX IF NOT EXISTS idx_wes_evaluatee ON weighted_evaluation_scores(evaluatee_id);
CREATE INDEX IF NOT EXISTS idx_wes_quarter ON weighted_evaluation_scores(quarter_id);

-- Example: evaluation_assignments  
CREATE INDEX IF NOT EXISTS idx_ea_evaluator ON evaluation_assignments(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_ea_evaluatee ON evaluation_assignments(evaluatee_id);
CREATE INDEX IF NOT EXISTS idx_ea_quarter ON evaluation_assignments(quarter_id);
```

## 6. Data Migration Strategy

### 6.1 Legacy Company Creation

**Assumption:** All current data belongs to one "Legacy Company"

```sql
-- Create the legacy company for existing data
INSERT INTO public.companies (id, name) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Legacy Company'
);

-- Set legacy company as default for existing profiles
UPDATE public.profiles 
SET default_company_id = '00000000-0000-0000-0000-000000000001'
WHERE default_company_id IS NULL;
```

### 6.2 Data Backfill Strategy

#### **Phase 1: Add Nullable company_id**
```sql
-- Add company_id column as nullable first
ALTER TABLE public.{table_name} 
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
```

#### **Phase 2: Backfill with Legacy Company**
```sql
-- Backfill all existing rows with legacy company
UPDATE public.{table_name} 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;
```

#### **Phase 3: Make NOT NULL and Add Constraints**
```sql
-- Make company_id required
ALTER TABLE public.{table_name} 
ALTER COLUMN company_id SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_{table_name}_company_id ON public.{table_name}(company_id);

-- Add trigger for auto-population
CREATE TRIGGER enforce_company_id_trigger
  BEFORE INSERT OR UPDATE ON public.{table_name}
  FOR EACH ROW EXECUTE FUNCTION public.enforce_company_id();
```

## 7. Application Integration Impact

### 7.1 Minimal Frontend Changes Required

#### **No Query Changes Needed**
Current application queries will continue to work:
```typescript
// This query will automatically be scoped to user's company
const { data } = await supabase
  .from('people')
  .select('*');
```

#### **Company Switching (New Feature)**
```typescript
// New RPC for switching between companies
const { error } = await supabase
  .rpc('switch_company', { target_company: 'company-uuid' });
```

#### **Profile Enhancement Required**
```typescript
// Enhanced profile with company information
interface Profile {
  id: string;
  email: string;
  full_name: string;
  default_company_id: string;
  companies: CompanyMembership[]; // New: list of company memberships
}
```

### 7.2 Authentication Flow Enhancement

#### **Login Enhancement**
1. User authenticates with Supabase Auth
2. System loads profile with default company
3. If no default company, prompt for company selection
4. Set company context for session

#### **Company Context Management**
```typescript
// New context provider needed
const CompanyContext = createContext<{
  currentCompany: Company;
  availableCompanies: Company[];
  switchCompany: (companyId: string) => Promise<void>;
}>();
```

## 8. Risk Assessment & Mitigation

### 8.1 Migration Risks

| Risk Level | Risk | Impact | Mitigation Strategy |
|------------|------|--------|-------------------|
| **LOW** | Data loss during migration | Data corruption | Comprehensive backups before each step |
| **LOW** | Performance degradation | Slow queries | Proper indexing strategy |
| **LOW** | Application downtime | Service interruption | Blue-green deployment with rollback |
| **MEDIUM** | RLS policy conflicts | Access denied errors | Thorough testing with test accounts |
| **MEDIUM** | Company assignment errors | Data in wrong tenant | Careful backfill validation |

### 8.2 Rollback Strategy

#### **Per-Migration Rollback Plans**

1. **Company Tables Creation** - Simple DROP tables
2. **Company ID Addition** - DROP COLUMN company_id  
3. **RLS Implementation** - DISABLE RLS, DROP policies
4. **Trigger Installation** - DROP triggers
5. **Data Backfill** - Restore from backup

#### **Emergency Rollback Procedure**
```sql
-- Quick rollback script template
BEGIN;
  -- Disable RLS on all tables
  ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY;
  
  -- Drop company_id columns
  ALTER TABLE public.{table} DROP COLUMN IF EXISTS company_id;
  
  -- Drop company infrastructure
  DROP TABLE IF EXISTS public.company_memberships;
  DROP TABLE IF EXISTS public.companies;
  DROP TABLE IF EXISTS public.profiles;
COMMIT;
```

## 9. Testing Strategy

### 9.1 Pre-Migration Testing
1. **Full Database Backup** - Complete pg_dump
2. **Application Smoke Tests** - Verify current functionality
3. **Performance Baseline** - Document current query times

### 9.2 Migration Testing
1. **Staging Environment** - Test on production data copy
2. **Positive Tests** - Verify RLS allows proper access
3. **Negative Tests** - Verify RLS blocks cross-tenant access
4. **Performance Tests** - Ensure query performance maintained

### 9.3 Post-Migration Validation
1. **Data Integrity Checks** - Verify all data properly scoped
2. **Access Control Validation** - Test user permissions
3. **Application Functionality** - Full regression testing

## 10. Implementation Timeline

### **Phase 1: Foundation (Week 1)**
- Create company infrastructure tables
- Set up basic functions and types
- Create legacy company and initial memberships

### **Phase 2: Table Updates (Week 2)** 
- Add company_id to high-priority tables (people, evaluation_cycles)
- Implement backfill for tables with data
- Add indexes and constraints

### **Phase 3: Security (Week 3)**
- Implement RLS policies on all tenant tables
- Test access control thoroughly
- Enable RLS in production

### **Phase 4: Enhancement (Week 4)**
- Add remaining tenant tables
- Implement company switching
- Update frontend for multi-company support

### **Phase 5: Optimization (Week 5)**
- Performance tuning
- Additional indexes if needed
- Documentation and training

## 11. Success Criteria

### **Technical Success Metrics**
- ✅ All tenant data properly isolated by company
- ✅ RLS policies prevent cross-tenant data access
- ✅ Query performance within 10% of baseline
- ✅ Zero data loss during migration
- ✅ Application functions without modification

### **Business Success Metrics**
- ✅ Support for multiple companies
- ✅ Secure data isolation
- ✅ Scalable architecture for growth
- ✅ Minimal downtime during deployment
- ✅ Easy company management for administrators

## Next Steps

1. **Review and Approve Plan** - Stakeholder sign-off
2. **Phase 3 Implementation** - Begin multi-tenancy foundation
3. **Staging Environment Setup** - Test on production data copy
4. **Migration Script Generation** - Create idempotent SQL migrations
5. **Production Deployment** - Carefully staged rollout

---

*This plan provides a comprehensive strategy for safely implementing multi-tenancy while maintaining system stability and performance.*
