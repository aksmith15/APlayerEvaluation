# A-Player Evaluations Dashboard - UI/UX Documentation

## Design System Overview

The A-Player Evaluations Dashboard follows a modern, professional design system optimized for data visualization and enterprise dashboard applications. The design emphasizes clarity, accessibility, and user efficiency in displaying complex evaluation data.

## Design Philosophy

### Core Principles
- **Data-First Design**: Prioritize clear data visualization over decorative elements
- **Cognitive Load Reduction**: Minimize mental effort required to process information
- **Progressive Disclosure**: Show relevant information at appropriate levels of detail
- **Consistency**: Maintain uniform patterns across all dashboard components
- **Accessibility**: Ensure usability for all users regardless of abilities

### Visual Hierarchy
1. **Primary**: Employee selection and quarter filtering
2. **Secondary**: Key metrics and radar charts
3. **Tertiary**: Detailed breakdowns and historical data
4. **Supporting**: Navigation, actions, and metadata

## Color Palette

### Primary Colors
```css
/* Brand Primary - Professional Blue */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Main brand color */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;

/* Secondary - Neutral Gray */
--secondary-50: #f8fafc;
--secondary-100: #f1f5f9;
--secondary-200: #e2e8f0;
--secondary-300: #cbd5e1;
--secondary-400: #94a3b8;
--secondary-500: #64748b;  /* Text color */
--secondary-600: #475569;
--secondary-700: #334155;
--secondary-800: #1e293b;
--secondary-900: #0f172a;
```

### Data Visualization Colors
```css
/* Chart Color Palette */
--chart-manager: #059669;     /* Green - Manager scores */
--chart-peer: #dc2626;        /* Red - Peer scores */
--chart-self: #7c3aed;        /* Purple - Self scores */
--chart-weighted: #f59e0b;    /* Amber - Weighted final scores */

/* Performance Indicators */
--success: #10b981;           /* High performance */
--warning: #f59e0b;           /* Medium performance */
--danger: #ef4444;            /* Low performance */
--info: #3b82f6;              /* Neutral information */
```

### Background Colors
```css
/* Layout Backgrounds */
--bg-primary: #ffffff;        /* Main content background */
--bg-secondary: #f8fafc;      /* Sidebar, cards */
--bg-tertiary: #f1f5f9;       /* Subtle sections */
--bg-overlay: rgba(0, 0, 0, 0.5); /* Modal overlays */
```

## Typography

### Font Family
```css
/* Primary Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;

/* Fallback for Code/Data */
font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;
```

### Typography Scale
```css
/* Heading Styles */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }    /* Page titles */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }  /* Section headers */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }       /* Subsection headers */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }    /* Card titles */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }   /* Emphasis text */

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; }      /* Primary body text */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }   /* Secondary text */
.text-xs { font-size: 0.75rem; line-height: 1rem; }       /* Caption text */

/* Font Weights */
.font-light { font-weight: 300; }     /* Light emphasis */
.font-normal { font-weight: 400; }    /* Body text */
.font-medium { font-weight: 500; }    /* Subtle emphasis */
.font-semibold { font-weight: 600; }  /* Strong emphasis */
.font-bold { font-weight: 700; }      /* Headers */
```

## Component Specifications

### 1. Navigation Components

#### Header Component
```css
.header {
  height: 64px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--secondary-200);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-logo {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-600);
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}
```

#### Breadcrumb Navigation
```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 0.875rem;
  color: var(--secondary-600);
}

.breadcrumb-separator {
  color: var(--secondary-400);
}

.breadcrumb-current {
  color: var(--secondary-800);
  font-weight: 500;
}
```

### 2. Form Components

#### Button Specifications
```css
/* Primary Button */
.btn-primary {
  background: var(--primary-600);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-700);
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: var(--bg-primary);
  color: var(--secondary-700);
  border: 1px solid var(--secondary-300);
  padding: 12px 24px;
  border-radius: 8px;
}

/* Icon Button */
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### Input Field Specifications
```css
.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--secondary-300);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--secondary-700);
}
```

#### Select/Dropdown Specifications
```css
.select-container {
  position: relative;
  width: 100%;
}

.select-field {
  appearance: none;
  width: 100%;
  padding: 12px 16px 12px 16px;
  padding-right: 40px;
  border: 1px solid var(--secondary-300);
  border-radius: 8px;
  background: var(--bg-primary);
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
```

### 3. Data Display Components

#### Card Component
```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--secondary-200);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--secondary-800);
}

.card-content {
  color: var(--secondary-600);
}
```

#### Table Component
```css
.table-container {
  overflow-x: auto;
  border: 1px solid var(--secondary-200);
  border-radius: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background: var(--secondary-50);
  font-weight: 600;
  color: var(--secondary-700);
}

.table-cell {
  padding: 12px 16px;
  border-bottom: 1px solid var(--secondary-200);
  text-align: left;
}

.table-row:hover {
  background: var(--secondary-50);
}
```

### 4. Chart Components

#### Chart Container
```css
.chart-container {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--secondary-800);
}

.chart-subtitle {
  font-size: 0.875rem;
  color: var(--secondary-600);
  margin-top: 4px;
}
```

#### Legend Component
```css
.chart-legend {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--secondary-200);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--secondary-600);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
```

## Dashboard Layout Specifications

### 1. Login Page Layout
```css
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 48px 40px;
  background: var(--bg-primary);
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--secondary-800);
  margin-bottom: 8px;
}

.login-subtitle {
  color: var(--secondary-600);
}
```

### 2. Employee Selection Page Layout
```css
.employee-selection-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.selection-header {
  margin-bottom: 32px;
}

.selection-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--secondary-800);
  margin-bottom: 8px;
}

.selection-subtitle {
  font-size: 1.125rem;
  color: var(--secondary-600);
}

.search-section {
  margin-bottom: 32px;
  display: flex;
  gap: 16px;
  align-items: end;
}

.employee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.employee-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.employee-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
```

### 3. Employee Analytics Page Layout
```css
.analytics-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.analytics-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--secondary-800);
}

.analytics-actions {
  display: flex;
  gap: 12px;
}

.analytics-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

/* Employee Profile Section */
.profile-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.profile-name {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--secondary-800);
  margin-bottom: 8px;
}

.profile-role {
  font-size: 1.125rem;
  color: var(--primary-600);
  font-weight: 500;
  margin-bottom: 4px;
}

.profile-department {
  color: var(--secondary-600);
  margin-bottom: 8px;
}

.profile-email {
  color: var(--secondary-500);
  font-size: 0.875rem;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.chart-full-width {
  grid-column: 1 / -1;
}
```

## Chart Design Patterns

### 1. Radar Chart Specifications
```typescript
const radarChartConfig = {
  margin: { top: 20, right: 30, bottom: 20, left: 30 },
  colors: {
    fill: 'rgba(59, 130, 246, 0.1)',
    stroke: '#3b82f6',
    strokeWidth: 2
  },
  grid: {
    stroke: '#e2e8f0',
    strokeDasharray: '3 3'
  },
  labels: {
    fontSize: 12,
    fill: '#64748b'
  }
};
```

### 2. Clustered Bar Chart Specifications
```typescript
const clusteredBarConfig = {
  margin: { top: 20, right: 30, bottom: 60, left: 40 },
  colors: {
    manager: '#059669',
    peer: '#dc2626',
    self: '#7c3aed',
    weighted: '#f59e0b'
  },
  barSize: 20,
  categoryGap: '20%',
  axes: {
    x: {
      fontSize: 12,
      angle: -45,
      textAnchor: 'end'
    },
    y: {
      domain: [0, 10],
      tickCount: 6
    }
  }
};
```

### 3. Trend Line Chart Specifications
```typescript
const trendLineConfig = {
  margin: { top: 20, right: 30, bottom: 40, left: 40 },
  line: {
    stroke: '#3b82f6',
    strokeWidth: 3,
    dot: {
      fill: '#3b82f6',
      strokeWidth: 2,
      r: 4
    }
  },
  grid: {
    horizontal: true,
    vertical: false,
    stroke: '#f1f5f9'
  }
};
```

## Responsive Design Guidelines

### Breakpoints
```css
/* Mobile First Approach */
.container {
  padding: 16px;
}

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
  .container {
    padding: 20px;
  }
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  .charts-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .profile-section {
    grid-template-columns: 1fr 1fr;
  }
}

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) {
  .analytics-container {
    max-width: 1400px;
  }
}
```

### Mobile Optimizations
```css
/* Mobile-specific adjustments */
@media (max-width: 767px) {
  .profile-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .analytics-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .analytics-actions {
    justify-content: stretch;
  }
  
  .analytics-actions button {
    flex: 1;
  }
  
  .employee-grid {
    grid-template-columns: 1fr;
  }
  
  .search-section {
    flex-direction: column;
    align-items: stretch;
  }
}
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast Requirements
```css
/* Minimum contrast ratios */
.text-primary { color: #1e293b; }    /* 16.75:1 ratio */
.text-secondary { color: #475569; }  /* 7.25:1 ratio */
.text-disabled { color: #94a3b8; }   /* 4.5:1 ratio */

/* Interactive elements */
.btn-primary { 
  background: #2563eb; 
  color: white; /* 8.59:1 ratio */
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db; /* 3:1 ratio minimum */
}
```

#### Focus Management
```css
/* Focus indicators */
.focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--secondary-800);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

#### Screen Reader Support
```html
<!-- Semantic HTML structure -->
<main role="main" aria-labelledby="page-title">
  <h1 id="page-title">Employee Analytics Dashboard</h1>
  
  <!-- Chart with accessible description -->
  <section aria-labelledby="performance-chart-title">
    <h2 id="performance-chart-title">Performance Radar Chart</h2>
    <div role="img" aria-describedby="chart-description">
      <!-- Chart component -->
    </div>
    <div id="chart-description" class="sr-only">
      Performance radar chart showing scores across 10 attributes
    </div>
  </section>
</main>

<!-- Screen reader only text -->
<span class="sr-only">
  Additional context for screen readers
</span>
```

#### Keyboard Navigation
```css
/* Keyboard navigation support */
.keyboard-navigation {
  /* Tab order management */
  tabindex: 0;
}

/* Interactive elements */
.btn, .input, .select {
  position: relative;
}

.btn:focus-visible,
.input:focus-visible,
.select:focus-visible {
  z-index: 1;
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Modal trap focus */
.modal[aria-hidden="false"] {
  /* Focus management for modals */
}
```

## Animation and Transitions

### Micro-interactions
```css
/* Hover effects */
.btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Loading states */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Page transitions */
.page-enter {
  opacity: 0;
  transform: translateX(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 300ms, transform 300ms;
}
```

### Chart Animations
```typescript
// Recharts animation configuration
const chartAnimationConfig = {
  animationBegin: 0,
  animationDuration: 800,
  animationEasing: 'ease-out'
};
```

## Error States and Feedback

### Error Message Design
```css
.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #059669;
  padding: 12px 16px;
  border-radius: 8px;
}

.warning-message {
  background: #fffbeb;
  border: 1px solid #fed7aa;
  color: #d97706;
  padding: 12px 16px;
  border-radius: 8px;
}
```

### Loading States
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--secondary-200) 25%,
    var(--secondary-100) 50%,
    var(--secondary-200) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

This comprehensive UI/UX documentation provides the foundation for creating a consistent, accessible, and user-friendly A-Player Evaluations Dashboard that effectively presents complex evaluation data in an intuitive interface.
