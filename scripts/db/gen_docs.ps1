param([string]$OutRoot = $null)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# gen_docs.ps1 - Generate robust database documentation from schema dump
# Purpose: Parse Postgres SQL schema and generate comprehensive Markdown documentation
# Usage: ./scripts/db/gen_docs.ps1 [-OutRoot path]

# Guard rails + logging
function Log([string]$msg) { Write-Host $msg }
function Time([string]$label, [scriptblock]$block) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $res = & $block
    $sw.Stop()
    Log ("[TIME] $label $($sw.ElapsedMilliseconds) ms")
    return $res
}

Log "[DOCS] Database Documentation Generator"
Log "====================================="

# Compute repo root and docs root with plain string paths
$repoRootObj = Resolve-Path (Join-Path $PSScriptRoot '..\\..')
$repoRoot = $repoRootObj.Path
$docsRoot = if ($OutRoot) { (Resolve-Path $OutRoot).Path } else { Join-Path $repoRoot 'Docs' }

Log "[CONFIG] Paths:"
Log "   Repo Root: $repoRoot"
Log "   Docs Root: $docsRoot"
Log ""

function New-Dir($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null } }

New-Dir $docsRoot
New-Dir (Join-Path $docsRoot '_generated')
New-Dir (Join-Path $docsRoot 'reference\db\tables')
New-Dir (Join-Path $docsRoot 'reference\db')

# Load the schema once
$schemaPath = Join-Path $docsRoot '_generated\schema_public.sql'
if (!(Test-Path $schemaPath)) { throw "Schema file not found: $schemaPath" }

$sql = Time "Loading schema file" {
    Get-Content -Path $schemaPath -Raw
}

if ([string]::IsNullOrWhiteSpace($sql)) {
    Log "[ERROR] Schema file is empty"
    exit 1
}

$fileInfo = Get-Item $schemaPath
$sizeKB = [Math]::Round($fileInfo.Length / 1KB, 2)
Log "[OK] Found schema dump: $schemaPath ($sizeKB KB)"
Log ""

# Fast statement scanner - split on simple patterns first, then filter
function Get-SqlStatements([string]$sql) {
    Log "[PARSE] Splitting SQL file into statements..."
    
    # Much simpler approach: split on semicolons followed by newlines and CREATE keywords
    # This is fast but may include some false positives - we'll filter later
    $candidateStmts = $sql -split ';\s*(?=\r?\n\s*(?:CREATE|ALTER|DROP|COMMENT|--|\s*$))' | Where-Object { 
        $_.Trim().Length -gt 10 
    }
    
    Log "[PARSE] Found $($candidateStmts.Count) candidate statements"
    
    # Quick filter to only keep statements that look like SQL DDL
    $stmts = $candidateStmts | Where-Object {
        $trimmed = $_.Trim()
        $trimmed -match '^\s*(?:CREATE|ALTER|DROP|COMMENT)' -or 
        ($trimmed -match '^\s*--' -and $trimmed.Length -lt 200)  # Include short comments
    }
    
    Log "[PARSE] Filtered to $($stmts.Count) SQL statements"
    return $stmts
}

# Parse SQL statements
$statements = Time "Splitting SQL into statements" {
    Get-SqlStatements $sql
}

Log "[PARSE] Found $($statements.Count) SQL statements"

# Simple, fast regexes for each statement type
$tablePattern = '(?i)^\s*CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?:"?public"?|\w+)\.)?"?(?<name>[A-Za-z0-9_]+)"?'
$viewPattern = '(?i)^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?:"?public"?|\w+)\.)?"?(?<name>[A-Za-z0-9_]+)"?'
$functionPattern = '(?i)^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:(?:"?public"?|\w+)\.)?"?(?<name>[A-Za-z0-9_]+)"?'

# Parse tables, views, functions
$tables = @()
$views = @()
$functions = @()

Log "[PARSE] Processing $($statements.Count) statements..."
$processed = 0

foreach ($stmt in $statements) {
    $processed++
    if ($processed % 100 -eq 0) {
        Log "[PARSE] Processed $processed/$($statements.Count) statements..."
    }
    if ($stmt -match $tablePattern) {
        $tableName = $matches['name']
        Log "[TABLE] Found: $tableName"
        
        # Simplified parsing - just collect basic info for now
        $tables += @{
            name = $tableName
            columns = @()
            constraints = @{
                primary_key = @()
                unique = @()
                foreign_keys = @()
                checks = @()
            }
            rls_enabled = $false
            policies = @()
        }
    }
    elseif ($stmt -match $viewPattern) {
        $viewName = $matches['name']
        Log "[VIEW] Found: $viewName"
        
        # Simplified view parsing
        $views += @{
            name = $viewName
            definition = "-- View definition available in schema dump"
        }
    }
    elseif ($stmt -match $functionPattern) {
        $functionName = $matches['name']
        Log "[FUNCTION] Found: $functionName"
        
        # Simplified function parsing
        $functions += @{
            name = $functionName
            args = ""
            returns = ""
            language = "sql"
            body = "-- Function body available in schema dump"
            security = ""
            volatility = ""
        }
    }
}

Log "[OK] Parsed $($tables.Count) tables, $($views.Count) views, $($functions.Count) functions"

# ====================================================================
# PARSE SAVED QUERIES
# ====================================================================

Log "[SCAN] Scanning for saved queries..."

$queryRoots = @(
    (Join-Path $repoRoot 'sql'),
    (Join-Path $repoRoot 'supabase\sql'),
    (Join-Path $repoRoot 'a-player-dashboard\sql')
) | Where-Object { Test-Path $_ }

$queryFiles = @()
foreach ($root in $queryRoots) {
    $queryFiles += Get-ChildItem -Path $root -Recurse -Include *.sql -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch '\\supabase\\migrations\\' }
}

$queriesDir = Join-Path $docsRoot 'reference\db\queries'
New-Dir $queriesDir

function Get-RelPath([string]$base, [string]$full) {
    try { 
        return [System.IO.Path]::GetRelativePath($base, $full) 
    }
    catch {
        $u1 = New-Object System.Uri(($base.TrimEnd('\') + '\'))
        $u2 = New-Object System.Uri($full)
        return $u1.MakeRelativeUri($u2).ToString()
    }
}

$qIndex = @"
# Saved Queries

"@

foreach ($f in $queryFiles) {
    $rel = Get-RelPath $repoRoot $f.FullName
    $name = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
    $md = Join-Path $queriesDir ($name + '.md')

    $lines = Get-Content -Path $f.FullName
    $descLines = @()
    foreach ($ln in $lines) {
        if ($ln -match '^\s*--') { $descLines += ($ln -replace '^\s*--\s?', '') } else { break }
    }
    $desc = if ($descLines.Count -gt 0) { ($descLines -join "`n") } else { "No description" }

    $content = @"
# Query: $name

## Description
$desc

## SQL
``````sql
$(Get-Content -Path $f.FullName -Raw)
``````
"@
    
    Set-Content -Path $md -Value $content -Encoding UTF8

    $qIndex += "- [$name](./$name.md) - $rel`n"
}
Set-Content -Path (Join-Path $queriesDir 'README.md') -Value $qIndex -Encoding UTF8

Log "[OK] Found $($queryFiles.Count) saved queries"

# ====================================================================
# GENERATE TABLE DOCUMENTATION
# ====================================================================

Log ""
Log "[GENERATE] Creating table documentation..."

foreach ($table in $tables) {
    $tableFile = Join-Path $docsRoot "reference\db\tables\$($table.name).md"
    
    # Generate columns table
    $columnsTable = "| Name | Type | Nullable | Default | Notes |`n"
    $columnsTable += "|------|------|----------|---------|-------|`n"
    
    foreach ($col in $table.columns) {
        $nullable = if ($col.nullable) { "Yes" } else { "No" }
        $default = if ($col.default) { $col.default } else { "-" }
        $notes = if ($col.notes) { $col.notes } else { "-" }
        $columnsTable += "| $($col.name) | $($col.type) | $nullable | $default | $notes |`n"
    }
    
    # Generate constraints section
    $constraintsSection = ""
    
    if ($table.constraints.primary_key.Count -gt 0) {
        $pkCols = $table.constraints.primary_key -join ', '
        $constraintsSection += "Primary Key: ($pkCols)`n`n"
    }
    
    if ($table.constraints.unique.Count -gt 0) {
        $constraintsSection += "Unique:`n`n"
        foreach ($unique in $table.constraints.unique) {
            $uniqueCols = $unique -join ', '
            $constraintsSection += "($uniqueCols)`n`n"
        }
    }
    
    if ($table.constraints.checks.Count -gt 0) {
        $constraintsSection += "Checks:`n`n"
        foreach ($check in $table.constraints.checks) {
            $constraintsSection += "$check`n`n"
        }
    }
    
    # Generate foreign keys table
    $foreignKeysTable = ""
    if ($table.constraints.foreign_keys.Count -gt 0) {
        $foreignKeysTable = "| From Column(s) | -> Table | Target Column(s) | On Delete | On Update |`n"
        $foreignKeysTable += "|----------------|--------|------------------|-----------|-----------|`n"
        
        foreach ($fk in $table.constraints.foreign_keys) {
            $fromCols = $fk.from_columns -join ', '
            $toCols = $fk.to_columns -join ', '
            $onDelete = if ($fk.on_delete) { $fk.on_delete } else { "-" }
            $onUpdate = if ($fk.on_update) { $fk.on_update } else { "-" }
            
            $foreignKeysTable += "| $fromCols | $($fk.to_table) | $toCols | $onDelete | $onUpdate |`n"
        }
    }
    else {
        $foreignKeysTable = "No foreign key constraints.`n"
    }
    
    # Generate RLS section
    $rlsSection = "## Row Level Security`n"
    $rlsSection += "- Enabled: $($table.rls_enabled)`n"
    if ($table.policies.Count -gt 0) {
        $rlsSection += "- Policies:`n"
        foreach ($p in $table.policies) {
            $rlsSection += "  - $($p.name) - USING: $($p.using) CHECK: $($p.check)`n"
        }
    }
    
    # Generate complete table documentation
    $tableContent = @"
# Table: $($table.name)

## Columns

$columnsTable

## Constraints

$constraintsSection

## Foreign Keys

$foreignKeysTable

$rlsSection
"@

    Set-Content -Path $tableFile -Value $tableContent -Encoding UTF8
    Log "[OK] Generated: $tableFile"
}

# ====================================================================
# GENERATE VIEWS DOCUMENTATION
# ====================================================================

Log ""
Log "[GENERATE] Creating views documentation..."

$viewsFile = Join-Path $docsRoot "reference\db\views.md"
$viewsContent = @"
# Views (public)

"@

if ($views.Count -eq 0) {
    $viewsContent += "No views found.`n"
}
else {
    foreach ($view in $views) {
        $viewsContent += @"

## $($view.name)

``````sql
$($view.definition)
``````
"@
    }
}

Set-Content -Path $viewsFile -Value $viewsContent -Encoding UTF8
Log "[OK] Generated: $viewsFile"

# ====================================================================
# GENERATE FUNCTIONS DOCUMENTATION
# ====================================================================

Log ""
Log "[GENERATE] Creating functions documentation..."

$functionsFile = Join-Path $docsRoot "reference\db\functions.md"
$fnContent = @"
# SQL Functions (public)

"@

if ($functions.Count -eq 0) {
    $fnContent += "No SQL functions found.`n"
}
else {
    foreach ($func in $functions) {
        $fnContent += @"

## $($func.name)($($func.args)) -> $($func.returns)
- Language: $($func.language)$(if ($func.security) { "`n- Security: $($func.security)" })$(if ($func.volatility) { "`n- Volatility: $($func.volatility)" })

``````sql
$($func.body)
``````
"@
    }
}

Set-Content -Path $functionsFile -Value $fnContent -Encoding UTF8
Log "[OK] Generated: $functionsFile"

# ====================================================================
# GENERATE INVENTORY JSON
# ====================================================================

Log ""
Log "[GENERATE] Creating database inventory..."

$inventoryFile = Join-Path $docsRoot "_generated\db_inventory.json"

# Build inventory structure
$inventory = @{
    generated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    schema_file = "_generated/schema_public.sql"
    tables = @()
    views = @()
    functions = @()
    queries = @()
}

# Add tables to inventory
foreach ($table in $tables) {
    $tableInventory = @{
        name = $table.name
        columns = @()
        primary_key = $table.constraints.primary_key
        unique = $table.constraints.unique
        foreign_keys = $table.constraints.foreign_keys
        rls_enabled = $table.rls_enabled
        policies = $table.policies
    }
    
    foreach ($col in $table.columns) {
        $tableInventory.columns += @{
            name = $col.name
            type = $col.type
            nullable = $col.nullable
            default = $col.default
        }
    }
    
    $inventory.tables += $tableInventory
}

# Add views to inventory
foreach ($view in $views) {
    $inventory.views += @{
        name = $view.name
    }
}

# Add functions to inventory
foreach ($func in $functions) {
    $inventory.functions += @{
        name = $func.name
        args = $func.args
        returns = $func.returns
        language = $func.language
        security = $func.security
        volatility = $func.volatility
    }
}

# Add queries to inventory
foreach ($qf in $queryFiles) {
    $qname = [System.IO.Path]::GetFileNameWithoutExtension($qf.Name)
    $inventory.queries += @{
        name = $qname
        path = "reference/db/queries/$qname.md"
    }
}

$inventoryJson = $inventory | ConvertTo-Json -Depth 10
Set-Content -Path $inventoryFile -Value $inventoryJson -Encoding UTF8
Log "[OK] Generated: $inventoryFile"

# ====================================================================
# FINAL SUMMARY
# ====================================================================

Log ""
Log "[SUCCESS] Documentation generation completed!"
Log ""
Log "[SUMMARY] Database objects discovered:"
Log "   Tables: $($tables.Count)"
Log "   Views: $($views.Count)"
Log "   Functions: $($functions.Count)"
Log "   Queries: $($queryFiles.Count)"
Log ""
Log "[DOCS ROOT] $docsRoot"
Log ""

# Exit with appropriate code
$totalObjects = $tables.Count + $views.Count + $functions.Count + $queryFiles.Count
if ($totalObjects -eq 0) {
    Log "[ERROR] No database objects found. Check schema file: $schemaPath"
    exit 1
}

Log "[COMPLETE] Documentation generation finished successfully!"
exit 0