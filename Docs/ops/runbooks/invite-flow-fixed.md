# Invite → Register → Accept Flow - Runbook

**Status:** ✅ Fixed as of February 1, 2025  
**Last Updated:** February 1, 2025  
**Maintainer:** Development Team

## Overview

This runbook covers the complete invite → register → accept flow for the A-Player app, now using Supabase's secure `action_link` system instead of homemade tokens.

## Flow Architecture

### 1. **Create Invite** (`create-invite` edge function)
- **Input:** Company admin creates invite with `email`, `company_id`, `role_to_assign`, optional `position`, `jwt_role`
- **Process:** 
  - Validates admin permissions via RLS + JWT role checks
  - Uses `admin.auth.admin.generateLink({ type: 'invite' })` to create secure action_link
  - Stores invite metadata in `invites` table with expiration
  - Sends email via Resend with action_link
- **Output:** `{ success: true, invite_id, action_link, email_id }`

### 2. **Accept Action Link** (User clicks email link)
- **Process:**
  - Supabase handles auth flow via action_link
  - User lands on `/register-from-invite` with session established
  - Invite metadata embedded in `user.user_metadata`
- **Frontend:** Detects authenticated session and processes automatically or shows registration form

### 3. **Complete Registration** (`accept-invite-v2` edge function)
- **Input:** Authenticated user with invite metadata or token
- **Process:**
  - Idempotent upserts for `profiles`, `people`, `company_memberships`
  - Service role bypasses RLS for provisioning
  - Marks invite as claimed (token flow only)
- **Output:** `{ success: true, company_name, assigned_role, redirect_to }`

## Key Components

### Edge Functions

#### `create-invite/index.ts`
```typescript
// Generates secure Supabase action_link with embedded metadata
const { data: linkData } = await admin.auth.admin.generateLink({
  type: 'invite',
  email,
  options: {
    redirectTo: `${siteUrl}/register-from-invite`,
    data: { position, jwt_role, inviter_name, company_id, role_to_assign }
  }
})
```

#### `accept-invite-v2/index.ts`
```typescript
// Idempotent provisioning with service role
const { error: profileUpsertError } = await admin
  .from('profiles')
  .upsert({
    id: user.id,
    email: user.email,
    // ... other fields
  }, { onConflict: 'id', ignoreDuplicates: false })
```

### Frontend Registration

#### `RegisterFromInvite.tsx`
- **Action Link Flow:** Auto-detects authenticated session, extracts metadata, completes acceptance
- **Token Flow:** Fallback for legacy token-based invites
- **Error Handling:** Comprehensive error states and user feedback

#### `registrationService.ts`
- **Authorization Headers:** Includes `Bearer ${session.access_token}` in edge function calls
- **Session Management:** Handles auth session for invite acceptance

## Environment Configuration

### Required Environment Variables

**Edge Functions (Supabase Dashboard > Edge Functions > Environment Variables):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
SITE_URL=https://your-app-domain.com
```

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Auth Settings

**Dashboard > Authentication > URL Configuration:**
- Add redirect URLs:
  - `http://localhost:3000/register-from-invite` (development)
  - `https://your-app-domain.com/register-from-invite` (production)

**Dashboard > Authentication > Settings:**
- Enable email confirmations: ✅
- Disable signups (invite-only): ✅

## Database Schema

### Tables Involved

```sql
-- Core tables for invite flow
CREATE TABLE invites (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  email TEXT NOT NULL,
  role_to_assign company_role NOT NULL,
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_by UUID REFERENCES people(id),
  position TEXT,
  jwt_role TEXT,
  inviter_name TEXT
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE,
  full_name TEXT,
  default_company_id UUID REFERENCES companies(id),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE company_memberships (
  company_id UUID REFERENCES companies(id),
  profile_id UUID REFERENCES profiles(id),
  role company_role,
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(company_id, profile_id)
);
```

### RLS Policies

**Service Role Policies (for invite provisioning):**
```sql
-- Allow edge functions to create/update records during invite acceptance
CREATE POLICY "profiles_service_role_provisioning" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "people_service_role_provisioning" ON people
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "company_memberships_service_role_provisioning" ON company_memberships
  FOR ALL USING (auth.role() = 'service_role');
```

## Troubleshooting

### Common Issues

#### 1. **401 Unauthorized in Edge Functions**
**Symptoms:** Edge function returns 401 when called from frontend  
**Cause:** Missing Authorization header in frontend → edge function calls  
**Fix:** Ensure all edge function calls include:
```typescript
const { data: { session } } = await supabase.auth.getSession();
const { data, error } = await supabase.functions.invoke('function-name', {
  headers: { Authorization: `Bearer ${session.access_token}` }
});
```

#### 2. **500 Internal Server Error During Invite Acceptance**
**Symptoms:** User registration fails with 500 error  
**Cause:** RLS policies blocking service role operations  
**Fix:** Ensure service role policies are installed:
```sql
-- Run migration 0007_fix_rls_for_invite_flow.sql
```

#### 3. **Action Link Doesn't Work**
**Symptoms:** Clicking invite email link shows error or doesn't authenticate  
**Cause:** Missing redirect URL in Supabase auth configuration  
**Fix:** Add redirect URLs in Supabase Dashboard > Authentication > URL Configuration

#### 4. **Race Conditions During Registration**
**Symptoms:** Duplicate key errors or incomplete user setup  
**Cause:** Multiple concurrent operations on same user  
**Fix:** The accept-invite-v2 function is now idempotent with upserts

#### 5. **Email Not Sent**
**Symptoms:** Invite created but no email received  
**Cause:** Missing or invalid Resend API key  
**Fix:** Verify RESEND_API_KEY in edge function environment variables

### Debugging

#### Enable Debug Logging
```typescript
// In edge functions
console.log('Debug info:', { user: user.email, metadata: user.user_metadata });
```

#### Check Auth Session
```typescript
// In frontend
const { data: { session }, error } = await supabase.auth.getSession();
console.log('Session:', session?.user?.email, session?.access_token ? 'has token' : 'no token');
```

#### Verify Environment Variables
```typescript
// In edge functions
console.log('Environment check:', {
  hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
  hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  hasResendKey: !!Deno.env.get('RESEND_API_KEY')
});
```

## Testing Flow

### Manual Test Steps

1. **Create Invite:**
   ```bash
   # As company admin, create invite via UI or API
   POST /functions/v1/create-invite
   {
     "company_id": "uuid",
     "email": "test@example.com", 
     "role_to_assign": "member"
   }
   ```

2. **Check Email:**
   - Verify email received
   - Click action_link in email
   - Should redirect to /register-from-invite

3. **Complete Registration:**
   - Should auto-complete or show registration form
   - Submit form (if shown)
   - Should redirect to /dashboard

4. **Verify Setup:**
   ```sql
   -- Check user was created
   SELECT id, email FROM auth.users WHERE email = 'test@example.com';
   
   -- Check profile created
   SELECT id, email, default_company_id FROM profiles WHERE email = 'test@example.com';
   
   -- Check membership created
   SELECT * FROM company_memberships WHERE profile_id = (
     SELECT id FROM profiles WHERE email = 'test@example.com'
   );
   ```

### Automated Tests

```typescript
// Integration test example
it('should complete invite flow', async () => {
  // 1. Create invite
  const invite = await createInvite({
    email: 'test@example.com',
    company_id: testCompanyId,
    role_to_assign: 'member'
  });
  
  // 2. Simulate action_link click
  const session = await simulateActionLinkAuth(invite.action_link);
  
  // 3. Complete acceptance
  const result = await acceptInvite(session.access_token, invite.token);
  
  // 4. Verify user setup
  expect(result.success).toBe(true);
  expect(result.company_name).toBe('Test Company');
});
```

## Monitoring

### Key Metrics
- **Invite Creation Rate:** Number of invites created per day
- **Invite Acceptance Rate:** Percentage of sent invites that are accepted
- **Registration Completion Time:** Time from email click to successful login
- **Error Rate:** Percentage of failed invite acceptances

### Alerts
- **High Error Rate:** > 5% of invite acceptances failing
- **Email Delivery Failures:** Resend API errors
- **Edge Function Timeouts:** Functions taking > 10 seconds

### Log Queries
```sql
-- Check recent invite activity
SELECT 
  created_at,
  email,
  claimed_at IS NOT NULL as accepted,
  expires_at > now() as still_valid
FROM invites 
WHERE created_at > now() - interval '7 days'
ORDER BY created_at DESC;

-- Check edge function performance
-- (Use Supabase Dashboard > Edge Functions > Logs)
```

## Security Considerations

### Action Link Security
- Links are single-use and time-limited (7 days)
- Metadata is signed by Supabase and cannot be tampered with
- No sensitive data in URLs (all in signed JWT)

### RLS Protection
- Service role policies are scoped to provisioning operations only
- User access still governed by company membership policies
- No data leakage between companies

### Email Security
- Use official company domain for "From" address
- Include invite metadata in email for verification
- Log all invite creation and acceptance events

## Future Improvements

### Planned Enhancements
- **Batch Invites:** Support uploading CSV of email addresses
- **Custom Roles:** Allow defining custom roles per company
- **Invite Templates:** Customizable email templates per company
- **Analytics Dashboard:** Detailed invite flow analytics

### Scalability Considerations
- **Rate Limiting:** Implement rate limits on invite creation
- **Email Queuing:** Queue email sending for high-volume invites
- **Monitoring:** Add comprehensive monitoring and alerting

---

## Quick Reference

### File Locations
- **Edge Functions:** `supabase/functions/{create-invite,accept-invite-v2,get-invite-data}/`
- **Frontend Components:** `src/pages/RegisterFromInvite.tsx`
- **Services:** `src/services/registrationService.ts`
- **Migrations:** `supabase/migrations/0006_profile_auto_creation_trigger.sql`, `0007_fix_rls_for_invite_flow.sql`

### Environment Setup
1. Copy `env.example` to `.env`
2. Set environment variables in Supabase Dashboard > Edge Functions
3. Configure auth redirect URLs
4. Run migrations: `supabase db push`

### Emergency Procedures
- **Disable Invites:** Comment out create-invite function
- **Reset User:** Delete from `company_memberships`, `profiles`, `auth.users`
- **Debug Session:** Check browser dev tools > Application > Local Storage > `ape.auth`
