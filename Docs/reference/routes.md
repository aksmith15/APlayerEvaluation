# Application Routes Overview

Complete routing table for the A-Player Evaluation System with all 9 application routes.

## 📋 Routes Table

| Path | Methods | Purpose | Auth Required | Key Files | Notes |
|------|---------|---------|---------------|-----------|-------|
| `/` | GET | Landing/Login page | No | `src/pages/Login.tsx` | Redirects to dashboard if authenticated |
| `/login` | GET | Authentication page | No | `src/pages/Login.tsx` | Supabase auth integration |
| `/dashboard` | GET | Main dashboard/employee selection | Yes | `src/pages/EmployeeSelection.tsx` | Default authenticated route |
| `/analytics/:employeeId` | GET | Employee analytics display | Yes (Admin/Manager) | `src/pages/EmployeeAnalytics.tsx` | Dynamic employee ID parameter |
| `/assignments` | GET | Assignment management interface | Yes (Admin) | `src/pages/AssignmentManagement.tsx` | Admin-only assignment creation |
| `/my-assignments` | GET | User's assigned evaluations | Yes | `src/pages/MyAssignments.tsx` | Personal evaluation queue |
| `/accept-invite` | GET | Invitation acceptance flow | No | `src/pages/AcceptInvite.tsx` | Token-based invite handling |
| `/survey/:assignmentId` | GET | Evaluation survey form | Yes | `src/components/ui/EvaluationSurvey.tsx` | Dynamic assignment ID parameter |
| `/dev/pdf-preview` | GET | PDF generation preview | Yes (Dev) | `src/pages/react-pdf/CoachingReportPage.tsx` | **DEV-ONLY** - Development testing route |

## 🔐 Authentication & Authorization

### Authentication Levels
- **No Auth**: Public routes accessible without login
- **Yes**: Requires valid Supabase session
- **Admin**: Requires `jwtRole: 'super_admin'` or `'hr_admin'`
- **Manager**: Requires manager-level access for specific employees
- **Dev**: Development/testing routes (disabled in production)

### Route Protection
All protected routes use `ProtectedRoute` component from `src/components/ProtectedRoute.tsx` which:
- Validates Supabase authentication session
- Checks user roles and permissions
- Handles tenant context for multi-company access
- Redirects unauthorized users to login

## 🎯 Route Categories

### Public Routes (2)
- **Landing/Login** (`/`, `/login`) - Entry points for unauthenticated users
- **Invite Acceptance** (`/accept-invite`) - Token-based access for new users

### User Routes (3)
- **Dashboard** (`/dashboard`) - Employee selection and overview
- **Analytics** (`/analytics/:employeeId`) - Individual employee evaluation data
- **My Assignments** (`/my-assignments`) - Personal evaluation tasks

### Admin Routes (2)
- **Assignment Management** (`/assignments`) - Create and manage evaluation assignments
- **Survey Interface** (`/survey/:assignmentId`) - Evaluation form interface

### Development Routes (2)
- **PDF Preview** (`/dev/pdf-preview`) - **DEV-ONLY** Testing route for coaching reports
- **Debug Routes** - Additional development utilities (not in production build)

## 🏗️ Route Architecture

### React Router Configuration
```typescript
// Main routing setup in src/App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/login" element={<Login />} />
    <Route path="/accept-invite" element={<AcceptInvite />} />
    <Route path="/dashboard" element={
      <ProtectedRoute><EmployeeSelection /></ProtectedRoute>
    } />
    <Route path="/analytics/:employeeId" element={
      <ProtectedRoute><EmployeeAnalytics /></ProtectedRoute>
    } />
    <Route path="/assignments" element={
      <ProtectedRoute requiredRole="admin"><AssignmentManagement /></ProtectedRoute>
    } />
    <Route path="/my-assignments" element={
      <ProtectedRoute><MyAssignments /></ProtectedRoute>
    } />
    <Route path="/survey/:assignmentId" element={
      <ProtectedRoute><EvaluationSurvey /></ProtectedRoute>
    } />
    {/* Development routes */}
    <Route path="/dev/pdf-preview" element={
      <ProtectedRoute dev={true}><CoachingReportPage /></ProtectedRoute>
    } />
  </Routes>
</BrowserRouter>
```

### Navigation Flow
```
Login (/login)
  ↓ (after auth)
Dashboard (/dashboard) 
  ↓ (select employee)
Analytics (/analytics/:employeeId)
  ↓ (admin access)
Assignment Management (/assignments)
  ↓ (create assignments)
My Assignments (/my-assignments)
  ↓ (start evaluation)
Survey (/survey/:assignmentId)
```

## 🔄 Route Parameters

### Dynamic Parameters
- **`:employeeId`** - UUID of the employee being analyzed
- **`:assignmentId`** - UUID of the specific evaluation assignment

### Query Parameters
- **`?token=xxx`** - Invitation token for accept-invite flow
- **`?redirect=path`** - Post-login redirect path
- **`?quarterId=xxx`** - Quarter filter for analytics
- **`?employeeId=xxx&quarterId=xxx`** - DEV route parameters

## 🛡️ Security Considerations

### Row Level Security (RLS)
All data access is protected by Supabase RLS policies that:
- Enforce company-based data isolation
- Validate user roles and permissions
- Log unauthorized access attempts
- Handle cross-tenant access control

### Route-Level Security
- Admin routes check `jwtRole` from user profile
- Manager routes validate employee access permissions
- Development routes disabled in production builds
- All authenticated routes require valid Supabase session

## 📱 Mobile Responsiveness

All routes are designed with mobile-first approach:
- Responsive layouts for all screen sizes
- Touch-friendly interface elements
- Progressive Web App (PWA) support
- Offline capability for core routes

## 🔍 Route Testing

### Test Coverage
```bash
# Route-specific tests
npm run test src/tests/integration/auth-flow.test.tsx
npm run test src/tests/integration/assignment-survey-workflow.test.tsx

# E2E route testing
npm run test:e2e tests/e2e/critical-user-flows.spec.ts
```

### Development Testing
- **DEV Preview**: Use `/dev/pdf-preview` for coaching report testing
- **Route Guards**: Test authentication redirects
- **Parameter Validation**: Verify dynamic route parameters
- **Error Boundaries**: Test 404 and error handling

## 🚀 Performance Optimization

### Code Splitting
- Routes are lazy-loaded for optimal bundle size
- Separate chunks for admin-only routes
- Preloading for frequently accessed routes

### Caching Strategy
- Route-level data caching with React Query
- Component-level memoization
- Service Worker caching for offline access

---

## 🎯 Route Development Guidelines

### Adding New Routes
1. **Define route** in main App.tsx router
2. **Create page component** in `src/pages/`
3. **Add authentication** via ProtectedRoute wrapper
4. **Update navigation** components as needed
5. **Add route tests** in integration test suite
6. **Update this documentation**

### Route Naming Convention
- Use kebab-case for URLs (`/my-assignments`)
- Use PascalCase for component names (`MyAssignments`)
- Keep routes RESTful and intuitive
- Use parameters sparingly and meaningfully

---

**Total Routes: 9 (7 production + 2 development)**  
**Auth Protected: 6 routes**  
**Admin Only: 2 routes**  
**Development Only: 2 routes**
