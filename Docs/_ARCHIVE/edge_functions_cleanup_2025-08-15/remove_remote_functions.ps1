# Remove unused Edge Functions from Remote Supabase
# Based on cleanup plan - keeps only production functions and needed debug function

Write-Host "Removing unused Edge Functions from Remote Supabase..." -ForegroundColor Blue

# Functions to keep (8 total)
$functionsToKeep = @(
    "accept-invite",
    "create-invite", 
    "ai-coaching-report",
    "ai-strengths-insights",
    "ai-development-insights",
    "ai-descriptive-review",
    "test-create-invite-debug",
    "_shared"
)

# Functions to remove from remote (based on our local cleanup)
$functionsToRemove = @(
    "ai-insights-fixed",
    "ai-strengths-test", 
    "test-simple",
    "insights-minimal",
    "test-exact-copy",
    "test-insights-debug",
    "test-minimal",
    "test-ultra-minimal",
    "send-invitation-email",
    "debug-invitation-email",
    "send-invitation-email-debug",
    "test-resend-simple",
    "test-resend-detailed",
    "send-simple-email",
    "test-hello",
    "create-invite-step-debug",
    "test-smtp-direct"
)

Write-Host ""
Write-Host "Functions to keep (8 total):" -ForegroundColor Green
foreach ($func in $functionsToKeep) {
    Write-Host "  KEEP: $func"
}

Write-Host ""
Write-Host "Functions to remove from remote ($($functionsToRemove.Count) total):" -ForegroundColor Red
foreach ($func in $functionsToRemove) {
    Write-Host "  REMOVE: $func"
}

Write-Host ""
Write-Host "WARNING: This will permanently delete functions from your Supabase project!" -ForegroundColor Yellow
$confirm = Read-Host "Continue with remote function deletion? (y/N)"

if ($confirm -match "^[Yy]$") {
    Write-Host ""
    Write-Host "Removing functions from remote Supabase..." -ForegroundColor Yellow
    
    $successCount = 0
    $errorCount = 0
    
    foreach ($func in $functionsToRemove) {
        try {
            Write-Host "  Removing: $func" -NoNewline
            
            # Use supabase functions delete command
            $result = & supabase functions delete $func --confirm 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host " SUCCESS" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host " ERROR: $result" -ForegroundColor Red
                $errorCount++
            }
        }
        catch {
            Write-Host " EXCEPTION: $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
        
        # Small delay to avoid rate limiting
        Start-Sleep -Milliseconds 500
    }
    
    Write-Host ""
    Write-Host "Cleanup Results:" -ForegroundColor Blue
    Write-Host "  Successfully removed: $successCount functions" -ForegroundColor Green
    if ($errorCount -gt 0) {
        Write-Host "  Failed to remove: $errorCount functions" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Listing remaining remote functions:" -ForegroundColor Blue
    & supabase functions list
    
    Write-Host ""
    Write-Host "Remote cleanup completed!" -ForegroundColor Green
    Write-Host "Next: Test your application to ensure everything still works" -ForegroundColor Cyan
    
} else {
    Write-Host ""
    Write-Host "Remote cleanup cancelled - no functions were removed" -ForegroundColor Gray
}
