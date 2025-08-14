# Project Structure Documentation

## Overview
This project follows a **feature-driven architecture** with clear separation of concerns and domain boundaries. The structure promotes maintainability, testability, and developer productivity.

## Directory Structure

```
src/
├── features/           # Feature domains (business logic organization)
│   ├── auth/          # Authentication & authorization
│   ├── survey/        # Survey evaluation system
│   ├── assignments/   # Assignment management
│   └── analytics/     # Data analytics & reporting
├── shared/            # Shared utilities & components
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utility functions
│   ├── constants/     # Application constants
│   └── types/         # Shared TypeScript types
├── pages/             # Route-level components
├── services/          # External service integrations (temporary)
├── contexts/          # React context providers (temporary)
└── assets/           # Static assets
```

## Feature Domain Architecture

Each feature domain follows a consistent internal structure:

```
features/{domain}/
├── components/        # Domain-specific components
├── hooks/            # Domain-specific custom hooks
├── services/         # Domain-specific services
├── contexts/         # Domain-specific context providers
├── types/            # Domain-specific types
├── constants/        # Domain-specific constants
└── index.ts          # Barrel export for clean imports
```

### Feature Domains

#### 🔐 **Auth** (`/features/auth/`)
- **Purpose**: Authentication, authorization, user management
- **Components**: Login forms, protected routes, auth guards
- **Services**: Authentication service, user profile management
- **Contexts**: Auth state, user data management

#### 📋 **Survey** (`/features/survey/`)
- **Purpose**: Evaluation surveys, questionnaires, responses
- **Components**: Survey forms, question components, progress indicators
- **Services**: Survey submission, response management
- **Contexts**: Survey navigation, response state

#### 📊 **Assignments** (`/features/assignments/`)
- **Purpose**: Assignment creation, management, tracking
- **Components**: Assignment forms, status tables, coverage dashboards
- **Services**: Assignment CRUD, coverage analysis, bulk operations

#### 📈 **Analytics** (`/features/analytics/`)
- **Purpose**: Data visualization, reporting, insights
- **Components**: Charts, dashboards, performance metrics
- **Services**: Data aggregation, chart data processing, AI insights

## Shared Architecture

### 🧩 **Shared Components** (`/shared/components/`)

```
shared/components/
├── ui/               # Basic UI components (Button, Card, etc.)
├── layout/           # Layout components (Header, Sidebar, etc.)
└── forms/            # Form components (FormField, Validation, etc.)
```

### 🪝 **Shared Hooks** (`/shared/hooks/`)
- Custom hooks used across multiple features
- Performance monitoring hooks
- Data fetching hooks

### 🛠️ **Shared Utils** (`/shared/utils/`)
- Pure utility functions
- Date/time helpers
- Calculation functions
- Download utilities

## Import Strategy

### Path Mapping
The project uses TypeScript path mapping for clean imports:

```typescript
// Feature domains
import { AuthProvider, useAuth } from '@auth';
import { SurveyProvider } from '@survey';
import { AssignmentCreationForm } from '@assignments';
import { RadarChart } from '@analytics';

// Shared utilities
import { Button, Card } from '@shared/components/ui';
import { useDataFetch } from '@shared/hooks';
import { formatDate } from '@shared/utils';

// Legacy paths (during migration)
import { authService } from '@services/authService';
import { User } from '@types/auth';
```

### Barrel Exports
Each feature and shared module uses barrel exports (`index.ts`) for clean imports:

```typescript
// ✅ Good - Clean barrel import
import { useAuth, AuthProvider } from '@auth';

// ❌ Avoid - Deep imports
import { useAuth } from '@auth/contexts/AuthContext';
```

## Migration Strategy

### Current State (Week 4 Day 4)
- ✅ **Directory Structure**: Feature domains and shared folders created
- ✅ **Barrel Exports**: Comprehensive index files for all domains
- ✅ **Path Mapping**: TypeScript and Vite configured for clean imports
- ⚪ **Component Migration**: Files remain in original locations with re-exports
- ⚪ **Import Updates**: Gradual migration to new import paths

### Next Steps
1. **Gradual Migration**: Move files to new structure incrementally
2. **Import Updates**: Update imports to use new paths
3. **Legacy Cleanup**: Remove old files once migration is complete
4. **Testing**: Ensure all functionality works after reorganization

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase starting with "use" (`useUserData.ts`)
- **Services**: camelCase (`authService.ts`)
- **Types**: PascalCase (`UserPermissions.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### Exports
- **Named Exports**: Preferred for most cases
- **Default Exports**: Only for main component in single-component files
- **Barrel Exports**: Use `index.ts` files for feature boundaries

## Benefits

### 🎯 **Developer Experience**
- **Clear Boundaries**: Easy to understand what code belongs where
- **Discoverability**: Logical organization makes finding code intuitive
- **Onboarding**: New developers can quickly understand the structure

### 🔧 **Maintainability**
- **Separation of Concerns**: Business logic grouped by domain
- **Loose Coupling**: Features can evolve independently
- **Testability**: Domain boundaries make unit testing easier

### ⚡ **Performance**
- **Bundle Splitting**: Features can be code-split efficiently
- **Tree Shaking**: Better dead code elimination
- **Lazy Loading**: Features can be loaded on-demand

### 🚀 **Scalability**
- **Team Organization**: Teams can own specific feature domains
- **Feature Flags**: Easier to toggle features on/off
- **Microservice Alignment**: Structure aligns with potential service boundaries

## Examples

### Adding a New Feature
```bash
# 1. Create feature structure
mkdir -p src/features/notifications/{components,hooks,services,types}

# 2. Create barrel exports
touch src/features/notifications/index.ts
touch src/features/notifications/components/index.ts
# ... etc

# 3. Add to main features index
# Update src/features/index.ts

# 4. Add path mapping
# Update tsconfig.app.json and vite.config.ts
```

### Using the Structure
```typescript
// NotificationBell.tsx - A shared component
import { Button, Badge } from '@shared/components/ui';
import { useNotifications } from '@features/notifications';

// UserProfile.tsx - An auth domain component  
import { useUser, useUserPermissions } from '@auth';
import { Card } from '@shared/components/ui';

// AnalyticsDashboard.tsx - An analytics feature
import { RadarChart, TrendChart } from '@analytics';
import { useEmployeeData } from '@shared/hooks';
```

This structure provides a solid foundation for scaling the application while maintaining code quality and developer productivity.


