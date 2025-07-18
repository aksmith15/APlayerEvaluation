# A-Player Dashboard Deployment Guide

This guide provides comprehensive instructions for deploying the A-Player Dashboard to production environments.

## 🚀 Quick Start

For production deployment with Docker:

```bash
# Clone and navigate to project
git clone <repository-url>
cd a-player-dashboard

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Deploy (Linux/macOS)
./scripts/deploy.sh

# Deploy (Windows)
.\scripts\deploy.ps1
```

## 📋 Prerequisites

### System Requirements

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **System Memory**: Minimum 2GB RAM
- **Disk Space**: Minimum 5GB available
- **Network**: HTTPS access to Supabase and external APIs

### Required Services

- **Supabase Project**: Set up with authentication and database
- **Analytics Endpoint** (Optional): For performance monitoring

## 🔧 Environment Configuration

### 1. Create Environment File

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Performance Monitoring (OPTIONAL)
VITE_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com/api/collect
```

### 3. Optional Configuration

```bash
# Performance Monitoring Settings
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ERROR_TRACKING=true
ENABLE_USER_ANALYTICS=true

# Security Configuration
ENABLE_SECURITY_HEADERS=true
CSP_POLICY="default-src 'self'; script-src 'self' 'unsafe-inline' https://tufjnccktzcbmaemekiz.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://tufjnccktzcbmaemekiz.supabase.co;"

# Cache Configuration
CACHE_CONTROL_MAX_AGE=31536000
STATIC_CACHE_MAX_AGE=86400
```

## 🐳 Docker Deployment

### Production Deployment

The recommended deployment method uses Docker with automated scripts:

```bash
# Linux/macOS
./scripts/deploy.sh

# Windows PowerShell
.\scripts\deploy.ps1
```

### Manual Docker Deployment

If you prefer manual deployment:

```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f a-player-dashboard
```

### Development Environment

For local development with hot reload:

```bash
# Start development environment
docker-compose --profile development up -d a-player-dashboard-dev

# The application will be available at http://localhost:5173
```

## 🏗️ Build Process

### Local Build

```bash
# Install dependencies
npm ci

# Run tests
npm run test:run

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Build Stages

The Dockerfile uses multi-stage builds:

1. **Base**: Install dependencies
2. **Development**: Development environment with hot reload
3. **Builder**: Compile application for production
4. **Production**: Nginx server with optimized static files

## 🔍 Health Checks & Monitoring

### Application Health

The deployment includes automatic health checks:

- **Health Endpoint**: `http://localhost/health`
- **Check Interval**: Every 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3 attempts

### Performance Monitoring

The application includes comprehensive performance monitoring:

- **Core Web Vitals**: LCP, FCP, CLS, INP, TTFB
- **User Analytics**: Session tracking, interaction monitoring
- **Error Tracking**: Global error handling and reporting
- **Real-time Dashboard**: Performance metrics with export capability

### Monitoring Access

- **Performance Dashboard**: Click the floating "📊 Performance" button in the application
- **Export Data**: Use the export button in the performance dashboard
- **Debug Mode**: Enabled automatically in development environments

## 🔒 Security Configuration

### Content Security Policy

The application includes a strict CSP policy:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://tufjnccktzcbmaemekiz.supabase.co;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' https://tufjnccktzcbmaemekiz.supabase.co;
```

### Security Headers

Nginx is configured with security headers:

- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin

### SSL/TLS Configuration

For HTTPS deployment:

1. Place SSL certificates in `./ssl/` directory
2. Update `docker-compose.yml` to mount certificates
3. Configure Nginx with SSL settings

## 🔄 Deployment Operations

### Backup & Restore

#### Create Backup

```bash
# Linux/macOS
./scripts/deploy.sh backup

# Windows
.\scripts\deploy.ps1 -Action backup
```

#### Rollback Deployment

```bash
# Linux/macOS
./scripts/deploy.sh rollback

# Windows
.\scripts\deploy.ps1 -Action rollback
```

### Updates

For application updates:

1. Pull latest code: `git pull origin main`
2. Run deployment script: `./scripts/deploy.sh`
3. The script automatically handles backups and health checks

### Log Management

#### View Application Logs

```bash
# Docker Compose logs
docker-compose logs -f a-player-dashboard

# Nginx logs
docker-compose exec a-player-dashboard tail -f /var/log/nginx/access.log
docker-compose exec a-player-dashboard tail -f /var/log/nginx/error.log
```

#### Log Rotation

Logs are automatically managed by Docker. For custom log rotation:

```bash
# Configure in docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "100m"
    max-file: "5"
```

## 🌐 Production Considerations

### Performance Optimization

- **Static Asset Caching**: 1 year cache for static assets
- **Gzip Compression**: Enabled for all text-based content
- **Image Optimization**: Serve WebP when supported
- **Bundle Splitting**: Code splitting for optimal loading

### Scaling

For high-traffic deployments:

1. **Load Balancing**: Use multiple container instances
2. **CDN**: Serve static assets via CDN
3. **Database**: Optimize Supabase connection pooling
4. **Monitoring**: Implement external monitoring (Datadog, New Relic)

### Environment-Specific Configuration

#### Staging Environment

```bash
# Copy production config
cp .env.production .env.staging

# Modify for staging
VITE_SUPABASE_URL=https://staging-project.supabase.co
ENABLE_PERFORMANCE_MONITORING=false
LOG_LEVEL=debug
```

#### Production Environment

```bash
# Use production-optimized settings
NODE_ENV=production
ENABLE_PERFORMANCE_MONITORING=true
LOG_LEVEL=warn
ENABLE_ACCESS_LOGS=true
```

## 🚨 Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs a-player-dashboard

# Check resource usage
docker stats
```

#### Health Check Failures

```bash
# Manual health check
curl -f http://localhost/health

# Check Nginx configuration
docker-compose exec a-player-dashboard nginx -t

# Restart services
docker-compose restart
```

#### Environment Variable Issues

```bash
# Verify environment loading
docker-compose exec a-player-dashboard env | grep VITE_

# Check .env file syntax
cat .env | grep -v '^#' | grep '='
```

### Performance Issues

#### Slow Initial Load

1. Check network connectivity to Supabase
2. Verify CDN configuration
3. Review performance dashboard metrics
4. Check browser developer tools for bottlenecks

#### Memory Issues

```bash
# Check container memory usage
docker stats a-player-dashboard-app

# Increase container memory limits in docker-compose.yml
mem_limit: 1g
```

### Support

For deployment issues:

1. Check the application logs first
2. Review this deployment guide
3. Verify environment configuration
4. Test with the health check script

## 📚 Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Supabase Documentation**: https://supabase.com/docs
- **Nginx Configuration**: https://nginx.org/en/docs/
- **Performance Monitoring**: Core Web Vitals documentation

---

## 🎯 Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Supabase project set up and accessible
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Health checks tested
- [ ] Performance benchmarks established
- [ ] Security headers validated
- [ ] Test deployment in staging environment
- [ ] Documentation reviewed and updated 