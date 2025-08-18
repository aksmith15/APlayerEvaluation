# A-Player Evaluation System Architecture

## Overview

A-Player is a comprehensive employee evaluation platform built with **Vite + React + TypeScript** frontend and **Supabase** backend infrastructure. The system enables multi-tenant, role-based employee performance evaluations with AI-powered insights and analytics.

**Primary Users:**
- **HR Administrators:** Manage company evaluation cycles, create assignments, and access analytics
- **Managers:** Conduct manager evaluations and review team performance data
- **Employees:** Complete self and peer evaluations through secure survey links
- **Super Admins:** Cross-company administration and system management
- **Coaches:** Folkls at culture base who will be utilizing the analytics and coaching reports.

**Key Components:**
- **Frontend:** Vite-powered React SPA with TypeScript, TailwindCSS, and comprehensive testing
- **Database:** Supabase Postgres with multi-tenant RLS policies and real-time subscriptions
- **Authentication:** Supabase Auth with email/magic link and role-based access control
- **AI Processing:** [Edge Functions](./EDGE_FUNCTIONS.md) with OpenAI/Anthropic integration for coaching insights
- **Email System:** Resend API for invitation and notification delivery

## Frontend Architecture

### Hooks

The application uses a comprehensive set of custom React hooks for data management, performance monitoring, and UI state:

**Core Data Hooks:**
- **useDataFetch** - Advanced data fetching with caching, retries, and performance monitoring
- **useDataFetching** - Simple data fetching utility for basic operations

**Performance Hooks:**
- **usePerformanceMonitoring** - Component performance tracking and Core Web Vitals monitoring
- **useChartPerformance** - Specialized performance monitoring for chart components

**UI/Layout Hooks:**
- **useResponsive** - Screen size detection and responsive design utilities
- **useChartHeight** - Dynamic chart height calculation based on screen size

**Survey Hooks:**
- **useSurveyNavigation** - Survey state management and navigation logic

**Context Hooks:**
- **useAuth** - Authentication state and actions
- **useBreadcrumbs** - Breadcrumb navigation generation

*Complete hook documentation available at [docs/hooks/](./hooks/)*

### Hooks

The application uses a comprehensive set of custom React hooks for data management, performance monitoring, and UI state. Full documentation available at [docs/HOOKS.md](./HOOKS.md).

**Core Data Hooks:**
- **[useDataFetch](./hooks/useDataFetch.md)** - Advanced data fetching with caching, retries, and performance monitoring
- **[useDataFetching](./hooks/useDataFetching.md)** - Simple data fetching utility for basic operations

**Performance Hooks:**
- **[usePerformanceMonitoring](./hooks/usePerformanceMonitoring.md)** - Component performance tracking and Core Web Vitals monitoring
- **[useChartPerformance](./hooks/usePerformanceMonitoring.md#usechartperformance)** - Specialized performance monitoring for chart components

### Routes Overview

The application uses React Router DOM for client-side routing with protected route patterns:

| Path | Methods | Purpose | Auth | Key Files | Notes |
|------|---------|---------|------|-----------|-------|
| `/` | GET | User login and authentication | No (redirects if authenticated) | `src/pages/Login.tsx`, `src/components/ProtectedRoute.tsx` | Public route, redirects authenticated users to `/employees` |
| `/accept-invite` | GET | Accepts invitation and provisions membership | Public → creates session | `src/pages/AcceptInvite.tsx` | Handles invitation tokens, creates user accounts, redirects to dashboard on success |
| `/employees` | GET | Employee selection dashboard | Yes | `src/pages/EmployeeSelection.tsx` | Main dashboard for selecting employees to analyze |
| `/analytics` | GET | Employee analytics and performance data | Yes | `src/pages/EmployeeAnalytics.tsx` | Displays charts, insights, and evaluation data |
| `/assignments/my` | GET | User's assigned evaluations | Yes | `src/pages/MyAssignments.tsx` | Shows surveys assigned to current user |
| `/survey/:token` | GET | Evaluation survey interface | Yes (+ valid token) | `src/components/ui/EvaluationSurvey.tsx` | Multi-step survey with session persistence |
| `/assignments/manage` | GET | Assignment management (admin) | Yes (admin role validated in component) | `src/pages/AssignmentManagement.tsx` | Create and manage evaluation assignments |
| `/dev/pdf-preview` | GET | DEV-only PDF render preview | Dev only | `src/pages/react-pdf/DevPdfPreview.tsx` | Live PDF preview with HMR, guarded by `import.meta.env.DEV` |
| `/dashboard` | GET | Redirect route to employee selection | Auth required | `src/App.tsx:124` | Redirects to `/employees` for backward compatibility |
| `*` | GET | Catch-all fallback route | N/A (redirect) | `src/App.tsx:127` | Redirects unknown routes to `/` (login) |

#### Route Protection Patterns
- **Public Routes**: `/` (login), `/accept-invite` - accessible without authentication
- **Protected Routes**: All others require authentication via `ProtectedRoute` component
- **Admin Routes**: `/assignments/manage` performs role validation within the component
- **Parameterized Routes**: `/survey/:token` validates token and assignment access
- **Development Routes**: `/dev/pdf-preview` only available when `import.meta.env.DEV` is true

## High-Level Architecture Diagram

![High-Level Architecture](./diagrams/high-level.mmd)

## Data Flow Overview

The system follows RESTful patterns with client-side routing for navigation. User interactions flow through the [Routes Overview](#routes-overview) above, with protected routes enforcing authentication and role-based access control.

![Data Flow](./diagrams/data-flow.mmd)

## Technology Stack

| Component | Version | Used In | Notes |
|-----------|---------|---------|-------|
| **Frontend Core** |
| Vite | 7.0.4 | Build tool | HMR, optimized builds, ES2019 target |
| React | 18.3.1 | UI framework | StrictMode, Suspense, lazy loading |
| TypeScript | 5.8.3 | Type system | Strict mode, path aliases |
| React Router DOM | 7.6.3 | Routing | Protected routes, lazy loading |
| **Backend Infrastructure** |
| Supabase | 2.55.0 | Backend-as-a-Service | Postgres, Auth, Storage, [Edge Functions](./EDGE_FUNCTIONS.md) |
| PostgreSQL | 15.8 | Database | Multi-tenant with RLS |
| **External Services** |
| Resend | API | Email delivery | Invitation and notification emails |
| OpenAI | GPT-4 | AI analysis | Primary AI provider for coaching |
| Anthropic | Claude-3.5 | AI analysis | Fallback AI provider |

---

**🔗 Related Documentation:**
- [INTEGRATIONS.md](./INTEGRATIONS.md) - External service integrations and APIs
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Environment setup and deployment procedures
- [High-Level System Diagram](./diagrams/high-level.mmd)
- [Data Flow Sequence Diagram](./diagrams/data-flow.mmd)