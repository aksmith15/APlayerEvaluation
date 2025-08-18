# Company Onboarding Runbook

## Overview
This runbook provides step-by-step procedures for onboarding new companies into the A-Player evaluation system. Currently uses manual SQL approach for super admin company management.

## Prerequisites
- Super admin database access
- PostgreSQL client (psql, pgAdmin, or Supabase SQL Editor)
- Knowledge of company requirements and basic information

---

## 🏢 Adding a New Company

### Step 1: Gather Company Information

**Required Information:**
- Company name (must be unique)
- Company description (optional but recommended)
- Company website URL (optional)

**Example:**
```
Name: Acme Corporation
Description: Leading widget manufacturer and software solutions provider
Website: https://acme.com
```

### Step 2: Execute Company Creation SQL

**Primary Command:**
```sql
-- Add new company
INSERT INTO companies (name, description, website) 
VALUES (
    'Acme Corporation',
    'Leading widget manufacturer and software solutions provider', 
    'https://acme.com'
);
```

**Verify Creation:**
```sql
-- Check company was created successfully
SELECT id, name, slug, description, website, created_at 
FROM companies 
WHERE name = 'Acme Corporation';
```

**Expected Output:**
```
id                                   | name             | slug             | description                    | website           | created_at
-------------------------------------|------------------|------------------|--------------------------------|-------------------|-------------------
f47ac10b-58cc-4372-a567-0e02b2c3d479 | Acme Corporation | acme-corporation | Leading widget manufacturer... | https://acme.com  | 2025-01-18 15:30:00
```

### Step 3: Record Company ID

**Save the company ID for future reference:**
- Copy the `id` field from the query result
- Document in company records/spreadsheet
- This ID will be used for invites and user assignments

---

## 🔍 Company Management Operations

### List All Companies
```sql
-- View all active companies
SELECT id, name, slug, description, website, created_at
FROM companies 
WHERE deleted_at IS NULL
ORDER BY name;
```

### Find Company by Name
```sql
-- Search for specific company
SELECT id, name, slug, description, website, created_at
FROM companies 
WHERE name ILIKE '%acme%'
AND deleted_at IS NULL;
```

### Update Company Information
```sql
-- Update company details
UPDATE companies 
SET 
    description = 'Updated company description',
    website = 'https://newwebsite.com',
    updated_at = NOW()
WHERE name = 'Acme Corporation';
```

### Soft Delete Company
```sql
-- Deactivate company (soft delete)
UPDATE companies 
SET deleted_at = NOW()
WHERE name = 'Acme Corporation';
```

### Restore Deleted Company
```sql
-- Restore previously deleted company
UPDATE companies 
SET deleted_at = NULL
WHERE name = 'Acme Corporation';
```

---

## 👥 Company User Management

### Check Company Users
```sql
-- List all users in a company
SELECT 
    p.name,
    p.email,
    p.role,
    p.jwt_role,
    p.hire_date,
    p.active
FROM people p
JOIN companies c ON p.company_id = c.id
WHERE c.name = 'Acme Corporation'
ORDER BY p.name;
```

### Check Company Memberships
```sql
-- View company memberships
SELECT 
    pr.full_name,
    pr.email,
    cm.role,
    cm.joined_at,
    cm.is_active
FROM company_memberships cm
JOIN profiles pr ON cm.profile_id = pr.id
JOIN companies c ON cm.company_id = c.id
WHERE c.name = 'Acme Corporation'
ORDER BY cm.joined_at;
```

---

## 📧 Company Invite Management

### Check Pending Invites
```sql
-- View pending invites for a company
SELECT 
    i.email,
    i.role_to_assign,
    i.position,
    i.jwt_role,
    i.inviter_name,
    i.created_at,
    i.expires_at
FROM invites i
JOIN companies c ON i.company_id = c.id
WHERE c.name = 'Acme Corporation'
AND i.claimed_at IS NULL
AND i.revoked_at IS NULL
ORDER BY i.created_at DESC;
```

### Revoke Company Invite
```sql
-- Manually revoke an invite
UPDATE invites 
SET revoked_at = NOW()
WHERE email = 'user@example.com'
AND company_id = (SELECT id FROM companies WHERE name = 'Acme Corporation');
```

---

## 🚨 Troubleshooting

### Common Issues

#### Issue: Duplicate Company Name
**Error:** `duplicate key value violates unique constraint`
**Solution:**
```sql
-- Check if company name already exists
SELECT name, deleted_at FROM companies WHERE name = 'Acme Corporation';

-- If deleted, restore instead of creating new
UPDATE companies SET deleted_at = NULL WHERE name = 'Acme Corporation';
```

#### Issue: Invalid Website URL
**Error:** `invalid input syntax for type url`
**Solution:**
```sql
-- Use NULL for website if URL is invalid
INSERT INTO companies (name, description, website) 
VALUES ('Acme Corporation', 'Description here', NULL);
```

#### Issue: Company Not Visible to Super Admin
**Check company context resolution:**
```sql
-- Verify super admin can see company
SELECT 
    c.id,
    c.name,
    p.email as admin_email,
    p.jwt_role
FROM companies c
CROSS JOIN people p
WHERE p.jwt_role = 'super_admin'
AND p.email = 'admin@example.com'
AND c.deleted_at IS NULL;
```

---

## 📋 Company Setup Checklist

After creating a new company, complete these steps:

### Immediate Setup (Required)
- [ ] Company created in database
- [ ] Company ID documented
- [ ] Basic company information verified
- [ ] Super admin can see company in UI

### Configuration (Recommended)
- [ ] First admin user invited
- [ ] Company logo uploaded (if applicable)
- [ ] Default evaluation settings configured
- [ ] Department structure planned

### Testing (Before Go-Live)
- [ ] Super admin can create invites for this company
- [ ] Invite emails contain correct company information
- [ ] New users can register and access company data
- [ ] Company switching works correctly

---

## 📊 Company Analytics

### Company Statistics
```sql
-- Get company overview stats
SELECT 
    c.name,
    COUNT(DISTINCT p.id) as total_employees,
    COUNT(DISTINCT CASE WHEN p.active = true THEN p.id END) as active_employees,
    COUNT(DISTINCT i.id) as pending_invites,
    c.created_at as company_created
FROM companies c
LEFT JOIN people p ON c.id = p.company_id
LEFT JOIN invites i ON c.id = i.company_id AND i.claimed_at IS NULL AND i.revoked_at IS NULL
WHERE c.name = 'Acme Corporation'
GROUP BY c.id, c.name, c.created_at;
```

### Recent Company Activity
```sql
-- View recent activity for a company
SELECT 
    'User Joined' as activity_type,
    p.name as user_name,
    p.email,
    p.hire_date as activity_date
FROM people p
JOIN companies c ON p.company_id = c.id
WHERE c.name = 'Acme Corporation'
AND p.hire_date >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'Invite Sent' as activity_type,
    i.email as user_name,
    i.inviter_name as email,
    i.created_at as activity_date
FROM invites i
JOIN companies c ON i.company_id = c.id
WHERE c.name = 'Acme Corporation'
AND i.created_at >= NOW() - INTERVAL '30 days'

ORDER BY activity_date DESC;
```

---

## 🔐 Security Considerations

### Access Control
- Only super admins should execute these SQL commands
- Document all company creation activities
- Verify company information before creation
- Monitor for suspicious company creation patterns

### Data Privacy
- Ensure company information complies with privacy policies
- Document data retention requirements
- Implement proper backup procedures
- Follow GDPR/compliance requirements if applicable

---

## 📞 Escalation Process

### When to Escalate
- Database connection issues
- Constraint violations that can't be resolved
- Bulk company operations (>10 companies)
- Data corruption or inconsistencies

### Escalation Contacts
- **Technical Issues**: Development Team Lead
- **Business Issues**: Product Manager
- **Security Issues**: Security Team
- **Data Issues**: Database Administrator

---

## 📝 Change Log

| Date | Change | Author | Notes |
|------|--------|--------|-------|
| 2025-01-18 | Initial creation | Development Team | Manual SQL approach documented |
| | | | Future: UI-based company management planned |

---

*Last Updated: January 18, 2025*
*Next Review: After UI-based company management implementation*
