# Environment Variables Reference

Complete reference for all environment variables used in the A-Player Evaluation System across frontend, backend, CI/CD, and deployment environments.

## Environment Variables Table

| NAME | Used by | Purpose | Required (Dev/Prod) | Default/Example | Secret? | Source Location |
|------|---------|---------|-------------------|-----------------|---------|-----------------|
| **Core Supabase Configuration** |
| `VITE_SUPABASE_URL` | FE | Supabase project URL for client connections | Yes/Yes | `https://your-project-ref.supabase.co` | N | `src/constants/config.ts:10` |
| `VITE_SUPABASE_ANON_KEY` | FE | Supabase anonymous/public key for client auth | Yes/Yes | `eyJhbGciOiJIUzI1Ni...` | N | `src/constants/config.ts:11` |
| `SUPABASE_URL` | Edge | Supabase project URL for Edge Functions | Yes/Yes | `https://your-project-ref.supabase.co` | N | `supabase/functions/*/index.ts` |
| `SUPABASE_ANON_KEY` | Edge | Supabase anonymous key for Edge Functions | Yes/Yes | `eyJhbGciOiJIUzI1Ni...` | N | `supabase/functions/*/index.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge | Supabase service role key for admin operations | Yes/Yes | `eyJhbGciOiJIUzI1Ni...` | **Y** | `supabase/functions/*/index.ts` |
| **Email & External Services** |
| `RESEND_API_KEY` | Edge | Resend email service API key for transactional emails | Yes/Yes | `re_4KaYor7w_L2YqDgxfTRr...` | **Y** | `supabase/functions/create-invite/index.ts:205` |
| `OPENAI_API_KEY` | Edge | OpenAI API key for AI coaching reports | No/Yes | `sk-proj-...` | **Y** | `supabase/functions/ai-*/index.ts` |
| `ANTHROPIC_API_KEY` | Edge | Anthropic Claude API key for AI analysis (fallback) | No/Yes | `sk-ant-...` | **Y** | `supabase/functions/ai-*/index.ts` |
| **Application Configuration** |
| `VITE_APP_TITLE` | FE | Application title displayed in browser | No/No | `A-Player Evaluation Dashboard` | N | `env.example:14` |
| `VITE_APP_ENVIRONMENT` | FE | Environment identifier for app behavior | No/No | `production` | N | `env.example:15` |
| `SITE_URL` | Edge | Base URL for redirect operations in Edge Functions | No/Yes | `https://a-player-evaluations.onrender.com` | N | `supabase/functions/invite-redirect/index.ts:22` |
| `VITE_APP_URL` | Edge | Alternative base URL for Edge Function redirects | No/No | `https://your-app-url.com` | N | `supabase/functions/test-create-invite-debug/index.ts:24` |
| **Analytics & Monitoring** |
| `VITE_ANALYTICS_ENABLED` | FE | Enable/disable analytics collection | No/No | `false` | N | `env.example:18` |
| `VITE_PERFORMANCE_MONITORING` | FE | Enable/disable performance monitoring | No/No | `false` | N | `env.example:19` |
| `VITE_ANALYTICS_ENDPOINT` | FE | Analytics service endpoint URL | No/No | `https://your-analytics-endpoint.com/api/collect` | N | `src/utils/performance.ts:435` |
| **Feature Flags** |
| `VITE_FEATURE_PDF_GENERATION` | FE | Enable/disable PDF generation features | No/No | `true` | N | `env.example:22` |
| `VITE_FEATURE_EMAIL_INVITES` | FE | Enable/disable email invitation system | No/No | `true` | N | `env.example:23` |
| `VITE_FEATURE_ANALYTICS_DASHBOARD` | FE | Enable/disable analytics dashboard | No/No | `true` | N | `env.example:24` |
| **Development & Debug** |
| `VITE_TENANCY_ENFORCED` | FE | Enforce tenant isolation in development | No/No | `false` | N | `src/lib/db.ts:8`, `src/utils/debugTenant.ts:59` |
| **Runtime Environment** |
| `NODE_ENV` | FE/CI | Node.js environment mode | Auto/Auto | `development`/`production` | N | Multiple locations |
| `MODE` | FE | Vite mode (dev-only via import.meta.env) | Auto/Auto | `development`/`production` | N | `src/utils/debugTenant.ts:61` |
| `DEV` | FE | Vite development mode flag (dev-only) | Auto/N/A | `true`/`false` | N | Multiple `import.meta.env.DEV` |
| `PROD` | FE | Vite production mode flag (dev-only) | N/A/Auto | `false`/`true` | N | `src/lib/monitoring.ts:54`, `src/lib/logRls.ts:49` |
| **CI/CD & Testing** |
| `CI` | CI | Continuous Integration environment flag | Auto/N/A | `true` | N | `playwright.config.ts:11,13,15,83` |
| `PORT` | Server | Express server port for production | No/Auto | `8080` | N | `server.cjs:47` |
| **Docker Analytics (Optional)** |
| `ANALYTICS_SECRET_KEY` | Docker | Secret key for self-hosted analytics | No/No | `your-secret-key` | **Y** | `docker-compose.yml:68` |
| `ANALYTICS_DATABASE_URL` | Docker | Database URL for self-hosted analytics | No/No | `postgresql://user:pass@host:5432/db` | **Y** | `docker-compose.yml:69` |
| `ANALYTICS_DB_USER` | Docker | Database user for analytics PostgreSQL | No/No | `analytics` | **Y** | `docker-compose.yml:84` |
| `ANALYTICS_DB_PASSWORD` | Docker | Database password for analytics PostgreSQL | No/No | `your-password` | **Y** | `docker-compose.yml:85` |

## Environment-Specific Configuration

### Development Environment
**Required Variables:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - For Edge Functions testing
- `RESEND_API_KEY` - For email functionality

**Optional Variables:**
- `VITE_TENANCY_ENFORCED=false` - Disable tenant enforcement for easier testing
- `VITE_ANALYTICS_ENABLED=false` - Disable analytics in development
- `OPENAI_API_KEY` - For testing AI features
- `ANTHROPIC_API_KEY` - For testing AI fallback

### Production Environment
**Required Variables:**
- `VITE_SUPABASE_URL` - Production Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Production Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Production service role key (**SECRET**)
- `RESEND_API_KEY` - Production email API key (**SECRET**)
- `OPENAI_API_KEY` - Production AI API key (**SECRET**)
- `ANTHROPIC_API_KEY` - Production AI fallback key (**SECRET**)
- `SITE_URL` - Production application URL

**Recommended Variables:**
- `VITE_TENANCY_ENFORCED=true` - Enable tenant isolation
- `VITE_ANALYTICS_ENABLED=true` - Enable analytics collection
- `VITE_PERFORMANCE_MONITORING=true` - Enable performance monitoring

## Variable Usage Patterns

### Frontend (Vite) Variables
```typescript
// All frontend variables must be prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
const mode = import.meta.env.MODE;
```

### Edge Functions (Deno) Variables
```typescript
// Edge Functions use Deno.env.get()
const apiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
```

### Node.js Variables
```javascript
// Server and test environments use process.env
const port = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === 'production';
```

## Security Notes

### Secret Variables ⚠️
The following variables contain sensitive information and should be handled securely:
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- `RESEND_API_KEY` - Email service access
- `OPENAI_API_KEY` - AI service access with usage costs
- `ANTHROPIC_API_KEY` - AI service access with usage costs
- `ANALYTICS_SECRET_KEY` - Analytics service security
- `ANALYTICS_DATABASE_URL` - Database connection string
- `ANALYTICS_DB_PASSWORD` - Database credentials

### Deployment Security
- **Supabase Edge Functions**: Set secrets via `supabase secrets set KEY=value`
- **Render.com**: Use environment variables dashboard
- **Docker**: Use Docker secrets or environment files with restricted permissions
- **CI/CD**: Store secrets in repository secrets (GitHub Actions) or equivalent

### Variable Exposure
- **Frontend (`VITE_*`)**: Exposed in client-side code, never use for secrets
- **Edge Functions**: Server-side only, safe for secrets
- **Node.js Server**: Server-side only, safe for secrets

## Validation & Health Checks

### Startup Validation
The application validates critical environment variables on startup:

```typescript
// Frontend validation (src/services/supabase.ts)
if (!SUPABASE_CONFIG.URL || SUPABASE_CONFIG.URL === 'your-supabase-url') {
  console.error('⚠️ Supabase URL is not configured properly');
}

// Edge Function validation (create-invite/index.ts)
if (!resendApiKey) {
  return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), 
    { status: 500 });
}
```

### Deploy Scripts Validation
Both PowerShell and Bash deploy scripts validate required variables:

```powershell
# PowerShell (scripts/deploy.ps1)
if (-not $envVars.ContainsKey('VITE_SUPABASE_URL')) {
    Write-Error-Custom "VITE_SUPABASE_URL is not set in .env file"
}
```

```bash
# Bash (scripts/deploy.sh)
if [[ -z "$VITE_SUPABASE_URL" ]]; then
    error "VITE_SUPABASE_URL is not set in .env file"
fi
```

## Potential Cleanup

### Unused Variables Found
Based on code analysis, the following variables are defined in examples but not found in active code:

1. **`VITE_APP_TITLE`** - Defined in `env.example` but not used in codebase
   - **Location**: `env.example:14`
   - **Status**: Potentially unused, safe to remove if confirmed

2. **`VITE_APP_ENVIRONMENT`** - Defined in `env.example` but not used in codebase
   - **Location**: `env.example:15`
   - **Status**: Potentially unused, safe to remove if confirmed

3. **`VITE_ANALYTICS_ENABLED`** - Defined in `env.example` but not actively checked
   - **Location**: `env.example:18`
   - **Status**: Feature flag without implementation

4. **`VITE_PERFORMANCE_MONITORING`** - Defined in `env.example` but not actively checked
   - **Location**: `env.example:19`
   - **Status**: Feature flag without implementation

5. **Feature Flags** - All `VITE_FEATURE_*` variables are defined but not used
   - **Locations**: `env.example:22-24`
   - **Status**: Placeholder feature flags, safe to remove if features are stable

### Stale Variables
Variables that appear to be development artifacts:

1. **`VITE_APP_URL`** - Only used in debug Edge Function
   - **Location**: `supabase/functions/test-create-invite-debug/index.ts:24`
   - **Status**: Debug-only, can be removed with debug function

2. **Analytics Docker Variables** - Only used in optional Docker services
   - **Locations**: `docker-compose.yml:68,69,84,85`
   - **Status**: Optional feature, keep if analytics service is planned

## Environment File Templates

### .env.development
```bash
# Development Environment
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key

# Edge Functions (set via supabase secrets)
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key
RESEND_API_KEY=your-dev-resend-key
OPENAI_API_KEY=your-dev-openai-key

# Development Features
VITE_TENANCY_ENFORCED=false
VITE_ANALYTICS_ENABLED=false
```

### .env.production
```bash
# Production Environment
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
SITE_URL=https://your-production-url.com

# Production Features
VITE_TENANCY_ENFORCED=true
VITE_ANALYTICS_ENABLED=true
VITE_PERFORMANCE_MONITORING=true

# Secrets (set via deployment platform)
# SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key
# RESEND_API_KEY=your-prod-resend-key
# OPENAI_API_KEY=your-prod-openai-key
# ANTHROPIC_API_KEY=your-prod-anthropic-key
```

---

**📁 Related Documentation:**
- [DEPLOYMENT.md](./DEPLOYMENT.md#environment--secrets) - Deployment-specific environment setup
- [INTEGRATIONS.md](./INTEGRATIONS.md) - External service API key management
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions/secrets)
