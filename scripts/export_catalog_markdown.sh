#!/usr/bin/env bash
set -euo pipefail

# Export database catalog to markdown documentation
# Part of the backend documentation system for A-Player Evaluations Dashboard

: "${DATABASE_URL:=}"  # may be unset if using supabase local
OUT_DIR="docs/db"
SQL_DIR="sql"

echo "🔍 Exporting database catalog to markdown documentation..."

# Create output directory
mkdir -p "$OUT_DIR"

# Function to run psql commands
psql_cmd() {
  # Prefer DATABASE_URL if provided; otherwise rely on local psql default connection params
  if [[ -n "${DATABASE_URL:-}" ]]; then
    echo "🔗 Using DATABASE_URL connection"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -X -q "$@"
  else
    echo "🔗 Using local psql connection"
    psql -v ON_ERROR_STOP=1 -X -q "$@"
  fi
}

echo "📊 Generating database overview..."

# Generate overview.md with comprehensive database structure
psql_cmd <<'SQL' > "$OUT_DIR/overview.md"
\pset format unaligned
\pset tuples_only on
\echo "# Database Overview"
\echo ""
\echo "Generated on $(date)"
\echo ""
\echo "## Tables & Columns"
\echo ""
\echo "### Tables"
\echo ""
\i sql/tables_and_columns.sql
\echo ""
\echo "## Primary Keys"
\echo ""
\i sql/pks.sql
\echo ""
\echo "## Foreign Keys"
\echo ""
\i sql/fks.sql
\echo ""
\echo "## Indexes"
\echo ""
\i sql/indexes.sql
\echo ""
\echo "## Views & Materialized Views"
\echo ""
\i sql/views.sql
\echo ""
\echo "## Triggers"
\echo ""
\i sql/triggers.sql
\echo ""
\echo "## Sequences"
\echo ""
\i sql/sequences.sql
SQL

echo "🔒 Generating RLS policies documentation..."

# Generate rls-policies.md
psql_cmd <<'SQL' > "$OUT_DIR/rls-policies.md"
\pset format unaligned
\pset tuples_only on
\echo "# Row Level Security (RLS)"
\echo ""
\echo "Generated on $(date)"
\echo ""
\echo "## Tables with RLS Enabled"
\echo ""
\echo "| Schema | Table | RLS Enabled |"
\echo "|--------|-------|-------------|"
\i sql/rls.sql
\echo ""
\echo "## Detailed RLS Policies"
\echo ""
\echo "| Schema | Table | Policy | Permissive | Roles | Command | Qualifier | With Check |"
\echo "|--------|-------|--------|------------|-------|---------|-----------|------------|"
SQL

echo "🔐 Generating grants and privileges documentation..."

# Generate grants.md
psql_cmd <<'SQL' > "$OUT_DIR/grants.md"
\pset format unaligned
\pset tuples_only on
\echo "# Grants & Privileges"
\echo ""
\echo "Generated on $(date)"
\echo ""
\echo "## Table Privileges by Role"
\echo ""
\echo "| Schema | Table | Privilege | Grantee |"
\echo "|--------|-------|-----------|---------|"
\i sql/grants.sql
SQL

echo "✅ Database catalog documentation generated successfully!"
echo "📁 Output files:"
echo "   - $OUT_DIR/overview.md"
echo "   - $OUT_DIR/rls-policies.md" 
echo "   - $OUT_DIR/grants.md"
