# RLS Error Catalog

**Audit Date**: February 1, 2025  
**Purpose**: Catalog all observed and potential RLS permission denied errors

## 🚨 Error Classification

### Error Code 42501: Permission Denied

This is the primary error when RLS policies reject operations. Based on the codebase analysis, here are the scenarios where these errors can occur:

## 📋 Observed RLS Error Scenarios

### 1. Employee Quarter Notes Access (KNOWN ISSUE)

**Error Pattern:**
```
Error: permission denied for table employee_quarter_notes
Code: 42501
```

**Reproduction Steps:**
1. Login as any user
2. Navigate to employee analytics
3. Try to save/load quarter notes
4. **Expected**: Notes save successfully  
5. **Actual**: Permission denied error

**Root Cause**: RLS policies may not properly handle company_id context  
**Status**: PARTIALLY FIXED - company_id now explicitly included in operations  
**File**: `src/services/dataFetching.ts:842`

### 2. People Table Cross-Tenant Access (POTENTIAL)

**Error Pattern:**
```
Error: permission denied for table people  
Code: 42501
```

**Reproduction Steps:**
1. Login as Company A user
2. Manually craft request to access Company B employee data
3. **Expected**: Permission denied
4. **Risk**: If RLS fails, could return wrong data instead of error

**Root Cause**: Missing explicit company_id filters in application layer  
**Affected Operations**: `fetchEmployees()`, profile lookups

### 3. Invitation Management Errors (POTENTIAL)

**Error Pattern:**
```
Error: permission denied for table invites
Code: 42501  
```

**Reproduction Steps:**
1. Login as Company A admin
2. Attempt to access/modify invites from Company B
3. **Expected**: Permission denied
4. **Risk**: Cross-tenant invite manipulation

**Root Cause**: Missing company ownership validation  
**Affected Operations**: Invite revocation, invite listing

### 4. Evaluation Data Access (HIGH RISK)

**Error Pattern:**
```
Error: permission denied for table submissions
Error: permission denied for table attribute_scores
Code: 42501
```

**Reproduction Steps:**
1. Complete evaluation survey
2. Check if submission properly scoped to company
3. **Risk**: Submission could fail or leak to wrong tenant

**Root Cause**: No company_id in submission payloads  
**Affected Operations**: Survey submissions, score recording

## 🔍 Silent Failure Scenarios (200 OK, Empty Results)

These are often worse than 42501 errors because they fail silently:

### 1. Empty Employee Lists

**Behavior**: `fetchEmployees()` returns `[]` instead of error  
**User Experience**: "No employees found" message  
**Root Cause**: RLS filters out all results, but query succeeds

### 2. Missing Evaluation Cycles

**Behavior**: Quarter selector shows no available quarters  
**User Experience**: Cannot perform evaluations  
**Root Cause**: `evaluation_cycles` query returns empty due to RLS

### 3. Incomplete Analytics Data

**Behavior**: Charts show "No data available"  
**User Experience**: Analytics appear broken  
**Root Cause**: `weighted_evaluation_scores` filtered by RLS

## 🧪 Reproduction Test Suite

### Test 1: Basic RLS Validation
```bash
# Test if RLS is enforced at database level
psql> SET ROLE authenticated;
psql> SELECT * FROM people LIMIT 1;
# Should either return data or permission denied
```

### Test 2: Cross-Tenant Data Leak
```typescript
// Attempt to access another company's data
const { data, error } = await supabase
  .from('people')
  .select('*')
  .eq('company_id', 'wrong-company-id');
// Should return permission denied or empty results
```

### Test 3: Missing Company Context
```typescript
// Test operations without proper company context
const { data, error } = await supabase
  .from('submissions')
  .insert([{ submitter_id: 'user-id' }]); // No company_id
// Should fail with permission denied
```

### Test 4: Invite Security
```typescript
// Test cross-tenant invite access
const { data, error } = await supabase
  .from('invites')
  .update({ revoked_at: new Date() })
  .eq('id', 'other-company-invite-id');
// Should fail with permission denied
```

## 🎯 Error Patterns by Feature

### Employee Selection Page
- **Table**: `people`
- **Error Risk**: HIGH
- **Pattern**: Empty results instead of errors
- **Impact**: Users see no employees available

### Analytics Dashboard  
- **Tables**: `weighted_evaluation_scores`, `quarter_final_scores`
- **Error Risk**: MEDIUM
- **Pattern**: Empty charts and "No data" messages
- **Impact**: Analytics appear broken

### Assignment Management
- **Tables**: `assignment_details`, `assignment_statistics`  
- **Error Risk**: MEDIUM
- **Pattern**: 42501 errors or empty assignment lists
- **Impact**: Cannot create or manage assignments

### Evaluation Surveys
- **Tables**: `submissions`, `attribute_scores`
- **Error Risk**: HIGH
- **Pattern**: 42501 on submit or silent failures
- **Impact**: Survey submissions lost or misdirected

### Invite Management
- **Table**: `invites`
- **Error Risk**: HIGH  
- **Pattern**: 42501 on cross-tenant operations
- **Impact**: Admin operations fail or affect wrong company

## 🔧 Error Detection & Handling

### Current Error Handling (INADEQUATE)

Most operations use basic error checking:
```typescript
if (error) {
  console.error('Error:', error);
  throw error;
}
```

**Issues:**
- No specific handling for 42501 errors
- No tenant context logging
- Users see generic error messages
- No automatic retry with proper context

### Recommended Error Handling

```typescript
if (error) {
  if (error.code === '42501') {
    console.error(`[RLS] Permission denied for ${table}:`, {
      operation,
      userEmail: user?.email,
      companyContext: getCurrentCompany(),
      error: error.message
    });
    
    // User-friendly message
    throw new Error('Access denied. Please check your company permissions.');
  }
  
  // Log other errors with context
  console.error(`[DB] ${operation} failed:`, error);
  throw error;
}
```

## 📊 RLS Error Frequency (Estimated)

Based on code patterns and user flows:

- **High Frequency**: Employee Quarter Notes (known issue)
- **Medium Frequency**: Empty analytics data (silent failures)
- **Low Frequency**: Cross-tenant invite manipulation (would require deliberate action)
- **Unknown**: Evaluation submission failures (need testing)

## ⚠️ Critical Testing Gaps

1. **No Cross-Tenant Tests**: No automated tests for RLS enforcement
2. **No Error Scenario Tests**: No tests for 42501 handling
3. **No Silent Failure Detection**: No monitoring for empty result sets that should have data
4. **No Company Context Tests**: No validation that operations use correct company_id

## 🎯 Immediate Action Items

1. **Add RLS Error Logging**: Implement structured logging for all 42501 errors
2. **Create Test Suite**: Build automated tests for each RLS scenario
3. **Monitor Silent Failures**: Track when queries return unexpectedly empty results
4. **User Experience**: Add better error messages for permission issues
5. **Developer Tools**: Create debugging tools to validate company context

## 🚨 Emergency Response Plan

### If Cross-Tenant Data Leak Detected:
1. **Immediate**: Disable affected features
2. **Audit**: Check logs for scope of exposure  
3. **Notify**: Alert affected customers
4. **Fix**: Implement explicit company_id filters
5. **Verify**: Test all tenant isolation

### If RLS Failures Spike:
1. **Check**: Database connection and JWT token validity
2. **Verify**: Company context resolution is working
3. **Rollback**: Revert recent changes if needed
4. **Monitor**: Track error rates and affected users

The complete fix plan for these issues is documented in `FIX_PLAN.md`.
