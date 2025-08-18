# A-Player Evaluation System Deployment Guide

## Overview

This document provides comprehensive deployment instructions for the A-Player Evaluation System across different environments and platforms.

## Environments

| Environment | Frontend URL | Supabase Project | Purpose |
|-------------|--------------|------------------|---------|
| **Local Development** | `http://localhost:3000` | Local Supabase or shared dev | Development and testing |
| **Staging** | `https://staging-a-player.onrender.com` | `staging-project.supabase.co` | Pre-production testing |
| **Production** | `https://a-player-evaluations.onrender.com` | `tufjnccktzcbmaemekiz.supabase.co` | Live production system |

## Build Process

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

## Configuration Management

### Environment & Secrets

The A-Player system uses environment variables for configuration across frontend, Edge Functions, and deployment environments. **For complete environment variable reference including security notes, validation, and cleanup recommendations, see [ENVIRONMENT.md](./ENVIRONMENT.md).**

#### Critical Variables Summary

| Variable | Used By | Purpose | Secret? |
|----------|---------|---------|---------|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL | No |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public API key | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Admin operations | **Yes** |
| `RESEND_API_KEY` | Edge Functions | Email delivery | **Yes** |
| `OPENAI_API_KEY` | Edge Functions | AI coaching reports | **Yes** |
| `ANTHROPIC_API_KEY` | Edge Functions | AI fallback provider | **Yes** |

#### Environment Variable Patterns
- **Frontend**: All variables must be prefixed with `VITE_` (exposed in client)
- **Edge Functions**: Use `Deno.env.get()` for server-side variables
- **Secrets**: Set via `supabase secrets set` for Edge Functions
- **Validation**: Deploy scripts validate required variables before deployment

## Deploy Platforms

### Render.com (Recommended)

**Service Type:** Web Service  
**Runtime:** Node.js 22.x  

**Configuration:**
```yaml
# Render Service Settings
Build Command: npm ci && npm run build
Start Command: npm run serve
Root Directory: a-player-dashboard
Environment: Node 22.x
```

### Docker Deployment

**Docker Compose Commands:**
```bash
# Production deployment
docker-compose up -d

# Development with hot reload  
docker-compose --profile development up -d a-player-dashboard-dev
```

## Rollback Procedures

### Frontend Rollback

**Render.com:**
1. Access Render Dashboard
2. Navigate to service deployments
3. Select previous successful deployment
4. Click "Redeploy" with previous commit

### Database Rollback

**Migration Rollback:**
```bash
# Rollback one migration
supabase db reset --local

# Point-in-time recovery (Supabase Pro)
# Via Supabase Dashboard > Database > Backups
```

## Supabase CLI Operations

### Database Commands

The Supabase CLI provides comprehensive database management capabilities:

```bash
# Database Schema Management
supabase db push                     # Apply local migrations to remote database
supabase db reset                    # Reset database to clean state
supabase db diff -f migration_name   # Generate migration from schema differences
supabase migration list              # List all migrations and their status

# Type Generation
supabase gen types typescript --project-ref YOUR_REF > src/types/database.ts

# Local Development
supabase start                       # Start local Supabase stack
supabase stop                        # Stop local services
supabase status                      # Check service status
```

### Edge Functions Deployment

**Deploy Individual Functions:**
```bash
# Deploy specific function
supabase functions deploy create-invite --project-ref YOUR_PROJECT_REF

# Deploy with environment variables
supabase secrets set RESEND_API_KEY=your-key-here
supabase functions deploy create-invite

# Verify deployment
supabase functions list
```

**Deploy All Functions:**
```bash
# Deploy all functions in functions/ directory
supabase functions deploy --project-ref YOUR_PROJECT_REF

# Set all secrets from .env file
supabase secrets set --env-file .env
```

**Edge Function Environment Variables:**
```bash
# Set individual secrets
supabase secrets set RESEND_API_KEY=re_4KaYor7w_L2YqDgxfTRr4pkLGSVWu9cuiTryu
supabase secrets set OPENAI_API_KEY=sk-proj-your-key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key

# List current secrets (names only, not values)
supabase secrets list

# Unset a secret
supabase secrets unset SECRET_NAME
```

**Edge Function Testing:**
```bash
# Test locally before deployment
supabase functions serve create-invite

# Test deployed function
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/create-invite' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email": "test@example.com", "company_id": "test-company"}'
```

### Production Edge Function Deployment Steps

1. **Verify Local Function**
   ```bash
   supabase functions serve create-invite
   # Test function locally
   ```

2. **Set Production Secrets**
   ```bash
   supabase secrets set RESEND_API_KEY=production-key --project-ref YOUR_REF
   supabase secrets set OPENAI_API_KEY=production-key --project-ref YOUR_REF
   supabase secrets set ANTHROPIC_API_KEY=production-key --project-ref YOUR_REF
   ```

3. **Deploy Function**
   ```bash
   supabase functions deploy create-invite --project-ref YOUR_REF
   ```

4. **Verify Deployment**
   ```bash
   # Check function logs
   supabase functions logs create-invite --project-ref YOUR_REF
   
   # Test production function
   curl -X POST 'https://YOUR_REF.supabase.co/functions/v1/create-invite' \
     -H 'Authorization: Bearer PROD_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"email": "test@company.com", "company_id": "real-company-id"}'
   ```

## Backup & Restore Procedures

### Database Backups

**Automated Backups (Supabase Pro):**
- **Point-in-time Recovery**: Available for last 7 days on Pro plan
- **Daily Backups**: Automatic daily backups retained for 7 days
- **Access**: Via Supabase Dashboard > Database > Backups

**Manual Backup Commands:**
```bash
# Backup specific tables
pg_dump --host=db.YOUR_REF.supabase.co \
        --port=5432 \
        --username=postgres \
        --dbname=postgres \
        --table=profiles \
        --table=companies \
        > manual_backup.sql

# Full database backup (requires service role key)
supabase db dump --project-ref YOUR_REF > full_backup.sql

# Local backup
supabase db dump --local > local_backup.sql
```

### Restore Procedures

**Point-in-Time Recovery (Supabase Dashboard):**
1. Navigate to Supabase Dashboard > Database > Backups
2. Select "Point in time recovery"
3. Choose timestamp (within last 7 days)
4. Confirm restore operation

**Manual Restore:**
```bash
# Restore from SQL backup
psql --host=db.YOUR_REF.supabase.co \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     < backup_file.sql

# Restore local database
supabase db reset --with-seed backup_file.sql
```

### Backup Strategy Recommendations

**Development:**
- Use `supabase db dump --local` before major schema changes
- Regular exports of test data for seeding

**Staging:**
- Weekly manual backups before deployments
- Point-in-time recovery testing

**Production:**
- Rely on automated Supabase Pro backups
- Monthly full database exports for long-term retention
- Test restore procedures quarterly

### Data Migration Between Environments

```bash
# Export from staging
supabase db dump --project-ref STAGING_REF > staging_data.sql

# Import to production (use with caution)
# Recommend selective table imports rather than full dumps
psql --host=db.PROD_REF.supabase.co \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     < staging_data.sql
```

## Rollback Procedures

### Frontend Rollback

**Render.com Platform:**
1. Access Render Dashboard → Your Service
2. Navigate to "Deployments" tab
3. Locate previous successful deployment
4. Click "Redeploy" on the target version
5. Monitor deployment logs for success

**Manual Git Rollback:**
```bash
# Identify commit to rollback to
git log --oneline -10

# Create rollback branch
git checkout -b rollback-to-COMMIT_HASH

# Reset to specific commit
git reset --hard COMMIT_HASH

# Force push (if necessary)
git push origin rollback-to-COMMIT_HASH --force
```

### Database Rollback

**Migration Rollback:**
```bash
# View migration history
supabase migration list

# Reset to specific migration
supabase db reset --to-migration MIGRATION_TIMESTAMP

# Create new migration to undo changes
supabase db diff -f rollback_recent_changes
```

**Point-in-Time Recovery:**
- Use Supabase Dashboard for GUI-based recovery
- Available for last 7 days (Pro plan)
- Creates new database instance

### Edge Function Rollback

```bash
# Redeploy previous version from git
git checkout PREVIOUS_COMMIT
supabase functions deploy FUNCTION_NAME --project-ref YOUR_REF

# Or restore from local backup
# (Keep local copies of working function versions)
```

### Emergency Rollback Checklist

1. **Identify Issue Scope**
   - Frontend only? → Render rollback
   - Database schema? → Migration rollback or point-in-time recovery
   - Edge Functions? → Function redeploy

2. **Communication**
   - Notify stakeholders of rollback initiation
   - Document incident and resolution steps

3. **Verification**
   - Test critical user flows after rollback
   - Monitor error rates and performance metrics
   - Verify data integrity

4. **Post-Rollback**
   - Investigate root cause
   - Plan proper fix for next deployment
   - Update rollback procedures if needed

---

**🔗 Related Documentation:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [INTEGRATIONS.md](./INTEGRATIONS.md) - External service configurations
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Local development setup and workflows
- [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment variable reference
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli) - Official CLI reference
