# Application Tenancy Findings

**Audit Date**: February 1, 2025  
**Scope**: A-Player Evaluations Dashboard Client Application  
**Status**: CRITICAL ISSUES IDENTIFIED

## 🚨 Executive Summary

The application code audit reveals **CRITICAL multi-tenancy vulnerabilities** that could lead to cross-tenant data exposure and RLS policy failures. While the database schema has "A+ EXEMPLARY" security ratings, the application layer has significant gaps in company_id binding and tenant context management.

### Top 5 Critical Issues
1. **Global Employee Fetching** - `fetchEmployees()` returns all active employees across companies
2. **Missing Company Context** - No centralized tenant context management
3. **RLS Over-Reliance** - Many operations assume RLS will handle tenant filtering
4. **Inconsistent Company ID Binding** - Some operations include company_id, others don't
5. **Hardcoded Auth Keys** - ANON_KEY exposed in config file

## 📊 Root-Cause Analysis

### Issue #1: Global Data Fetching (CRITICAL)

**Evidence:**
```typescript
// src/services/dataFetching.ts:21
const { data: people, error: peopleError } = await supabase
  .from('people')
  .select('*')
  .eq('active', true)  // ❌ NO COMPANY_ID FILTER
  .order('name');
```

**Impact**: Returns employees from ALL companies if RLS policies fail  
**Likely Symptom**: Users seeing employees from other companies in selection dropdown  
**Root Cause**: No application-level tenant filtering

### Issue #2: Evaluation Cycles Cross-Tenant Access (HIGH)

**Evidence:**
```typescript
// src/services/dataFetching.ts:66
const { data, error } = await supabase
  .from('evaluation_cycles')
  .select('*')
  .order('start_date', { ascending: false }); // ❌ NO COMPANY_ID FILTER
```

**Impact**: May return quarters from all companies  
**Likely Symptom**: Empty results or 42501 errors, quarter mixups  
**Root Cause**: Assumes evaluation_cycles are global rather than company-scoped

### Issue #3: Invite System Security Gap (CRITICAL)

**Evidence:**
```typescript
// src/components/ui/InviteManager.tsx:159
const { error } = await supabase
  .from('invites')
  .update({ revoked_at: new Date().toISOString() })
  .eq('id', inviteId); // ❌ NO COMPANY_ID VALIDATION
```

**Impact**: Could revoke invites from other companies  
**Likely Symptom**: Cross-tenant invite manipulation  
**Root Cause**: No company ownership validation on updates

### Issue #4: Submission/Score Data Missing Company Context (HIGH)

**Evidence:**
```typescript
// src/components/ui/EvaluationSurvey.tsx:3083
const { data: newSubmission, error: submissionError } = await supabase
  .from('submissions')
  .insert([{
    submitter_id: user.id,
    assignment_id,
    submitted_at: new Date().toISOString()
    // ❌ NO COMPANY_ID
  }]);
```

**Impact**: Submissions/scores rely entirely on RLS for tenant isolation  
**Likely Symptom**: 42501 errors or cross-tenant data leaks if RLS fails  
**Root Cause**: No explicit company_id in write operations

### Issue #5: Inconsistent Company Membership Model (MEDIUM)

**Evidence:**
```typescript
// src/services/dataFetching.ts:732
person_id: person.id, // ❌ SHOULD BE profile_id per RLS policies
company_id: defaultCompany.id,
```

**Impact**: Company memberships may not work with existing RLS policies  
**Likely Symptom**: Access denied errors, membership lookups failing  
**Root Cause**: Mismatch between app code and database schema expectations

### Issue #6: Hardcoded Credentials (SECURITY)

**Evidence:**
```typescript
// src/constants/config.ts:11
ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJI...'
```

**Impact**: Exposed anon key in client bundle  
**Likely Symptom**: Potential unauthorized API access  
**Root Cause**: Fallback hardcoded key in production builds

## 🔍 Common Failure Patterns Detected

### Pattern 1: Missing Company ID on Writes
- **Occurrences**: 8 insert/update operations
- **Tables Affected**: submissions, attribute_scores, invites (updates)
- **Risk Level**: HIGH
- **Symptoms**: 42501 permission denied, data in wrong tenant

### Pattern 2: Global Selects Without Tenant Filter  
- **Occurrences**: 12 select operations
- **Tables Affected**: people, evaluation_cycles, weighted_evaluation_scores
- **Risk Level**: CRITICAL
- **Symptoms**: Cross-tenant data exposure, empty results

### Pattern 3: RLS Over-Dependence
- **Occurrences**: 15+ operations
- **Risk Level**: MEDIUM
- **Symptoms**: Silent failures, inconsistent behavior

### Pattern 4: No Current Company Context
- **Occurrences**: Throughout application
- **Risk Level**: HIGH  
- **Symptoms**: Undefined company context, manual lookups everywhere

## 📋 Affected Application Paths

| Application Path | Tables Accessed | RLS Dependency | Company ID Binding | Risk Level |
|-----------------|-----------------|----------------|-------------------|------------|
| `/employees` (Employee Selection) | people | HIGH | MISSING | CRITICAL |
| `/analytics` (Employee Analytics) | weighted_evaluation_scores, quarter_final_scores | HIGH | MISSING | HIGH |
| `/assignments/manage` (Assignment Management) | assignment_details, assignment_statistics | HIGH | MISSING | HIGH |
| `/survey/:token` (Evaluation Survey) | submissions, attribute_scores, attribute_responses | HIGH | MISSING | CRITICAL |
| InviteManager Component | invites, people | MEDIUM | PARTIAL | HIGH |
| Employee Quarter Notes | employee_quarter_notes | HIGH | FIXED | LOW |

## 🎯 Policy Dependencies Analysis

### Critical Dependencies
- **people table queries** → Depend on people.company_id RLS policy  
- **evaluation_cycles queries** → May not have company_id column (needs verification)
- **weighted_evaluation_scores** → Depends on complex view RLS policies
- **submissions/attribute_scores** → Depend on assignment-based RLS

### Vulnerable Scenarios
1. **RLS Policy Disabled**: Global data exposure across all paths
2. **JWT Claims Missing**: All queries return empty results  
3. **Company Context Lost**: User sees wrong company data
4. **Session Edge Cases**: Mixed tenant data during company switching

## 🚨 High-Risk Scenarios to Test

### Scenario 1: Cross-Tenant Employee Access
1. Login as Company A user
2. Access `/employees` endpoint  
3. **Expected**: Only Company A employees
4. **Risk**: See employees from Company B, C, etc.

### Scenario 2: Invite System Exploitation
1. Login as Company A admin
2. Create invite, note the invite ID
3. Login as Company B admin  
4. Attempt to revoke Company A's invite
5. **Expected**: Permission denied
6. **Risk**: Successfully revoke other company's invite

### Scenario 3: Survey Cross-Contamination
1. Complete evaluation survey for Company A employee
2. Check if submission has proper company context
3. **Expected**: Submission tied to Company A
4. **Risk**: Submission appears in Company B's data

## 💡 Root Cause Summary

### Primary Issues
1. **No Centralized Tenant Context**: Each operation manually resolves company_id
2. **Inconsistent Implementation**: Some operations include company_id, others don't
3. **RLS Over-Reliance**: App assumes database will handle all tenant filtering
4. **Missing Validation**: No company ownership checks on updates/deletes
5. **Hardcoded Fallbacks**: Security credentials exposed in client code

### Contributing Factors
- No tenant-aware data access layer
- Manual company_id lookups scattered throughout code
- Inconsistent error handling for RLS failures
- No standardized patterns for multi-tenant operations
- Missing integration tests for cross-tenant scenarios

## 📈 Impact Assessment

### Data Exposure Risk: **HIGH**
- Employee data could leak across companies
- Evaluation results could be cross-contaminated  
- Administrative actions could affect wrong tenants

### System Reliability: **MEDIUM**
- RLS failures cause empty results (confusing UX)
- Inconsistent behavior across different features
- Manual company_id resolution prone to bugs

### Security Posture: **MEDIUM**
- RLS provides good baseline protection
- Application layer adds little additional security
- Hardcoded credentials create attack vectors

### Development Velocity: **LOW**
- Manual tenant context in every operation
- No reusable patterns for multi-tenant queries
- High cognitive load for developers

## 🎯 Recommended Immediate Actions

1. **Emergency Patch**: Add explicit company_id filters to `fetchEmployees()` and `evaluation_cycles` queries
2. **Security Review**: Remove hardcoded ANON_KEY from config file
3. **Validation Layer**: Add company ownership checks to invite operations
4. **Testing**: Implement cross-tenant access tests
5. **Monitoring**: Add structured logging for RLS errors

The next step is implementing the staged fix plan in `FIX_PLAN.md`.
