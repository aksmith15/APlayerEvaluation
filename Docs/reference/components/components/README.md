# Component Documentation

This directory contains comprehensive documentation for React components in the A-Player Evaluation System, ranked by usage frequency and architectural importance.

## 📊 Component Priority Rankings

Components are ranked by import frequency, usage patterns, and architectural significance. Higher priority components are documented first.

### Tier 1: Core UI Components (Universal Usage)
1. **[Button](./Button.mdx)** - Primary action component used across all interfaces
2. **[Card](./Card.mdx)** - Content container used throughout the application
3. **[LoadingSpinner](./LoadingSpinner.mdx)** - Loading state indicator used in all data operations
4. **[ErrorMessage](./ErrorMessage.mdx)** - Error display component used in error boundaries
5. **[SearchInput](./SearchInput.mdx)** - Search functionality component used in multiple views

### Tier 2: Layout & Navigation Components (High Usage)
6. **[ErrorBoundary](./ErrorBoundary.mdx)** - Application-level error handling wrapper
7. **[ProtectedRoute](./ProtectedRoute.mdx)** - Authentication wrapper for secure routes
8. **[Breadcrumb](./Breadcrumb.mdx)** - Navigation breadcrumb component
9. **[CompanySwitcher](./CompanySwitcher.mdx)** - Multi-tenant company selection
10. **[KeyboardShortcuts](./KeyboardShortcuts.mdx)** - Keyboard navigation component

### Tier 3: Specialized UI Components (Feature-Specific)
11. **[EvaluationSurvey](./EvaluationSurvey.mdx)** - Main survey interface component
12. **[LazyChart](./LazyChart.mdx)** - Dynamic chart loading component
13. **[TabSystem](./TabSystem.mdx)** - Compound tab navigation component
14. **[EmployeeProfile](./EmployeeProfile.mdx)** - Employee information display
15. **[GeneratePDFButton](./GeneratePDFButton.mdx)** - PDF generation trigger component

### Tier 4: Data Components (Analytics & Management)
16. **[RadarChart](./RadarChart.mdx)** - Performance visualization chart
17. **[AssignmentCard](./AssignmentCard.mdx)** - Assignment display component
18. **[TopAnalyticsGrid](./TopAnalyticsGrid.mdx)** - Analytics dashboard grid
19. **[CoreGroupAnalysisTabs](./CoreGroupAnalysisTabs.mdx)** - Performance analysis tabs
20. **[PerformanceDashboard](./PerformanceDashboard.mdx)** - Performance monitoring dashboard

## 🏗️ Component Architecture

### Component Organization
```
src/components/
├── ui/                          # Reusable UI components
│   ├── Button.tsx              # Tier 1: Core actions
│   ├── Card.tsx                # Tier 1: Content containers
│   ├── LoadingSpinner.tsx      # Tier 1: Loading states
│   ├── ErrorMessage.tsx        # Tier 1: Error display
│   ├── SearchInput.tsx         # Tier 1: Search functionality
│   ├── ErrorBoundary.tsx       # Tier 2: Error handling
│   ├── Breadcrumb.tsx          # Tier 2: Navigation
│   ├── CompanySwitcher.tsx     # Tier 2: Multi-tenancy
│   ├── EvaluationSurvey.tsx    # Tier 3: Survey interface
│   ├── LazyChart.tsx           # Tier 3: Chart loading
│   ├── compound/               # Compound components
│   │   └── TabSystem.tsx       # Tier 3: Tab navigation
│   ├── survey/                 # Survey-specific components
│   ├── assignment-tabs/        # Assignment management
│   └── hoc/                    # Higher-order components
├── ProtectedRoute.tsx          # Tier 2: Route protection
└── pdf/                        # PDF generation components
    ├── PageWrapper.tsx
    ├── ScoreCard.tsx
    └── ValueBar.tsx
```

### Design System Integration
All components follow consistent design patterns:
- **TypeScript Interfaces**: Explicit prop definitions with proper typing
- **Accessibility**: ARIA roles, keyboard navigation, screen reader support
- **Responsive Design**: Mobile-first approach with breakpoint adaptations
- **Theme Integration**: Consistent color scheme and spacing
- **Testing**: Unit tests and integration test coverage

## 🔍 Usage Patterns

### Import Frequency Analysis
Based on codebase analysis, components ranked by import count:

| Component | Import Count | Usage Context |
|-----------|--------------|---------------|
| LoadingSpinner | 8+ imports | Data loading states, route transitions |
| Button | 7+ imports | Forms, actions, navigation |
| Card | 6+ imports | Content organization, data display |
| ErrorMessage | 5+ imports | Error handling, user feedback |
| SearchInput | 4+ imports | Employee search, data filtering |
| CompanySwitcher | 3+ imports | Multi-tenant navigation |
| Breadcrumb | 3+ imports | Page navigation |
| ErrorBoundary | 3+ imports | Application error handling |

### Component Categories

#### **Core UI Components**
Essential building blocks used across multiple features:
- Interactive elements (Button, SearchInput)
- Content containers (Card, ErrorMessage)
- State indicators (LoadingSpinner, ErrorBoundary)

#### **Navigation Components**
Components that handle user navigation and routing:
- Route protection (ProtectedRoute)
- Page navigation (Breadcrumb, KeyboardShortcuts)
- Context switching (CompanySwitcher)

#### **Feature Components**
Specialized components for specific application features:
- Survey system (EvaluationSurvey, BaseQuestionForm)
- Analytics (RadarChart, PerformanceDashboard)
- Assignment management (AssignmentCard, AssignmentCreationForm)

#### **Compound Components**
Complex components composed of multiple sub-components:
- TabSystem (tabs, panels, navigation)
- CoreGroupAnalysisTabs (multi-tab analytics)
- PerformanceDashboard (charts, controls, data)

## 📋 Documentation Standards

Each component documentation includes:

### **Props Table**
Auto-derived from TypeScript interfaces:
- **name** - Property name
- **type** - TypeScript type definition
- **default** - Default value if optional
- **required** - Required/optional indicator
- **description** - Property purpose and usage

### **Accessibility**
- ARIA roles and labels
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### **Usage Examples**
Real code examples from the application:
- Basic usage patterns
- Advanced configurations
- Integration with other components

### **Side Effects**
- Event handlers and callbacks
- External API calls
- State management implications
- Performance considerations

## 📑 Remaining Components Queue

### Priority 5: Additional UI Components (21-40)
- TrendLineChart, ClusteredBarChart, HistoricalClusteredBarChart
- AssignmentCreationForm, AssignmentStatusTable, AssignmentDebugger
- AttributeWeightsManager, AnalysisJobManager
- InviteManager, PDFViewer, QuarterRangeSelector
- BaseQuestionForm, ScoringForm, ConditionalQuestionForm
- EmployeeCardSkeleton, ChartSkeleton, SkeletonLoader
- NoEvaluationData, EmptyState, NoEmployeesFound
- PersonaQuickGlanceWidget, QuarterlyNotes
- LetterGrade, Notification, AuthenticationTest

### Priority 6: Specialized Components (41-60)
- CoverageDashboard, CoverageTab, DebugTab, ManageTab
- OverviewTab, CreateTab, UploadTab, WeightsTab
- CharacterTab, CompetenceTab, CuriosityTab
- EvaluationConsensusCard, CoreGroupPerformanceCard
- DebugInviteTest, DownloadAnalyticsButton
- SurveyIntro, withLoadingState HOC

### Priority 7: PDF Components (61+)
- PageWrapper, ScoreCard, ValueBar
- CoachingReportPage, CoverPage, DescriptiveReviewPage
- DevelopmentAreasPage, StrengthsPage, SummaryPage

## 🎯 Component Development Guidelines

### Creating New Components
1. **TypeScript First**: Define explicit interfaces for all props
2. **Accessibility**: Include ARIA attributes and keyboard support
3. **Testing**: Write unit tests for all interactive behavior
4. **Documentation**: Follow the established MDX template
5. **Performance**: Consider lazy loading for heavy components

### Component Naming Convention
- **PascalCase**: All component names use PascalCase
- **Descriptive Names**: Clear purpose indication (LoadingSpinner vs Spinner)
- **Context Prefixes**: Feature-specific prefixes (AssignmentCard, SurveyIntro)

### Props Interface Standards
```typescript
interface ComponentProps {
  // Required props first
  requiredProp: string;
  
  // Optional props with defaults
  optionalProp?: boolean;
  
  // Event handlers
  onAction?: (data: any) => void;
  
  // Accessibility props
  ariaLabel?: string;
  role?: string;
  
  // Style/layout props
  className?: string;
  variant?: 'primary' | 'secondary';
}
```

## 📊 Documentation Status

**🎉 Complete: All 20 Core Components Documented**

### Coverage Summary
- ✅ **Tier 1**: 5/5 components (Foundation UI)
- ✅ **Tier 2**: 5/5 components (Layout & Navigation)  
- ✅ **Tier 3**: 5/5 components (Specialized UI)
- ✅ **Tier 4**: 5/5 components (Data Components)

### Documentation Features
- **📝 Comprehensive MDX**: Detailed component documentation with examples
- **🔗 Cross-References**: Linked related components and hooks
- **♿ Accessibility**: Complete accessibility guidelines and examples
- **⚡ Performance**: Performance notes and optimization guidance
- **🎨 Design System**: Integration with design system patterns
- **💡 Usage Examples**: Real-world implementation examples
- **🧪 TypeScript**: Complete TypeScript interface documentation

---

**🔗 Related Documentation:**
- [ARCHITECTURE.md](../ARCHITECTURE.md#frontend-architecture) - Frontend architecture overview
- [Hooks Documentation](../hooks/) - Custom React hooks used by components
- [Testing Guide](../../a-player-dashboard/src/setupTests.ts) - Component testing setup
