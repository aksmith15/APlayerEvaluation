# A-Player Evaluations Dashboard - UI/UX Documentation

## Design System Overview

The A-Player Evaluations Dashboard follows a modern, professional design system optimized for data visualization and enterprise dashboard applications. The design emphasizes clarity, accessibility, and user efficiency in displaying complex evaluation data.

**Live Production URL**: https://a-player-evaluations.onrender.com

### Implementation Status
- ✅ **Production Deployed**: Live and operational with real-time performance monitoring
- ✅ **Component Library**: 24 custom UI components with comprehensive testing
- ✅ **Accessibility Compliant**: ARIA labels, keyboard navigation, screen reader support
- ✅ **Performance Optimized**: Core Web Vitals monitoring with interactive dashboard
- ✅ **Responsive Design**: Mobile, tablet, and desktop compatibility

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

### 3. Data Display Components (Actual Implementation)

#### Card Component (Enhanced with Interactions)
```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
}

.card:hover {
  border-color: var(--primary-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
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

### 4. Advanced Component Implementations

#### Performance Dashboard Component
```css
.performance-dashboard {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: all 0.3s ease;
}

.performance-dashboard.collapsed {
  width: 60px;
  height: 60px;
}

.performance-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--secondary-100);
}

.metric-label {
  font-size: 0.875rem;
  color: var(--secondary-600);
}

.metric-value {
  font-weight: 600;
  font-size: 0.875rem;
}

.metric-good { color: var(--success); }
.metric-warning { color: var(--warning); }
.metric-poor { color: var(--danger); }
```

#### Interactive Chart Components
```css
.chart-container {
  position: relative;
  width: 100%;
  height: 400px;
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 16px;
}

.chart-tooltip {
  background: var(--secondary-800);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.radar-chart {
  /* Specific styling for radar chart performance attributes */
  .recharts-polar-grid-angle line {
    stroke: var(--secondary-300);
  }
  
  .recharts-polar-grid-concentric polygon {
    stroke: var(--secondary-200);
    fill: none;
  }
}

.clustered-bar-chart {
  /* Specific styling for clustered bar charts */
  .recharts-cartesian-grid-horizontal line {
    stroke: var(--secondary-200);
  }
  
  .recharts-xAxis .recharts-cartesian-axis-tick-value {
    font-size: 0.75rem;
    fill: var(--secondary-600);
  }
}
```

#### Analysis Job Manager Component
```css
.analysis-job-manager {
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
  border: 1px solid var(--primary-200);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
}

.job-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-pending { background: var(--warning); }
.status-running { background: var(--info); animation: pulse 2s infinite; }
.status-completed { background: var(--success); }
.status-failed { background: var(--danger); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--secondary-200);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  transition: width 0.3s ease;
}
```

#### PDF Viewer Component
```css
.pdf-viewer {
  width: 100%;
  height: 600px;
  border: 1px solid var(--secondary-200);
  border-radius: 8px;
  overflow: hidden;
  background: var(--secondary-50);
}

.pdf-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--secondary-100);
  border-bottom: 1px solid var(--secondary-200);
}

.pdf-page-info {
  font-size: 0.875rem;
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

### 3. Enhanced Employee Analytics Page Layout ✨ **UPDATED**
**Last Updated:** January 16, 2025

The Employee Analytics page has been restructured for improved visual hierarchy and better use of space.

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

/* Enhanced Employee Profile Section - Full Width Horizontal Card */
.profile-section {
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.profile-name {
  font-size: 2.25rem; /* Increased for prominence */
  font-weight: 700;
  color: var(--secondary-800);
  margin-bottom: 8px;
}

.profile-role {
  font-size: 1.25rem;
  color: var(--primary-600);
  font-weight: 500;
  margin-bottom: 4px;
}

.profile-department {
  font-size: 1.125rem;
  color: var(--secondary-600);
  margin-bottom: 8px;
}

.profile-email {
  color: var(--secondary-500);
  font-size: 0.875rem;
}

.profile-meta {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--secondary-200);
  font-size: 0.875rem;
  color: var(--secondary-600);
}

.profile-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Performance Overview Section - Full Width */
.performance-overview {
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  min-height: 600px; /* Generous space for radar chart */
}

.performance-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--secondary-800);
  margin-bottom: 24px;
}

/* Charts Grid - Responsive Layout */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

/* Large screens: Two column layout for secondary charts */
@media (min-width: 1200px) {
  .charts-grid.secondary {
    grid-template-columns: 1fr 1fr;
  }
}

.chart-full-width {
  grid-column: 1 / -1;
}

/* Quarter Filter Integration */
.quarter-filter-section {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: var(--secondary-50);
  border-radius: 8px;
}

.quarter-info {
  font-size: 0.875rem;
  color: var(--secondary-600);
}
```

#### Key Layout Improvements:
- **Full-Width Employee Profile**: Horizontal card layout with enhanced typography hierarchy
- **Dedicated Performance Overview**: Large, full-width section for the radar chart component
- **Improved Visual Hierarchy**: Clear separation between profile information and analytics
- **Better Space Utilization**: More generous spacing for better readability
- **Enhanced Profile Display**: Larger name typography and better information organization
- **Responsive Grid System**: Adapts chart layout based on screen size
- **Quarter Filter Integration**: Prominent placement of quarter selection controls

## Chart Design Patterns

### 1. Enhanced Radar Chart Specifications ✨ **UPDATED**
**Last Updated:** January 16, 2025

The radar chart component has been enhanced with evaluation type selection and improved sizing for better readability.

#### Component Structure:
```css
.radar-chart-container {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  min-height: 500px; /* Increased from 300px for better visibility */
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.evaluation-type-selector {
  min-width: 200px;
}

.chart-stats {
  display: flex;
  gap: 16px;
  font-size: 0.875rem;
  color: var(--secondary-600);
}
```

#### TypeScript Configuration:
```typescript
const radarChartConfig = {
  margin: { top: 20, right: 30, bottom: 20, left: 30 },
  height: 500, // Increased for better readability
  colors: {
    // Single evaluation type display (no overlapping)
    'Total Score': {
      fill: 'rgba(59, 130, 246, 0.15)',
      stroke: '#3b82f6',
      strokeWidth: 3
    },
    'Manager': {
      fill: 'rgba(5, 150, 105, 0.15)',
      stroke: '#059669',
      strokeWidth: 3
    },
    'Peer': {
      fill: 'rgba(220, 38, 38, 0.15)',
      stroke: '#dc2626',
      strokeWidth: 3
    },
    'Self': {
      fill: 'rgba(124, 58, 237, 0.15)',
      stroke: '#7c3aed',
      strokeWidth: 3
    }
  },
  grid: {
    stroke: '#e2e8f0',
    strokeDasharray: '3 3',
    strokeWidth: 1
  },
  labels: {
    fontSize: 12,
    fill: '#64748b',
    fontWeight: 500
  },
  domain: [0, 10], // Fixed scale for consistency
  tickCount: 5
};
```

#### Evaluation Type Options:
```typescript
const evaluationTypes = [
  { value: 'weighted', label: 'Total Score', description: 'Weighted average (Manager 55%, Peer 35%, Self 10%)' },
  { value: 'manager', label: 'Manager', description: 'Manager evaluation scores only' },
  { value: 'peer', label: 'Peer', description: 'Peer evaluation scores only' },
  { value: 'self', label: 'Self', description: 'Self-evaluation scores only' }
];
```

#### Features:
- **Evaluation Type Selector**: Dropdown to switch between Total Score, Manager, Peer, and Self evaluations
- **Enhanced Size**: 500px height for improved readability
- **Single Type Display**: Shows one evaluation type at a time to reduce visual clutter
- **Statistical Display**: Shows average and count for selected evaluation type
- **Professional Styling**: Consistent with overall design system
- **Responsive Design**: Adapts to different screen sizes

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

## Recent UI/UX Enhancements ✨

### Authentication Flow Improvements
**Updated:** January 16, 2025

The authentication system has been enhanced for better user experience and reliability:

#### Loading States
```css
.auth-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.auth-spinner-text {
  color: var(--secondary-600);
  font-size: 0.875rem;
}
```

#### Error Handling
```css
.auth-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.auth-error-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.auth-error-details {
  font-size: 0.875rem;
  opacity: 0.8;
}
```

#### Features:
- **Improved Loading States**: Clear feedback during authentication process
- **Enhanced Error Messages**: Specific error messages for different failure scenarios
- **Graceful Timeouts**: Proper handling of network timeouts and connection issues
- **State Management**: Reliable authentication state management without infinite loops

### Employee Selection Enhancements

#### Score Badges
```css
.score-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.score-badge.high {
  background: #dcfce7;
  color: #166534;
}

.score-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.score-badge.low {
  background: #fee2e2;
  color: #991b1b;
}

.score-badge.no-score {
  background: var(--secondary-100);
  color: var(--secondary-600);
}
```

#### Employee Cards
```css
.employee-card-enhanced {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--secondary-200);
}

.employee-card-enhanced:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  border-color: var(--primary-300);
}

.employee-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.employee-score-section {
  text-align: right;
}
```

### Data Visualization Improvements

#### Chart Loading States
```css
.chart-skeleton {
  background: var(--secondary-100);
  border-radius: 8px;
  height: 400px;
  position: relative;
  overflow: hidden;
}

.chart-skeleton::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: loading 1.5s infinite;
}
```

#### Empty States
```css
.chart-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--secondary-500);
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 0.875rem;
  text-align: center;
  max-width: 300px;
}
```

## Design System Updates

### Enhanced Component States
- **Interactive Feedback**: Improved hover and focus states for all interactive elements
- **Loading Patterns**: Consistent skeleton loading across all data components
- **Error Recovery**: Clear error states with actionable recovery options
- **Progressive Enhancement**: Graceful degradation for slower connections

### Accessibility Improvements
- **Screen Reader Support**: Enhanced ARIA labels and descriptions for complex charts
- **Keyboard Navigation**: Full keyboard accessibility for all interactive components
- **Color Contrast**: All UI elements meet WCAG 2.1 AA standards
- **Focus Management**: Clear focus indicators and logical tab order

### Performance Optimizations
- **Lazy Loading**: Charts and heavy components load on demand
- **Efficient Re-renders**: Optimized React rendering with proper memoization
- **Responsive Images**: Proper image sizing and lazy loading for better performance
- **Bundle Optimization**: Code splitting and tree shaking for smaller bundles

## Survey Assignment System UI/UX

### Assignment Card Components

The assignment card system provides visual distinction between different types of evaluation assignments with clear visual cues and consistent interaction patterns.

#### Base Assignment Card Styling
```css
.assignment-card {
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.assignment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: var(--primary-300);
}

.assignment-card:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

#### Assignment Card Variants
```css
/* Self-Evaluation Cards - Blue Theme */
.assignment-card.self-evaluation {
  border-left: 4px solid var(--primary-500); /* Blue accent */
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--bg-primary) 100%);
}

.assignment-card.self-evaluation:hover {
  border-left-color: var(--primary-600);
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--bg-primary) 100%);
}

/* Evaluate Others Cards - Green Theme */
.assignment-card.evaluate-others {
  border-left: 4px solid var(--success); /* Green accent */
  background: linear-gradient(135deg, #f0fdf4 0%, var(--bg-primary) 100%);
}

.assignment-card.evaluate-others:hover {
  border-left-color: #059669;
  background: linear-gradient(135deg, #dcfce7 0%, var(--bg-primary) 100%);
}

/* Manager Assignment Cards - Orange Theme */
.assignment-card.manager-assignment {
  border-left: 4px solid var(--warning); /* Orange accent */
  background: linear-gradient(135deg, #fefbf3 0%, var(--bg-primary) 100%);
}

.assignment-card.manager-assignment:hover {
  border-left-color: #d97706;
  background: linear-gradient(135deg, #fef3c7 0%, var(--bg-primary) 100%);
}
```

#### Assignment Card Content Structure
```css
.assignment-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.assignment-type-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.assignment-type-badge.self {
  background: var(--primary-100);
  color: var(--primary-700);
}

.assignment-type-badge.peer {
  background: #dcfce7;
  color: #166534;
}

.assignment-type-badge.manager {
  background: #fef3c7;
  color: #92400e;
}

.assignment-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-pending { background: var(--warning); }
.status-in-progress { background: var(--info); }
.status-completed { background: var(--success); }

.assignment-evaluatee {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--secondary-800);
  margin-bottom: 8px;
}

.assignment-details {
  color: var(--secondary-600);
  font-size: 0.875rem;
  line-height: 1.4;
}

.assignment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--secondary-200);
  font-size: 0.75rem;
  color: var(--secondary-500);
}

.assignment-due-date {
  font-weight: 500;
}

.assignment-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### Assignment Management Dashboard

#### Dashboard Layout
```css
.assignment-management-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.assignment-management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.assignment-management-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--secondary-800);
}

.assignment-management-actions {
  display: flex;
  gap: 12px;
}

.assignment-dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
}

.assignment-main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.assignment-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
```

#### Assignment Creation Form
```css
.assignment-creation-form {
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  padding: 24px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--secondary-800);
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.multi-select-container {
  position: relative;
}

.multi-select {
  min-height: 120px;
  border: 1px solid var(--secondary-300);
  border-radius: 8px;
  padding: 8px;
  background: var(--bg-primary);
}

.selected-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-100);
  color: var(--primary-700);
  padding: 4px 8px;
  border-radius: 6px;
  margin: 2px;
  font-size: 0.875rem;
}

.selected-item-remove {
  cursor: pointer;
  font-weight: bold;
  color: var(--primary-600);
}

.selected-item-remove:hover {
  color: var(--primary-800);
}
```

#### Bulk Assignment Upload
```css
.bulk-upload-container {
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  padding: 24px;
}

.upload-dropzone {
  border: 2px dashed var(--secondary-300);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-dropzone:hover {
  border-color: var(--primary-400);
  background: var(--primary-50);
}

.upload-dropzone.dragover {
  border-color: var(--primary-500);
  background: var(--primary-100);
}

.upload-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: var(--secondary-400);
}

.upload-text {
  color: var(--secondary-600);
  margin-bottom: 8px;
}

.upload-subtext {
  color: var(--secondary-500);
  font-size: 0.875rem;
}

.csv-template-link {
  color: var(--primary-600);
  text-decoration: underline;
  cursor: pointer;
}

.csv-template-link:hover {
  color: var(--primary-800);
}

.upload-progress {
  margin-top: 16px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--secondary-200);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  transition: width 0.3s ease;
}

.upload-results {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
}

.upload-results.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.upload-results.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}
```

#### Assignment Status Table
```css
.assignment-status-table {
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  background: var(--secondary-50);
  padding: 16px 24px;
  border-bottom: 1px solid var(--secondary-200);
}

.table-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--secondary-800);
}

.table-filters {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.filter-select {
  min-width: 140px;
}

.assignment-table {
  width: 100%;
  border-collapse: collapse;
}

.assignment-table th {
  background: var(--secondary-50);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--secondary-700);
  border-bottom: 1px solid var(--secondary-200);
}

.assignment-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--secondary-100);
  vertical-align: middle;
}

.assignment-table tr:hover {
  background: var(--secondary-50);
}

.table-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button.view {
  background: var(--primary-100);
  color: var(--primary-700);
}

.action-button.remind {
  background: var(--warning);
  color: white;
}

.action-button.delete {
  background: var(--danger);
  color: white;
}
```

### My Assignments Dashboard

#### Dashboard Grid Layout
```css
.my-assignments-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.my-assignments-header {
  margin-bottom: 32px;
}

.my-assignments-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--secondary-800);
  margin-bottom: 8px;
}

.my-assignments-subtitle {
  color: var(--secondary-600);
  font-size: 1.125rem;
}

.assignments-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.summary-card {
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.summary-number {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.summary-number.pending { color: var(--warning); }
.summary-number.in-progress { color: var(--info); }
.summary-number.completed { color: var(--success); }

.summary-label {
  color: var(--secondary-600);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.assignments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.assignments-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--secondary-800);
}

.section-count {
  background: var(--secondary-100);
  color: var(--secondary-600);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}
```

### Survey Components

#### Survey Container
```css
.survey-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.survey-header {
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  text-align: center;
}

.survey-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--secondary-800);
  margin-bottom: 8px;
}

.survey-evaluatee {
  font-size: 1.25rem;
  color: var(--primary-600);
  margin-bottom: 16px;
}

.survey-description {
  color: var(--secondary-600);
  line-height: 1.6;
}

.survey-content {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 12px;
  padding: 32px;
}
```

#### Survey Progress Indicator
```css
.survey-progress {
  margin-bottom: 32px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--secondary-700);
}

.progress-percentage {
  font-size: 0.875rem;
  color: var(--secondary-600);
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: var(--secondary-200);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.75rem;
  color: var(--secondary-500);
}

.progress-step.active {
  color: var(--primary-600);
  font-weight: 500;
}

.progress-step.completed {
  color: var(--success);
}

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--secondary-300);
  background: var(--bg-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-circle.active {
  border-color: var(--primary-500);
  background: var(--primary-500);
  color: white;
}

.step-circle.completed {
  border-color: var(--success);
  background: var(--success);
  color: white;
}
```

#### Attribute Rating Component
```css
.attribute-rating {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.attribute-header {
  margin-bottom: 20px;
}

.attribute-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--secondary-800);
  margin-bottom: 8px;
}

.attribute-description {
  color: var(--secondary-600);
  font-size: 0.875rem;
  line-height: 1.5;
}

.rating-scale {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.rating-button {
  width: 48px;
  height: 48px;
  border: 2px solid var(--secondary-300);
  border-radius: 50%;
  background: var(--bg-primary);
  color: var(--secondary-600);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rating-button:hover {
  border-color: var(--primary-400);
  background: var(--primary-50);
  color: var(--primary-600);
}

.rating-button.selected {
  border-color: var(--primary-500);
  background: var(--primary-500);
  color: white;
  transform: scale(1.1);
}

.rating-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--secondary-500);
  margin-bottom: 16px;
}

.rating-feedback {
  padding: 16px;
  background: var(--primary-50);
  border-radius: 6px;
  border-left: 4px solid var(--primary-500);
  font-size: 0.875rem;
  color: var(--secondary-700);
}
```

#### Conditional Question Component
```css
.conditional-question {
  margin-top: 20px;
  padding: 20px;
  background: var(--bg-primary);
  border: 1px solid var(--secondary-200);
  border-radius: 8px;
  border-left: 4px solid var(--primary-500);
}

.question-header {
  margin-bottom: 16px;
}

.question-text {
  font-weight: 500;
  color: var(--secondary-800);
  margin-bottom: 8px;
}

.question-context {
  font-size: 0.875rem;
  color: var(--secondary-600);
  font-style: italic;
}

.question-input {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid var(--secondary-300);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
}

.question-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.question-types {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.question-type-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.question-type-badge.improvement {
  background: #fef3c7;
  color: #92400e;
}

.question-type-badge.standard {
  background: var(--primary-100);
  color: var(--primary-700);
}

.question-type-badge.advanced {
  background: #dcfce7;
  color: #166534;
}
```

#### Question Group Component
```css
.question-group {
  margin-bottom: 40px;
}

.group-header {
  margin-bottom: 24px;
  text-align: center;
}

.group-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--secondary-800);
  margin-bottom: 8px;
}

.group-description {
  color: var(--secondary-600);
  line-height: 1.6;
}

.group-progress {
  background: var(--secondary-100);
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--secondary-600);
  text-align: center;
  margin-bottom: 24px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
```

#### Survey Navigation
```css
.survey-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--secondary-200);
}

.nav-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.nav-button.secondary {
  background: var(--bg-primary);
  color: var(--secondary-700);
  border: 1px solid var(--secondary-300);
}

.nav-button.secondary:hover {
  background: var(--secondary-50);
  border-color: var(--secondary-400);
}

.nav-button.primary {
  background: var(--primary-600);
  color: white;
}

.nav-button.primary:hover {
  background: var(--primary-700);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.nav-step-info {
  font-size: 0.875rem;
  color: var(--secondary-600);
}

.nav-save-status {
  font-size: 0.75rem;
  color: var(--success);
  display: flex;
  align-items: center;
  gap: 4px;
}
```

### Responsive Design for Survey System

#### Mobile Optimizations
```css
@media (max-width: 767px) {
  .assignment-dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .assignment-sidebar {
    order: -1;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .assignments-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .assignments-grid {
    grid-template-columns: 1fr;
  }
  
  .rating-scale {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .rating-button {
    width: 40px;
    height: 40px;
    font-size: 0.875rem;
  }
  
  .survey-navigation {
    flex-direction: column;
    gap: 16px;
  }
  
  .nav-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .assignment-card {
    padding: 16px;
  }
  
  .survey-content {
    padding: 20px;
  }
  
  .attribute-rating {
    padding: 16px;
  }
  
  .rating-scale {
    justify-content: center;
    gap: 6px;
  }
  
  .rating-button {
    width: 36px;
    height: 36px;
    font-size: 0.75rem;
  }
}
```

#### Tablet Optimizations
```css
@media (min-width: 768px) and (max-width: 1023px) {
  .assignment-dashboard-grid {
    grid-template-columns: 1fr 280px;
    gap: 24px;
  }
  
  .assignments-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .assignments-summary {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Accessibility Features for Survey System

#### Focus Management
```css
.survey-container:focus-within .question-input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.rating-button:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.assignment-card:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

#### ARIA Labels and Screen Reader Support
```html
<!-- Assignment Card Accessibility -->
<div class="assignment-card self-evaluation" 
     role="button" 
     tabindex="0"
     aria-label="Self evaluation for John Doe, Q2 2025, Status: Pending"
     aria-describedby="assignment-details-1">
  <div id="assignment-details-1" class="sr-only">
    Complete your self-evaluation for Q2 2025. Due date: March 15, 2025.
  </div>
</div>

<!-- Rating Scale Accessibility -->
<fieldset class="rating-scale" aria-labelledby="attribute-title">
  <legend id="attribute-title">Communication - Rate from 1 to 10</legend>
  <button class="rating-button" 
          aria-label="Rate 1 out of 10 for Communication"
          aria-pressed="false">1</button>
  <!-- ... more rating buttons -->
</fieldset>

<!-- Survey Progress Accessibility -->
<div class="survey-progress" 
     role="progressbar" 
     aria-valuenow="60" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Survey completion progress">
  <span class="sr-only">60% complete</span>
</div>
```

#### Keyboard Navigation Support
```css
.survey-container {
  /* Ensure logical tab order */
}

.rating-button {
  /* Arrow key navigation within rating scale */
}

.survey-navigation .nav-button:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Skip link for survey sections */
.survey-skip-link {
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

.survey-skip-link:focus {
  top: 6px;
}
```

---

This comprehensive UI/UX documentation provides the foundation for creating a consistent, accessible, and user-friendly A-Player Evaluations Dashboard that effectively presents complex evaluation data in an intuitive interface. The recent enhancements focus on improved authentication flow, better data visualization, enhanced user feedback throughout the application, and the complete Survey Assignment System with role-based assignment management and custom React survey components.
