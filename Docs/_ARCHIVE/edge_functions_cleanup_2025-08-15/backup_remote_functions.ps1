# Backup Remote Edge Functions List
# Creates a backup of current remote functions before cleanup

Write-Host "Creating backup of remote Edge Functions..." -ForegroundColor Blue

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "remote_functions_backup_$timestamp.txt"

Write-Host "Saving function list to: $backupFile"

# Get function list and save to file
$functionList = & supabase functions list
$functionList | Out-File -FilePath $backupFile -Encoding utf8

Write-Host ""
Write-Host "Backup created successfully!" -ForegroundColor Green
Write-Host "File: $backupFile"
Write-Host ""
Write-Host "Current remote functions:" -ForegroundColor Blue
$functionList

Write-Host ""
Write-Host "This backup can help you identify functions to restore if needed." -ForegroundColor Cyan
