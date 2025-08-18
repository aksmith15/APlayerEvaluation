# A-Player Evaluations Dashboard Project Structure

## Project Architecture Overview

The A-Player Evaluations Dashboard follows a modern React 18 + TypeScript + Tailwind CSS architecture optimized for a comprehensive 5-page evaluation management application. The structure emphasizes maintainability, scalability, and clear separation of concerns for data visualization, survey management, assignment tracking, and user interface components.

## Root Directory Structure

```
A-Player Evaluation2/
├── a-player-dashboard/              # Main application directory
│   ├── public/                      # Static assets and HTML template  
│   │   ├── index.html               # Main HTML template
│   │   └── vite.svg                 # Vite logo
│   ├── src/                         # Source code directory
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/                  # Complete UI component library
│   │   │   │   ├── AnalysisJobManager.tsx    # AI analysis job management
│   │   │   │   ├── AssignmentCard.tsx       # Assignment display cards with self/other variants
│   │   │   │   ├── AssignmentCreationForm.tsx # Bulk assignment creation interface
│   │   │   │   ├── AssignmentStatusTable.tsx # Assignment monitoring table
│   │   │   │   ├── AttributeRating.tsx      # 1-10 scale rating component
│   │   │   │   ├── BulkAssignmentUpload.tsx # CSV upload for assignments
│   │   │   │   ├── Button.tsx               # Reusable button with variants
│   │   │   │   ├── Button.test.tsx          # Button component tests
│   │   │   │   ├── Card.tsx                 # Card layout component
│   │   │   │   ├── Card.test.tsx            # Card component tests
│   │   │   │   ├── ClusteredBarChart.tsx    # Attribute breakdown visualization
│   │   │   │   ├── ConditionalQuestion.tsx  # Dynamic question rendering
│   │   │   │   ├── DownloadAnalyticsButton.tsx # PDF export functionality
│   │   │   │   ├── EmptyState.tsx           # Empty state component
│   │   │   │   ├── ErrorBoundary.tsx        # Error boundary wrapper
│   │   │   │   ├── ErrorMessage.tsx         # Error display component
│   │   │   │   ├── HistoricalClusteredBarChart.tsx # Historical comparison
│   │   │   │   ├── KeyboardShortcuts.tsx    # Keyboard shortcuts help
│   │   │   │   ├── LoadingSpinner.tsx       # Loading indicator
│   │   │   │   ├── PDFViewer.tsx           # PDF document viewer
│   │   │   │   ├── PerformanceDashboard.tsx # Real-time performance monitoring
│   │   │   │   ├── QuarterRangeSelector.tsx # Quarter filtering dropdown
│   │   │   │   ├── QuestionGroup.tsx        # Grouped question display
│   │   │   │   ├── RadarChart.tsx          # Employee attribute radar chart
│   │   │   │   ├── SearchInput.tsx         # Search functionality
│   │   │   │   ├── SearchInput.test.tsx    # Search component tests
│   │   │   │   ├── SkeletonLoader.tsx      # Loading skeleton component
│   │   │   │   ├── SurveyContainer.tsx      # Main survey wrapper component
│   │   │   │   ├── SurveyNavigation.tsx     # Survey step navigation
│   │   │   │   ├── SurveyProgress.tsx       # Survey completion progress indicator
│   │   │   │   ├── TrendLineChart.tsx      # Performance trend visualization
│   │   │   │   ├── Breadcrumb.tsx          # Navigation breadcrumbs
│   │   │   │   └── index.ts                # Component exports
│   │   │   └── ProtectedRoute.tsx          # Route protection wrapper
│   │   ├── pages/                          # Main application pages
│   │   │   ├── Login.tsx                   # Manager authentication page
│   │   │   ├── EmployeeSelection.tsx       # Employee selection interface
│   │   │   ├── EmployeeAnalytics.tsx       # Employee analytics dashboard
│   │   │   ├── AssignmentManagement.tsx    # Manager assignment creation and monitoring dashboard
│   │   │   ├── MyAssignments.tsx           # User assignment viewing dashboard
│   │   │   └── EvaluationSurvey.tsx        # Custom survey component replacing fillout.com (PENDING STAGE 7.4)
│   │   ├── services/                       # External service integrations
│   │   │   ├── supabase.ts                 # Supabase client configuration
│   │   │   ├── dataFetching.ts             # Data fetching utilities
│   │   │   ├── authService.ts              # Authentication service
│   │   │   ├── assignmentService.ts        # Assignment CRUD operations and assignment logic
│   │   │   └── realtimeService.ts          # Real-time updates service
│   │   ├── types/                          # TypeScript type definitions
│   │   │   ├── database.ts                 # Database entity types
│   │   │   ├── evaluation.ts               # Evaluation-specific types
│   │   │   ├── auth.ts                     # Authentication types
│   │   │   ├── charts.ts                   # Chart data types
│   │   │   ├── assignment.ts               # Assignment-specific TypeScript interfaces
│   │   │   └── survey.ts                   # Survey response and question types
│   │   ├── utils/                          # Utility functions
│   │   │   ├── calculations.ts             # Score calculations and aggregations
│   │   │   ├── downloadUtils.ts            # File download utilities
│   │   │   ├── performance.ts              # Performance monitoring utilities
│   │   │   ├── useDataFetching.ts          # Data fetching hook
│   │   │   └── useResponsive.ts            # Responsive design hook
│   │   ├── contexts/                       # React context providers
│   │   │   ├── AuthContext.tsx             # Authentication context
│   │   │   └── NavigationContext.tsx       # Navigation context
│   │   ├── constants/                      # Application constants
│   │   │   ├── attributes.ts               # Performance attributes definitions
│   │   │   └── config.ts                   # Configuration constants
│   │   ├── assets/                         # Static assets and styles
│   │   │   ├── logos/                      # Company logos and branding assets
│   │   │   │   └── culture-base-logo.png   # The Culture Base logo for PDF reports
│   │   │   └── react.svg                   # React logo
│   │   ├── tests/                          # Test infrastructure
│   │   │   └── integration/                # Integration tests
│   │   │       ├── auth-flow.test.tsx      # Authentication flow tests
│   │   │       ├── employee-selection.test.tsx # Employee selection tests
│   │   │       └── README.md               # Testing documentation
│   │   ├── App.tsx                         # Main application component
│   │   ├── main.tsx                        # Application entry point
│   │   ├── index.css                       # Global styles and Tailwind
│   │   ├── vite-env.d.ts                   # Vite environment types
│   │   ├── setupTests.ts                   # Test setup configuration
│   │   └── test-utils.tsx                  # Testing utilities and mocks
│   ├── tests/                              # End-to-end tests
│   │   └── e2e/                            # Playwright E2E tests
│   │       ├── critical-user-flows.spec.ts # Critical user journey tests
│   │       └── test-helpers.ts             # E2E test utilities
│   ├── scripts/                            # Deployment scripts
│   │   ├── deploy.sh                       # Unix deployment script
│   │   └── deploy.ps1                      # Windows deployment script
│   ├── .env                                # Environment variables (not in git)
│   ├── .gitignore                          # Git ignore patterns
│   ├── .dockerignore                       # Docker ignore patterns
│   ├── package.json                        # Project dependencies and scripts
│   ├── package-lock.json                   # Locked dependency versions
│   ├── tsconfig.json                       # TypeScript configuration
│   ├── tsconfig.app.json                   # TypeScript app configuration
│   ├── tsconfig.node.json                  # TypeScript Node configuration
│   ├── tailwind.config.js                  # Tailwind CSS configuration
│   ├── postcss.config.js                   # PostCSS configuration
│   ├── vite.config.ts                      # Vite build configuration
│   ├── eslint.config.js                    # ESLint configuration
│   ├── playwright.config.ts                # Playwright E2E configuration
│   ├── Dockerfile                          # Docker containerization
│   ├── docker-compose.yml                  # Docker orchestration
│   ├── nginx.conf                          # Nginx production configuration
│   ├── database-schema.sql                 # Database schema
│   ├── DEPLOYMENT.md                       # Deployment documentation
│   └── README.md                           # Project documentation
├── Docs/                                   # Project documentation
│   ├── Bug_tracking.md                     # Bug tracking and resolution
│   ├── Implementation.md                   # Implementation progress
│   ├── project_structure.md                # This file - project structure
│   ├── UI_UX_doc.md                        # UI/UX design documentation
│   └── User_Guide.md                       # User guide and manual
├── PRD.md                                  # Product Requirements Document
└── [Various summary and session files]     # Development session summaries
```

## Detailed Structure Breakdown

### `/src/components/` - Component Organization

#### `/src/components/ui/` - Complete UI Component Library (Actual Implementation)
```
ui/
├── AnalysisJobManager.tsx           # AI analysis job management and status
├── AssignmentCard.tsx               # Assignment display cards with self/other variants
├── AssignmentCreationForm.tsx       # Bulk assignment creation interface
├── AssignmentStatusTable.tsx        # Assignment monitoring table
├── AttributeRating.tsx              # 1-10 scale rating component
├── BulkAssignmentUpload.tsx         # CSV upload for assignments
├── Button.tsx                       # Reusable button with variants and accessibility
├── Button.test.tsx                  # Comprehensive button component tests
├── Card.tsx                         # Card layout with hover effects and interactions
├── Card.test.tsx                    # Card component testing suite
├── ClusteredBarChart.tsx            # Multi-series bar chart for attribute breakdown
├── ConditionalQuestion.tsx          # Dynamic question rendering
├── DownloadAnalyticsButton.tsx      # PDF export and download functionality
├── EmptyState.tsx                   # Empty state with icons and messages
├── ErrorBoundary.tsx                # React error boundary with error reporting
├── ErrorMessage.tsx                 # Error display with retry functionality
├── HistoricalClusteredBarChart.tsx  # Historical data comparison charts
├── KeyboardShortcuts.tsx            # Keyboard shortcuts help overlay
├── LoadingSpinner.tsx               # Loading indicators with accessibility
├── PDFViewer.tsx                    # PDF document viewer component
├── PerformanceDashboard.tsx         # Real-time performance monitoring dashboard
├── QuarterRangeSelector.tsx         # Advanced quarter filtering and selection
├── QuestionGroup.tsx                # Grouped question display
├── RadarChart.tsx                   # Interactive radar chart for performance attributes
├── SearchInput.tsx                  # Advanced search with filtering and accessibility
├── SearchInput.test.tsx             # Search component test suite
├── SkeletonLoader.tsx               # Loading skeleton components
├── SurveyContainer.tsx              # Main survey wrapper component
├── SurveyNavigation.tsx             # Survey step navigation
├── SurveyProgress.tsx               # Survey completion progress indicator
├── TrendLineChart.tsx               # Time-series trend visualization
├── Breadcrumb.tsx                   # Navigation breadcrumb component
└── index.ts                         # Comprehensive component exports
```

#### `/src/components/` - Component Architecture (Actual Implementation)
```
components/
├── ui/                              # Complete UI component library (33 components)
│   └── [All components listed above]
└── ProtectedRoute.tsx               # Route protection and authentication wrapper
```

### `/src/pages/` - Application Pages

#### Page Component Structure
Each page follows a consistent structure:

```typescript
// Example: EmployeeAnalytics.tsx
import React from 'react';
import { Layout } from '../components/layout';
import { QuarterSelector } from '../components/forms';
import { RadarChart, ClusteredBarChart } from '../components/charts';

interface EmployeeAnalyticsProps {
  employeeId: string;
}

export const EmployeeAnalytics: React.FC<EmployeeAnalyticsProps> = ({
  employeeId
}) => {
  // Component logic
  return (
    <Layout>
      {/* Page content */}
    </Layout>
  );
};
```

### `/src/services/` - Service Layer (Actual Implementation)

#### Service Organization
```typescript
// supabase.ts - Database client configuration and setup
export const supabaseClient = createClient(url, key);
export const supabase = supabaseClient;

// dataFetching.ts - Comprehensive data fetching utilities
export const fetchEmployees = async () => Promise<Employee[]>;
export const fetchQuarters = async () => Promise<Quarter[]>;
export const fetchEmployeeOverallScores = async (employeeId: string) => Promise<EvaluationScore[]>;
export const fetchEmployeeDetailedScores = async (employeeId: string, quarterId: string) => Promise<DetailedScore[]>;

// authService.ts - Authentication service with session management
export const signInWithEmail = async (email: string, password: string) => Promise<AuthResult>;
export const signOut = async () => Promise<void>;
export const getCurrentUser = () => User | null;
export const onAuthStateChange = (callback: (user: User | null) => void) => Unsubscribe;

// assignmentService.ts - Assignment CRUD operations and assignment logic
export const fetchUserAssignments = async (userId: string) => Promise<EvaluationAssignment[]>;
export const fetchManagedAssignments = async (managerId: string) => Promise<EvaluationAssignment[]>;
export const createBulkAssignments = async (assignments: AssignmentCreationRequest[]) => Promise<EvaluationAssignment[]>;
export const updateAssignmentStatus = async (assignmentId: string, status: string) => Promise<void>;
export const getAssignmentByToken = async (surveyToken: string) => Promise<EvaluationAssignment>;
export const processBulkAssignmentCSV = async (csvData: BulkAssignmentData[]) => Promise<void>;

// realtimeService.ts - Real-time updates and subscriptions
export const subscribeToEmployeeUpdates = (employeeId: string, callback: (data: any) => void) => Subscription;
export const subscribeToQuarterUpdates = (callback: (data: any) => void) => Subscription;
```

### Route Structure - Application Navigation

#### Protected Routes Configuration
```typescript
// Main application routes with role-based access control
├── / (root)                                    # Redirects to /login or /employees based on auth
├── /login                                      # Manager authentication page (public)
├── /employees                                  # Employee selection interface (authenticated)
├── /employees/:id/analytics                    # Employee analytics dashboard (authenticated)
├── /assignments/manage                         # Assignment management dashboard (super_admin/hr_admin only)
├── /assignments/my                             # User assignment viewing dashboard (all authenticated users)
└── /survey/:assignmentId                       # Evaluation survey component (authenticated with valid assignment)
```

#### Route Protection Patterns
```typescript
// Route access control based on JWT roles
- /login: Public access
- /employees: All authenticated users
- /employees/:id/analytics: All authenticated users  
- /assignments/manage: super_admin and hr_admin roles only
- /assignments/my: All authenticated users
- /survey/:assignmentId: Authenticated users with valid assignment token
```

### Database Schema Extensions - Survey Assignment System

#### evaluation_assignments Table Schema
```sql
-- New table for managing evaluation assignments and survey distribution
CREATE TABLE evaluation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  evaluatee_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  quarter_id UUID NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  evaluation_type evaluation_type_enum NOT NULL, -- 'peer', 'manager', 'self'
  status assignment_status_enum NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  assigned_by UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  survey_token UUID UNIQUE DEFAULT gen_random_uuid(), -- Unique token for survey access
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(evaluator_id, evaluatee_id, quarter_id, evaluation_type), -- One assignment per evaluator/evaluatee/quarter/type
  CHECK (evaluator_id != evaluatee_id OR evaluation_type = 'self') -- Self-evaluations allowed for same person
);

-- Enum types for evaluation assignments
CREATE TYPE evaluation_type_enum AS ENUM ('peer', 'manager', 'self');
CREATE TYPE assignment_status_enum AS ENUM ('pending', 'in_progress', 'completed');

-- Indexes for performance optimization
CREATE INDEX idx_evaluation_assignments_evaluator ON evaluation_assignments(evaluator_id);
CREATE INDEX idx_evaluation_assignments_evaluatee ON evaluation_assignments(evaluatee_id);
CREATE INDEX idx_evaluation_assignments_quarter ON evaluation_assignments(quarter_id);
CREATE INDEX idx_evaluation_assignments_status ON evaluation_assignments(status);
CREATE INDEX idx_evaluation_assignments_survey_token ON evaluation_assignments(survey_token);

-- Row Level Security (RLS) Policies for evaluation_assignments
-- Policy 1: Users can view their own assignments (as evaluator)
CREATE POLICY "Users can view own assignments" ON evaluation_assignments
FOR SELECT USING (
  evaluator_id IN (
    SELECT id FROM people 
    WHERE email = auth.email()
  )
);

-- Policy 2: Super admin and HR admin can view all assignments
CREATE POLICY "Admins can view all assignments" ON evaluation_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM people 
    WHERE email = auth.email() 
    AND jwt_role IN ('super_admin', 'hr_admin')
  )
);

-- Policy 3: Users can update status of their own assignments
CREATE POLICY "Users can update own assignment status" ON evaluation_assignments
FOR UPDATE USING (
  evaluator_id IN (
    SELECT id FROM people 
    WHERE email = auth.email()
  )
) WITH CHECK (
  evaluator_id IN (
    SELECT id FROM people 
    WHERE email = auth.email()
  )
);
```

#### Database Relationships
```
evaluation_assignments
├── evaluator_id → people(id)           # Who is doing the evaluation
├── evaluatee_id → people(id)           # Who is being evaluated  
├── quarter_id → evaluation_cycles(id)  # Which evaluation period
├── assigned_by → people(id)            # Who created the assignment
└── survey_token (unique)               # Secure access token for survey
```

### `/src/types/` - TypeScript Type Definitions

#### Type Organization
```typescript
// database.ts - Database entity types
export interface WeightedEvaluationScore {
  evaluatee_id: string;
  evaluatee_name: string;
  quarter_id: string;
  quarter_name: string;
  attribute_name: string;
  manager_score: number;
  peer_score: number;
  self_score: number;
  weighted_final_score: number;
  // ... other fields
}

export interface AppConfig {
  id: number;
  key: string;
  value: string;
  environment: string;
  created_at: string;
}

// evaluation.ts - Evaluation-specific types
export interface EvaluationData {
  employee: Employee;
  scores: AttributeScore[];
  quarter: Quarter;
}

// charts.ts - Chart data types
export interface ChartData {
  attribute: string;
  managerScore: number;
  peerScore: number;
  selfScore: number;
  weightedScore: number;
}

// assignment.ts - Assignment-specific TypeScript interfaces
export interface EvaluationAssignment {
  id: string;
  evaluator_id: string;
  evaluatee_id: string;
  quarter_id: string;
  evaluation_type: 'peer' | 'manager' | 'self';
  status: 'pending' | 'in_progress' | 'completed';
  assigned_by: string;
  assigned_at: string;
  completed_at?: string;
  survey_token: string;
  created_at: string;
}

export interface AssignmentCreationRequest {
  evaluatee_ids: string[];
  evaluator_ids: string[];
  quarter_id: string;
  evaluation_type: 'peer' | 'manager' | 'self';
  assigned_by: string;
}

export interface BulkAssignmentData {
  evaluator_email: string;
  evaluatee_email: string;
  quarter_name: string;
  evaluation_type: 'peer' | 'manager' | 'self';
}

// survey.ts - Survey response and question types
export interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: 'rating' | 'text' | 'multiple_choice';
  attribute_name?: string;
  is_required: boolean;
  conditional_logic?: {
    show_if_score: 'high' | 'medium' | 'low'; // 9-10, 6-8, <6
    dependent_attribute?: string;
  };
}

export interface SurveyResponse {
  assignment_id: string;
  question_id: string;
  response_value: string | number;
  attribute_score?: number;
  response_timestamp: string;
}

export interface SurveyProgress {
  total_questions: number;
  completed_questions: number;
  current_step: 'confirmation' | 'welcome' | 'preliminary' | 'attributes' | 'completion';
  percentage_complete: number;
}

export interface AttributeRating {
  attribute_name: string;
  score: number; // 1-10 scale
  follow_up_questions?: SurveyQuestion[];
}
```

### `/src/utils/` - Utility Functions (Actual Implementation)

#### Utility Organization
```typescript
// calculations.ts - Score calculations and statistical functions
export const calculateWeightedScore = (
  managerScore: number,
  peerScore: number,
  selfScore: number
): number => {
  return (managerScore * 0.55) + (peerScore * 0.35) + (selfScore * 0.10);
};
export const calculateAverage = (scores: number[]): number;
export const calculateTrends = (historicalData: any[]): TrendData;

// downloadUtils.ts - File download and export utilities
export const downloadPDF = (htmlContent: string, filename: string): void;
export const exportToJSON = (data: any, filename: string): void;
export const generatePDFReport = (employeeData: EmployeeData): Promise<Blob>;

// performance.ts - Performance monitoring utilities
export interface PerformanceMonitor {
  trackPageLoad(): void;
  trackUserInteraction(action: string): void;
  exportSessionData(): any;
}
export const createPerformanceMonitor = (): PerformanceMonitor;
export const getPerformanceMonitor = (): PerformanceMonitor | null;

// useDataFetching.ts - Custom data fetching hook
export const useDataFetching = <T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[]
): { data: T | null; loading: boolean; error: Error | null };

// useResponsive.ts - Responsive design utilities
export const useResponsive = () => {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
};
```

### `/src/contexts/` - React Context Providers (Actual Implementation)

#### Context Organization
```typescript
// AuthContext.tsx - Authentication state management
export const AuthContext = createContext<AuthContextType>({});
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication state, login, logout, user management
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// NavigationContext.tsx - Navigation state management
export const NavigationContext = createContext<NavigationContextType>({});
export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation state, breadcrumbs, current page tracking
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};
```

### `/src/tests/` - Testing Infrastructure (Actual Implementation)

#### Test Organization
```typescript
// setupTests.ts - Test configuration and global setup
import '@testing-library/jest-dom';
// Configure testing environment, mock global objects

// test-utils.tsx - Testing utilities and custom render functions
export const renderWithProviders = (ui: ReactElement, options?: any) => {
  // Custom render with AuthContext, NavigationContext providers
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// integration/ - Integration test suite
// ├── auth-flow.test.tsx          # Authentication flow testing
// ├── employee-selection.test.tsx # Employee selection workflow testing
// └── README.md                   # Testing documentation and guidelines
```

### `/tests/e2e/` - End-to-End Testing (Playwright Implementation)

#### E2E Test Structure
```typescript
// playwright.config.ts - Playwright configuration
export default defineConfig({
  testDir: './tests/e2e',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});

// critical-user-flows.spec.ts - Critical user journey tests
test('complete evaluation workflow', async ({ page }) => {
  // Test: Login → Employee Selection → Analytics → PDF Export
});

// test-helpers.ts - E2E testing utilities
export const loginAsManager = async (page: Page, credentials: Credentials) => {
  // Helper function for authentication in E2E tests
};
```

### `/scripts/` - Deployment Infrastructure (Actual Implementation)

#### Deployment Script Organization
```bash
# deploy.sh - Unix/Linux deployment script
#!/bin/bash
# - System requirements check (Docker, Node.js, npm)
# - Environment validation and configuration
# - Pre-deployment testing (npm test, build verification)
# - Automated backup creation
# - Docker container deployment
# - Health monitoring and rollback capability

# deploy.ps1 - Windows PowerShell deployment script
# - Cross-platform compatibility for Windows development
# - Same functionality as deploy.sh adapted for PowerShell
# - Windows-specific system checks and path handling
# - Docker Desktop integration
```

#### Docker Infrastructure
```yaml
# Dockerfile - Multi-stage containerization
FROM node:18-alpine as base          # Base Node.js environment
FROM base as development             # Development environment setup
FROM base as builder                 # Production build stage
FROM nginx:alpine as production      # Production web server

# docker-compose.yml - Service orchestration
services:
  a-player-dashboard:               # Main application service
    build: { context: ., target: production }
    ports: ["80:80", "443:443"]     # HTTP/HTTPS port mapping
    environment: [...]              # Environment variable configuration
    healthcheck: [...]              # Container health monitoring
    
# nginx.conf - Production web server configuration
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;       # Serve static assets
  try_files $uri $uri/ /index.html; # SPA routing support
}
```

#### Production Configuration Files
```sql
-- database-schema.sql - Complete database schema
-- Tables: employee_data, evaluation_scores, quarters, app_config, evaluation_assignments
-- Indexes: Performance optimization for large datasets
-- Constraints: Data integrity and foreign key relationships

-- DEPLOYMENT.md - Comprehensive deployment guide
-- Production environment setup
-- Environment variable configuration
-- SSL certificate setup
-- Health monitoring and troubleshooting
```

## Configuration Files (Actual Implementation)

### Package.json Structure (Production)
```json
{
  "name": "a-player-dashboard",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.1",
    "@supabase/supabase-js": "^2.48.1",
    "recharts": "^2.13.3",
    "jspdf": "^2.5.2",
    "html2canvas": "^1.4.1",
    "react-pdf": "^9.1.1",
    "date-fns": "^4.1.0",
    "web-vitals": "^4.2.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@playwright/test": "^1.49.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.17.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.14.0",
    "jsdom": "^25.0.1",
    "postcss": "^8.5.1",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.6.2",
    "typescript-eslint": "^8.18.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
}
```

### Vite Configuration (Production Optimized)
```typescript
// vite.config.ts - Production optimized configuration
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize chunk sizes and enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks for optimal caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['date-fns'],
          'pdf-vendor': ['jspdf', 'html2canvas', 'react-pdf']
        }
      }
    },
    // Increase chunk size warning limit to 1000kb (from default 500kb)
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize bundle size
    minify: 'esbuild'
  },
  // Optimize dev server
  server: {
    port: 3000,
    host: true
  },
  // Configure preview server for production hosting (Render deployment)
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      'a-player-evaluations.onrender.com',
      '.onrender.com' // Allow all Render subdomains
    ]
  },
  // Enable dependency pre-bundling for faster dev builds
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'recharts',
      'date-fns',
      'jspdf',
      'html2canvas'
    ]
  },
  // Vitest configuration for testing
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        'dist/',
        'coverage/'
      ]
    }
  }
})
```

## Production Deployment Status

### Live Production Environment
- **Production URL**: https://a-player-evaluations.onrender.com
- **Hosting Platform**: Render Web Service 
- **Deployment Method**: GitHub Integration with Auto-Deploy
- **Status**: ✅ Live and Operational

### Performance Monitoring Implementation
```typescript
// Real-time performance monitoring with Core Web Vitals
- **LCP (Largest Contentful Paint)**: ≤2.5s target
- **FCP (First Contentful Paint)**: ≤1.8s target  
- **CLS (Cumulative Layout Shift)**: ≤0.1 target
- **INP (Interaction to Next Paint)**: ≤200ms target
- **TTFB (Time to First Byte)**: ≤800ms target

// PerformanceDashboard.tsx - Interactive monitoring component
- Real-time performance metrics display
- 5-second update intervals
- Color-coded performance ratings (Good/Needs Improvement/Poor)
- Export functionality for debugging and analysis
- User interaction tracking and session analytics
```

### Bundle Analysis (Production Build)
```bash
# Optimized production build results:
dist/index.html                              0.80 kB │ gzip:   0.38 kB
dist/assets/index-bF_8Izli.css              33.39 kB │ gzip:   5.75 kB
dist/assets/react-vendor-B1Zg0i_l.js        47.91 kB │ gzip:  17.22 kB
dist/assets/supabase-vendor-DLHNGoB8.js    116.17 kB │ gzip:  32.02 kB
dist/assets/index-B7OekaNv.js              219.48 kB │ gzip:  68.10 kB
dist/assets/chart-vendor-ZzRLarXY.js       362.57 kB │ gzip: 105.48 kB
dist/assets/pdf-vendor-KPlxCtwh.js         561.19 kB │ gzip: 166.35 kB

✓ Built in 5.97s with 10 optimized chunks
✓ Largest chunk: 561KB (PDF libraries) - within performance targets
✓ Total gzipped size: ~400KB for main application logic
```

## Development Workflow

### File Naming Conventions
- **Components**: PascalCase (e.g., `EmployeeAnalytics.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useEmployeeData.ts`)
- **Types**: PascalCase interfaces (e.g., `interface Employee {}`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `PERFORMANCE_ATTRIBUTES`)
- **Utilities**: camelCase (e.g., `calculateWeightedScore`)

### Import Organization
```typescript
// External imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Internal imports
import { Layout } from '@/components/layout';
import { RadarChart } from '@/components/charts';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { Employee, EvaluationData } from '@/types/evaluation';
import { calculateWeightedScore } from '@/utils/calculations';
```

### Component Structure Template
```typescript
// Component imports
import React, { useState, useEffect } from 'react';

// Type definitions
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// Component implementation
export const ComponentName: React.FC<ComponentProps> = ({
  prop1,
  prop2 = 0
}) => {
  // State management
  const [state, setState] = useState(initialState);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  );
};
```

## Performance Considerations

### Code Splitting Strategy
- Route-based splitting for pages
- Feature-based splitting for large components
- Vendor library chunking for optimal caching

### State Management Approach
- React Context for global state
- Local state for component-specific data
- Custom hooks for shared logic
- Memoization for expensive calculations

### Bundle Optimization
- Tree shaking for unused code elimination
- Dynamic imports for code splitting
- Asset optimization for images and icons
- Gzip compression for production builds

## Testing Structure

### Test Organization
```
src/
├── __tests__/                       # Global test utilities
├── components/
│   └── __tests__/                   # Component tests
├── hooks/
│   └── __tests__/                   # Hook tests
├── services/
│   └── __tests__/                   # Service tests
└── utils/
    └── __tests__/                   # Utility tests
```

### Test Naming Convention
- Test files: `ComponentName.test.tsx`
- Test utilities: `testUtils.ts`
- Mock files: `__mocks__/serviceName.ts`

This project structure provides a comprehensive foundation for building a scalable, maintainable A-Player Evaluations Dashboard with complete assignment management and survey capabilities. The architecture supports clear separation of concerns, role-based access control, and modern React development practices for a full-featured evaluation management system that replaces external survey tools with custom React components.
