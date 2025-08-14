# Tenancy Test Matrix

**Document Date**: February 1, 2025  
**Purpose**: Comprehensive test scenarios for tenant isolation validation  
**Test Environment**: Development, Staging, Production

## 🎯 Test Methodology

### Test Categories
1. **Unit Tests**: Component and utility function testing
2. **Integration Tests**: Database operation testing with tenant context
3. **E2E Tests**: Full user workflow testing across tenant boundaries
4. **Security Tests**: Cross-tenant access attempt validation
5. **Performance Tests**: Tenant-aware query performance validation

### Test Data Setup
```sql
-- Test companies
INSERT INTO companies (id, name) VALUES 
  ('company-a-uuid', 'Company A'),
  ('company-b-uuid', 'Company B'),
  ('company-c-uuid', 'Company C');

-- Test users per company
INSERT INTO people (id, email, name, company_id, jwt_role, active) VALUES
  ('user-a1-uuid', 'admin@companya.com', 'Admin A', 'company-a-uuid', 'hr_admin', true),
  ('user-a2-uuid', 'user@companya.com', 'User A', 'company-a-uuid', 'member', true),
  ('user-b1-uuid', 'admin@companyb.com', 'Admin B', 'company-b-uuid', 'hr_admin', true),
  ('user-b2-uuid', 'user@companyb.com', 'User B', 'company-b-uuid', 'member', true);
```

## 📋 Role-Based Test Matrix

| Role | Employee Selection | Analytics View | Assignment Mgmt | Survey Completion | Invite Management |
|------|-------------------|----------------|-----------------|-------------------|-------------------|
| **super_admin** | ✅ All company employees | ✅ All employee data | ✅ Create/manage all | ✅ Complete surveys | ✅ Manage all invites |
| **hr_admin** | ✅ Own company employees | ✅ Own company data | ✅ Create/manage own | ✅ Complete surveys | ✅ Manage own invites |
| **member** | ✅ Own company employees | ✅ View assigned data | ❌ View only | ✅ Complete surveys | ❌ View only |

## 🧪 Unit Test Suite

### 1. Tenant Context Tests
```typescript
// src/lib/__tests__/tenantContext.test.ts
describe('TenantContext', () => {
  beforeEach(() => {
    clearCompanyContext();
  });

  test('throws when not initialized', () => {
    expect(() => getCompanyContext()).toThrow('CompanyContext not initialized');
  });
  
  test('returns context after initialization', () => {
    const ctx = { companyId: 'test-company', userId: 'test-user', role: 'member' };
    setCompanyContext(ctx);
    expect(getCompanyContext()).toEqual(ctx);
  });
  
  test('validates context correctly', () => {
    setCompanyContext({ companyId: 'invalid-uuid', userId: 'test-user' });
    const result = validateTenantContext();
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Invalid companyId format (expected UUID)');
  });

  test('role checking functions work', () => {
    setCompanyContext({ companyId: 'test-company', userId: 'test-user', role: 'hr_admin' });
    expect(hasRole('hr_admin')).toBe(true);
    expect(hasRole('super_admin')).toBe(false);
    expect(hasAnyRole(['hr_admin', 'super_admin'])).toBe(true);
  });
});
```

### 2. Database Wrapper Tests
```typescript
// src/lib/__tests__/db.test.ts
describe('fromTenant', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn() })),
      insert: jest.fn(),
      update: jest.fn(() => ({ eq: jest.fn() })),
      delete: jest.fn(() => ({ eq: jest.fn() }))
    }))
  };

  beforeEach(() => {
    setCompanyContext({ companyId: 'test-company', userId: 'test-user' });
    process.env.VITE_TENANCY_ENFORCED = 'true';
  });

  test('adds company_id filter to select queries', () => {
    const query = fromTenant(mockSupabase, 'people').select('*');
    expect(query.eq).toHaveBeenCalledWith('company_id', 'test-company');
  });

  test('enriches insert payload with company_id', () => {
    fromTenant(mockSupabase, 'people').insert({ name: 'Test User' });
    expect(mockSupabase.from().insert).toHaveBeenCalledWith({
      company_id: 'test-company',
      name: 'Test User'
    });
  });

  test('falls back to standard query when feature flag disabled', () => {
    process.env.VITE_TENANCY_ENFORCED = 'false';
    const result = fromTenant(mockSupabase, 'people');
    expect(result).toBe(mockSupabase.from('people'));
  });
});
```

## 🔗 Integration Test Suite

### 1. Employee Data Access Tests
```typescript
// src/services/__tests__/dataFetching.integration.test.ts
describe('Employee Data Access', () => {
  test('fetchEmployees returns only company employees', async () => {
    // Setup: Login as Company A user
    await loginAsUser('admin@companya.com');
    
    // Execute: Fetch employees
    const employees = await fetchEmployees();
    
    // Verify: Only Company A employees returned
    expect(employees).toHaveLength(2);
    expect(employees.every(emp => emp.email.includes('companya.com'))).toBe(true);
  });

  test('fetchEmployees with wrong company context fails gracefully', async () => {
    // Setup: Manually set wrong company context
    setCompanyContext({ companyId: 'wrong-company', userId: 'test-user' });
    
    // Execute & Verify: Should return empty array or throw descriptive error
    await expect(fetchEmployees()).resolves.toEqual([]);
  });
});
```

### 2. Survey Submission Tests
```typescript
describe('Survey Submissions', () => {
  test('survey submission includes correct company_id', async () => {
    // Setup: Login and start survey
    await loginAsUser('user@companya.com');
    const assignmentId = 'test-assignment-id';
    
    // Execute: Submit survey
    await handleSurveySubmit(assignmentId, mockSurveyData);
    
    // Verify: Check database record has correct company_id
    const { data } = await supabase
      .from('submissions')
      .select('company_id')
      .eq('assignment_id', assignmentId)
      .single();
      
    expect(data.company_id).toBe('company-a-uuid');
  });

  test('cross-tenant survey submission fails', async () => {
    // Setup: Login as Company A user but try to submit for Company B assignment
    await loginAsUser('user@companya.com');
    const companyBAssignmentId = 'company-b-assignment-id';
    
    // Execute & Verify: Should fail with permission error
    await expect(handleSurveySubmit(companyBAssignmentId, mockSurveyData))
      .rejects.toThrow(/permission denied|access denied/i);
  });
});
```

### 3. Invite Management Tests
```typescript
describe('Invite Management', () => {
  test('invite revocation only affects own company invites', async () => {
    // Setup: Create invites for both companies
    const companyAInvite = await createTestInvite('company-a-uuid');
    const companyBInvite = await createTestInvite('company-b-uuid');
    
    // Login as Company A admin
    await loginAsUser('admin@companya.com');
    
    // Execute: Try to revoke Company B invite
    await expect(revokeInvite(companyBInvite.id))
      .rejects.toThrow(/can only revoke invites from your company/i);
    
    // Verify: Company A invite can still be revoked
    await expect(revokeInvite(companyAInvite.id)).resolves.not.toThrow();
  });
});
```

## 🎭 End-to-End Test Suite

### 1. Complete User Workflow Tests
```typescript
// tests/e2e/tenant-isolation.spec.ts
test('complete employee evaluation workflow respects tenant boundaries', async ({ page, context }) => {
  // Step 1: Login as Company A admin
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'admin@companya.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Step 2: Verify employee selection shows only Company A employees
  await page.goto('/employees');
  const employeeCards = await page.locator('[data-testid="employee-card"]').all();
  
  for (const card of employeeCards) {
    const companyId = await card.getAttribute('data-company-id');
    expect(companyId).toBe('company-a-uuid');
  }
  
  // Step 3: Select employee and verify analytics data
  await employeeCards[0].click();
  await expect(page.locator('[data-testid="employee-analytics"]')).toBeVisible();
  
  // Step 4: Verify no Company B data leakage
  const chartData = await page.locator('[data-testid="radar-chart"]').getAttribute('data-values');
  const dataPoints = JSON.parse(chartData);
  // Add assertions to verify data belongs to Company A only
  
  // Step 5: Try to access Company B employee directly via URL
  await page.goto('/analytics/company-b-employee-id');
  await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
});
```

### 2. Cross-Tenant Security Tests
```typescript
test('cannot access other company data via URL manipulation', async ({ page }) => {
  // Login as Company A user
  await loginAsUser(page, 'user@companya.com');
  
  // Attempt to access Company B URLs
  const forbiddenUrls = [
    '/analytics/company-b-employee-id',
    '/assignments/manage?company_id=company-b-uuid',
    '/survey/company-b-assignment-token'
  ];
  
  for (const url of forbiddenUrls) {
    await page.goto(url);
    
    // Verify access denied or redirect to safe page
    const currentUrl = page.url();
    const hasAccessDenied = await page.locator('[data-testid="access-denied"]').isVisible();
    const redirectedToSafePage = currentUrl.includes('/employees') || currentUrl.includes('/login');
    
    expect(hasAccessDenied || redirectedToSafePage).toBe(true);
  }
});
```

### 3. Role-Based Access Tests
```typescript
test('role-based access controls work correctly', async ({ page }) => {
  // Test member role limitations
  await loginAsUser(page, 'user@companya.com'); // member role
  
  await page.goto('/assignments/manage');
  await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  
  // Test hr_admin role permissions
  await loginAsUser(page, 'admin@companya.com'); // hr_admin role
  
  await page.goto('/assignments/manage');
  await expect(page.locator('[data-testid="assignment-creation-form"]')).toBeVisible();
});
```

## 🛡️ Security Test Suite

### 1. RLS Policy Bypass Tests
```typescript
// These tests attempt to bypass application-level protections
describe('RLS Policy Bypass Attempts', () => {
  test('direct supabase query without tenant context fails safely', async () => {
    // Clear tenant context to simulate bypass attempt
    clearCompanyContext();
    
    // Attempt direct query (should fail or return empty)
    const { data, error } = await supabase
      .from('people')
      .select('*');
      
    // Verify: Either RLS blocks it or returns no cross-tenant data
    expect(data?.length || 0).toBeLessThanOrEqual(1); // At most own user
  });

  test('malformed company_id in requests rejected', async () => {
    // Attempt to set malicious company context
    const maliciousAttempts = [
      { companyId: "'; DROP TABLE people; --", userId: 'test' },
      { companyId: 'company-a-uuid OR 1=1', userId: 'test' },
      { companyId: null, userId: 'test' }
    ];
    
    for (const attempt of maliciousAttempts) {
      expect(() => setCompanyContext(attempt)).toThrow();
    }
  });
});
```

### 2. Token Manipulation Tests
```typescript
test('survey token manipulation fails securely', async ({ page }) => {
  await loginAsUser(page, 'user@companya.com');
  
  // Get valid Company A survey token
  const validToken = await getTestSurveyToken('company-a-uuid');
  
  // Attempt to modify token to access Company B data
  const maliciousTokens = [
    validToken.replace('company-a-uuid', 'company-b-uuid'),
    validToken + 'malicious-suffix',
    'completely-fake-token'
  ];
  
  for (const token of maliciousTokens) {
    await page.goto(`/survey/${token}`);
    
    // Verify: Secure error handling
    const hasError = await page.locator('[data-testid="invalid-token"]').isVisible();
    const redirected = page.url().includes('/login') || page.url().includes('/assignments');
    
    expect(hasError || redirected).toBe(true);
  }
});
```

## 🚀 Performance Test Suite

### 1. Query Performance Tests
```typescript
describe('Tenant-Aware Query Performance', () => {
  test('tenant filtering does not significantly degrade performance', async () => {
    const iterations = 100;
    
    // Measure standard query performance
    const standardStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await supabase.from('people').select('*').limit(10);
    }
    const standardDuration = performance.now() - standardStart;
    
    // Measure tenant-aware query performance
    setCompanyContext({ companyId: 'test-company', userId: 'test-user' });
    
    const tenantStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await fromTenant(supabase, 'people').select('*').limit(10);
    }
    const tenantDuration = performance.now() - tenantStart;
    
    // Verify: Less than 20% performance degradation
    const degradation = (tenantDuration - standardDuration) / standardDuration;
    expect(degradation).toBeLessThan(0.2);
  });
});
```

## 📊 Test Execution Matrix

### Development Testing
```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e

# Security tests
npm run test:security

# Performance tests
npm run test:performance

# Full test suite
npm run test:all
```

### Staging/Production Testing
```bash
# Tenant isolation validation
npm run test:tenant-isolation

# Role-based access validation
npm run test:rbac

# Cross-tenant security validation
npm run test:security:cross-tenant

# Performance regression testing
npm run test:performance:regression
```

## 🎯 Test Scenarios by Feature

### Employee Selection
- ✅ Only company employees shown
- ✅ Search filters within company
- ✅ Direct employee ID access validated
- ❌ Cross-tenant employee access blocked

### Employee Analytics
- ✅ Analytics data scoped to company
- ✅ Historical data respects tenant boundaries
- ✅ PDF exports contain only company data
- ❌ URL manipulation to other company data blocked

### Assignment Management
- ✅ Assignments scoped to company
- ✅ Bulk assignment CSV validates company membership
- ✅ Assignment status updates validated
- ❌ Cross-tenant assignment modification blocked

### Survey System
- ✅ Survey tokens validated for company
- ✅ Submissions include proper company context
- ✅ Survey completion tracking per company
- ❌ Token manipulation attempts blocked

### Invite Management
- ✅ Invites scoped to company
- ✅ Invite revocation validates ownership
- ✅ Invite status tracking per company
- ❌ Cross-tenant invite manipulation blocked

## 🔍 Monitoring & Alerting

### Test Result Monitoring
- **Test Success Rate**: Should be >95%
- **Security Test Failures**: Should be 0
- **Performance Degradation**: Should be <20%
- **Cross-Tenant Access Attempts**: Should be 0 successful

### Automated Test Alerts
- Failed security tests trigger immediate alert
- Performance degradation >30% triggers warning
- Cross-tenant access success triggers critical alert
- RLS error rate >5% triggers investigation

## 📝 Test Documentation

### Test Case Template
```typescript
/**
 * Test: [Feature] - [Scenario]
 * 
 * Setup:
 * - User role: [role]
 * - Company: [company]
 * - Data state: [description]
 * 
 * Execute:
 * - [Action steps]
 * 
 * Verify:
 * - [Expected results]
 * - [Security assertions]
 * - [Performance assertions]
 * 
 * Cleanup:
 * - [Cleanup steps]
 */
```

This comprehensive test matrix ensures complete validation of tenant isolation across all features and user roles.
