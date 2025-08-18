# A-Player Evaluation System - Complete Deployment Guide

<!-- merged: Docs/DEPLOYMENT.md, Docs/Render_Deployment_Guide.md, a-player-dashboard/DEPLOYMENT.md (2025-08-18) -->

This comprehensive guide covers all deployment scenarios for the A-Player Evaluation System, including local development, staging, and production environments.

---

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

---

## 📋 System Requirements

### Prerequisites

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **System Memory**: Minimum 2GB RAM
- **Disk Space**: Minimum 5GB available
- **Network**: HTTPS access to Supabase and external APIs
- **Node.js**: Version 22.x (for development)

### Required Services

- **Supabase Project**: Set up with authentication and database
- **Analytics Endpoint** (Optional): For performance monitoring

---

## 🌍 Environment Overview

| Environment | Frontend URL | Supabase Project | Purpose |
|-------------|--------------|------------------|---------|
| **Local Development** | `http://localhost:3000` | Local Supabase or shared dev | Development and testing |
| **Staging** | `https://staging-a-player.onrender.com` | `staging-project.supabase.co` | Pre-production testing |
| **Production** | `https://a-player-evaluations.onrender.com` | `tufjnccktzcbmaemekiz.supabase.co` | Live production system |

---

## 🔧 Environment Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Required Environment Variables

#### Critical Variables Summary

| Variable | Used By | Purpose | Secret? |
|----------|---------|---------|---------|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL | No |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public API key | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Admin operations | **Yes** |
| `RESEND_API_KEY` | Edge Functions | Email delivery | **Yes** |
| `OPENAI_API_KEY` | Edge Functions | AI coaching reports | **Yes** |
| `ANTHROPIC_API_KEY` | Edge Functions | AI fallback provider | **Yes** |

#### Frontend Environment Variables (.env)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Application Configuration  
VITE_APP_NAME="A-Player Evaluations"
VITE_APP_VERSION="2.1.0"

# Feature Flags
VITE_TENANCY_ENFORCED=true
VITE_DEBUG_MODE=false

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT=https://your-analytics.com/api
```

#### Edge Functions Environment Variables

Configure in Supabase Dashboard under `Edge Functions` → `Environment Variables`:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project.supabase.co
RESEND_API_KEY=re_your-resend-key
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
SITE_URL=https://your-domain.com
```

---

## 🏗️ Build Process

### Vite Build Configuration

The application uses **Vite 7.0.4** with TypeScript compilation and optimized production builds:

```bash
# Development
npm run dev        # Start development server (localhost:5173)

# Production Build
npm run build      # TypeScript compilation + Vite build
npm run preview    # Preview production build locally

# Testing
npm run test       # Unit tests with Vitest
npm run test:e2e   # End-to-end tests with Playwright
```

### Build Optimization

The application includes several Vite optimizations:
- Simplified `manualChunks` for stable builds
- React dependencies deduplicated
- Asset optimization for production
- Source map generation for debugging

---

## 🚀 Deployment Methods

### Method 1: Docker Deployment (Recommended)

#### 1. Build Docker Image

```bash
# Build production image
docker build -t a-player-dashboard .

# Or use Docker Compose
docker-compose build
```

#### 2. Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 3. Docker Configuration

The included `docker-compose.yml` provides:
- Nginx reverse proxy
- SSL termination
- Health checks
- Volume mounts for persistent data

### Method 2: Render Deployment

#### ✅ **SUCCESSFUL DEPLOYMENT CONFIGURATION**

**Final Working Setup:**
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run serve`
- **Node Version**: 22.x (specified in package.json engines)
- **Root Directory**: `a-player-dashboard`

#### Render Configuration

1. **Connect Repository**: Link your GitHub repository to Render
2. **Configure Build Settings**:
   ```yaml
   Build Command: npm ci && npm run build
   Start Command: npm run serve
   Node Version: 22.x
   Root Directory: a-player-dashboard
   ```

3. **Environment Variables**: Add all required variables in Render dashboard

#### Common Render Issues & Solutions

##### **Issue 1: React Context Isolation Errors**

**Problem:** Multiple createContext/forwardRef errors
```javascript
pdf-pages-DJuRIdTk.js:1 Uncaught TypeError: Cannot read properties of undefined (reading 'createContext')
```

**Root Cause:** Over-engineered Vite code splitting creating separate chunks for React-dependent components

**Solution:** Simplified vite.config.ts:
- Simplified `manualChunks` to only `react-core` bundle
- Added `resolve.dedupe` for React dependencies
- Removed problematic feature-specific chunks

##### **Issue 2: Asset Serving Issues**

**Problem:** Survey components 404 errors
```javascript
GET https://a-player-evaluations.onrender.com/assets/survey-components-EbTAcVai.js net::ERR_ABORTED 404
```

**Solution:** Added `base: '/'` and eliminated problematic chunks

### Method 3: Manual Server Deployment

#### 1. Build Application

```bash
npm ci
npm run build
```

#### 2. Configure Web Server

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/dist;
    index index.html;
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Apache Configuration:**
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/dist
    
    # SPA routing
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
    # Cache static assets
    <Directory "/path/to/dist/assets">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </Directory>
</VirtualHost>
```

---

## 🔒 Security Configuration

### SSL/TLS Setup

#### Production Requirements
- **SSL Certificate**: Required for production
- **HTTPS Redirect**: Force HTTPS for all traffic
- **Security Headers**: Implement CSP, HSTS, X-Frame-Options

#### Example Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CSP for A-Player application
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co;" always;
}
```

### Environment Security

#### Production Secrets Management
- Store sensitive keys in environment variables only
- Never commit secrets to version control
- Use different keys for staging and production
- Regularly rotate API keys

#### Edge Functions Security
Configure in Supabase Dashboard:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ... (high-privilege key)
RESEND_API_KEY=re_... (email sending)
OPENAI_API_KEY=sk-... (AI services)
```

---

## 📊 Monitoring & Health Checks

### Application Health

#### Health Check Endpoint
The application provides health monitoring:
```bash
curl https://your-domain.com/health
```

#### Key Metrics to Monitor
- **Response Time**: Page load performance
- **Error Rate**: JavaScript errors and API failures  
- **Uptime**: Service availability
- **Database Connection**: Supabase connectivity

### Logging

#### Frontend Logging
- Browser console errors
- User interaction tracking
- Performance metrics

#### Server Logging
- Access logs for traffic analysis
- Error logs for troubleshooting
- Security logs for monitoring

---

## 🔄 Database Migration & Edge Functions

### Database Deployment

#### Migration Process
```bash
# Apply migrations
supabase db push

# Verify migration status
supabase migration list
```

#### Edge Functions Deployment
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy ai-coaching-report

# Set environment variables
supabase secrets set OPENAI_API_KEY=sk-your-key
```

---

## 🧪 Testing Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed and tested
- [ ] SSL certificate valid
- [ ] Health checks passing
- [ ] Performance tests completed

### Post-Deployment Verification

#### 1. Functional Testing
```bash
# Test authentication
curl -X POST https://your-domain.com/auth/login

# Test API endpoints
curl https://your-domain.com/api/health

# Test static assets
curl https://your-domain.com/assets/app.js
```

#### 2. Performance Testing
- **Load Time**: < 3 seconds for initial page load
- **API Response**: < 500ms for most operations
- **Database Queries**: Optimized with proper indexing

#### 3. Security Testing
- SSL Labs test for HTTPS configuration
- OWASP ZAP scan for vulnerabilities
- Authentication flow verification

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading
```bash
# Check if variables are set
printenv | grep VITE_

# Verify .env file location
ls -la .env*
```

#### 2. Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm ci

# Check Node.js version
node --version  # Should be 22.x
```

#### 3. Database Connection Issues
```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Check RLS policies
supabase db inspect
```

#### 4. Edge Function Errors
```bash
# Check function logs
supabase functions logs ai-coaching-report

# Test function locally
supabase functions serve
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Docker rollback
docker-compose down
docker-compose up -d --scale app=0 previous_image

# Git rollback
git revert HEAD
git push origin main
```

#### Database Recovery
```bash
# Restore from backup
supabase db dump --file backup.sql
supabase db reset --file backup.sql
```

---

## 📈 Performance Optimization

### Frontend Optimization

#### Build Optimizations
- Code splitting for large components
- Tree shaking for unused code
- Asset compression and caching
- CDN integration for static assets

#### Runtime Optimizations
- React.memo for expensive components
- Lazy loading for routes and components
- Service worker for offline functionality
- IndexedDB for client-side caching

### Backend Optimization

#### Database Performance
- Connection pooling
- Query optimization
- Index maintenance
- Caching strategies

#### Edge Function Performance
- Cold start mitigation
- Response caching
- Timeout optimization
- Error handling

---

## 🔄 Maintenance

### Regular Maintenance Tasks

#### Weekly
- [ ] Review error logs
- [ ] Check system metrics
- [ ] Verify backup integrity
- [ ] Update security patches

#### Monthly  
- [ ] Performance analysis
- [ ] Dependency updates
- [ ] Security audit
- [ ] Capacity planning

#### Quarterly
- [ ] Full system backup
- [ ] Disaster recovery test
- [ ] Security penetration test
- [ ] Performance optimization review

### Backup Strategy

#### Database Backups
```bash
# Daily automated backup
supabase db dump --file "backup-$(date +%Y%m%d).sql"

# Point-in-time recovery setup
supabase db backup enable
```

#### Application Backups
- Source code in version control
- Environment configurations documented
- SSL certificates backed up
- Infrastructure as code maintained

---

## 📞 Support & Escalation

### Issue Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **Critical** | System down, data loss | 15 minutes | Authentication failure, database corruption |
| **High** | Major feature broken | 2 hours | PDF generation failing, user registration issues |
| **Medium** | Minor feature impact | 8 hours | UI glitches, performance degradation |
| **Low** | Enhancement requests | 72 hours | Feature requests, documentation updates |

### Contact Information

- **Primary Oncall**: [Your team contact]
- **Database Issues**: [Database admin contact]
- **Security Issues**: [Security team contact]
- **Infrastructure**: [DevOps team contact]

---

## 🎯 Success Criteria

### Deployment Success Indicators

- [ ] Application accessible via HTTPS
- [ ] Authentication working for all user types
- [ ] All major features functional
- [ ] Performance metrics within acceptable ranges
- [ ] No critical security vulnerabilities
- [ ] Monitoring and alerting operational

### Performance Benchmarks

- **Page Load Time**: < 3 seconds (95th percentile)
- **API Response Time**: < 500ms (95th percentile)
- **Uptime**: 99.9% availability
- **Error Rate**: < 0.1% of requests

**The A-Player Evaluation System is now ready for production deployment with enterprise-grade reliability and security! 🚀**
