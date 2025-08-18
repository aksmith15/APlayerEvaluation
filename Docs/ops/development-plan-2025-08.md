# A-Player Development Plan - August 2025

## Overview
This development plan outlines the next phase of enhancements for the A-Player Evaluation system, focusing on multi-company support for super admins and user profile management capabilities.

## 🎯 Phase 1: Multi-Company Super Admin Support

### Goal
Enable super admins to invite users to any company they oversee, with proper company selection and onboarding workflows.

### Current State
- ✅ Super admin role (`jwt_role = 'super_admin'`) functional
- ✅ Company switching UI exists (`CompanySwitcher.tsx`)
- ✅ `getUserCompanies()` returns all companies for super admins
- ✅ Single-company invite flow working perfectly
- ❌ Invite UI hardcoded to user's company
- ❌ No company onboarding process documented

### Requirements

#### 1.1 Company Onboarding Process
**Manual SQL Approach (Phase 1)**
```sql
-- Add new company (super admin executes via database)
INSERT INTO companies (name, description, website) 
VALUES ('Acme Corporation', 'Leading widget manufacturer', 'https://acme.com');

-- Verify company was created
SELECT id, name, slug, created_at FROM companies 
WHERE name = 'Acme Corporation';
```

**Documentation Required:**
- SQL scripts for common company operations
- Company setup checklist
- Default configuration steps

#### 1.2 Enhanced Invite UI with Company Selection

**Changes to `InviteManager.tsx`:**
- Add company dropdown for super admins
- Load available companies via `getUserCompanies()`
- Show current selected company context
- Maintain backward compatibility for single-company admins

**UI Mockup:**
```
┌─────────────────────────────────────┐
│ Send Company Invitation             │
├─────────────────────────────────────┤
│ Target Company: [Dropdown]  ↓      │  ← NEW: Only for super admins
│ Email: [user@company.com]           │
│ Position: [Software Engineer]       │
│ Role: [Member ↓]                    │
│ Admin Permissions: [None ↓]         │
│ [Send Invitation]                   │
└─────────────────────────────────────┘
```

#### 1.3 Backend Multi-Company Support

**Changes to `create-invite/index.ts`:**
- Accept optional `company_id` parameter
- Validate super admin can invite to any company
- Fallback to user's default company for non-super admins
- Enhanced logging for cross-company invites

**API Changes:**
```typescript
// Current API
POST /functions/v1/create-invite
{
  "email": "user@example.com",
  "role_to_assign": "member",
  "position": "Engineer"
}

// Enhanced API (backward compatible)
POST /functions/v1/create-invite
{
  "email": "user@example.com", 
  "role_to_assign": "member",
  "position": "Engineer",
  "company_id": "uuid-of-target-company"  // NEW: Optional for super admins
}
```

### Implementation Tasks

- [ ] **1.1.1** Document company onboarding SQL scripts
- [ ] **1.1.2** Create company setup checklist
- [ ] **1.2.1** Add company selection dropdown to `InviteManager.tsx`
- [ ] **1.2.2** Load available companies for super admins
- [ ] **1.2.3** Update form submission to include selected company
- [ ] **1.3.1** Enhance `create-invite` function for multi-company support
- [ ] **1.3.2** Add validation for super admin cross-company invites
- [ ] **1.3.3** Update invite email templates with company context
- [ ] **1.4.1** Test complete multi-company invite flow
- [ ] **1.4.2** Update documentation and runbooks

### Testing Scenarios
1. **Super Admin Multi-Company**: Create invites for different companies
2. **Regular Admin Single-Company**: Ensure existing flow still works
3. **Company Selection Validation**: Verify permission checks
4. **Email Content**: Confirm company-specific invite emails

---

## 🎯 Phase 2: User Profile Editor

### Goal
Allow any authenticated user to edit their profile photo, password, and basic information through a dedicated profile management interface.

### Current State
- ✅ Profile pictures stored in `profile-pictures` bucket
- ✅ User data in `profiles` and `people` tables
- ✅ Password management via Supabase Auth
- ❌ No profile editing UI
- ❌ No password change interface

### Requirements

#### 2.1 Profile Editor Component

**New Component: `ProfileEditor.tsx`**
- Personal information editing (name, position)
- Profile picture upload/change
- Password change form
- Account settings (email is read-only)

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│ My Profile                                  │
├─────────────────────────────────────────────┤
│ [Profile Picture]  Change Photo             │
│                                             │
│ Full Name: [John Smith____________]         │
│ Email: john@company.com (read-only)         │
│ Position: [Software Engineer______]        │
│ Company: Acme Corp (read-only)              │
│                                             │
│ ═══ Change Password ═══                     │
│ Current Password: [************]            │
│ New Password: [************]                │
│ Confirm Password: [************]            │
│                                             │
│ [Save Changes] [Cancel]                     │
└─────────────────────────────────────────────┘
```

#### 2.2 Profile Picture Management

**Features:**
- Upload new profile picture
- Preview before saving
- Delete/reset to default
- File validation (type, size limits)
- Automatic resizing/optimization

**Integration:**
- Reuse existing `uploadProfilePicture()` service
- Update `people.profile_picture_url` field
- Handle old image cleanup
- Real-time UI updates

#### 2.3 Password Change Functionality

**Security Requirements:**
- Require current password verification
- Strong password validation
- Confirmation field matching
- Clear success/error feedback
- Logout other sessions option

**Implementation:**
```typescript
// Use Supabase Auth password update
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

#### 2.4 Profile Data Updates

**Editable Fields:**
- `profiles.full_name`
- `people.position` (if exists)
- `people.profile_picture_url`

**Read-Only Fields:**
- Email (managed through separate email change flow)
- Company (managed by admins)
- Role (managed by admins)
- Account creation date

### Implementation Tasks

- [ ] **2.1.1** Create `ProfileEditor.tsx` component
- [ ] **2.1.2** Add profile route and navigation
- [ ] **2.1.3** Design responsive profile editor layout
- [ ] **2.2.1** Implement profile picture upload flow
- [ ] **2.2.2** Add image preview and validation
- [ ] **2.2.3** Handle old image cleanup
- [ ] **2.3.1** Create password change form component
- [ ] **2.3.2** Add password validation and security checks
- [ ] **2.3.3** Implement password update via Supabase Auth
- [ ] **2.4.1** Create profile data update services
- [ ] **2.4.2** Add real-time data synchronization
- [ ] **2.4.3** Handle profile update errors gracefully

### Navigation Integration
```typescript
// Add to main navigation
{
  path: '/profile',
  element: <ProfileEditor />,
  protected: true
}

// Add profile link to user menu
<MenuItem onClick={() => navigate('/profile')}>
  My Profile
</MenuItem>
```

### Testing Scenarios
1. **Profile Picture Upload**: Test various image formats and sizes
2. **Password Change**: Verify security validations work
3. **Data Persistence**: Ensure changes save correctly
4. **Error Handling**: Test network failures and validation errors
5. **Mobile Responsiveness**: Verify UI works on all devices

---

## 🚀 Implementation Priority

### Sprint 1 (Week 1)
**Focus: Multi-Company Foundation**
- Company onboarding documentation
- Backend multi-company support
- Basic company selection UI

### Sprint 2 (Week 2) 
**Focus: Profile Management**
- Profile editor component
- Password change functionality
- Profile picture management

### Sprint 3 (Week 3)
**Focus: Polish & Testing**
- Complete multi-company testing
- Profile editor refinements
- Documentation updates
- User acceptance testing

---

## 📋 Acceptance Criteria

### Multi-Company Support
- [ ] Super admin can select target company when creating invites
- [ ] Regular admins continue using single-company flow
- [ ] Company onboarding process documented with SQL scripts
- [ ] Cross-company invite validation works correctly
- [ ] Email templates include correct company information

### Profile Editor
- [ ] Users can update profile picture successfully
- [ ] Password change requires current password verification
- [ ] Profile data saves to correct database tables
- [ ] Error messages are clear and actionable
- [ ] Mobile-responsive design works properly

### Quality Assurance
- [ ] All existing functionality remains intact
- [ ] New features work across all supported browsers
- [ ] Performance impact is minimal
- [ ] Security review completed
- [ ] Documentation updated

---

## 🔧 Technical Notes

### Database Considerations
- No schema changes required for multi-company invites
- Profile editor may need additional indexes for performance
- Consider profile picture storage cleanup strategy

### Security Considerations
- Validate super admin permissions on every cross-company operation
- Sanitize all user input in profile editor
- Rate limit password change attempts
- Secure file upload validation for profile pictures

### Performance Considerations
- Cache company lists for super admins
- Optimize profile picture upload/resize pipeline
- Consider lazy loading for profile editor components

---

## 📚 Documentation Updates Required

### User Documentation
- Multi-company invite workflow guide
- Profile management user guide
- Password security best practices

### Admin Documentation  
- Company onboarding procedures
- Super admin permission management
- Profile data management policies

### Developer Documentation
- Multi-company API changes
- Profile editor component usage
- File upload service documentation

---

*Last Updated: January 2025*
*Next Review: After Sprint 3 completion*
