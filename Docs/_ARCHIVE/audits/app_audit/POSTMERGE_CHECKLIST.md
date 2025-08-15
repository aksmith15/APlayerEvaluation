# Post-Merge Tenancy Validation Checklist

**Document Date**: February 1, 2025  
**Purpose**: Manual validation checklist after tenancy fix implementation  
**Reviewer**: ________________  
**Date Completed**: ________________

## 📋 Pre-Deployment Validation

### ✅ Code Review Checklist
- [ ] All tenancy SDK files added correctly (`src/lib/tenantContext.ts`, `src/lib/resolveCompany.ts`, `src/lib/db.ts`, `src/lib/logRls.ts`, `src/lib/monitoring.ts`)
- [ ] App.tsx modified to initialize tenant context on auth state change
- [ ] Environment variables configured (`VITE_TENANCY_ENFORCED` in all environments)
- [ ] Feature flag set to `false` for initial deployment
- [ ] No breaking changes to existing API contracts
- [ ] All existing tests still pass
- [ ] New tenancy tests added and passing

### ✅ Build Validation
- [ ] Development build succeeds with `VITE_TENANCY_ENFORCED=false`
- [ ] Development build succeeds with `VITE_TENANCY_ENFORCED=true`
- [ ] Production build succeeds
- [ ] Bundle size increase is <5% (tenancy SDK is lightweight)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors on application startup

## 🚀 Stage A Deployment Validation

### ✅ Foundation Deployment (Days 1-3)
- [ ] **Application Starts Successfully**
  - [ ] No console errors on load
  - [ ] Existing login flow works unchanged
  - [ ] User authentication completes normally
  
- [ ] **Tenant Context Initialization**
  - [ ] Login triggers tenant context initialization
  - [ ] Console shows "✅ Tenant context initialized" message
  - [ ] Context includes valid companyId, userId, and role
  - [ ] Logout clears tenant context properly
  
- [ ] **Feature Flag Validation**
  - [ ] `VITE_TENANCY_ENFORCED=false` preserves existing behavior
  - [ ] All database queries work as before
  - [ ] No performance degradation observed
  
- [ ] **Monitoring Integration**
  - [ ] Tenancy events logged to browser console (dev mode)
  - [ ] LocalStorage contains tenancy event history
  - [ ] No monitoring errors in console

### ✅ Stage A Manual Tests
```bash
# Test 1: Basic Authentication Flow
1. Open application in incognito mode
2. Navigate to login page
3. Login with valid credentials
4. Check browser console for:
   ✅ "🏢 Initializing tenant context..."
   ✅ "✅ Tenant context initialized: { companyId: '...', role: '...' }"
   ❌ No error messages

# Test 2: Context Persistence
1. Login and verify context initialization
2. Navigate between pages (employees, analytics)
3. Refresh page
4. Verify context persists across navigation
5. Logout and verify context cleared

# Test 3: Fallback Behavior
1. Temporarily break company resolution (invalid email)
2. Verify application continues to work
3. Check console for fallback warning messages
4. Verify RLS still provides protection
```

## 🛠️ Stage B Deployment Validation

### ✅ Critical Fixes Deployment (Days 4-10)
- [ ] **Employee Selection Fix**
  - [ ] `fetchEmployees()` only returns employees from user's company
  - [ ] No cross-tenant employee data visible
  - [ ] Employee count matches expected company size
  - [ ] Search functionality works within tenant scope
  
- [ ] **Invite Management Fix**
  - [ ] Invite listing scoped to user's company
  - [ ] Invite revocation validates company ownership
  - [ ] Cross-tenant invite access properly blocked
  - [ ] Error messages are user-friendly
  
- [ ] **Survey Submission Fix**
  - [ ] Survey submissions include company_id
  - [ ] Submissions linked to correct company
  - [ ] Cross-tenant survey access blocked
  - [ ] Survey completion tracking accurate

### ✅ Stage B Manual Tests
```bash
# Test 1: Employee Selection Validation
1. Login as Company A user
2. Navigate to /employees
3. Count visible employees
4. Verify all employees belong to Company A
5. Use browser dev tools to check network requests
6. Confirm company_id filter applied to queries

# Test 2: Invite Security Validation
1. Login as Company A admin
2. Navigate to invite management
3. Note invite IDs in developer tools
4. Attempt to revoke invite from Company B (use API directly)
5. Verify permission denied error
6. Confirm only Company A invites modifiable

# Test 3: Survey Submission Validation
1. Complete evaluation survey
2. Check database submissions table
3. Verify submission includes correct company_id
4. Attempt cross-tenant survey access via URL manipulation
5. Confirm access properly blocked

# Test 4: Fallback Behavior Testing
1. Set VITE_TENANCY_ENFORCED=false
2. Verify all operations still work
3. Check that RLS provides fallback protection
4. No functional regressions observed
```

## 🎯 Stage C Deployment Validation

### ✅ Complete Migration (Days 11-17)
- [ ] **Global Tenancy Enablement**
  - [ ] `VITE_TENANCY_ENFORCED=true` in production
  - [ ] All database operations use tenant-aware patterns
  - [ ] No 42501 permission denied errors on legitimate operations
  - [ ] Cross-tenant access attempts properly blocked
  
- [ ] **Performance Validation**
  - [ ] Page load times within acceptable bounds (<10% degradation)
  - [ ] Database query performance acceptable
  - [ ] Memory usage stable
  - [ ] No memory leaks in tenant context management
  
- [ ] **Error Handling**
  - [ ] RLS errors logged with proper context
  - [ ] User-friendly error messages displayed
  - [ ] Automatic error recovery where possible
  - [ ] Monitoring alerts functioning

### ✅ Stage C Manual Tests
```bash
# Test 1: Full Tenancy Validation
1. Set VITE_TENANCY_ENFORCED=true
2. Login as different company users
3. Verify complete tenant isolation
4. Test all major features
5. Confirm no cross-tenant data leakage

# Test 2: Performance Testing
1. Measure page load times for key features
2. Compare with pre-tenancy performance
3. Verify <10% performance impact
4. Test with larger datasets if available

# Test 3: Error Scenario Testing
1. Simulate RLS policy failures
2. Test with invalid company context
3. Verify graceful error handling
4. Confirm user experience remains acceptable

# Test 4: Role-Based Access Testing
1. Test with different user roles (member, hr_admin, super_admin)
2. Verify role-based access controls work
3. Test role changes (if supported)
4. Confirm security boundaries respected
```

## 🔍 Data Integrity Validation

### ✅ Database State Checks
- [ ] **Company_ID Consistency**
  ```sql
  -- Check for records missing company_id where required
  SELECT table_name, count(*) 
  FROM information_schema.tables 
  WHERE table_schema = 'public';
  
  -- Verify no orphaned records
  SELECT count(*) FROM submissions WHERE company_id IS NULL;
  SELECT count(*) FROM attribute_scores WHERE company_id IS NULL;
  ```

- [ ] **Cross-Tenant Data Audit**
  ```sql
  -- Verify no cross-tenant references
  SELECT s.id, s.company_id, p.company_id 
  FROM submissions s 
  JOIN people p ON s.submitter_id = p.id 
  WHERE s.company_id != p.company_id;
  ```

- [ ] **RLS Policy Status**
  ```sql
  -- Verify all policies are enabled
  SELECT tablename, policyname, permissive, roles, cmd, qual 
  FROM pg_policies 
  WHERE schemaname = 'public' 
  ORDER BY tablename;
  ```

### ✅ Application State Validation
- [ ] **User Sessions**
  - [ ] Active user sessions maintain tenant context
  - [ ] Session refresh preserves tenant context
  - [ ] Multiple tab/window sessions work correctly
  - [ ] Mobile/responsive sessions work correctly

- [ ] **Cache Consistency**
  - [ ] Cached data respects tenant boundaries
  - [ ] Cache invalidation works correctly
  - [ ] No cross-tenant cache pollution
  - [ ] Cache performance acceptable

## 🚨 Security Validation

### ✅ Penetration Testing Checklist
- [ ] **URL Manipulation Tests**
  ```bash
  # Test direct access to other company data
  curl -H "Authorization: Bearer $TOKEN" \
    "https://app.example.com/api/employees/other-company-employee-id"
  
  # Expected: 403 Forbidden or 404 Not Found
  ```

- [ ] **API Endpoint Security**
  - [ ] All REST endpoints validate tenant context
  - [ ] GraphQL queries (if any) respect tenant boundaries
  - [ ] File upload/download respects tenant scope
  - [ ] Webhook endpoints validate tenant context

- [ ] **JWT Token Validation**
  ```bash
  # Test with modified JWT claims
  # Verify company_id tampering is detected
  # Confirm role escalation attempts fail
  ```

### ✅ Access Control Testing
- [ ] **Cross-Tenant Access Attempts**
  - [ ] Attempt to access other company employees
  - [ ] Attempt to modify other company invites
  - [ ] Attempt to view other company analytics
  - [ ] Attempt to submit surveys for other companies
  - [ ] All attempts properly blocked with appropriate errors

- [ ] **Role Escalation Tests**
  - [ ] Member role cannot access admin features
  - [ ] HR admin cannot access super admin features
  - [ ] Role changes require proper authentication
  - [ ] Temporary role elevation properly expires

## 📊 Monitoring & Alerting Validation

### ✅ Monitoring Setup
- [ ] **RLS Error Monitoring**
  - [ ] 42501 errors properly logged
  - [ ] Error context includes tenant information
  - [ ] Error rates within acceptable bounds (<1%)
  - [ ] Alerts fire for error rate spikes

- [ ] **Performance Monitoring**
  - [ ] Query performance tracking enabled
  - [ ] Page load time monitoring
  - [ ] Memory usage tracking
  - [ ] Alerts for performance degradation

- [ ] **Security Monitoring**
  - [ ] Cross-tenant access attempts logged
  - [ ] Failed authentication attempts tracked
  - [ ] Suspicious activity alerts configured
  - [ ] Security event escalation procedures tested

### ✅ Dashboard Validation
- [ ] **Tenancy Health Dashboard**
  - [ ] Context initialization success rate
  - [ ] RLS error rates by table/operation
  - [ ] Performance metrics by tenant
  - [ ] Security incident tracking

## 🎭 User Acceptance Testing

### ✅ Business User Validation
- [ ] **HR Administrator Testing**
  - [ ] Can manage employees within company
  - [ ] Can create/manage assignments
  - [ ] Can view company analytics
  - [ ] Cannot access other company data

- [ ] **Employee Testing**
  - [ ] Can complete assigned surveys
  - [ ] Can view permitted analytics
  - [ ] Cannot access unauthorized features
  - [ ] User experience remains intuitive

- [ ] **System Administrator Testing**
  - [ ] Can manage system-wide settings
  - [ ] Can switch between company contexts (if supported)
  - [ ] Can access monitoring/debugging tools
  - [ ] Emergency procedures work correctly

## 📚 Documentation Validation

### ✅ Updated Documentation
- [ ] **Developer Documentation**
  - [ ] Tenancy SDK usage examples
  - [ ] Migration guide for new features
  - [ ] Troubleshooting guide
  - [ ] API reference updates

- [ ] **User Documentation**
  - [ ] Updated user guide reflects new behavior
  - [ ] Error message explanations
  - [ ] FAQ updates for common issues
  - [ ] Video tutorials updated (if applicable)

- [ ] **Operations Documentation**
  - [ ] Deployment procedures updated
  - [ ] Monitoring/alerting procedures
  - [ ] Incident response procedures
  - [ ] Backup/recovery procedures

## 🚀 Go-Live Checklist

### ✅ Final Pre-Production Steps
- [ ] **Backup Validation**
  - [ ] Recent database backup verified
  - [ ] Application state snapshot taken
  - [ ] Rollback procedure documented and tested

- [ ] **Stakeholder Communication**
  - [ ] Development team briefed on changes
  - [ ] Support team trained on new error scenarios
  - [ ] Business stakeholders notified of deployment
  - [ ] Emergency contact procedures activated

- [ ] **Monitoring Readiness**
  - [ ] All monitoring systems active
  - [ ] Alert recipients configured
  - [ ] Escalation procedures tested
  - [ ] On-call engineer assigned

### ✅ Post-Deployment Monitoring (First 24 Hours)
- [ ] **Hour 1: Critical Validation**
  - [ ] Application accessible and functional
  - [ ] User authentication working
  - [ ] No critical errors in logs
  - [ ] Basic tenant isolation working

- [ ] **Hour 6: Functionality Validation**
  - [ ] All major features tested
  - [ ] Performance within acceptable bounds
  - [ ] No security incidents reported
  - [ ] User feedback positive

- [ ] **Hour 24: Stability Validation**
  - [ ] System stable under normal load
  - [ ] No data integrity issues detected
  - [ ] Monitoring systems functioning correctly
  - [ ] Ready for broader user adoption

## 📞 Emergency Procedures

### ✅ Rollback Plan (If Issues Detected)
1. **Immediate Actions (0-15 minutes)**
   - [ ] Set `VITE_TENANCY_ENFORCED=false`
   - [ ] Redeploy application
   - [ ] Verify service restoration

2. **Secondary Actions (15-60 minutes)**
   - [ ] Revert application code changes
   - [ ] Restore database if data corruption detected
   - [ ] Communicate incident to stakeholders

3. **Recovery Actions (1+ hours)**
   - [ ] Analyze root cause of failure
   - [ ] Plan remediation approach
   - [ ] Update implementation based on lessons learned

### ✅ Escalation Contacts
- **Technical Lead**: ________________
- **Database Administrator**: ________________
- **Security Team**: ________________
- **Business Stakeholder**: ________________

## ✅ Sign-Off

**Technical Validation Completed By**: ________________  
**Date**: ________________  
**Security Review Completed By**: ________________  
**Date**: ________________  
**Business Validation Completed By**: ________________  
**Date**: ________________  

**Overall Deployment Status**: [ ] APPROVED / [ ] REJECTED  
**Notes**: ________________________________________________

---

**This checklist ensures comprehensive validation of the tenancy implementation and provides confidence that the system is secure, performant, and ready for production use.**
