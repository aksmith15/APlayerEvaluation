# Database Overview

**Generated:** August 15, 2025  
**Database:** PostgreSQL 15.8 (Supabase)  
**Schema Version:** Migration 0004 Applied  

## Related Documentation

- [Environment & Secrets](../env.md)
- [Edge Functions](../edge-functions.md)  
- [System Architecture](../../architecture/ARCHITECTURE.md)

## Schema Dump

📄 **Current Schema**: [docs/_generated/schema_public.sql](../../_generated/schema_public.sql)

**Status**: Placeholder file created (schema dump not generated yet)

### How to generate:
```bash
supabase link --project-ref <your-project-ref>
supabase db dump --schema public --linked --file docs/_generated/schema_public.sql
```

## Per-Table Index

| Table | Columns | FKs | RLS | Link |
|-------|---------|-----|-----|------|
| *No tables documented yet* | - | - | - | - |

Per-table pages have not been generated yet. Generated after `pnpm db:docs`. 

To create detailed documentation for each table, run:
```bash
pnpm db:docs  # Generate from existing schema dump
# or
pnpm db:refresh  # Dump schema + generate docs
```

## ERD (Entity Relationship Diagram)

📊 **Database ERD**: [docs/architecture/diagrams/erd.mmd](../../architecture/diagrams/erd.mmd)

**Status**: ERD placeholder created. Generate with `pnpm db:docs`.

Other available diagrams:
- [Data Flow Diagram](../../architecture/diagrams/data-flow.mmd)
- [High-Level Architecture](../../architecture/diagrams/high-level.mmd)

### How to generate ERD:
```bash
pnpm db:docs    # Generate ERD from existing schema dump
# or
pnpm db:refresh # Dump schema + generate ERD
```

The ERD generation uses the Cursor AI task: "Generate a visual ERD from my schema"

## Quick Summary

This A-Player Evaluation System database uses a **multi-tenant architecture** with company-scoped data isolation. All tenant tables include `company_id` for data separation and are protected by Row Level Security (RLS) policies.

**Core Stats:**
- **15+ Core Tables** for multi-tenant evaluation system
- **6 Main Categories:** Multi-tenancy, People, Evaluations, Surveys, Analytics, System
- **Full RLS Coverage** on all tenant tables
- **4 Applied Migrations** with comprehensive backfill
- **Company-based Isolation** with role-based access control

## Tables by Category

### 🏢 Multi-Tenancy Foundation
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `companies` | Core tenant isolation | Auto-generated slug, soft delete |
| `profiles` | User profiles extending auth.users | Default company, preferences |
| `company_memberships` | Role-based access control | 4 roles: owner, admin, member, viewer |
| `invites` | Company invitation system | Secure tokens, expiration |

### 👥 People & Evaluation System  
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `people` | Employee/evaluatee records | Company-scoped, manager relationships |
| `evaluation_cycles` | Evaluation periods/quarters | Date ranges, active flags |
| `evaluation_assignments` | Survey assignments | Multi-type evaluations, status tracking |

### 📊 Survey Data & Responses
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `submissions` | Core survey responses | Unique evaluator/evaluatee/quarter/type |
| `attribute_responses` | Individual question responses | Flexible response types |
| `attribute_scores` | Calculated attribute scores | Raw and weighted scoring |

### 📈 Analytics & Computed Data
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `weighted_evaluation_scores` | Pre-computed dashboard scores | Performance optimization |
| `core_group_calculations` | Statistical analysis data | Mean, median, std deviation |
| `persona_classifications` | AI-generated personas | Confidence scoring, attributes |

### ⚙️ System & Configuration
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `analysis_jobs` | AI analysis tracking | PDF generation, error handling |
| `attribute_weights` | Configurable scoring weights | Company-specific weighting |
| `app_config` | Application configuration | Key-value store, company-scoped |

## Key Relationships

```
Companies (1) ──┬─→ Memberships (N) ──→ Profiles (1)
                ├─→ People (N)
                ├─→ Evaluation Cycles (N) 
                └─→ Attribute Weights (N)

People (1) ─────┬─→ Evaluation Assignments (N) (as evaluator)
                ├─→ Evaluation Assignments (N) (as evaluatee)  
                ├─→ Submissions (N)
                ├─→ Analysis Jobs (N)
                └─→ Persona Classifications (N)

Assignments (1) ─→ Submissions (1) ──┬─→ Attribute Responses (N)
                                     └─→ Attribute Scores (N)
```

## Multi-Tenancy Pattern

**All tenant tables follow this RLS pattern:**
```sql
CREATE POLICY "tenant_isolation" ON table_name
FOR ALL USING (
  company_id IN (
    SELECT cm.company_id 
    FROM company_memberships cm
    JOIN profiles p ON cm.profile_id = p.id
    WHERE p.id = auth.uid() AND cm.is_active = true
  )
);
```

**Access Control:**
- **Employees:** Own data + company-scoped read access
- **HR Admins:** Full company data management
- **Super Admins:** Cross-company access
- **Service Role:** Webhook operations, bypass user restrictions

## Performance Features

### Indexes
- **Company Scoping:** All tenant tables have `company_id` indexes
- **User Lookups:** Email-based lookups optimized  
- **Time Queries:** Date/timestamp indexes for reporting
- **Foreign Keys:** All relationships properly indexed

### Computed Views
- `assignment_statistics` - Assignment completion metrics
- `assignment_details` - Comprehensive assignment information with joins

## Migration History

| Migration | Date Applied | Purpose |
|-----------|--------------|---------|
| 0001 | August 2024 | Inventory snapshot |
| 0002 | August 2024 | Multi-tenant foundation |
| 0003 | August 2024 | Company ID propagation |
| 0004 | January 2025 | Analysis jobs RLS refinement |

## Legacy Data

- **Legacy Company ID:** `00000000-0000-0000-0000-000000000001`
- All existing data backfilled with legacy company
- Gradual migration strategy implemented
- Backward compatibility maintained

## Documentation Generation

To generate live database documentation:

```bash
# Option 1: Use Makefile (requires database access)
make docs

# Option 2: Manual SQL queries
# Run queries from sql/ directory against your database
psql $DATABASE_URL -f sql/tables_and_columns.sql
psql $DATABASE_URL -f sql/rls.sql  
psql $DATABASE_URL -f sql/grants.sql
```

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_PROJECT_REF` - Supabase project reference ID

## How to regenerate docs

### Using npm scripts (recommended):

**Windows (PowerShell):**
```powershell
# Set required environment variables
$env:SUPABASE_ACCESS_TOKEN = "your_token_here"
$env:SUPABASE_PROJECT_REF = "your_project_ref_here"

# Option 1: Dump + generate docs in one command
pnpm db:refresh

# Option 2: Step by step
pnpm db:dump    # Dump schema from Supabase
pnpm db:docs    # Generate docs from schema dump
```

**Linux/macOS (Bash):**
```bash
# Set required environment variables
export SUPABASE_ACCESS_TOKEN=your_token_here
export SUPABASE_PROJECT_REF=your_project_ref_here

# Option 1: Dump + generate docs in one command
pnpm db:refresh

# Option 2: Step by step
pnpm db:dump    # Dump schema from Supabase
pnpm db:docs    # Generate docs from schema dump
```

### Manual process:
```bash
# 1) Dump schema (public)
supabase link --project-ref <your-project-ref>
supabase db dump --schema public --linked --file docs/_generated/schema_public.sql

# 2) Generate per-table docs from schema_public.sql (run your existing Cursor task)
#    Task name: "Document my Supabase database from the schema"

# 3) Generate ERD from schema_public.sql (run your existing Cursor task)
#    Task name: "Generate a visual ERD from my schema"
```

---

🔗 **Related Documentation:**
- [RLS Policies](./rls-policies.md) - Row Level Security implementation
- [Database Grants](./grants.md) - Permission and role configuration  
- [Current Schema Dump](../../_generated/schema_public.sql) - Live database schema
- [Application Schema](../../../a-player-dashboard/database-schema.sql) - Application-specific schema
- [Table Documentation](./tables/) - Per-table detailed docs
- [Database Views](./views.md) - Views and computed data
- [Database Functions](./functions.md) - Stored procedures and functions