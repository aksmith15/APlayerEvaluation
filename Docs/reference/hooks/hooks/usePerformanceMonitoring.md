# usePerformanceMonitoring

React hook providing comprehensive performance monitoring capabilities including Core Web Vitals tracking and component-level performance insights.

## Purpose

`usePerformanceMonitoring` provides an easy-to-use interface for performance tracking in React components. It integrates with the global performance monitoring system to collect Core Web Vitals, measure component render times, track async operations, and provide actionable performance insights with alerts and recommendations.

## Signature

```typescript
function usePerformanceMonitoring(
  options: UsePerformanceMonitoringOptions = {}
): PerformanceHookReturn
```

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `UsePerformanceMonitoringOptions` | No | Configuration options for performance monitoring behavior |

### UsePerformanceMonitoringOptions

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `enabled` | `boolean` | No | `true` | Whether performance monitoring is active |
| `componentName` | `string` | No | `'UnknownComponent'` | Name used for identifying component in metrics |
| `trackRenders` | `boolean` | No | `false` | Whether to track individual render performance |
| `trackEffects` | `boolean` | No | `false` | Whether to track component mount/unmount timing |

## Returns

| Name | Type | Description |
|------|------|-------------|
| `coreWebVitals` | `CoreWebVitals` | Current Core Web Vitals metrics (LCP, FID, CLS, etc.) |
| `customMetrics` | `CustomMetrics` | Application-specific performance metrics |
| `measureRender` | `<T>(operation: () => T, operationName?: string) => T` | Function to measure synchronous operations |
| `measureAsync` | `<T>(operation: () => Promise<T>, operationName?: string) => Promise<T>` | Function to measure async operations |
| `trackComponentMount` | `() => void` | Manually track component mount performance |
| `trackComponentUpdate` | `() => void` | Manually track component update performance |
| `getPerformanceInsights` | `() => PerformanceInsights` | Get component-specific performance analysis and recommendations |

### PerformanceInsights

| Name | Type | Description |
|------|------|-------------|
| `renderCount` | `number` | Total number of renders for this component |
| `averageRenderTime` | `number` | Average render time in milliseconds |
| `alerts` | `string[]` | Performance alerts for this component |
| `recommendations` | `string[]` | Performance improvement recommendations |

## Usage Example

```typescript
// Basic performance monitoring
const {
  coreWebVitals,
  measureRender,
  measureAsync,
  getPerformanceInsights
} = usePerformanceMonitoring({
  componentName: 'EmployeeAnalytics',
  trackRenders: true,
  trackEffects: true
});

// Measure synchronous operations
const processedData = measureRender(() => {
  return complexDataProcessing(rawData);
}, 'dataProcessing');

// Measure async operations
const apiData = await measureAsync(async () => {
  return await fetchEmployeeData(employeeId);
}, 'fetchEmployeeData');

// Get component insights
const insights = getPerformanceInsights();
if (insights.alerts.length > 0) {
  console.warn('Performance alerts:', insights.alerts);
}

// Display Core Web Vitals
console.log('LCP:', coreWebVitals.LCP);
console.log('FID:', coreWebVitals.FID);
console.log('CLS:', coreWebVitals.CLS);
```

## Behavior & Side Effects

### Performance Monitoring
- **Core Web Vitals Collection**: Automatically collects LCP, FID, CLS, and other standard metrics
- **Custom Metrics**: Tracks application-specific performance metrics
- **Render Tracking**: When enabled, measures component render times and counts
- **Mount/Update Tracking**: Tracks component lifecycle performance

### Memory Management
- **Render Time Buffer**: Keeps only the last 10 render times in memory
- **Automatic Cleanup**: Clears performance monitoring references on unmount
- **Efficient Storage**: Uses refs to avoid triggering re-renders during measurement

### Event Integration
- **Global Performance Monitor**: Integrates with the global performance monitoring system
- **Conditional Initialization**: Only initializes performance monitoring if not already active
- **Environment Awareness**: Adjusts sampling rates based on development vs production

## Error & Retry Strategy

### Error Handling
- **Graceful Degradation**: Performance monitoring failures don't affect component functionality
- **Safe Fallbacks**: Returns empty objects/default values if monitoring is unavailable
- **Development vs Production**: More verbose error reporting in development mode

### Performance Thresholds
- **Render Time Alerts**: Warns when average render time exceeds 16ms (60fps threshold)
- **Render Count Alerts**: Warns when component re-renders excessively (>10 times)
- **Automatic Recommendations**: Provides actionable performance improvement suggestions

## Performance Notes

### Overhead Minimization
- **Conditional Execution**: All performance measurement respects the `enabled` flag
- **Lazy Initialization**: Performance monitor only initializes when first needed
- **Efficient Measurement**: Uses high-resolution `performance.now()` API
- **Memory Efficient**: Maintains minimal memory footprint with circular buffers

### Integration with Global Monitoring
```typescript
// Automatic integration with global performance system
const monitor = getPerformanceMonitor();
if (monitor) {
  monitor.measureChartRender(`${componentName}-Mount`, () => mountDuration);
}
```

## Dependencies

### Service Dependencies
- **`getPerformanceMonitor`** (from `../services/performanceMonitor`)
  - Global performance monitoring system
  - Core Web Vitals collection
  - Custom metrics management

- **`initializePerformanceMonitoring`** (from `../services/performanceMonitor`)
  - One-time performance system initialization
  - Configuration of sampling rates and debug mode

- **`measureChartRender`** and **`measureAsyncOperation`** (from `../services/performanceMonitor`)
  - Standardized measurement functions
  - Consistent metric collection format

### React Dependencies
- **`useEffect`**: Managing lifecycle and initialization
- **`useCallback`**: Memoizing measurement functions
- **`useRef`**: Storing performance metrics without triggering re-renders

### Type Dependencies
- **`CoreWebVitals`**: Standard web performance metrics interface
- **`CustomMetrics`**: Application-specific metrics interface

## useChartPerformance

The file also exports `useChartPerformance` for specialized chart component monitoring:

```typescript
export const useChartPerformance = (chartName: string, enabled: boolean = true)
```

**Features:**
- **Chart-Specific Metrics**: Tracks render times specific to chart components
- **Performant Threshold**: Considers <100ms as performant for charts
- **Automatic Integration**: Connects with global performance monitoring system
- **Memory Efficient**: Keeps only last 5 measurements per chart

### Usage Example
```typescript
const { measureChartOperation, getChartMetrics } = useChartPerformance('RadarChart');

const renderChart = () => {
  return measureChartOperation(() => (
    <ResponsiveRadarChart data={chartData} />
  ));
};

const metrics = getChartMetrics();
console.log(`${metrics.chartName} renders in ${metrics.averageRenderTime}ms`);
```

---

**📁 File Location:** `a-player-dashboard/src/hooks/usePerformanceMonitoring.ts`  
**🔗 Related:** [useDataFetch](./useDataFetch.md), [Performance Context](../contexts/PerformanceContext.md)