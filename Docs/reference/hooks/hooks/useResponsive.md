# useResponsive

React hook for detecting screen size and providing responsive design utilities based on Tailwind CSS breakpoints.

## Purpose

`useResponsive` provides real-time screen size information and responsive design utilities to React components. It follows Tailwind CSS breakpoint conventions and offers boolean flags for common device categories, making it easy to implement responsive layouts and conditional rendering based on screen size.

## Signature

```typescript
function useResponsive(): ScreenInfo
```

## Parameters

This hook takes no parameters.

## Returns

| Name | Type | Description |
|------|------|-------------|
| `width` | `number` | Current window width in pixels |
| `height` | `number` | Current window height in pixels |
| `isMobile` | `boolean` | True if width < 768px (below md breakpoint) |
| `isTablet` | `boolean` | True if width >= 768px and < 1024px (md to lg) |
| `isDesktop` | `boolean` | True if width >= 1024px (lg breakpoint and above) |
| `isLarge` | `boolean` | True if width >= 1280px (xl breakpoint and above) |
| `breakpoint` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | Current Tailwind CSS breakpoint name |

## Usage Example

```typescript
// Basic responsive behavior
const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();

// Conditional rendering based on screen size
if (isMobile) {
  return <MobileLayout />;
}

if (isTablet) {
  return <TabletLayout />;
}

return <DesktopLayout />;

// Responsive styling
const containerClass = isMobile 
  ? 'flex flex-col space-y-4' 
  : 'flex flex-row space-x-6';

// Responsive data display
const itemsPerRow = {
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
  '2xl': 5
}[breakpoint];

// Dynamic component props
const chartProps = {
  height: isMobile ? 300 : 500,
  showLegend: !isMobile,
  responsiveLayout: isTablet
};

return (
  <div className={containerClass}>
    <DataGrid itemsPerRow={itemsPerRow} />
    <Chart {...chartProps} />
  </div>
);
```

## Side Effects

### Event Listeners
- **Window Resize**: Attaches a `resize` event listener to track window size changes
- **Automatic Cleanup**: Removes event listener on component unmount

### State Updates
- **Real-time Updates**: Updates screen information whenever window is resized
- **Immediate Detection**: Calculates initial state on mount for SSR compatibility

## Dependencies

### Core React Hooks
- `React.useState` - Managing screen information state
- `React.useEffect` - Setting up window resize listener

### Browser APIs
- **`window.innerWidth`** - Current viewport width
- **`window.innerHeight`** - Current viewport height
- **`window.addEventListener`** - Resize event handling

## Error Handling & Retries

### SSR Compatibility
```typescript
// Fallback values for server-side rendering
if (typeof window === 'undefined') {
  return {
    width: 1024,
    height: 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLarge: false,
    breakpoint: 'lg'
  };
}
```

### Browser Support
- **Modern Browsers**: Uses standard `window.innerWidth/innerHeight`
- **Graceful Fallback**: Provides sensible defaults when window is unavailable

## Performance Notes

### Optimization Strategies
- **Single Event Listener**: Uses one resize listener regardless of hook usage count
- **Debouncing**: Resize events naturally debounced by browser
- **Minimal Calculations**: Simple arithmetic operations for breakpoint detection

### Memory Management
```typescript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  handleResize(); // Set initial state
  
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Memoization
- No memoization needed as calculations are lightweight
- State updates only occur when actual size changes

## Breakpoint Configuration

### Tailwind CSS Breakpoints
```typescript
const breakpoints = {
  sm: 640,    // Small devices
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (desktops)
  xl: 1280,   // Extra large devices
  '2xl': 1536 // 2X large devices
};
```

### Device Categories
- **Mobile**: `width < 768px` (below md)
- **Tablet**: `768px <= width < 1024px` (md to lg)
- **Desktop**: `width >= 1024px` (lg and above)
- **Large Desktop**: `width >= 1280px` (xl and above)

---

## useChartHeight

A specialized helper hook exported alongside `useResponsive` for responsive chart sizing:

```typescript
function useChartHeight(baseHeight: number = 500): number
```

### Purpose
Calculates optimal chart height based on screen size to ensure charts remain usable across all devices.

### Parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `baseHeight` | `number` | No | `500` | Base height for desktop displays |

### Returns
| Type | Description |
|------|-------------|
| `number` | Calculated height in pixels based on device type |

### Height Calculation Logic
```typescript
if (isMobile) return Math.max(300, baseHeight * 0.7);    // 70% of base, min 300px
if (isTablet) return Math.max(350, baseHeight * 0.8);    // 80% of base, min 350px
return baseHeight;                                       // Full height on desktop
```

### Usage Example
```typescript
const chartHeight = useChartHeight(600);
// Mobile: 420px (600 * 0.7)
// Tablet: 480px (600 * 0.8)  
// Desktop: 600px (full height)

return (
  <ResponsiveContainer width="100%" height={chartHeight}>
    <RadarChart data={data} />
  </ResponsiveContainer>
);
```

### Integration with Components
```typescript
// Used throughout the analytics components
// a-player-dashboard/src/pages/EmployeeAnalytics.tsx:44-48
const radarChartHeight = useChartHeight(500);
const barChartHeight = useChartHeight(500);
const trendChartHeight = useChartHeight(500);
const historicalChartHeight = useChartHeight(500);
```

---

**📁 File Location:** `a-player-dashboard/src/utils/useResponsive.ts`  
**🔗 Related:** [Chart Components](../components/), [Responsive Design Guide](../UI_UX_doc.md)
