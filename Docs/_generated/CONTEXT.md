# Context for AI (Cursor) - A-Player Evaluations Dashboard

## 🤖 Backend Development Guidelines

When changing backend code, writing queries, or proposing database migrations, **always consult these generated documentation files first**:

### 📚 Essential References

1. **`src/lib/database.types.ts`** - Generated TypeScript types for exact schema definitions
2. **`docs/db/overview.md`** - Complete table structure, columns, indexes, views, triggers
3. **`docs/db/rls-policies.md`** - Row Level Security rules and multi-tenancy constraints
4. **`docs/db/grants.md`** - Database privileges and role permissions
5. **`docs/edge/functions.md`** - Supabase Edge Functions summary and descriptions

### 🏢 Multi-Tenancy Architecture

This project uses **company-based multi-tenancy**. Key rules:

- **Company-scoped tables** require `company_id` filters (see `src/lib/db.ts` for the list)
- **Always use `fromTenant()` or `fromTenantSafe()`** from `src/lib/db.ts` for database queries
- **Never bypass RLS policies** - they enforce tenant isolation
- **Global tables** (`companies`, `profiles`, `app_config`) don't require company filtering

### ⚠️ Critical Safety Rules

#### Before Database Changes:
- ✅ Check existing RLS policies in `docs/db/rls-policies.md`
- ✅ Verify table permissions in `docs/db/grants.md`
- ✅ Review foreign key constraints in `docs/db/overview.md`
- ✅ Ensure new tables follow multi-tenancy patterns

#### Before Writing Queries:
- ✅ Use TypeScript types from `src/lib/database.types.ts`
- ✅ Apply appropriate `company_id` filtering for tenant isolation
- ✅ Follow existing RLS policy patterns
- ✅ Validate against existing table structure

#### Before Edge Function Changes:
- ✅ Review existing functions in `docs/edge/functions.md`
- ✅ Follow established patterns for authentication and authorization
- ✅ Ensure proper error handling and logging

### 🔄 Keeping Documentation Current

**Refresh documentation before major changes:**
```bash
make docs  # or npm run docs
```

This ensures you're working with the latest schema, types, and policies.

### 🚫 Never Propose Changes That:

1. **Violate RLS policies** - Always include explicit policy updates with rationale
2. **Break multi-tenancy** - All company-scoped operations must include `company_id`
3. **Ignore existing constraints** - Check PKs, FKs, and unique constraints first
4. **Bypass type safety** - Use generated TypeScript types, don't cast to `any`
5. **Skip testing** - Propose tests for new RLS policies and multi-tenant behavior

### 🧪 Testing Requirements

When proposing database changes, also include:
- **RLS policy tests** - Verify tenant isolation works correctly
- **Permission tests** - Ensure role-based access is maintained
- **Migration rollback plan** - How to safely revert if needed
- **Performance impact assessment** - For index and query changes

### 📖 Quick Reference Commands

```bash
# Generate all documentation
make docs

# Just update types
make types

# Check Edge Functions
make edge

# View help
make help
```

---

**Remember**: This documentation is generated from the live database. Always refresh it before proposing structural changes to ensure accuracy and prevent conflicts.
