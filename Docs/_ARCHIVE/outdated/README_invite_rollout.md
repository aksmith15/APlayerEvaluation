# Company Invite Feature - Production Rollout Guide

**Generated:** February 1, 2025  
**Status:** Ready for Production Deployment  
**Risk Level:** LOW - Additive feature with comprehensive testing

## 🚀 Rollout Overview

The Company Invite feature adds secure, multi-tenant user invitation capabilities to the A-Player Evaluations platform. This guide covers the complete rollout process from staging to production.

## 📋 Pre-Rollout Checklist

### ✅ Prerequisites Verified
- [x] **Existing RLS Policies** - No modifications to existing security policies
- [x] **Multi-Tenant Architecture** - Built on existing company isolation framework
- [x] **Authentication System** - Leverages existing JWT role-based system
- [x] **Database Schema** - New tables only, no breaking changes
- [x] **Edge Function Infrastructure** - Uses established Supabase Edge Function patterns

### ✅ Security Validation
- [x] **Zero Cross-Tenant Access** - Comprehensive test suite validates isolation
- [x] **Admin-Only Creation** - JWT role validation prevents unauthorized invitations
- [x] **Token-Based Security** - Single-use, time-limited invitation tokens
- [x] **Email Verification** - Strict email matching during acceptance
- [x] **RLS Policy Coverage** - Full row-level security implementation

## 🔄 Deployment Phases

### Phase 1: Database Migration (30 minutes)

**Timing:** During maintenance window or low-traffic period

#### Step 1.1: Backup Current State
```bash
# Create full database backup
pg_dump $DATABASE_URL > backup_pre_invite_$(date +%Y%m%d_%H%M%S).sql

# Verify backup integrity
pg_restore --list backup_pre_invite_*.sql | head -20
```

#### Step 1.2: Apply Database Migrations
```sql
-- Execute migrations in order:
\i supabase/migrations/0004_invitations_table.sql
\i supabase/migrations/0005_invitations_rls.sql

-- Verify successful migration
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invitations' AND table_schema = 'public';

-- Verify RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'invitations';
```

#### Step 1.3: Run Security Tests
```bash
# Execute comprehensive test suite
psql $DATABASE_URL -f docs/invite_tests.sql

# Expected output: All tests PASSED
# Any FAILED tests must be resolved before proceeding
```

### Phase 2: Edge Function Deployment (15 minutes)

#### Step 2.1: Deploy Accept-Invite Function
```bash
# Deploy the Edge Function
supabase functions deploy accept-invite

# Verify deployment
curl -X POST "$SUPABASE_URL/functions/v1/accept-invite" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}' \
  | jq '.error' # Should return error about missing/invalid token
```

#### Step 2.2: Test Edge Function Connectivity
```sql
-- Create test invitation for function testing
INSERT INTO invitations (company_id, email, role, invited_by) 
VALUES (
  (SELECT id FROM companies LIMIT 1),
  'test-function@example.com',
  'member',
  (SELECT id FROM profiles WHERE email LIKE '%admin%' LIMIT 1)
);

-- Note the token for testing
SELECT token FROM invitations WHERE email = 'test-function@example.com';
```

### Phase 3: Frontend Deployment (15 minutes)

#### Step 3.1: Deploy Frontend Updates
```bash
# Build and deploy the updated frontend
npm run build
# Deploy to your hosting platform (Render, Vercel, etc.)
```

#### Step 3.2: Add Route Configuration
Ensure your router includes the new accept invite route:
```typescript
// In your App.tsx or routing configuration
<Route path="/accept-invite" element={<AcceptInvite />} />
```

#### Step 3.3: Update Navigation (Optional)
Add invitation management to admin navigation:
```typescript
// Add to admin dashboard navigation
{isAdmin && (
  <NavigationItem href="/invitations" icon={UserPlusIcon}>
    Manage Invitations
  </NavigationItem>
)}
```

### Phase 4: Staging Environment Testing (60 minutes)

#### Step 4.1: End-to-End User Flow Testing
1. **Admin Creates Invitation**
   - Login as company admin
   - Navigate to invitation management
   - Create invitation for test email
   - Verify invitation appears in list

2. **Email Verification** (Manual Step)
   - Check email content generation
   - Verify invitation link format
   - Confirm expiry date is correct

3. **Invitation Acceptance**
   - Open invitation link in incognito browser
   - Complete sign-up/sign-in flow
   - Accept invitation
   - Verify user gains company access

4. **Admin Management**
   - Test invitation revocation
   - Test invitation resending
   - Verify statistics update

#### Step 4.2: Security Testing
```bash
# Run security validation script
./test-security-scenarios.sh

# Test cross-tenant isolation
./test-cross-tenant-access.sh

# Verify unauthorized access prevention
./test-unauthorized-access.sh
```

#### Step 4.3: Performance Testing
```sql
-- Test with multiple concurrent invitations
-- Monitor query performance and RLS overhead
EXPLAIN ANALYZE SELECT * FROM invitations WHERE company_id = $1;

-- Verify index usage
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM invitations 
WHERE email = 'test@example.com' 
  AND accepted_at IS NULL 
  AND expires_at > now();
```

### Phase 5: Production Deployment (30 minutes)

#### Step 5.1: Production Migration
```bash
# 1. Enable maintenance mode (if applicable)
# 2. Apply database migrations
psql $PRODUCTION_DATABASE_URL -f supabase/migrations/0004_invitations_table.sql
psql $PRODUCTION_DATABASE_URL -f supabase/migrations/0005_invitations_rls.sql

# 3. Deploy Edge Function
supabase functions deploy accept-invite --project-ref $PROD_PROJECT_REF

# 4. Deploy frontend
npm run build
# Deploy to production hosting
```

#### Step 5.2: Production Smoke Testing
```bash
# Quick smoke test on production
curl -X POST "$PROD_SUPABASE_URL/functions/v1/accept-invite" \
  -H "Authorization: Bearer $PROD_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid"}' \
  | grep "Invalid.*invitation" # Should find this error message
```

#### Step 5.3: Enable Feature for Admins
- Notify company administrators of new feature
- Provide admin training documentation
- Monitor initial usage and feedback

## 📧 Email Configuration

### Option A: Extend Existing n8n Integration
```javascript
// Add to existing n8n email workflow
{
  "webhook_url": "https://kolbesmith.app.n8n.cloud/webhook/send-invitation",
  "payload": {
    "to": "{{invitation.email}}",
    "subject": "You're invited to join {{company.name}}",
    "html": "{{email.html_content}}",
    "text": "{{email.text_content}}"
  }
}
```

### Option B: Direct SMTP Integration
```typescript
// In Edge Function or separate email service
const emailConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};
```

### Required Environment Variables
```bash
# Add to your deployment environment
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASS=your-smtp-password
INVITATION_BASE_URL=https://your-app-domain.com
```

## 🔍 Monitoring and Observability

### Key Metrics to Track
- **Invitation Creation Rate** - Invitations created per day/week
- **Acceptance Rate** - Percentage of invitations accepted
- **Time to Accept** - Average time from invitation to acceptance
- **Expiry Rate** - Percentage of invitations that expire unused
- **Error Rate** - Failed acceptances or system errors

### Monitoring Queries
```sql
-- Daily invitation statistics
SELECT 
  DATE(created_at) as date,
  COUNT(*) as created,
  COUNT(accepted_at) as accepted,
  COUNT(revoked_at) as revoked,
  COUNT(CASE WHEN expires_at < now() AND accepted_at IS NULL THEN 1 END) as expired
FROM invitations 
WHERE created_at >= current_date - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Average acceptance time
SELECT 
  AVG(EXTRACT(epoch FROM (accepted_at - created_at))/3600) as avg_hours_to_accept
FROM invitations 
WHERE accepted_at IS NOT NULL;
```

### Alert Thresholds
- **High Error Rate**: > 5% of acceptance attempts failing
- **Low Acceptance Rate**: < 60% acceptance rate over 7 days
- **System Errors**: Any Edge Function errors or RLS violations

## 🚨 Rollback Procedures

### Emergency Rollback (5 minutes)
If critical issues are discovered:

```sql
-- 1. Disable invitation creation (emergency stop)
UPDATE app_config 
SET value = 'false' 
WHERE key = 'invitations_enabled';

-- 2. Revoke all pending invitations (if necessary)
UPDATE invitations 
SET revoked_at = now() 
WHERE accepted_at IS NULL AND revoked_at IS NULL;
```

### Full Rollback (30 minutes)
If complete feature removal is required:

```bash
# 1. Disable Edge Function
supabase functions delete accept-invite

# 2. Remove frontend components
# Deploy previous version without invitation features

# 3. Drop database objects (CAUTION: Data loss)
# Only if absolutely necessary and data can be recovered
```

## ✅ Post-Deployment Validation

### Immediate Checks (First 24 hours)
- [ ] Edge Function responding correctly
- [ ] Admin users can create invitations
- [ ] Invitation emails are generated
- [ ] Accept invite page loads correctly
- [ ] RLS policies blocking unauthorized access
- [ ] No performance degradation

### Weekly Review (First month)
- [ ] Review invitation statistics
- [ ] Analyze user feedback
- [ ] Monitor error rates
- [ ] Validate security assumptions
- [ ] Performance impact assessment

## 📞 Support and Troubleshooting

### Common Issues and Solutions

**Issue: Admin cannot create invitations**
```sql
-- Check user's JWT role and company membership
SELECT 
  p.email,
  p.default_company_id,
  cm.role,
  'JWT role check needed' as note
FROM profiles p
LEFT JOIN company_memberships cm ON p.id = cm.profile_id
WHERE p.email = 'admin@company.com';
```

**Issue: Invitation acceptance fails**
```sql
-- Check invitation status and expiry
SELECT 
  email,
  expires_at,
  accepted_at,
  revoked_at,
  CASE 
    WHEN accepted_at IS NOT NULL THEN 'Already accepted'
    WHEN revoked_at IS NOT NULL THEN 'Revoked'
    WHEN expires_at < now() THEN 'Expired'
    ELSE 'Valid'
  END as status
FROM invitations 
WHERE token = 'invitation-token-here';
```

**Issue: Cross-tenant data visible**
```sql
-- Verify RLS policies are active
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'invitations';

-- Should return: rowsecurity = true
```

### Emergency Contacts
- **Development Team**: [Your team contact]
- **Database Admin**: [Your DBA contact]
- **Security Team**: [Your security contact]

## 📊 Success Criteria

### Technical Success
- ✅ Zero security vulnerabilities
- ✅ Zero cross-tenant data access
- ✅ < 2 second response time for all operations
- ✅ 99.9% uptime for Edge Function

### Business Success
- ✅ > 70% invitation acceptance rate
- ✅ < 1 day average time to accept
- ✅ Positive admin user feedback
- ✅ Reduced manual user onboarding time

---

## 🎉 Rollout Complete

Upon successful completion of all phases, the Company Invite feature will be fully operational and ready for production use. The feature provides:

- **Secure user onboarding** with token-based invitations
- **Multi-tenant isolation** maintaining complete data security
- **Admin-friendly interface** for invitation management
- **Automated email notifications** (when configured)
- **Comprehensive audit trail** for compliance and monitoring

**Next Steps:** Monitor usage patterns, gather user feedback, and consider future enhancements like bulk invitations or role-specific invitation templates.
