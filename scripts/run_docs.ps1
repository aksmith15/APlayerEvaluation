# PowerShell version of the documentation generation script
# A-Player Evaluations Dashboard - Backend Documentation System

$ErrorActionPreference = "Stop"

Write-Host "🚀 Running backend documentation generation..." -ForegroundColor Blue

# Change to project root directory
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "📁 Working directory: $(Get-Location)" -ForegroundColor Gray

# Check if Make is available
$makeAvailable = Get-Command make -ErrorAction SilentlyContinue
if ($makeAvailable) {
    Write-Host "✅ Make is available, running: make docs" -ForegroundColor Green
    make docs
} else {
    Write-Host "⚠️  Make not available, running fallback documentation generation..." -ForegroundColor Yellow
    
    # Ensure directories exist
    $null = New-Item -ItemType Directory -Path "docs\db" -Force
    $null = New-Item -ItemType Directory -Path "docs\edge" -Force
    $null = New-Item -ItemType Directory -Path "src\lib" -Force
    
    # Check for export script
    $exportScript = "scripts\export_catalog_markdown.sh"
    if (Test-Path $exportScript) {
        Write-Host "📝 Export script found, but bash unavailable..." -ForegroundColor Yellow
        Write-Host "⚠️  On Windows without bash, manual database connection required" -ForegroundColor Yellow
        
        # Create placeholder documentation
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        @"
# Database Overview

Generated on $timestamp (Windows fallback mode)

⚠️ **Note**: This is a placeholder. To generate full documentation:
1. Install WSL/Git Bash for bash support, or
2. Run queries manually against your database, or  
3. Use a Unix-like environment with Make

## Setup Instructions

### Option 1: Install Tools
- Install WSL: ``wsl --install``
- Install Make: via package manager or build tools
- Run: ``make docs``

### Option 2: Manual Generation
1. Connect to your database
2. Run the SQL files in the ``sql/`` directory
3. Format the output as markdown

## Expected Files
- ``docs/db/schema.sql`` - Full database schema
- ``docs/db/overview.md`` - Tables, columns, indexes, views, triggers  
- ``docs/db/rls-policies.md`` - Row Level Security policies
- ``docs/db/grants.md`` - Database privileges and grants

## Environment Variables
- ``DATABASE_URL`` - PostgreSQL connection string
- ``SUPABASE_PROJECT_REF`` - Supabase project reference ID
"@ | Out-File -FilePath "docs\db\overview.md" -Encoding utf8
        
        @"
# Row Level Security (RLS)

Generated on $timestamp (Windows fallback mode)

⚠️ **Note**: This is a placeholder. Run SQL queries manually or use Unix tools.

TODO: Connect to database and run:
````sql
$(Get-Content "sql\rls.sql" -Raw)
````
"@ | Out-File -FilePath "docs\db\rls-policies.md" -Encoding utf8

        @"
# Grants & Privileges

Generated on $timestamp (Windows fallback mode)

⚠️ **Note**: This is a placeholder. Run SQL queries manually or use Unix tools.

TODO: Connect to database and run:
````sql
$(Get-Content "sql\grants.sql" -Raw)
````
"@ | Out-File -FilePath "docs\db\grants.md" -Encoding utf8

        Write-Host "📝 Created placeholder markdown files" -ForegroundColor Green
    } else {
        Write-Host "❌ Export script not found at $exportScript" -ForegroundColor Red
    }
    
    # Generate schema if tools are available
    Write-Host "🗃️  Attempting to generate database schema..." -ForegroundColor Blue
    $supabaseAvailable = Get-Command supabase -ErrorAction SilentlyContinue
    if ($supabaseAvailable) {
        try {
            $supabaseStatus = & supabase status 2>$null
            if ($supabaseStatus -like "*local db*") {
                Write-Host "📡 Generating schema from local Supabase..." -ForegroundColor Green
                & supabase db dump --local --schema-only | Out-File -FilePath "docs\db\schema.sql" -Encoding utf8
            } elseif ($env:DATABASE_URL) {
                Write-Host "🔗 DATABASE_URL found, but pg_dump needed..." -ForegroundColor Yellow
                $dbUrlMasked = $env:DATABASE_URL -replace 'postgresql://[^@]+@', 'postgresql://***@'
                "-- TODO: Install pg_dump or use WSL/Git Bash for full schema generation`n-- DATABASE_URL is set: $dbUrlMasked" | Out-File -FilePath "docs\db\schema.sql" -Encoding utf8
            } else {
                Write-Host "⚠️  No local DB or DATABASE_URL available" -ForegroundColor Yellow
                "-- TODO: Configure DATABASE_URL or set up local Supabase`n-- Run: supabase start (for local) or set DATABASE_URL" | Out-File -FilePath "docs\db\schema.sql" -Encoding utf8
            }
        } catch {
            Write-Host "⚠️  Supabase available but failed: $($_.Exception.Message)" -ForegroundColor Yellow
            "-- TODO: Fix Supabase configuration or set DATABASE_URL`n-- Error: $($_.Exception.Message)" | Out-File -FilePath "docs\db\schema.sql" -Encoding utf8
        }
    } else {
        Write-Host "⚠️  No database tools available for schema generation" -ForegroundColor Yellow
        "-- TODO: Install supabase CLI or pg_dump, and set DATABASE_URL`n-- Run: npm install -g supabase" | Out-File -FilePath "docs\db\schema.sql" -Encoding utf8
    }
    
    # Generate TypeScript types
    Write-Host "📘 Attempting to generate TypeScript types..." -ForegroundColor Blue
    if ($supabaseAvailable) {
        try {
            $supabaseStatus = & supabase status 2>$null
            if ($supabaseStatus -like "*local db*") {
                Write-Host "📡 Generating types from local Supabase..." -ForegroundColor Green
                & supabase gen types typescript --local | Out-File -FilePath "src\lib\database.types.ts" -Encoding utf8
            } elseif ($env:SUPABASE_PROJECT_REF) {
                Write-Host "☁️  Generating types from remote Supabase..." -ForegroundColor Green
                & supabase gen types typescript --project-id $env:SUPABASE_PROJECT_REF | Out-File -FilePath "src\lib\database.types.ts" -Encoding utf8
            } else {
                Write-Host "⚠️  No local DB or SUPABASE_PROJECT_REF available" -ForegroundColor Yellow
                $typesContent = @"
// TODO: Configure Supabase for TypeScript type generation
// Options:
// 1. Set up local Supabase: supabase start
// 2. Set SUPABASE_PROJECT_REF environment variable
// 3. Run: npm run docs:types

export type Database = {
  // TODO: Generated types will appear here
};
"@
                $typesContent | Out-File -FilePath "src\lib\database.types.ts" -Encoding utf8
            }
        } catch {
            Write-Host "⚠️  Supabase type generation failed: $($_.Exception.Message)" -ForegroundColor Yellow
            $errorContent = @"
// TODO: Fix Supabase configuration
// Error: $($_.Exception.Message)

export type Database = {
  // TODO: Generated types will appear here
};
"@
            $errorContent | Out-File -FilePath "src\lib\database.types.ts" -Encoding utf8
        }
    } else {
        Write-Host "⚠️  Supabase CLI not available for type generation" -ForegroundColor Yellow
        $defaultContent = @"
// TODO: Install Supabase CLI for TypeScript type generation
// Run: npm install -g supabase
// Then: npm run docs:types

export type Database = {
  // TODO: Generated types will appear here
};
"@
        $defaultContent | Out-File -FilePath "src\lib\database.types.ts" -Encoding utf8
    }
    
    # Generate Edge Functions documentation
    Write-Host "⚡ Generating Edge Functions documentation..." -ForegroundColor Blue
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $functionsDoc = @"
# Edge Functions

Generated on $timestamp

"@
    
    if (Test-Path "supabase\functions") {
        $functionsDoc += "`n## Available Functions:`n`n"
        Get-ChildItem "supabase\functions" -Directory | ForEach-Object {
            $funcName = $_.Name
            $indexFile = Join-Path $_.FullName "index.ts"
            $functionsDoc += "- **$funcName**`n"
            
            if (Test-Path $indexFile) {
                $description = (Get-Content $indexFile -Head 10 | Where-Object { $_ -match "^\s*//|^\s*\*" } | Select-Object -First 3 | ForEach-Object { $_ -replace "^\s*[\/\*]*\s*", "" }) -join " "
                if ($description) {
                    $functionsDoc += "  - $description`n"
                }
            }
        }
    } else {
        $functionsDoc += "No supabase/functions directory found.`n"
    }
    
    $functionsDoc | Out-File -FilePath "docs\edge\functions.md" -Encoding utf8
    
    Write-Host ""
    Write-Host "✅ Fallback documentation generation completed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📁 Generated documentation files:" -ForegroundColor Blue
Write-Host "   - docs\db\schema.sql"
Write-Host "   - docs\db\overview.md"
Write-Host "   - docs\db\rls-policies.md"
Write-Host "   - docs\db\grants.md"
Write-Host "   - docs\edge\functions.md"
Write-Host "   - src\lib\database.types.ts"
Write-Host ""
Write-Host "💡 To set up full functionality:" -ForegroundColor Cyan
Write-Host "   - Install WSL or Git Bash for Unix-like tools"
Write-Host "   - Install Make for complete build system"
Write-Host "   - Set DATABASE_URL for schema generation"
Write-Host "   - Set SUPABASE_PROJECT_REF for remote type generation"
