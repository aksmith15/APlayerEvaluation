# Row Level Security (RLS) Implementation Guide
## A-Player Evaluation Dashboard

---

## 📋 Overview

This guide covers the comprehensive Row Level Security implementation for the A-Player Evaluation Dashboard. The RLS policies ensure that users can only access evaluation data they are authorized to view, providing secure multi-tenant access to quarterly analysis data.

## 🔒 Security Model

### User Roles
The RLS policies support the following user roles (stored in JWT token):

- **`authenticated`** - Basic authenticated user
- **`hr_admin`** - HR administrator with elevated access 
- **`super_admin`** - System administrator with full access
- **`service_role`** - System service for webhooks/automation

### Access Patterns
1. **Self Access**: Users can always view their own evaluation data
2. **Manager Access**: Managers can view data for their direct reports
3. **HR Access**: HR admins can view all employee data
4. **Admin Access**: Super admins have unrestricted access

## 📊 Protected Tables

### 1. **`people`** - Employee Data
**Policies:**
- ✅ Authenticated users can view active employees (for selection)
- ✅ Users can view their own profile details
- ✅ HR/Admin can view all employees including inactive

**Use Case:** Employee selection in analytics dashboard

---

### 2. **`evaluation_cycles`** - Quarter Information  
**Policies:**
- ✅ All authenticated users can view quarters
- ✅ Only HR/Admin can create/modify quarters

**Use Case:** Quarter selection for trend analysis

---

### 3. **`weighted_evaluation_scores`** - Core Score Data
**Policies:**
- ✅ Users can view their own evaluation scores
- ✅ Managers can view scores for their direct reports
- ✅ HR/Admin can view all scores

**Use Case:** Main quarterly analysis data (radar charts, trends)

---

### 4. **`quarter_final_scores`** - Quarterly Trend Data
**Policies:**
- ✅ Users can view their own quarterly trend data
- ✅ Managers can view trends for their team
- ✅ HR/Admin can view all quarterly trends

**Use Case:** Historical trend analysis and performance tracking

---

### 5. **`analysis_jobs`** - AI Analysis Tracking
**Policies:**
- ✅ Users can view/create AI analysis for accessible employees
- ✅ System service role can update job status (for webhooks)
- ✅ Jobs inherit access from employee relationship

**Use Case:** AI meta-analysis generation and tracking

---

### 6. **`app_config`** - Configuration Data
**Policies:**
- ✅ Authenticated users can read public config (excludes secrets)
- ✅ Only super admin can modify configuration

**Use Case:** Application settings and webhook URLs

---

### 7. **`submissions`** - Evaluation Submissions
**Policies:**
- ✅ Users can view submissions they created
- ✅ Users can view submissions about themselves
- ✅ Managers can view submissions for their team
- ✅ HR/Admin can view all submissions

**Use Case:** Detailed evaluation response data

## 🚀 Implementation Steps

### Step 1: Deploy RLS Policies
```bash
# Run the deployment script in Supabase SQL Editor
cat scripts/deploy-rls-policies.sql
```

### Step 2: Set Up Authentication
Ensure your JWT tokens include the required fields:
```json
{
  "email": "user@company.com",
  "role": "hr_admin",  // Optional: hr_admin, super_admin
  "aud": "authenticated",
  "iss": "supabase"
}
```

### Step 3: Add Manager Relationships (Optional)
If you want manager-subordinate access, add a `manager_id` column to the `people` table:
```sql
ALTER TABLE people ADD COLUMN manager_id UUID REFERENCES people(id);
```

### Step 4: Test Access Patterns
1. **Test self-access**: User should see only their data
2. **Test manager access**: Manager should see team data
3. **Test HR access**: HR should see all data
4. **Test unauthorized access**: Should be blocked

## 🔧 Configuration Requirements

### Database Schema Updates
The RLS policies assume the following schema:

```sql
-- Required columns in people table
- id (UUID, Primary Key)
- email (TEXT, for JWT matching)
- active (BOOLEAN, for filtering)
- manager_id (UUID, optional, for hierarchy)

-- Required foreign key relationships
- weighted_evaluation_scores.evaluatee_id → people.id
- quarter_final_scores.evaluatee_id → people.id  
- analysis_jobs.evaluatee_id → people.id
```

### Performance Indexes
The deployment script creates these indexes for optimal performance:
```sql
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_people_manager_id ON people(manager_id);
CREATE INDEX idx_people_active ON people(active);
```

## ⚡ Performance Considerations

### Query Optimization
- RLS policies use indexes on `people.email` for JWT email lookups
- Manager relationship queries are optimized with `manager_id` index
- Active employee filtering uses dedicated index

### Caching Strategy
- Quarter data can be cached (read-only for most users)
- Employee lists can be cached with user-specific filtering
- Score data should not be cached due to access control complexity

## 🛡️ Security Features

### Explicit Allow Model
- **Default Deny**: All access denied unless explicitly allowed
- **Principle of Least Privilege**: Users get minimal required access
- **Defense in Depth**: Multiple policy layers protect sensitive data

### Audit Trail
All database access is automatically logged by Supabase with:
- User identification (from JWT)
- Table access patterns
- Query execution details
- Policy enforcement results

### Error Handling
- Invalid access attempts return empty results (not errors)
- No data leakage through error messages
- Graceful handling of missing relationships

## 🧪 Testing Guide

### Test Cases
1. **Authenticated User Access**
   - Can view active employees for selection
   - Can view their own evaluation scores
   - Cannot view other employees' detailed data

2. **Manager Access**
   - Can view team members' evaluation data
   - Cannot view peers' or other teams' data
   - Can generate AI analysis for team members

3. **HR Admin Access**
   - Can view all employee data
   - Can manage evaluation cycles
   - Can access all historical data

4. **Unauthorized Access**
   - Anonymous users get no data
   - Users cannot access data outside their scope
   - Service operations work correctly

### Testing SQL
```sql
-- Test as regular user
SELECT auth.jwt() ->> 'email';
SELECT * FROM people; -- Should only see active employees

-- Test manager access
SELECT * FROM weighted_evaluation_scores 
WHERE evaluatee_id = 'some-employee-id';

-- Test HR admin access
SELECT COUNT(*) FROM weighted_evaluation_scores; -- Should see all
```

## 🚨 Important Notes

### Manager Hierarchy
- The policies assume a `manager_id` column in the `people` table
- If this column doesn't exist, manager-based access will be skipped
- You can add this column later without breaking existing functionality

### JWT Role Setup
- Roles are stored in the JWT token's custom claims
- Set up roles in your Supabase Auth configuration
- Test role assignment before deploying to production

### Webhook Access
- The `service_role` is needed for n8n webhook updates to `analysis_jobs`
- Ensure your webhook uses the service role key
- Regular users cannot update job status directly

## 📈 Next Steps

1. **Deploy the RLS policies** using the provided script
2. **Test access patterns** with different user types
3. **Set up manager relationships** if needed
4. **Configure JWT roles** in your auth system
5. **Monitor performance** and optimize as needed

---

**🔗 Related Files:**
- `supabase-rls-policies.sql` - Complete policy definitions
- `scripts/deploy-rls-policies.sql` - Deployment-ready script
- `database-schema.sql` - Original table definitions 