# Edge Functions Documentation

This document provides comprehensive documentation for all Supabase Edge Functions in the A-Player Evaluation System.

## Production Functions

### create-invite

| Field | Value |
|-------|-------|
| **NAME** | create-invite |
| **Route** | `/functions/v1/create-invite` |
| **Purpose** | Allow company admins to generate secure invite links for new users |
| **Auth** | Required - JWT token with admin role validation |
| **Env Vars** | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `SITE_URL` |
| **Reads/Writes** | **Reads**: `people` (role validation), **Writes**: `auth.users` (via admin API), **External**: Resend API |
| **Timeouts/limits** | Default timeout (25s), Email rate limiting via Resend |
| **Called by** | Admin panels, user management interfaces |

### accept-invite-v2

| Field | Value |
|-------|-------|
| **NAME** | accept-invite-v2 |
| **Route** | `/functions/v1/accept-invite-v2` |
| **Purpose** | Process invitation acceptance and user onboarding with enhanced validation |
| **Auth** | Token-based (invite token + JWT) |
| **Env Vars** | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Reads/Writes** | **Reads**: `invitations`, **Writes**: `people`, `company_memberships` |
| **Timeouts/limits** | Default timeout (25s) |
| **Called by** | Invite acceptance pages, onboarding flows |

### invite-redirect

| Field | Value |
|-------|-------|
| **NAME** | invite-redirect |
| **Route** | `/functions/v1/invite-redirect` |
| **Purpose** | Stable redirector for invite links to decouple email links from frontend hostname |
| **Auth** | None (public redirect) |
| **Env Vars** | `SITE_URL` |
| **Reads/Writes** | None (redirect only) |
| **Timeouts/limits** | Instant redirect, no processing |
| **Called by** | Email invite links, external referrals |

### ai-coaching-report

| Field | Value |
|-------|-------|
| **NAME** | ai-coaching-report |
| **Route** | `/functions/v1/ai-coaching-report` |
| **Purpose** | Generate comprehensive coaching reports from evaluation scores using AI analysis |
| **Auth** | Required - JWT token |
| **Env Vars** | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| **Reads/Writes** | **Reads**: Evaluation data (via request payload), **External**: Anthropic/OpenAI APIs |
| **Timeouts/limits** | Extended timeout (120s for AI processing), Token usage limits |
| **Called by** | Report generation interfaces, PDF builders |

### ai-descriptive-review

| Field | Value |
|-------|-------|
| **NAME** | ai-descriptive-review |
| **Route** | `/functions/v1/ai-descriptive-review` |
| **Purpose** | Generate descriptive review text per core group from compact scores and grades |
| **Auth** | Required - JWT token |
| **Env Vars** | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| **Reads/Writes** | **Reads**: Score data (via request payload), **External**: Anthropic/OpenAI APIs |
| **Timeouts/limits** | Extended timeout (90s), Token usage limits |
| **Called by** | Performance review generators, analytics dashboards |

### ai-development-insights

| Field | Value |
|-------|-------|
| **NAME** | ai-development-insights |
| **Route** | `/functions/v1/ai-development-insights` |
| **Purpose** | Generate actionable insights for improving employee development areas |
| **Auth** | Required - JWT token |
| **Env Vars** | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| **Reads/Writes** | **Reads**: Employee and attribute data (via payload), **External**: Anthropic/OpenAI APIs |
| **Timeouts/limits** | Extended timeout (90s), Token usage limits |
| **Called by** | Development planning tools, coaching interfaces |

### ai-strengths-insights

| Field | Value |
|-------|-------|
| **NAME** | ai-strengths-insights |
| **Route** | `/functions/v1/ai-strengths-insights` |
| **Purpose** | Generate actionable insights for leveraging employee strengths |
| **Auth** | Required - JWT token |
| **Env Vars** | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| **Reads/Writes** | **Reads**: Employee and attribute data (via payload), **External**: Anthropic/OpenAI APIs |
| **Timeouts/limits** | Extended timeout (90s), Token usage limits |
| **Called by** | Strength analysis tools, talent optimization interfaces |

## Test and Debug Functions

### test-cors

| Field | Value |
|-------|-------|
| **NAME** | test-cors |
| **Route** | `/functions/v1/test-cors` |
| **Purpose** | **[TEST]** Minimal test function to debug CORS headers and preflight requests |
| **Auth** | None |
| **Env Vars** | None |
| **Reads/Writes** | None |
| **Timeouts/limits** | Instant response |
| **Called by** | Development testing, CORS debugging |

### test-create-invite-debug

| Field | Value |
|-------|-------|
| **NAME** | test-create-invite-debug |
| **Route** | `/functions/v1/test-create-invite-debug` |
| **Purpose** | **[DEBUG]** Test environment variables and basic function execution for invite creation |
| **Auth** | JWT token validation testing |
| **Env Vars** | All environment variables (validation testing) |
| **Reads/Writes** | **Reads**: `people` (for testing), environment validation only |
| **Timeouts/limits** | Default timeout (25s) |
| **Called by** | Development debugging, environment validation |

### accept-invite-minimal

| Field | Value |
|-------|-------|
| **NAME** | accept-invite-minimal |
| **Route** | `/functions/v1/accept-invite-minimal` |
| **Purpose** | **[DEBUG]** Minimal accept-invite function for debugging, completely self-contained |
| **Auth** | Basic token validation (debug mode) |
| **Env Vars** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Reads/Writes** | Minimal database operations for testing |
| **Timeouts/limits** | Default timeout (25s) |
| **Called by** | Development debugging, integration testing |

## Architecture Overview

### Function Categories

#### Production Functions (7 functions)
- **Invitation System**: `create-invite`, `accept-invite-v2`, `invite-redirect`
- **AI Services**: `ai-coaching-report`, `ai-descriptive-review`, `ai-development-insights`, `ai-strengths-insights`

#### Test/Debug Functions (3 functions)
- **Testing**: `test-cors`, `test-create-invite-debug`, `accept-invite-minimal`

### Common Patterns

#### CORS Handling
All functions implement consistent CORS headers:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
```

#### Authentication Patterns
- **Admin Functions**: Validate JWT role for admin operations
- **User Functions**: Standard JWT validation
- **Public Functions**: No authentication required
- **Debug Functions**: Relaxed validation for testing

#### Environment Variables
- **Core Supabase**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **AI Services**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- **Email Service**: `RESEND_API_KEY`
- **Application**: `SITE_URL`, `VITE_APP_URL`

#### Error Handling
All functions implement structured error responses with CORS headers and appropriate HTTP status codes.

### Security Considerations

#### Token Validation
- JWT tokens validated through Supabase client
- Service role key used for admin operations
- Invite tokens validated against secure database records

#### Rate Limiting
- AI functions subject to external API rate limits
- Email functions limited by Resend API quotas
- Database operations protected by Supabase rate limiting

#### Data Access
- Row Level Security (RLS) enforced on all database operations
- Multi-tenant data isolation maintained
- Sensitive data filtered before AI processing

### Performance Notes

#### Timeout Configuration
- **Standard Functions**: 25 seconds default
- **AI Functions**: 90-120 seconds for processing
- **Redirect Functions**: Instant response

#### Optimization Strategies
- Minimal payload sizes for AI functions
- Efficient database queries with proper indexing
- Connection pooling through Supabase client
- Error caching to prevent retry storms

---

**📁 Function Directory**: [`supabase/functions/`](../supabase/functions/)  
**🔧 Deployment**: Supabase CLI (`supabase functions deploy`)  
**📊 Monitoring**: Supabase Dashboard → Edge Functions  
**🔗 Related**: [Database Schema](./Supabase_Database_Structure.md), [Environment Variables](./ENVIRONMENT.md)
