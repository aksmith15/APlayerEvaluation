# Edge Functions Cleanup Plan

## Functions to Keep (8 total)

### Production Functions (6)
- `accept-invite` - ✅ Used in AcceptInvite.tsx
- `create-invite` - ✅ Used in InviteManager.tsx
- `ai-coaching-report` - ✅ Used in aiCoachingService.ts
- `ai-strengths-insights` - ✅ Used in aiInsightsService.ts
- `ai-development-insights` - ✅ Used in aiInsightsService.ts
- `ai-descriptive-review` - ✅ Used in aiReviewService.ts

### Debug Functions (2)
- `test-create-invite-debug` - ✅ Used in DebugInviteTest.tsx
- `_shared` - ✅ Shared utilities (CORS, etc.)

## Functions to Remove (20 total)

### AI Test/Debug Functions
- `ai-insights-fixed` - Unused duplicate
- `ai-strengths-insights-copy` - Unused copy
- `ai-strengths-test` - Test version
- `insights-minimal` - Minimal test version
- `test-insights-debug` - Debug version
- `working-insights-test` - Test version

### Invite Test/Debug Functions  
- `create-invite-step-debug` - Unused debug version
- `debug-create-invite` - Unused debug version
- `debug-invitation-email` - Unused debug version

### Email Test Functions
- `send-invitation-email` - Unused
- `send-invitation-email-debug` - Unused debug version
- `send-simple-email` - Unused test version

### General Test Functions
- `test-exact-copy` - Unused test
- `test-hello` - Minimal test
- `test-minimal` - Minimal test  
- `test-resend-detailed` - Email test
- `test-resend-simple` - Email test
- `test-simple` - Simple test
- `test-smtp-direct` - SMTP test
- `test-ultra-minimal` - Ultra minimal test

## Cleanup Commands

### Backend (Supabase Functions Directory)
```bash
# Remove unused function directories
rm -rf supabase/functions/ai-insights-fixed
rm -rf supabase/functions/ai-strengths-insights-copy
rm -rf supabase/functions/ai-strengths-test
rm -rf supabase/functions/create-invite-step-debug
rm -rf supabase/functions/debug-create-invite
rm -rf supabase/functions/debug-invitation-email
rm -rf supabase/functions/insights-minimal
rm -rf supabase/functions/send-invitation-email
rm -rf supabase/functions/send-invitation-email-debug
rm -rf supabase/functions/send-simple-email
rm -rf supabase/functions/test-exact-copy
rm -rf supabase/functions/test-hello
rm -rf supabase/functions/test-insights-debug
rm -rf supabase/functions/test-minimal
rm -rf supabase/functions/test-resend-detailed
rm -rf supabase/functions/test-resend-simple
rm -rf supabase/functions/test-simple
rm -rf supabase/functions/test-smtp-direct
rm -rf supabase/functions/test-ultra-minimal
rm -rf supabase/functions/working-insights-test
```

### Remote Deployment
After removing local files, you'll need to:
1. Deploy the cleaned functions: `supabase functions deploy`
2. Or remove them from remote: `supabase functions delete [function-name]`

## Benefits After Cleanup
- Reduced deployment size and time
- Cleaner function list in Supabase dashboard
- Easier maintenance and debugging
- Better organization for new team members

## Before/After Comparison
- **Before**: 28 functions (21% utilization)
- **After**: 8 functions (100% utilization)
- **Space Saved**: 71% reduction in function count
