# PowerShell Edge Functions Cleanup Script
# Removes unused test and debug functions while preserving production and needed debug functions

Write-Host "Starting Edge Functions Cleanup..." -ForegroundColor Blue

# Change to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Check if supabase functions directory exists
if (-not (Test-Path "supabase\functions")) {
    Write-Host "supabase\functions directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Current functions directory:" -ForegroundColor Gray
Get-ChildItem "supabase\functions" -Directory | Format-Table Name, LastWriteTime

Write-Host ""
Write-Host "Functions to keep:" -ForegroundColor Green
Write-Host "  accept-invite (production)"
Write-Host "  create-invite (production)" 
Write-Host "  ai-coaching-report (production)"
Write-Host "  ai-strengths-insights (production)"
Write-Host "  ai-development-insights (production)"
Write-Host "  ai-descriptive-review (production)"
Write-Host "  test-create-invite-debug (debug needed)"
Write-Host "  _shared (utilities)"

Write-Host ""
Write-Host "Functions to remove (20 total):" -ForegroundColor Red

# List of functions to remove
$functionsToRemove = @(
    "ai-insights-fixed",
    "ai-strengths-insights-copy", 
    "ai-strengths-test",
    "create-invite-step-debug",
    "debug-create-invite",
    "debug-invitation-email",
    "insights-minimal",
    "send-invitation-email",
    "send-invitation-email-debug",
    "send-simple-email",
    "test-exact-copy",
    "test-hello",
    "test-insights-debug",
    "test-minimal",
    "test-resend-detailed",
    "test-resend-simple",
    "test-simple",
    "test-smtp-direct",
    "test-ultra-minimal",
    "working-insights-test"
)

# Check which functions actually exist before removal
$existingFunctions = @()
foreach ($func in $functionsToRemove) {
    if (Test-Path "supabase\functions\$func") {
        $existingFunctions += $func
        Write-Host "  $func" -ForegroundColor Yellow
    } else {
        Write-Host "  $func (not found, skipping)" -ForegroundColor Gray
    }
}

if ($existingFunctions.Count -eq 0) {
    Write-Host ""
    Write-Host "No functions to remove - directory is already clean!" -ForegroundColor Green
    exit 0
}

Write-Host ""
$confirm = Read-Host "Remove $($existingFunctions.Count) unused functions? (y/N)"

if ($confirm -match "^[Yy]$") {
    Write-Host ""
    Write-Host "Removing unused functions..." -ForegroundColor Yellow
    
    foreach ($func in $existingFunctions) {
        Write-Host "  Removing: $func"
        Remove-Item -Path "supabase\functions\$func" -Recurse -Force
    }
    
    Write-Host ""
    Write-Host "Cleanup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Remaining functions:" -ForegroundColor Gray
    Get-ChildItem "supabase\functions" -Directory | Format-Table Name, LastWriteTime
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review the remaining functions above"
    Write-Host "  2. Test your application to ensure everything works"
    Write-Host "  3. Deploy to remove functions from remote:"
    Write-Host "     supabase functions deploy"
    Write-Host "  4. Or manually delete remote functions:"
    Write-Host "     supabase functions delete [function-name]"
    
} else {
    Write-Host ""
    Write-Host "Cleanup cancelled - no functions were removed" -ForegroundColor Gray
}
