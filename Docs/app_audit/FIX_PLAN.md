# Tenancy Fix Plan - Zero Downtime Implementation

**Plan Date**: February 1, 2025  
**Implementation Type**: Staged, Zero-Downtime with Feature Flags  
**Estimated Timeline**: 3 weeks (Stage A: 3 days, Stage B: 1 week, Stage C: 1.5 weeks)

## 🎯 Implementation Strategy

### Core Principles
- ✅ **Zero Downtime**: All changes are additive and backwards compatible
- ✅ **Feature Flags**: New tenancy enforcement gated behind `TENANCY_ENFORCED` flag
- ✅ **Safe Fallbacks**: Current RLS-dependent code remains as fallback
- ✅ **Incremental Migration**: Convert features one by one, not all at once
- ✅ **Extensive Testing**: Each stage includes comprehensive validation

### Success Criteria
- No 42501 permission denied errors on properly scoped operations
- No cross-tenant data exposure
- Consistent company context across all features
- Improved error handling and user experience
- Developer-friendly tenancy patterns

## 📋 Stage A: Foundation & Safety (3 days)

**Goal**: Add tenancy infrastructure without changing existing behavior

### A1: Add Tenancy SDK (Day 1)

**Files to Create**:
```typescript
// src/lib/tenantContext.ts
export type CompanyContext = { 
  companyId: string; 
  role?: string | null;
  userId: string;
};

let current: CompanyContext | null = null;

export function setCompanyContext(ctx: CompanyContext) { 
  current = ctx; 
  console.log('[TenantContext] Set:', ctx);
}

export function getCompanyContext(): CompanyContext {
  if (!current) {
    console.error('[TenantContext] Not initialized - this will cause RLS failures');
    throw new Error("CompanyContext not initialized");
  }
  return current;
}

export function clearCompanyContext() {
  console.log('[TenantContext] Cleared');
  current = null;
}

// Development helper
export function getCurrentCompanyId(): string | null {
  return current?.companyId || null;
}
```

```typescript
// src/lib/resolveCompany.ts
import { createClient } from "@supabase/supabase-js";
import type { CompanyContext } from "./tenantContext";

export async function resolveCompanyContext(supabase: any): Promise<CompanyContext> {
  // 1) Get authenticated user
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error(`Authentication required: ${error?.message || 'No user'}`);
  }

  // 2) Look up company context via people table (matches existing pattern)
  const { data: person, error: personError } = await supabase
    .from("people")
    .select("id, company_id, email, jwt_role")
    .eq("email", user.email)
    .eq("active", true)
    .single();

  if (personError || !person) {
    throw new Error(`User profile not found: ${personError?.message || 'No person record'}`);
  }

  // 3) Handle missing company_id (same logic as existing code)
  let companyId = person.company_id;
  
  if (!companyId) {
    console.warn('[TenantContext] User missing company_id, attempting auto-assignment...');
    
    // Get first available company (matches existing fallback logic)
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name")
      .order("created_at", { ascending: true })
      .limit(1);

    if (companiesError || !companies?.length) {
      throw new Error(`No companies available: ${companiesError?.message || 'Empty companies table'}`);
    }

    companyId = companies[0].id;
    
    // Update person record (existing pattern)
    const { error: updateError } = await supabase
      .from("people")
      .update({ company_id: companyId })
      .eq("email", user.email);

    if (updateError) {
      console.warn('[TenantContext] Could not update company_id:', updateError);
      // Continue anyway - RLS might still work
    } else {
      console.log(`[TenantContext] Auto-assigned company: ${companies[0].name}`);
    }
  }

  if (!companyId) {
    throw new Error("Unable to determine company context for user");
  }

  return { 
    companyId, 
    role: person.jwt_role,
    userId: user.id
  };
}
```

```typescript
// src/lib/db.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCompanyContext } from "./tenantContext";

// Feature flag for progressive rollout
const TENANCY_ENFORCED = import.meta.env.VITE_TENANCY_ENFORCED === 'true';

export function fromTenant<T extends string>(sb: SupabaseClient, table: T) {
  if (!TENANCY_ENFORCED) {
    // Fallback to existing behavior during rollout
    return sb.from(table);
  }

  const { companyId } = getCompanyContext();
  
  return {
    select: (...args: any[]) => {
      const query = sb.from(table).select(...args);
      // Add company_id filter for multi-tenant tables
      if (isCompanyScoped(table)) {
        return query.eq("company_id", companyId);
      }
      return query;
    },
    
    insert: (payload: any) => {
      const enrichedPayload = Array.isArray(payload)
        ? payload.map(r => enrichPayloadWithCompany(r, table, companyId))
        : enrichPayloadWithCompany(payload, table, companyId);
      
      return sb.from(table).insert(enrichedPayload);
    },
    
    update: (patch: any) => {
      const query = sb.from(table).update(patch);
      if (isCompanyScoped(table)) {
        return query.eq("company_id", companyId);
      }
      return query;
    },
    
    upsert: (payload: any) => {
      const enrichedPayload = Array.isArray(payload)
        ? payload.map(r => enrichPayloadWithCompany(r, table, companyId))
        : enrichPayloadWithCompany(payload, table, companyId);
      
      return sb.from(table).upsert(enrichedPayload);
    },
    
    delete: () => {
      const query = sb.from(table).delete();
      if (isCompanyScoped(table)) {
        return query.eq("company_id", companyId);
      }
      return query;
    }
  };
}

// Table metadata (will expand based on schema analysis)
const COMPANY_SCOPED_TABLES = new Set([
  'people',
  'invites', 
  'employee_quarter_notes',
  'evaluation_assignments',
  'submissions',
  'attribute_scores',
  'attribute_responses'
]);

function isCompanyScoped(table: string): boolean {
  return COMPANY_SCOPED_TABLES.has(table);
}

function enrichPayloadWithCompany(payload: any, table: string, companyId: string) {
  if (isCompanyScoped(table) && !payload.company_id) {
    return { company_id: companyId, ...payload };
  }
  return payload;
}
```

```typescript
// src/lib/logRls.ts
export function wrapRls<T extends (...a:any)=>Promise<any>>(fn: T, label: string): T {
  return (async (...args: any[]) => {
    const start = performance.now();
    const res = await fn(...args);
    const duration = performance.now() - start;
    
    if (res?.error) {
      const errorDetails = {
        code: res.error.code,
        message: res.error.message,
        details: res.error.details,
        duration: `${duration.toFixed(2)}ms`,
        operation: label,
        timestamp: new Date().toISOString()
      };
      
      if (res.error.code === '42501') {
        console.error(`[RLS DENIED] ${label}:`, errorDetails);
        // Could send to monitoring service
      } else {
        console.error(`[DB ERROR] ${label}:`, errorDetails);
      }
    } else if (import.meta.env.DEV) {
      console.log(`[DB SUCCESS] ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return res;
  }) as T;
}
```

**Environment Setup**:
```bash
# Add to .env.development
VITE_TENANCY_ENFORCED=false

# Add to .env.production  
VITE_TENANCY_ENFORCED=false
```

### A2: Bootstrap Integration (Day 2)

**Update App.tsx**:
```typescript
// src/App.tsx (add after existing auth logic)
import { setCompanyContext, clearCompanyContext } from '@/lib/tenantContext';
import { resolveCompanyContext } from '@/lib/resolveCompany';

// In auth state change handler
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          // Existing auth logic...
          
          // NEW: Initialize tenant context
          const tenantContext = await resolveCompanyContext(supabase);
          setCompanyContext(tenantContext);
          console.log('✅ Tenant context initialized:', tenantContext);
          
        } catch (error) {
          console.error('❌ Failed to initialize tenant context:', error);
          // Don't break existing flow - continue without tenant context
        }
      } else if (event === 'SIGNED_OUT') {
        clearCompanyContext();
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

### A3: Add Structured Logging (Day 3)

**Add Error Monitoring**:
```typescript
// src/lib/monitoring.ts
interface TenancyEvent {
  type: 'RLS_ERROR' | 'MISSING_CONTEXT' | 'CROSS_TENANT_ATTEMPT';
  operation: string;
  table?: string;
  error?: any;
  context?: any;
  userId?: string;
  companyId?: string;
}

export function logTenancyEvent(event: TenancyEvent) {
  const logEntry = {
    ...event,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Development logging
  if (import.meta.env.DEV) {
    console.warn('[TENANCY]', logEntry);
  }
  
  // Production monitoring (implement as needed)
  if (import.meta.env.PROD) {
    // Send to monitoring service
    // Example: sendToDatadog(logEntry);
  }
}
```

**Stage A Validation**:
- ✅ New tenancy files created but not used (no behavior change)
- ✅ Tenant context initializes successfully on login
- ✅ Feature flag TENANCY_ENFORCED=false (existing behavior preserved)
- ✅ Structured logging captures tenant events
- ✅ All existing functionality works unchanged

## 📋 Stage B: Critical Fixes (1 week)

**Goal**: Fix the highest-risk issues using new tenancy infrastructure

### B1: Fix Employee Selection (Days 4-5)

**Current Issue**: `fetchEmployees()` returns all employees across companies

**Fix Implementation**:
```typescript
// src/services/dataFetching.ts
import { fromTenant } from '@/lib/db';
import { logTenancyEvent } from '@/lib/monitoring';

export const fetchEmployees = async (): Promise<Employee[]> => {
  return EmployeeCacheService.getEmployeeList(async () => {
    console.log('🔍 Fetching employees with tenant context...');
    
    try {
      // NEW: Use tenant-aware query if flag enabled
      const query = fromTenant(supabase, 'people')
        .select('*')
        .eq('active', true)
        .order('name');

      const { data: people, error: peopleError } = await query;

      if (peopleError) {
        logTenancyEvent({
          type: 'RLS_ERROR',
          operation: 'fetchEmployees',
          table: 'people',
          error: peopleError
        });
        throw peopleError;
      }

      // Existing processing logic remains the same...
      
    } catch (error) {
      // Fallback to original logic if tenant context fails
      console.warn('Tenant-aware query failed, falling back to RLS-only:', error);
      
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .eq('active', true)
        .order('name');
        
      if (peopleError) throw peopleError;
      // Continue with existing logic...
    }
  });
};
```

### B2: Fix Invite Management (Days 6-7)

**Current Issue**: Invite operations lack company validation

**Fix Implementation**:
```typescript
// src/components/ui/InviteManager.tsx
import { fromTenant } from '@/lib/db';
import { getCompanyContext } from '@/lib/tenantContext';

// Fix invite revocation
const revokeInvite = async (inviteId: string) => {
  try {
    setError(null);
    
    // NEW: Use tenant-aware update
    const { error } = await fromTenant(supabase, 'invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', inviteId);

    if (error) {
      if (error.code === '42501') {
        throw new Error('You can only revoke invites from your company.');
      }
      throw error;
    }

    // Remove from local state
    setInvites(prev => prev.filter(invite => invite.id !== inviteId));
    
  } catch (err: any) {
    console.error('Failed to revoke invite:', err);
    setError(`Failed to revoke invite: ${err.message}`);
  }
};
```

### B3: Fix Survey Submissions (Days 8-10)

**Current Issue**: Survey submissions don't include company_id

**Fix Implementation**:
```typescript
// src/components/ui/EvaluationSurvey.tsx
import { fromTenant } from '@/lib/db';
import { getCompanyContext } from '@/lib/tenantContext';

// Fix submission creation
const handleSurveySubmit = async () => {
  try {
    const { companyId, userId } = getCompanyContext();
    
    // NEW: Create submission with explicit company context
    const { data: newSubmission, error: submissionError } = await fromTenant(supabase, 'submissions')
      .insert([{
        submitter_id: userId,
        assignment_id: assignmentId,
        submitted_at: new Date().toISOString(),
        // company_id automatically added by fromTenant
      }]);

    // Fix attribute scores
    const { data: scoreData, error: scoreError } = await fromTenant(supabase, 'attribute_scores')
      .upsert([{
        submission_id: currentSubmissionId,
        attribute_name,
        score,
        evaluatee_id,
        evaluator_id,
        evaluation_type,
        quarter_id,
        // company_id automatically added by fromTenant
      }]);

    // Existing error handling...
    
  } catch (error) {
    logTenancyEvent({
      type: 'RLS_ERROR',
      operation: 'surveySubmit',
      error,
      context: { assignmentId, userId: user?.id }
    });
    throw error;
  }
};
```

**Stage B Testing**:
- ✅ Enable TENANCY_ENFORCED=true in development
- ✅ Test employee selection only shows company employees
- ✅ Test invite revocation fails for cross-tenant attempts
- ✅ Test survey submissions include proper company context
- ✅ Verify fallback behavior when tenant context missing

## 📋 Stage C: Complete Migration (1.5 weeks)

**Goal**: Convert all remaining operations and enable globally

### C1: Convert Analytics Operations (Days 11-13)

**Fix Evaluation Data Fetching**:
```typescript
// src/services/dataFetching.ts
export const fetchEmployeeDetailedScores = async (employeeId: string, quarterId?: string): Promise<WeightedEvaluationScore[]> => {
  try {
    // Validate employee belongs to current company
    const { companyId } = getCompanyContext();
    
    const { data: employee, error: empError } = await fromTenant(supabase, 'people')
      .select('id, company_id')
      .eq('id', employeeId)
      .single();
      
    if (empError || !employee) {
      throw new Error('Employee not found or access denied');
    }
    
    // Continue with existing query logic...
    let query = fromTenant(supabase, 'weighted_evaluation_scores')
      .select('*')
      .eq('evaluatee_id', employeeId);
      
    // Rest of existing logic...
    
  } catch (error) {
    logTenancyEvent({
      type: 'CROSS_TENANT_ATTEMPT',
      operation: 'fetchEmployeeDetailedScores',
      context: { employeeId, quarterId }
    });
    throw error;
  }
};
```

### C2: Convert Assignment Operations (Days 14-15)

**Fix Assignment Service**:
```typescript
// src/services/assignmentService.ts
export const fetchUserAssignments = async (userId: string): Promise<EvaluationAssignment[]> => {
  const { companyId } = getCompanyContext();
  
  // Use tenant-aware query
  let query = fromTenant(supabase, 'assignment_details')
    .select('*')
    .eq('evaluator_id', userId);
    
  // Rest of existing logic...
};
```

### C3: Global Enablement (Days 16-17)

**Production Rollout**:
```bash
# Update production environment
VITE_TENANCY_ENFORCED=true
```

**Monitoring Setup**:
```typescript
// Add to monitoring dashboard
- RLS error rate (target: <1%)
- Cross-tenant access attempts (target: 0)
- Tenant context initialization failures (target: <5%)
- Query performance impact (target: <10% degradation)
```

**Stage C Validation**:
- ✅ All operations use tenant-aware patterns
- ✅ No 42501 errors on legitimate operations
- ✅ Cross-tenant access properly blocked
- ✅ Performance within acceptable bounds
- ✅ Error handling provides clear user feedback

## 🧪 Testing Strategy

### Unit Tests
```typescript
// src/lib/__tests__/tenantContext.test.ts
describe('TenantContext', () => {
  test('throws when not initialized', () => {
    expect(() => getCompanyContext()).toThrow('CompanyContext not initialized');
  });
  
  test('returns context after initialization', () => {
    const ctx = { companyId: 'test-company', userId: 'test-user' };
    setCompanyContext(ctx);
    expect(getCompanyContext()).toEqual(ctx);
  });
});
```

### Integration Tests
```typescript
// src/lib/__tests__/db.test.ts
describe('fromTenant', () => {
  test('adds company_id filter to selects', async () => {
    setCompanyContext({ companyId: 'test-company', userId: 'test-user' });
    
    const mockQuery = jest.fn().mockReturnValue({ eq: jest.fn() });
    const mockSupabase = { from: jest.fn().mockReturnValue(mockQuery) };
    
    fromTenant(mockSupabase, 'people').select('*');
    
    expect(mockQuery.eq).toHaveBeenCalledWith('company_id', 'test-company');
  });
});
```

### E2E Tests
```typescript
// tests/e2e/tenancy.spec.ts
test('employee selection respects company boundaries', async ({ page }) => {
  // Login as Company A user
  await loginAsUser(page, 'companyA@example.com');
  
  // Navigate to employee selection
  await page.goto('/employees');
  
  // Verify only Company A employees shown
  const employees = await page.locator('[data-testid="employee-card"]').all();
  for (const employee of employees) {
    const companyId = await employee.getAttribute('data-company-id');
    expect(companyId).toBe('company-a-id');
  }
});
```

## 🔧 Code Diff Examples

### Before (Current):
```typescript
// ❌ Current vulnerable pattern
const { data: people, error } = await supabase
  .from('people')
  .select('*')
  .eq('active', true);
```

### After (Stage B):
```typescript
// ✅ Fixed pattern with fallback
const { data: people, error } = await fromTenant(supabase, 'people')
  .select('*')
  .eq('active', true);
```

### Configuration:
```typescript
// Feature flag approach
const TENANCY_ENFORCED = import.meta.env.VITE_TENANCY_ENFORCED === 'true';

if (!TENANCY_ENFORCED) {
  // Use existing RLS-dependent code
  return supabase.from(table);
} else {
  // Use new tenant-aware code
  return tenantAwareQuery;
}
```

## 📊 Risk Mitigation

### Rollback Plan
- **Stage A**: Simply remove new files, no functional changes
- **Stage B**: Set TENANCY_ENFORCED=false to revert to RLS-only
- **Stage C**: Gradual feature-by-feature rollback possible

### Monitoring & Alerts
- **Error Rate Spike**: >5% increase in database errors
- **Performance Degradation**: >20% increase in query times  
- **Cross-Tenant Access**: Any 42501 errors on legitimate operations
- **Context Failures**: >10% tenant context initialization failures

### Testing Coverage
- **Unit**: 90%+ coverage of tenancy utilities
- **Integration**: All database operations tested with tenant context
- **E2E**: Critical user flows validated for tenant isolation
- **Performance**: Load testing with tenant-aware queries

This plan provides a safe, incremental path to fixing all identified tenancy issues while maintaining system stability and enabling quick rollback if needed.
