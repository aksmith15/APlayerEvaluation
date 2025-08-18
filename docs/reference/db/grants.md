# Database Grants & Privileges

**Generated:** August 15, 2025  
**Database:** PostgreSQL 15.8 (Supabase)  
**Access Control:** Role-based with RLS enforcement

## Overview

The A-Player Evaluation System uses **PostgreSQL role-based access control** combined with **Row Level Security (RLS)** to provide secure, multi-tenant data access. The system leverages Supabase's built-in authentication roles while adding custom application-level roles.

## Database Roles

### Supabase System Roles

#### `postgres` (Superuser)
- **Purpose:** Database administration and maintenance
- **Access:** Full database privileges
- **Usage:** Reserved for system operations, not application use

#### `service_role`
- **Purpose:** Server-side operations, webhook processing
- **Access:** Bypass RLS, full table access
- **Usage:** 
  - AI analysis job processing
  - Email webhook operations  
  - Data migration scripts
  - Background computation jobs

#### `authenticated`
- **Purpose:** Standard user session role
- **Access:** Subject to RLS policies
- **Usage:** All logged-in user operations

#### `anon`
- **Purpose:** Anonymous/public access
- **Access:** Very limited, subject to RLS
- **Usage:** Public invitation acceptance, minimal operations

### Application-Level Roles

These roles are stored in the `company_memberships.role` column and enforced via RLS policies:

#### `owner`
- **Purpose:** Company ownership and administration
- **Privileges:**
  - Full company data access
  - User management (invite, remove, change roles)
  - Company configuration management
  - Billing and subscription control
  - Delete company data

#### `admin` 
- **Purpose:** HR administration and data management
- **Privileges:**
  - Full company data read/write access
  - User management (invite, deactivate members)
  - Evaluation cycle and assignment management
  - Analytics and reporting access
  - Configuration management

#### `member`
- **Purpose:** Standard employee access
- **Privileges:**
  - View company directory (people)
  - Complete assigned evaluations
  - View own evaluation results
  - Access own coaching reports
  - Limited analytics visibility

#### `viewer`
- **Purpose:** Read-only access for consultants/observers
- **Privileges:**
  - View company directory
  - Read-only access to analytics
  - No evaluation participation
  - No data modification

## Table Privileges by Role

### 🏢 Multi-Tenancy Tables

#### `companies`
| Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|------|--------|--------|--------|--------|-------|
| `service_role` | ✅ | ✅ | ✅ | ✅ | Full access |
| `owner` | ✅ | ❌ | ✅ | ✅ | Own company only |
| `admin` | ✅ | ❌ | ✅ | ❌ | Own company only |
| `member` | ✅ | ❌ | ❌ | ❌ | Own company only |
| `viewer` | ✅ | ❌ | ❌ | ❌ | Own company only |

#### `profiles`
| Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|------|--------|--------|--------|--------|-------|
| `service_role` | ✅ | ✅ | ✅ | ✅ | Full access |
| `owner` | ✅ | ❌ | ✅ | ❌ | Company members |
| `admin` | ✅ | ❌ | ✅ | ❌ | Company members |
| `member` | ✅ | ❌ | ✅ | ❌ | Self + colleagues |
| `viewer` | ✅ | ❌ | ❌ | ❌ | Colleagues only |

#### `company_memberships`
| Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|------|--------|--------|--------|--------|-------|
| `service_role` | ✅ | ✅ | ✅ | ✅ | Full access |
| `owner` | ✅ | ✅ | ✅ | ✅ | Own company |
| `admin` | ✅ | ✅ | ✅ | ✅ | Own company |
| `member` | ✅ | ❌ | ❌ | ❌ | View only |
| `viewer` | ✅ | ❌ | ❌ | ❌ | View only |

### 👥 People & Evaluation Tables

#### `people`
| Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|------|--------|--------|--------|--------|-------|
| `service_role` | ✅ | ✅ | ✅ | ✅ | Full access |
| `owner` | ✅ | ✅ | ✅ | ✅ | Company scoped |
| `admin` | ✅ | ✅ | ✅ | ✅ | Company scoped |
| `member` | ✅ | ❌ | ❌ | ❌ | View company directory |
| `viewer` | ✅ | ❌ | ❌ | ❌ | View company directory |

#### `evaluation_assignments`
| Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|------|--------|--------|--------|--------|-------|
| `service_role` | ✅ | ✅ | ✅ | ✅ | Full access |
| `owner` | ✅ | ✅ | ✅ | ✅ | Company scoped |
| `admin` | ✅ | ✅ | ✅ | ✅ | Company scoped |
| `member` | ✅ | ❌ | ❌ | ❌ | Own assignments |
| `viewer` | ✅ | ❌ | ❌ | ❌ | Read-only |

### 📊 Survey Data Tables

#### `submissions`
| Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|------|--------|--------|--------|--------|-------|
| `service_role` | ✅ | ✅ | ✅ | ✅ | Full access |
| `owner` | ✅ | ❌ | ❌ | ✅ | Company data |
| `admin` | ✅ | ❌ | ❌ | ✅ | Company data |
| `member` | ✅ | ✅ | ✅ | ❌ | Own submissions |
| `viewer` | ❌ | ❌ | ❌ | ❌ | No access |

#### `attribute_responses`
| Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|------|--------|--------|--------|--------|-------|
| `service_role` | ✅ | ✅ | ✅ | ✅ | Full access |
| `owner` | ✅ | ❌ | ❌ | ✅ | Via submissions |
| `admin` | ✅ | ❌ | ❌ | ✅ | Via submissions |
| `member` | ✅ | ✅ | ✅ | ❌ | Own responses |
| `viewer` | ❌ | ❌ | ❌ | ❌ | No access |

### 📈 Analytics Tables

#### `weighted_evaluation_scores`
| Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|------|--------|--------|--------|--------|-------|
| `service_role` | ✅ | ✅ | ✅ | ✅ | Full access |
| `owner` | ✅ | ❌ | ❌ | ❌ | Company analytics |
| `admin` | ✅ | ❌ | ❌ | ❌ | Company analytics |
| `member` | ✅ | ❌ | ❌ | ❌ | Own scores only |
| `viewer` | ✅ | ❌ | ❌ | ❌ | Aggregate only |

### ⚙️ System Tables

#### `analysis_jobs`
| Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|------|--------|--------|--------|--------|-------|
| `service_role` | ✅ | ✅ | ✅ | ✅ | Processing jobs |
| `owner` | ✅ | ❌ | ❌ | ✅ | Company oversight |
| `admin` | ✅ | ❌ | ❌ | ✅ | Company oversight |
| `member` | ✅ | ✅ | ❌ | ❌ | Own jobs only |
| `viewer` | ❌ | ❌ | ❌ | ❌ | No access |

## Privilege Inheritance

### Database Level
```sql
-- Standard PostgreSQL privileges
GRANT CONNECT ON DATABASE postgres TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
```

### Schema Level
```sql
-- Public schema access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Table access granted through RLS policies
-- No direct table-level grants to users
```

### Function Level
```sql
-- Supabase auth functions
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.role() TO authenticated;

-- Custom helper functions
GRANT EXECUTE ON FUNCTION get_user_company_ids() TO authenticated;
```

## Security Implementation

### Grant Strategy
1. **Minimal Direct Grants:** No direct table grants to user roles
2. **RLS Enforcement:** All access controlled via Row Level Security
3. **Function-Based Access:** Helper functions for complex permissions
4. **Service Role Bypass:** System operations use service_role

### Access Control Flow
```
User Login
    ↓
JWT Token (with auth.uid)
    ↓
Database Role Assignment (authenticated/anon)
    ↓
RLS Policy Evaluation
    ↓
Company Membership Check
    ↓
Application Role Verification (owner/admin/member/viewer)
    ↓
Table Access Granted/Denied
```

### Permission Enforcement Points
1. **Authentication:** Supabase JWT validation
2. **Authorization:** RLS policy evaluation
3. **Application Logic:** Frontend role-based UI restrictions
4. **API Layer:** Server-side permission validation

## Administrative Operations

### Grant Management
```sql
-- View current grants
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
ORDER BY grantee, table_name;

-- View role memberships
SELECT 
  r.rolname as role_name,
  m.rolname as member_of
FROM pg_roles r
JOIN pg_auth_members am ON r.oid = am.member
JOIN pg_roles m ON am.roleid = m.oid
WHERE r.rolname IN ('authenticated', 'anon', 'service_role');
```

### Permission Auditing
```sql
-- Audit RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check table RLS status
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Troubleshooting

### Common Permission Issues

#### "Permission Denied" Errors
1. Check RLS is enabled on table
2. Verify user has active company membership
3. Confirm correct application role
4. Test with service_role for debugging

#### Cross-Company Data Leakage
1. Verify `company_id` in all policies
2. Check company membership query logic
3. Test with users from different companies

#### Performance Issues
1. Ensure RLS policies use indexed columns
2. Monitor query execution plans
3. Consider policy optimization for complex queries

### Debug Queries
```sql
-- Test user's company access
SELECT cm.company_id, cm.role, c.name
FROM company_memberships cm
JOIN profiles p ON cm.profile_id = p.id
JOIN companies c ON cm.company_id = c.id
WHERE p.id = auth.uid() AND cm.is_active = true;

-- Test specific table access
EXPLAIN (ANALYZE, VERBOSE) 
SELECT * FROM people 
WHERE company_id = 'test-company-id';
```

---

🔗 **Related Documentation:**
- [rls-policies.md](./rls-policies.md) - Detailed RLS policy documentation
- [overview.md](./overview.md) - Database structure overview
- [Supabase_Database_Structure.md](../Supabase_Database_Structure.md) - Complete schema reference