# External Integrations

This document details all external service integrations used by the A-Player Evaluation System, beyond the core Supabase infrastructure.

## Overview

The A-Player system integrates with several external services to provide comprehensive functionality:

- **AI Providers:** OpenAI and Anthropic for coaching insights
- **Email Service:** Resend for transactional emails
- **Monitoring:** Sentry for error tracking and PostHog for analytics

## OpenAI Integration

### Service: OpenAI GPT API
**Where used:** AI coaching reports, descriptive reviews, insights generation  
**Files:** 
- `supabase/functions/ai-coaching-report/index.ts`
- `supabase/functions/ai-descriptive-review/index.ts`
- `supabase/functions/ai-development-insights/index.ts`
- `supabase/functions/ai-strengths-insights/index.ts`

### Authentication
- **Method:** Bearer token authentication
- **Environment Variable:** `OPENAI_API_KEY`
- **Scope:** Supabase Edge Functions environment

## Resend Email Service

### Service: Resend Transactional Email API
**Where used:** Invitation emails, notifications  
**Files:** `supabase/functions/create-invite/index.ts`

### Authentication
- **Method:** Bearer token authentication
- **Environment Variable:** `RESEND_API_KEY`
- **Current Key:** `re_4KaYor7w_L2YqDgxfTRr4pkLGSVWu9cuiTryu` (configured)

---

**🔗 Related Documentation:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Environment configuration for integrations
