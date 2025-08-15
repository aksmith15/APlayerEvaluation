# Backend Documentation System

This directory contains automatically generated documentation for the A-Player Evaluations Dashboard backend.

## 📁 Directory Structure

```
docs/
├── README.md              # This file
├── CONTEXT.md             # AI/Cursor guidance for backend changes
├── db/                    # Database documentation
│   ├── schema.sql         # Full database schema dump
│   ├── overview.md        # Tables, columns, indexes, views, triggers
│   ├── rls-policies.md    # Row Level Security policies
│   └── grants.md          # Database privileges and grants
└── edge/                  # Edge Functions documentation
    └── functions.md       # Supabase Edge Functions summary
```

## 🔄 Regenerating Documentation

### Option 1: Using npm (Works on all platforms)
```bash
cd a-player-dashboard
npm run docs
```

### Option 2: Using Make (Unix/Linux/WSL)
```bash
make docs
```

### Available Commands
- `make docs` - Generate all documentation
- `make schema` - Export database schema only
- `make types` - Generate TypeScript types only
- `make edge` - Generate Edge Functions docs only
- `make clean` - Remove all generated files
- `make help` - Show available commands

## 🌐 Platform Support

### Windows (PowerShell)
- ✅ Basic documentation generation
- ✅ Edge Functions documentation
- ⚠️ Placeholder files for database docs (requires database connection)

### Unix/Linux/WSL
- ✅ Full documentation generation
- ✅ Database schema introspection
- ✅ Live database queries
- ✅ TypeScript type generation

## 🔧 Environment Variables

Set these for full functionality:

- `DATABASE_URL` - PostgreSQL connection string for schema generation
- `SUPABASE_PROJECT_REF` - Supabase project ID for remote type generation

## 📊 Generated Files

### Database Documentation
- **schema.sql** - Complete database schema with tables, views, functions, etc.
- **overview.md** - Human-readable summary of database structure
- **rls-policies.md** - Row Level Security policies for multi-tenancy
- **grants.md** - Database privileges and role permissions

### Application Documentation  
- **functions.md** - Supabase Edge Functions with descriptions
- **src/lib/database.types.ts** - TypeScript type definitions

## 🎯 Usage Guidelines

### For Developers
1. **Always regenerate docs before major changes**: `npm run docs`
2. **Consult `CONTEXT.md`** before proposing backend changes
3. **Check RLS policies** in `rls-policies.md` for multi-tenancy rules
4. **Use generated types** from `database.types.ts` for type safety

### For AI/Cursor
- Read `CONTEXT.md` for backend development guidelines
- Reference generated documentation before proposing changes
- Never bypass RLS policies or multi-tenancy constraints

## 🔍 SQL Query Files

The `sql/` directory contains introspection queries used to generate documentation:

- `tables_and_columns.sql` - Table and column information
- `pks.sql` - Primary key constraints  
- `fks.sql` - Foreign key relationships
- `indexes.sql` - Database indexes
- `views.sql` - Views and materialized views
- `triggers.sql` - Database triggers
- `sequences.sql` - Sequences
- `rls.sql` - Row Level Security status and policies
- `grants.sql` - Database privileges

Run these manually in your database client for detailed information.

## 🚀 Getting Started

1. **Set up environment**:
   ```bash
   export DATABASE_URL="postgresql://user:pass@host:port/database"
   export SUPABASE_PROJECT_REF="your-project-ref"
   ```

2. **Generate documentation**:
   ```bash
   npm run docs
   ```

3. **Review generated files** in `docs/` directory

4. **Integrate into workflow** - regenerate docs before backend changes

## 💡 Tips

- Documentation is **version controlled** - commit changes with your code
- Files are **idempotent** - safe to regenerate anytime  
- **Placeholder files** are created when tools aren't available
- Use **Unix environment** (WSL) for full functionality on Windows

---

**Last Updated**: Generated automatically by the documentation system
