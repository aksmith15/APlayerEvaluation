# A-Player Evaluations Dashboard Project Structure

## Project Architecture Overview

The A-Player Evaluations Dashboard follows a modern React 18 + TypeScript + Tailwind CSS architecture optimized for a 3-page dashboard application. The structure emphasizes maintainability, scalability, and clear separation of concerns for data visualization and user interface components.

## Root Directory Structure

```
a-player-evaluations-dashboard/
├── public/                          # Static assets and HTML template
│   ├── index.html                   # Main HTML template
│   ├── favicon.ico                  # Application favicon
│   └── manifest.json                # PWA manifest
├── src/                             # Source code directory
│   ├── components/                  # Reusable UI components
│   │   ├── ui/                      # Base UI components
│   │   ├── charts/                  # Data visualization components
│   │   ├── layout/                  # Layout and navigation components
│   │   └── forms/                   # Form and input components
│   ├── pages/                       # Main application pages
│   │   ├── Login.tsx                # Manager authentication page
│   │   ├── EmployeeSelection.tsx    # Employee selection interface
│   │   └── EmployeeAnalytics.tsx    # Employee analytics dashboard
│   ├── services/                    # External service integrations
│   │   ├── supabase.ts              # Supabase client configuration
│   │   ├── dataFetching.ts          # Data fetching utilities
│   │   ├── webhookService.ts        # n8n webhook integration
│   │   └── configService.ts         # app_config table access
│   ├── types/                       # TypeScript type definitions
│   │   ├── database.ts              # Database entity types
│   │   ├── evaluation.ts            # Evaluation-specific types
│   │   ├── auth.ts                  # Authentication types
│   │   └── charts.ts                # Chart data types
│   ├── utils/                       # Utility functions
│   │   ├── calculations.ts          # Score calculations and aggregations
│   │   ├── formatting.ts            # Data formatting utilities
│   │   ├── dateUtils.ts             # Date and quarter utilities
│   │   └── chartHelpers.ts          # Chart configuration helpers
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts               # Authentication hook
│   │   ├── useEmployeeData.ts       # Employee data fetching hook
│   │   ├── useQuarterFilter.ts      # Quarter filtering hook
│   │   └── useWebhook.ts            # Webhook integration hook
│   ├── contexts/                    # React context providers
│   │   ├── AuthContext.tsx          # Authentication context
│   │   ├── DataContext.tsx          # Global data context
│   │   └── UIContext.tsx            # UI state context
│   ├── assets/                      # Static assets and styles
│   │   ├── images/                  # Image files
│   │   ├── icons/                   # Icon files
│   │   └── styles/                  # Custom CSS and Tailwind overrides
│   ├── constants/                   # Application constants
│   │   ├── attributes.ts            # Performance attributes definitions
│   │   ├── scoring.ts               # Scoring system constants
│   │   └── endpoints.ts             # API endpoints and URLs
│   ├── App.tsx                      # Main application component
│   ├── main.tsx                     # Application entry point
│   └── vite-env.d.ts               # Vite environment types
├── docs/                            # Project documentation
├── .env                             # Environment variables
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore patterns
├── package.json                     # Project dependencies and scripts
├── package-lock.json                # Locked dependency versions
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.node.json               # TypeScript configuration for Node
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
├── vite.config.ts                   # Vite build configuration
├── vitest.config.ts                 # Vitest testing configuration
├── eslint.config.js                 # ESLint configuration
└── README.md                        # Project documentation
```

## Detailed Structure Breakdown

### `/src/components/` - Component Organization

#### `/src/components/ui/` - Base UI Components
```
ui/
├── Button.tsx                       # Reusable button component
├── Card.tsx                         # Card layout component
├── Input.tsx                        # Form input component
├── Select.tsx                       # Dropdown select component
├── Modal.tsx                        # Modal dialog component
├── LoadingSpinner.tsx               # Loading indicator
├── ErrorBoundary.tsx                # Error boundary wrapper
├── Table.tsx                        # Data table component
├── SearchInput.tsx                  # Search functionality
├── Badge.tsx                        # Status badge component
├── Tooltip.tsx                      # Tooltip component
└── index.ts                         # Component exports
```

#### `/src/components/charts/` - Data Visualization Components
```
charts/
├── RadarChart.tsx                   # Employee attribute radar chart
├── ClusteredBarChart.tsx            # Attribute breakdown bar chart
├── TrendLineChart.tsx               # Performance trend visualization
├── HistoricalBarChart.tsx           # Historical quarter comparison
├── ScoreCard.tsx                    # Individual score display card
├── ChartContainer.tsx               # Chart wrapper with common functionality
├── ChartLegend.tsx                  # Chart legend component
├── ChartTooltip.tsx                 # Custom chart tooltips
└── index.ts                         # Chart component exports
```

#### `/src/components/layout/` - Layout and Navigation
```
layout/
├── Header.tsx                       # Application header
├── Sidebar.tsx                      # Navigation sidebar
├── Footer.tsx                       # Application footer
├── Layout.tsx                       # Main layout wrapper
├── Navigation.tsx                   # Navigation menu
├── Breadcrumbs.tsx                  # Breadcrumb navigation
└── index.ts                         # Layout component exports
```

#### `/src/components/forms/` - Form Components
```
forms/
├── LoginForm.tsx                    # Manager authentication form
├── QuarterSelector.tsx              # Quarter filtering dropdown
├── EmployeeSearch.tsx               # Employee search form
├── RangeSelector.tsx                # Quarter range selection
└── index.ts                         # Form component exports
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

### `/src/services/` - Service Layer

#### Service Organization
```typescript
// supabase.ts - Database client configuration
export const supabaseClient = createClient(url, key);

// dataFetching.ts - Data fetching utilities
export const fetchEmployeeData = async (employeeId: string) => { ... };
export const fetchQuarterData = async (quarterId: string) => { ... };

// webhookService.ts - n8n webhook integration
export const triggerMetaAnalysis = async (payload: WebhookPayload) => { ... };

// configService.ts - app_config table access
export const getWebhookUrl = async () => { ... };
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
```

### `/src/utils/` - Utility Functions

#### Utility Organization
```typescript
// calculations.ts - Score calculations
export const calculateWeightedScore = (
  managerScore: number,
  peerScore: number,
  selfScore: number
): number => {
  return (managerScore * 0.55) + (peerScore * 0.35) + (selfScore * 0.10);
};

// formatting.ts - Data formatting
export const formatScore = (score: number): string => {
  return score.toFixed(1);
};

// dateUtils.ts - Date utilities
export const formatQuarterDate = (date: string): string => { ... };

// chartHelpers.ts - Chart configuration
export const getChartColors = (): string[] => { ... };
```

### `/src/hooks/` - Custom React Hooks

#### Hook Organization
```typescript
// useAuth.ts - Authentication management
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Hook logic
  return { user, loading, login, logout };
};

// useEmployeeData.ts - Employee data management
export const useEmployeeData = (employeeId: string) => {
  // Data fetching and state management
  return { employee, scores, loading, error };
};

// useQuarterFilter.ts - Quarter filtering
export const useQuarterFilter = () => {
  // Quarter selection and filtering logic
  return { selectedQuarter, quarters, setQuarter };
};
```

### `/src/contexts/` - React Context Providers

#### Context Organization
```typescript
// AuthContext.tsx - Authentication state
export const AuthContext = createContext<AuthContextType>({});

// DataContext.tsx - Global data state
export const DataContext = createContext<DataContextType>({});

// UIContext.tsx - UI state management
export const UIContext = createContext<UIContextType>({});
```

## Configuration Files

### Package.json Structure
```json
{
  "name": "a-player-evaluations-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@supabase/supabase-js": "^2.38.0",
    "recharts": "^2.8.0",
    "react-pdf": "^7.5.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "vitest": "^1.0.4"
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

### Vite Configuration
```typescript
// vite.config.ts
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
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
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

This project structure provides a solid foundation for building a scalable, maintainable A-Player Evaluations Dashboard with clear separation of concerns and modern React development practices.
