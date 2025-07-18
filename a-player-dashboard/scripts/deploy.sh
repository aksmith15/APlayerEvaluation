#!/bin/bash

# A-Player Dashboard Deployment Script
# This script handles the complete deployment process with safety checks

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_IMAGE_NAME="a-player-dashboard"
CONTAINER_NAME="a-player-dashboard-app"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root (not recommended)
check_user() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root is not recommended for production deployments"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check available disk space (require at least 2GB)
    available_space=$(df "$PROJECT_DIR" | awk 'NR==2 {print $4}')
    required_space=2097152  # 2GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        error "Insufficient disk space. At least 2GB required, only $(($available_space / 1024))MB available."
    fi
    
    success "System requirements check passed"
}

# Validate environment configuration
check_environment() {
    log "Checking environment configuration..."
    
    if [[ ! -f "$PROJECT_DIR/.env" ]]; then
        if [[ -f "$PROJECT_DIR/.env.production" ]]; then
            log "Copying .env.production to .env"
            cp "$PROJECT_DIR/.env.production" "$PROJECT_DIR/.env"
        else
            error "No .env file found. Please create one from .env.example"
        fi
    fi
    
    # Check required environment variables
    source "$PROJECT_DIR/.env"
    
    if [[ -z "$VITE_SUPABASE_URL" ]]; then
        error "VITE_SUPABASE_URL is not set in .env file"
    fi
    
    if [[ -z "$VITE_SUPABASE_ANON_KEY" ]]; then
        error "VITE_SUPABASE_ANON_KEY is not set in .env file"
    fi
    
    success "Environment configuration is valid"
}

# Run pre-deployment tests
run_tests() {
    log "Running pre-deployment tests..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log "Installing dependencies..."
        npm ci
    fi
    
    # Run unit tests
    log "Running unit tests..."
    if ! npm run test:run; then
        error "Unit tests failed. Deployment aborted."
    fi
    
    # Run build test
    log "Testing production build..."
    if ! npm run build; then
        error "Production build failed. Deployment aborted."
    fi
    
    success "All tests passed"
}

# Create backup of current deployment
create_backup() {
    log "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    backup_name="backup_$(date +'%Y%m%d_%H%M%S')"
    
    # Stop current container if running
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log "Stopping current container for backup..."
        docker stop "$CONTAINER_NAME" || true
        
        # Export current container
        docker export "$CONTAINER_NAME" | gzip > "$BACKUP_DIR/${backup_name}_container.tar.gz"
    fi
    
    # Backup environment and configuration
    tar -czf "$BACKUP_DIR/${backup_name}_config.tar.gz" .env docker-compose.yml nginx.conf 2>/dev/null || true
    
    success "Backup created: $backup_name"
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    cd "$PROJECT_DIR"
    
    # Remove old containers and images
    log "Cleaning up old containers..."
    docker-compose down --remove-orphans || true
    docker system prune -f --volumes || true
    
    # Build new image
    log "Building new Docker image..."
    if ! docker-compose build --no-cache; then
        error "Docker build failed"
    fi
    
    # Start services
    log "Starting services..."
    if ! docker-compose up -d; then
        error "Failed to start services"
    fi
    
    success "Deployment completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    max_attempts=30
    attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        if curl -f -s http://localhost/health > /dev/null 2>&1; then
            success "Application is healthy and responding"
            return 0
        fi
        
        if curl -f -s http://localhost/ > /dev/null 2>&1; then
            success "Application is responding (no dedicated health endpoint)"
            return 0
        fi
        
        log "Waiting for application to start..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Cleanup old backups (keep only last 5)
cleanup_backups() {
    log "Cleaning up old backups..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Keep only the 5 most recent backups
        ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    fi
    
    success "Backup cleanup completed"
}

# Rollback function
rollback() {
    warning "Rolling back to previous deployment..."
    
    # Stop current containers
    docker-compose down || true
    
    # Find most recent backup
    latest_backup=$(ls -t "$BACKUP_DIR"/*_container.tar.gz 2>/dev/null | head -n 1)
    
    if [[ -n "$latest_backup" ]]; then
        log "Restoring from backup: $latest_backup"
        
        # Load backup image
        docker load < "$latest_backup"
        
        # Start previous version
        docker-compose up -d
        
        success "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Main deployment flow
main() {
    log "Starting A-Player Dashboard deployment process..."
    
    # Parse command line arguments
    case "${1:-deploy}" in
        "deploy")
            check_user
            check_requirements
            check_environment
            run_tests
            create_backup
            deploy
            health_check
            cleanup_backups
            success "🎉 Deployment completed successfully!"
            ;;
        "rollback")
            rollback
            ;;
        "health")
            health_check
            ;;
        "backup")
            create_backup
            ;;
        "test")
            run_tests
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|health|backup|test}"
            echo "  deploy   - Full deployment process (default)"
            echo "  rollback - Rollback to previous version"
            echo "  health   - Run health check only"
            echo "  backup   - Create backup only"
            echo "  test     - Run tests only"
            exit 1
            ;;
    esac
}

# Trap errors for cleanup
trap 'error "Deployment failed on line $LINENO"' ERR

# Run main function
main "$@" 