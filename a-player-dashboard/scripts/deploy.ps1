# A-Player Dashboard Deployment Script (PowerShell)
# This script handles the complete deployment process with safety checks

param(
    [string]$Action = "deploy"
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$DockerImageName = "a-player-dashboard"
$ContainerName = "a-player-dashboard-app"
$BackupDir = Join-Path $ProjectDir "backups"
$LogFile = Join-Path $ProjectDir "deploy.log"

# Logging functions
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor Blue
    $logMessage | Out-File -FilePath $LogFile -Append
}

function Write-Error-Custom {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [ERROR] $Message"
    Write-Host $logMessage -ForegroundColor Red
    $logMessage | Out-File -FilePath $LogFile -Append
    exit 1
}

function Write-Warning-Custom {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [WARNING] $Message"
    Write-Host $logMessage -ForegroundColor Yellow
    $logMessage | Out-File -FilePath $LogFile -Append
}

function Write-Success {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [SUCCESS] $Message"
    Write-Host $logMessage -ForegroundColor Green
    $logMessage | Out-File -FilePath $LogFile -Append
}

# Check if running as administrator
function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    $adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator
    return $principal.IsInRole($adminRole)
}

# Check system requirements
function Test-Requirements {
    Write-Log "Checking system requirements..."
    
    # Check Docker
    try {
        docker --version | Out-Null
    }
    catch {
        Write-Error-Custom "Docker is not installed or not in PATH. Please install Docker Desktop first."
    }
    
    # Check Docker Compose
    try {
        docker-compose --version | Out-Null
    }
    catch {
        try {
            docker compose version | Out-Null
        }
        catch {
            Write-Error-Custom "Docker Compose is not available. Please ensure Docker Desktop includes Compose."
        }
    }
    
    # Check available disk space (require at least 2GB)
    $drive = Get-PSDrive -Name (Split-Path $ProjectDir -Qualifier).Trim(':')
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    
    if ($freeSpaceGB -lt 2) {
        Write-Error-Custom "Insufficient disk space. At least 2GB required, only ${freeSpaceGB}GB available."
    }
    
    Write-Success "System requirements check passed"
}

# Validate environment configuration
function Test-Environment {
    Write-Log "Checking environment configuration..."
    
    $envFile = Join-Path $ProjectDir ".env"
    $envProdFile = Join-Path $ProjectDir ".env.production"
    
    if (-not (Test-Path $envFile)) {
        if (Test-Path $envProdFile) {
            Write-Log "Copying .env.production to .env"
            Copy-Item $envProdFile $envFile
        }
        else {
            Write-Error-Custom "No .env file found. Please create one from .env.example"
        }
    }
    
    # Check required environment variables
    $envContent = Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' }
    $envVars = @{}
    
    foreach ($line in $envContent) {
        $parts = $line -split '=', 2
        if ($parts.Length -eq 2) {
            $envVars[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
    
    if (-not $envVars.ContainsKey('VITE_SUPABASE_URL') -or [string]::IsNullOrEmpty($envVars['VITE_SUPABASE_URL'])) {
        Write-Error-Custom "VITE_SUPABASE_URL is not set in .env file"
    }
    
    if (-not $envVars.ContainsKey('VITE_SUPABASE_ANON_KEY') -or [string]::IsNullOrEmpty($envVars['VITE_SUPABASE_ANON_KEY'])) {
        Write-Error-Custom "VITE_SUPABASE_ANON_KEY is not set in .env file"
    }
    
    Write-Success "Environment configuration is valid"
}

# Run pre-deployment tests
function Invoke-Tests {
    Write-Log "Running pre-deployment tests..."
    
    Set-Location $ProjectDir
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Log "Installing dependencies..."
        npm ci
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Failed to install dependencies"
        }
    }
    
    # Run unit tests
    Write-Log "Running unit tests..."
    npm run test:run
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Unit tests failed. Deployment aborted."
    }
    
    # Run build test
    Write-Log "Testing production build..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Production build failed. Deployment aborted."
    }
    
    Write-Success "All tests passed"
}

# Create backup of current deployment
function New-Backup {
    Write-Log "Creating backup of current deployment..."
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    
    $backupName = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    
    # Stop current container if running
    $runningContainer = docker ps -q -f "name=$ContainerName" 2>$null
    if ($runningContainer) {
        Write-Log "Stopping current container for backup..."
        docker stop $ContainerName 2>$null | Out-Null
        
        # Export current container
        $backupFile = Join-Path $BackupDir "${backupName}_container.tar.gz"
        docker export $ContainerName | docker run --rm -i alpine gzip > $backupFile 2>$null
    }
    
    # Backup environment and configuration
    $configFiles = @(".env", "docker-compose.yml", "nginx.conf") | Where-Object { Test-Path (Join-Path $ProjectDir $_) }
    if ($configFiles) {
        $configBackup = Join-Path $BackupDir "${backupName}_config.zip"
        Compress-Archive -Path ($configFiles | ForEach-Object { Join-Path $ProjectDir $_ }) -DestinationPath $configBackup -Force
    }
    
    Write-Success "Backup created: $backupName"
}

# Build and deploy
function Start-Deploy {
    Write-Log "Starting deployment..."
    
    Set-Location $ProjectDir
    
    # Remove old containers and images
    Write-Log "Cleaning up old containers..."
    docker-compose down --remove-orphans 2>$null | Out-Null
    docker system prune -f --volumes 2>$null | Out-Null
    
    # Build new image
    Write-Log "Building new Docker image..."
    docker-compose build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Docker build failed"
    }
    
    # Start services
    Write-Log "Starting services..."
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to start services"
    }
    
    Write-Success "Deployment completed"
}

# Health check
function Test-Health {
    Write-Log "Performing health check..."
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-Log "Health check attempt $attempt/$maxAttempts"
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "Application is healthy and responding"
                return
            }
        }
        catch {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost/" -TimeoutSec 5 -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    Write-Success "Application is responding (no dedicated health endpoint)"
                    return
                }
            }
            catch {
                # Continue to retry
            }
        }
        
        Write-Log "Waiting for application to start..."
        Start-Sleep -Seconds 10
        $attempt++
    }
    
    Write-Error-Custom "Health check failed after $maxAttempts attempts"
}

# Cleanup old backups (keep only last 5)
function Remove-OldBackups {
    Write-Log "Cleaning up old backups..."
    
    if (Test-Path $BackupDir) {
        $backups = Get-ChildItem -Path $BackupDir -Filter "*.tar.gz" | Sort-Object LastWriteTime -Descending
        if ($backups.Count -gt 5) {
            $backups | Select-Object -Skip 5 | Remove-Item -Force
        }
        
        $configBackups = Get-ChildItem -Path $BackupDir -Filter "*.zip" | Sort-Object LastWriteTime -Descending
        if ($configBackups.Count -gt 5) {
            $configBackups | Select-Object -Skip 5 | Remove-Item -Force
        }
    }
    
    Write-Success "Backup cleanup completed"
}

# Rollback function
function Start-Rollback {
    Write-Warning-Custom "Rolling back to previous deployment..."
    
    # Stop current containers
    docker-compose down 2>$null | Out-Null
    
    # Find most recent backup
    $latestBackup = Get-ChildItem -Path $BackupDir -Filter "*_container.tar.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($latestBackup) {
        Write-Log "Restoring from backup: $($latestBackup.Name)"
        
        # Load backup image
        Get-Content $latestBackup.FullName | docker load
        
        # Start previous version
        docker-compose up -d
        
        Write-Success "Rollback completed"
    }
    else {
        Write-Error-Custom "No backup found for rollback"
    }
}

# Main deployment flow
function Main {
    Write-Log "Starting A-Player Dashboard deployment process..."
    
    # Check if running as administrator
    if (Test-Admin) {
        Write-Warning-Custom "Running as administrator. This is not recommended for production deployments."
    }
    
    switch ($Action.ToLower()) {
        "deploy" {
            Test-Requirements
            Test-Environment
            Invoke-Tests
            New-Backup
            Start-Deploy
            Test-Health
            Remove-OldBackups
            Write-Success "🎉 Deployment completed successfully!"
        }
        "rollback" {
            Start-Rollback
        }
        "health" {
            Test-Health
        }
        "backup" {
            New-Backup
        }
        "test" {
            Invoke-Tests
        }
        default {
            Write-Host "Usage: .\scripts\deploy.ps1 [-Action {deploy|rollback|health|backup|test}]"
            Write-Host "  deploy   - Full deployment process (default)"
            Write-Host "  rollback - Rollback to previous version"
            Write-Host "  health   - Run health check only"
            Write-Host "  backup   - Create backup only"
            Write-Host "  test     - Run tests only"
            exit 1
        }
    }
}

# Error handling
try {
    Main
}
catch {
    Write-Error-Custom "Deployment failed: $($_.Exception.Message)"
} 