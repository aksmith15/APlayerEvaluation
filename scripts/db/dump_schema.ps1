param([string]$OutRoot = $null)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# dump_schema.ps1 - Dump Supabase schema to local files
# Usage: $env:SUPABASE_ACCESS_TOKEN="xxx"; $env:SUPABASE_PROJECT_REF="yyy"; ./scripts/db/dump_schema.ps1 [-OutRoot path]

Write-Host "[SUPABASE] Schema Dump" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Compute repo root and docs root
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\\..')
$docsRoot = if ($OutRoot) { Resolve-Path $OutRoot } else { Join-Path $repoRoot 'Docs' }

Write-Host "[CONFIG] Paths:" -ForegroundColor Yellow
Write-Host "   Repo Root: $repoRoot" -ForegroundColor White
Write-Host "   Docs Root: $docsRoot" -ForegroundColor White
Write-Host ""

# Check required environment variables
Write-Host "[VALIDATE] Checking environment..." -ForegroundColor Yellow

if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "[ERROR] SUPABASE_ACCESS_TOKEN environment variable is required" -ForegroundColor Red
    Write-Host "   Set it with: `$env:SUPABASE_ACCESS_TOKEN='your_token_here'" -ForegroundColor White
    exit 1
}

if (-not $env:SUPABASE_PROJECT_REF) {
    Write-Host "[ERROR] SUPABASE_PROJECT_REF environment variable is required" -ForegroundColor Red
    Write-Host "   Set it with: `$env:SUPABASE_PROJECT_REF='your_project_ref_here'" -ForegroundColor White
    exit 1
}

# Verify Supabase CLI is installed
Write-Host "[CHECK] Verifying Supabase CLI..." -ForegroundColor Yellow
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCli) {
    Write-Host "[ERROR] Supabase CLI not found. Please install it and ensure it's in your PATH." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Supabase CLI found: $($supabaseCli.Source)" -ForegroundColor Green

Write-Host "[CONFIG] Configuration:" -ForegroundColor Yellow
Write-Host "   Project Ref: $env:SUPABASE_PROJECT_REF" -ForegroundColor White
Write-Host "   Token: $($env:SUPABASE_ACCESS_TOKEN.Substring(0, [Math]::Min(8, $env:SUPABASE_ACCESS_TOKEN.Length)))..." -ForegroundColor White
Write-Host ""

# Ensure output directories exist
Write-Host "[SETUP] Creating output directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path ($docsRoot) -Force | Out-Null
$outputDir = Join-Path $docsRoot '_generated'
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
Write-Host "[OK] Created directories: $docsRoot" -ForegroundColor Green

try {
    # Login to Supabase
    Write-Host "[LOGIN] Logging in to Supabase..." -ForegroundColor Yellow
    & supabase login --token $env:SUPABASE_ACCESS_TOKEN
    if ($LASTEXITCODE -ne 0) {
        throw "Supabase login failed"
    }

    # Link to project
    Write-Host "[LINK] Linking to project..." -ForegroundColor Yellow
    & supabase link --project-ref $env:SUPABASE_PROJECT_REF
    if ($LASTEXITCODE -ne 0) {
        throw "Supabase project link failed"
    }

    # Dump public schema
    Write-Host "[DUMP] Dumping public schema..." -ForegroundColor Yellow
    $publicSchemaFile = Join-Path $docsRoot '_generated\schema_public.sql'
    & supabase db dump --schema public --linked --file $publicSchemaFile
    if ($LASTEXITCODE -ne 0) {
        throw "Public schema dump failed"
    }

    # Verify public schema file was created and is not empty
    if (-not (Test-Path $publicSchemaFile)) {
        throw "Public schema file was not created: $publicSchemaFile"
    }
    
    $publicFileInfo = Get-Item $publicSchemaFile
    if ($publicFileInfo.Length -eq 0) {
        throw "Public schema file is empty: $publicSchemaFile"
    }

    Write-Host "[OK] Public schema dumped successfully" -ForegroundColor Green

    # Optional: dump storage schema if it exists
    Write-Host "[DUMP] Checking for storage schema..." -ForegroundColor Yellow
    $storageSchemaFile = Join-Path $docsRoot '_generated\schema_storage.sql'
    
    try {
        & supabase db dump --schema storage --linked --file $storageSchemaFile 2>$null
        if ($LASTEXITCODE -eq 0 -and (Test-Path $storageSchemaFile)) {
            $storageFileInfo = Get-Item $storageSchemaFile
            if ($storageFileInfo.Length -gt 0) {
                Write-Host "[OK] Storage schema dumped" -ForegroundColor Green
            } else {
                Remove-Item $storageSchemaFile -ErrorAction SilentlyContinue
                Write-Host "[WARN] Storage schema is empty (this is normal)" -ForegroundColor Yellow
            }
        } else {
            Remove-Item $storageSchemaFile -ErrorAction SilentlyContinue
            Write-Host "[WARN] Storage schema not found or empty (this is normal)" -ForegroundColor Yellow
        }
    } catch {
        Remove-Item $storageSchemaFile -ErrorAction SilentlyContinue
        Write-Host "[WARN] Storage schema not available (this is normal)" -ForegroundColor Yellow
    }

} catch {
    Write-Host "[ERROR] Schema dump failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[SUCCESS] Schema dump completed!" -ForegroundColor Green
Write-Host ""
Write-Host "[SUMMARY] File Statistics:" -ForegroundColor Yellow

# Show file statistics
if (Test-Path $publicSchemaFile) {
    $fileInfo = Get-Item $publicSchemaFile
    $sizeKB = [Math]::Round($fileInfo.Length / 1KB, 2)
    Write-Host ("   [schema_public.sql] {0} bytes ({1} KB), modified {2}" -f $fileInfo.Length, $sizeKB, $fileInfo.LastWriteTime) -ForegroundColor White
} else {
    Write-Host "   [ERROR] schema_public.sql: FAILED TO CREATE" -ForegroundColor Red
}

if (Test-Path $storageSchemaFile) {
    $storageInfo = Get-Item $storageSchemaFile
    $storageSizeKB = [Math]::Round($storageInfo.Length / 1KB, 2)
    Write-Host ("   [schema_storage.sql] {0} bytes ({1} KB), modified {2}" -f $storageInfo.Length, $storageSizeKB, $storageInfo.LastWriteTime) -ForegroundColor White
}

Write-Host ""
Write-Host "[NEXT] Next steps:" -ForegroundColor Green
Write-Host "   Run: pnpm db:docs    # Generate documentation from schema" -ForegroundColor White
Write-Host "   Or:  pnpm db:refresh # Dump + generate docs in one command" -ForegroundColor White