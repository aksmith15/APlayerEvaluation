# Policy Dependencies Analysis

**Audit Date**: February 1, 2025  
**Purpose**: Map application paths to RLS policies and identify dependencies

## 🗺️ Application Path → Policy Mapping

### Employee Selection (`/employees`)

**Primary Flow**: User selects employee to view analytics

**Database Operations:**
```typescript
// src/services/dataFetching.ts:fetchEmployees()
supabase.from('people').select('*').eq('active', true)
```

**RLS Policy Dependencies:**
- **Table**: `people`
- **Policy**: Company-scoped access policy  
- **Mechanism**: Likely `people.company_id = current_company_id()`
- **Risk Level**: CRITICAL
- **Failure Mode**: Returns employees from all companies or empty results

**Company Context Resolution:**
- ❌ **MISSING**: No explicit company_id filter in application
- ❌ **RISK**: Depends entirely on RLS policy implementation
- ❌ **ISSUE**: If RLS policy disabled/fails, exposes all employee data

### Employee Analytics (`/analytics/:employeeId`)

**Primary Flow**: Display evaluation data for selected employee

**Database Operations:**
```typescript
// src/services/dataFetching.ts:fetchEmployeeDetailedScores()
supabase.from('weighted_evaluation_scores').select('*').eq('evaluatee_id', employeeId)
supabase.from('quarter_final_scores').select('*').eq('evaluatee_id', employeeId)
```

**RLS Policy Dependencies:**
- **Tables**: `weighted_evaluation_scores`, `quarter_final_scores`, `core_group_scores`
- **Policies**: View-based RLS policies on evaluation data
- **Mechanism**: Complex policies involving evaluatee_id → people → company_id
- **Risk Level**: HIGH  
- **Failure Mode**: Empty charts, "No data available" messages

**Company Context Resolution:**
- ❌ **MISSING**: No company_id validation for employeeId parameter
- ⚠️ **RISK**: Could attempt to view employee from different company
- ✅ **PROTECTED**: RLS policies should prevent cross-tenant access

### Assignment Management (`/assignments/manage`)

**Primary Flow**: HR admins create and monitor evaluation assignments

**Database Operations:**
```typescript
// src/services/assignmentService.ts
supabase.from('assignment_details').select('*')
supabase.from('assignment_statistics').select('*')
```

**RLS Policy Dependencies:**
- **Tables**: `assignment_details`, `assignment_statistics`, `evaluation_assignments`
- **Policies**: Role-based + company-scoped policies
- **Mechanism**: `jwt_role IN ('hr_admin', 'super_admin') AND company_id = current_company_id()`
- **Risk Level**: MEDIUM
- **Failure Mode**: Permission denied or empty assignment lists

**Company Context Resolution:**
- ❓ **UNKNOWN**: Assignment service may use views that handle company context
- ⚠️ **RISK**: No explicit company_id filters visible in application code

### Evaluation Survey (`/survey/:token`)

**Primary Flow**: User completes evaluation survey via unique token

**Database Operations:**
```typescript
// src/components/ui/EvaluationSurvey.tsx
supabase.from('submissions').insert([{ submitter_id, assignment_id, submitted_at }])
supabase.from('attribute_scores').upsert([{ submission_id, attribute_name, score, evaluatee_id, evaluator_id }])
supabase.from('attribute_responses').upsert(questionData)
```

**RLS Policy Dependencies:**
- **Tables**: `submissions`, `attribute_scores`, `attribute_responses`
- **Policies**: Assignment-based access policies
- **Mechanism**: Token → assignment → company validation chain
- **Risk Level**: CRITICAL
- **Failure Mode**: Survey submission fails or data goes to wrong company

**Company Context Resolution:**
- ❌ **MISSING**: No company_id in submission payloads
- ❌ **CRITICAL**: Relies entirely on RLS policy chain
- ❌ **RISK**: If policy chain breaks, data could be misdirected

### Invite Manager Component

**Primary Flow**: Admins manage user invitations

**Database Operations:**
```typescript
// src/components/ui/InviteManager.tsx
supabase.from('invites').select().eq('company_id', peopleData.company_id)  // ✅ GOOD
supabase.from('invites').update({ revoked_at }).eq('id', inviteId)        // ❌ BAD
```

**RLS Policy Dependencies:**
- **Table**: `invites`
- **Policies**: Company-scoped invite policies
- **Mechanism**: `invites.company_id = current_company_id()`
- **Risk Level**: HIGH
- **Failure Mode**: Cross-tenant invite manipulation

**Company Context Resolution:**
- ✅ **GOOD**: Explicit company_id filter on reads
- ❌ **BAD**: No company validation on updates
- ⚠️ **RISK**: Could revoke invites from other companies

## 🔗 Policy Chain Analysis

### Complex Policy Dependencies

#### 1. Evaluation Data Chain
```
User Request → JWT Claims → current_company_id() → people.company_id → evaluatee_id → weighted_evaluation_scores
```

**Failure Points:**
- JWT claims missing or invalid
- `current_company_id()` function returns NULL
- `people.company_id` not set for evaluatee
- RLS policy on evaluation views disabled

#### 2. Assignment Token Chain
```
Survey Token → evaluation_assignments.survey_token → assignment.evaluatee_id → people.company_id → company validation
```

**Failure Points:**
- Invalid or expired token
- Assignment deleted or modified
- Evaluatee moved to different company
- Missing company_id in submission payload

#### 3. Role-Based Access Chain
```
JWT Role Claims → jwt_role validation → company membership → table access
```

**Failure Points:**
- JWT role not set in claims
- Role changed but token not refreshed
- Company membership removed
- RLS policy doesn't check role correctly

## 📊 Policy Dependency Matrix

| Application Feature | Primary Table | Secondary Tables | Policy Type | Complexity | Failure Risk |
|-------------------|---------------|------------------|-------------|------------|--------------|
| Employee Selection | people | none | Company-scoped | LOW | HIGH |
| Employee Analytics | weighted_evaluation_scores | quarter_final_scores, core_group_scores | View-based | HIGH | MEDIUM |
| Assignment Management | assignment_details | assignment_statistics | Role + Company | MEDIUM | MEDIUM |
| Evaluation Survey | submissions | attribute_scores, attribute_responses | Token-based | HIGH | CRITICAL |
| Invite Management | invites | people | Company-scoped | LOW | HIGH |
| Quarter Notes | employee_quarter_notes | people | Company-scoped | MEDIUM | LOW |

## 🎯 High-Risk Policy Dependencies

### Risk Category 1: No Application-Level Protection

**Features**: Employee Selection, Employee Analytics  
**Risk**: Application assumes RLS will handle all filtering  
**Impact**: Cross-tenant data exposure if RLS fails  
**Mitigation**: Add explicit company_id filters

### Risk Category 2: Complex Policy Chains

**Features**: Evaluation Survey, Assignment Management  
**Risk**: Multi-step policy validation can fail at any point  
**Impact**: Broken workflows, lost data  
**Mitigation**: Add application-level validation at each step

### Risk Category 3: Inconsistent Implementation

**Features**: Invite Management  
**Risk**: Some operations protected, others not  
**Impact**: Partial security vulnerabilities  
**Mitigation**: Standardize protection across all operations

## 🔍 Policy Validation Scenarios

### Scenario 1: Policy Bypass Test
```sql
-- Disable RLS temporarily (admin only)
ALTER TABLE people DISABLE ROW LEVEL SECURITY;

-- Test if application still protects data
-- Should fail gracefully or add explicit filters
```

### Scenario 2: JWT Claims Test
```sql
-- Set invalid company context
SET LOCAL "request.jwt.claims" = '{"sub":"user-id","company_id":"wrong-company"}';

-- Test if application validates company context
-- Should reject operations or return empty results
```

### Scenario 3: Role Escalation Test
```sql
-- Set higher role in JWT claims
SET LOCAL "request.jwt.claims" = '{"sub":"user-id","role":"super_admin"}';

-- Test if application properly validates role
-- Should grant/deny access appropriately
```

## 📈 Dependency Health Monitoring

### Key Metrics to Track

1. **RLS Error Rate**: `COUNT(42501 errors) / COUNT(total queries)`
2. **Empty Result Rate**: Queries that return 0 rows when data should exist
3. **Company Context Failures**: Operations that fail due to missing company_id
4. **Policy Chain Breaks**: Multi-step validations that fail at intermediate steps

### Alerting Thresholds

- **Critical**: RLS error rate > 5%
- **Warning**: Empty result rate > 10% on core tables
- **Info**: New users with missing company context

## 🚨 Policy Failure Recovery

### Automatic Recovery Strategies

1. **Company Context Auto-Resolution**: If company_id missing, derive from user profile
2. **Graceful Degradation**: Show limited data instead of complete failure  
3. **Retry with Explicit Context**: If RLS fails, retry with explicit company_id
4. **Role Fallback**: If role access fails, fallback to basic user permissions

### Manual Recovery Procedures

1. **RLS Policy Check**: Verify all policies are enabled and correctly configured
2. **JWT Token Refresh**: Force token refresh to get updated claims
3. **Company Membership Repair**: Fix broken user → company relationships
4. **Data Consistency Check**: Verify company_id values are consistent across tables

## 📋 Immediate Action Items

### High Priority
1. Add explicit company_id filters to `fetchEmployees()` and evaluation cycles
2. Add company validation to invite operations
3. Include company_id in survey submission payloads

### Medium Priority  
1. Implement centralized company context management
2. Add policy health monitoring and alerting
3. Create policy dependency validation tests

### Low Priority
1. Document all policy chains for developer reference
2. Create policy debugging tools
3. Implement automatic policy failure recovery

## 🔮 Future Considerations

### Policy Simplification Opportunities
- Consolidate similar policies across tables
- Use consistent naming patterns for company_id columns
- Standardize role-based access patterns

### Enhanced Security Features
- Add audit logging for policy violations
- Implement policy compliance scoring
- Create policy impact analysis tools

This analysis provides the foundation for the comprehensive fix plan in `FIX_PLAN.md`.
