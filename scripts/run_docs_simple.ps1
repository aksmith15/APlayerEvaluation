# Simple PowerShell documentation generation script
# A-Player Evaluations Dashboard - Backend Documentation System

Write-Host "Running backend documentation generation..." -ForegroundColor Blue

# Change to project root directory
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "Working directory: $(Get-Location)" -ForegroundColor Gray

# Create directories
New-Item -ItemType Directory -Path "docs\db" -Force | Out-Null
New-Item -ItemType Directory -Path "docs\edge" -Force | Out-Null  
New-Item -ItemType Directory -Path "src\lib" -Force | Out-Null

Write-Host "Creating documentation placeholders..." -ForegroundColor Blue

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Create database overview
$overviewContent = @"
# Database Overview

Generated on $timestamp (Windows PowerShell mode)

⚠️ **Note**: This is a placeholder. To generate full documentation:
1. Install WSL/Git Bash for bash support, or
2. Use a Unix-like environment with Make, or
3. Run queries manually against your database

## Setup Instructions

### Option 1: Install Unix Tools
- Install WSL: ``wsl --install``
- Install Make: via package manager
- Run: ``make docs``

### Option 2: Manual Generation  
1. Connect to your database
2. Run the SQL files in the ``sql/`` directory
3. Format the output as markdown

## Expected Documentation Files
- ``docs/db/schema.sql`` - Full database schema dump
- ``docs/db/overview.md`` - Tables, columns, indexes, views, triggers
- ``docs/db/rls-policies.md`` - Row Level Security policies  
- ``docs/db/grants.md`` - Database privileges and grants

## Environment Variables
- ``DATABASE_URL`` - PostgreSQL connection string
- ``SUPABASE_PROJECT_REF`` - Supabase project reference ID

## SQL Query Files
The ``sql/`` directory contains introspection queries:
- ``tables_and_columns.sql`` - Table and column information
- ``pks.sql`` - Primary key constraints
- ``fks.sql`` - Foreign key relationships
- ``indexes.sql`` - Database indexes
- ``views.sql`` - Views and materialized views
- ``triggers.sql`` - Database triggers
- ``sequences.sql`` - Sequences
- ``rls.sql`` - Row Level Security status and policies
- ``grants.sql`` - Database privileges

Run these manually in your database client for full information.
"@

$overviewContent | Out-File -FilePath "docs\db\overview.md" -Encoding utf8

# Create RLS policies placeholder
$rlsContent = @"
# Row Level Security (RLS)

Generated on $timestamp (Windows PowerShell mode)

⚠️ **Note**: This is a placeholder. For actual RLS information:

1. Connect to your PostgreSQL database
2. Run the queries from ``sql/rls.sql``:

````sql
-- Tables with RLS flags
SELECT schemaname, tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2;

-- RLS Policies  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
ORDER BY 1,2,3;
````

## Known RLS Setup
Based on your codebase, this project uses multi-tenancy with:
- Company-scoped tables requiring ``company_id`` filtering
- RLS policies enforcing tenant isolation
- ``fromTenant()`` helper in ``src/lib/db.ts`` for safe queries
"@

$rlsContent | Out-File -FilePath "docs\db\rls-policies.md" -Encoding utf8

# Create grants placeholder
$grantsContent = @"
# Grants & Privileges

Generated on $timestamp (Windows PowerShell mode)

⚠️ **Note**: This is a placeholder. For actual grants information:

1. Connect to your PostgreSQL database  
2. Run the queries from ``sql/grants.sql``:

````sql
SELECT table_schema, table_name, privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2,3,4;
````
"@

$grantsContent | Out-File -FilePath "docs\db\grants.md" -Encoding utf8

# Create schema placeholder
$schemaContent = @"
-- Database Schema Dump
-- Generated on $timestamp (Windows PowerShell mode)

-- TODO: Generate full schema dump
-- Options:
-- 1. Install Supabase CLI: npm install -g supabase
-- 2. Set up local database: supabase start
-- 3. Generate schema: supabase db dump --local --schema-only
-- 4. Or use pg_dump with DATABASE_URL

-- Placeholder: This project uses PostgreSQL with Supabase
-- Key tables from your codebase analysis:
-- - companies (multi-tenant isolation)
-- - profiles (user information) 
-- - company_memberships (user-company relationships)
-- - people (evaluation targets)
-- - evaluation_assignments (survey assignments)
-- - submissions (survey responses)
-- - attribute_responses (individual question responses)
-- - analysis_jobs (background processing)

-- For complete schema, run actual database tools.
"@

$schemaContent | Out-File -FilePath "docs\db\schema.sql" -Encoding utf8

# Create TypeScript types placeholder
$typesContent = @"
// TypeScript Database Types
// Generated on $timestamp (Windows PowerShell mode)

// TODO: Generate actual types with Supabase CLI
// Run: npm install -g supabase
// Then: supabase gen types typescript --local > src/lib/database.types.ts

export type Database = {
  // TODO: Generated types will appear here
  // This project uses multi-tenant PostgreSQL schema
  // Key entities: companies, profiles, people, evaluations, submissions
};

// Placeholder types based on codebase analysis
export interface Company {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  company_id: string;
}

// For complete types, use Supabase CLI type generation
"@

$typesContent | Out-File -FilePath "src\lib\database.types.ts" -Encoding utf8

# Create Edge Functions documentation
Write-Host "Documenting Edge Functions..." -ForegroundColor Blue

$functionsContent = @"
# Edge Functions

Generated on $timestamp

"@

if (Test-Path "supabase\functions") {
    $functionsContent += "`n## Available Functions:`n`n"
    $functions = Get-ChildItem "supabase\functions" -Directory
    foreach ($func in $functions) {
        $funcName = $func.Name
        $functionsContent += "- **$funcName**`n"
        
        $indexFile = Join-Path $func.FullName "index.ts"
        if (Test-Path $indexFile) {
            try {
                $firstLines = Get-Content $indexFile -Head 5 -ErrorAction SilentlyContinue
                $comment = $firstLines | Where-Object { $_ -match "^(//|/\*|\*)" } | Select-Object -First 1
                if ($comment) {
                    $description = $comment -replace "^[//\*\s]*", ""
                    $functionsContent += "  - $description`n"
                }
            } catch {
                # Ignore file read errors
            }
        }
    }
    
    $functionsContent += "`n## Function Details`n`n"
    $functionsContent += "Total functions found: $($functions.Count)`n"
    $functionsContent += "Location: ``supabase/functions/```n"
} else {
    $functionsContent += "No ``supabase/functions`` directory found.`n"
}

$functionsContent | Out-File -FilePath "docs\edge\functions.md" -Encoding utf8

Write-Host ""
Write-Host "Documentation placeholders generated!" -ForegroundColor Green
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Blue
Write-Host "   - docs\db\schema.sql (placeholder)"
Write-Host "   - docs\db\overview.md (placeholder)" 
Write-Host "   - docs\db\rls-policies.md (placeholder)"
Write-Host "   - docs\db\grants.md (placeholder)"
Write-Host "   - docs\edge\functions.md"
Write-Host "   - src\lib\database.types.ts (placeholder)"
Write-Host ""
Write-Host "For full functionality:" -ForegroundColor Cyan
Write-Host "   - Install WSL: wsl --install"
Write-Host "   - Install Make and Unix tools"  
Write-Host "   - Set DATABASE_URL environment variable"
Write-Host "   - Install Supabase CLI: npm install -g supabase"
Write-Host "   - Then run: make docs (or npm run docs with Unix tools)"
