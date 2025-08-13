/**
 * Chart Loader Service
 * 
 * Provides optimized dynamic loading for chart components with caching.
 * This service ensures chart components are loaded efficiently and cached
 * for subsequent usage, reducing redundant network requests.
 */

// Cache for loaded chart components
const chartComponentCache = new Map<string, Promise<React.ComponentType<any>>>();

export type ChartType = 'radar' | 'clustered-bar' | 'trend-line' | 'historical-bar';

/**
 * Dynamically loads and caches chart components
 */
export const loadChartComponent = async (chartType: ChartType): Promise<React.ComponentType<any>> => {
  // Check cache first
  if (chartComponentCache.has(chartType)) {
    return chartComponentCache.get(chartType)!;
  }

  // Create the loading promise
  const loadingPromise = (async () => {
    switch (chartType) {
      case 'radar':
        const { RadarChart } = await import('../components/ui/RadarChart');
        return RadarChart;
      case 'clustered-bar':
        const { ClusteredBarChart } = await import('../components/ui/ClusteredBarChart');
        return ClusteredBarChart;
      case 'trend-line':
        const { TrendLineChart } = await import('../components/ui/TrendLineChart');
        return TrendLineChart;
      case 'historical-bar':
        const { HistoricalClusteredBarChart } = await import('../components/ui/HistoricalClusteredBarChart');
        return HistoricalClusteredBarChart;
      default:
        throw new Error(`Unknown chart type: ${chartType}`);
    }
  })();

  // Cache the promise
  chartComponentCache.set(chartType, loadingPromise);
  
  return loadingPromise;
};

/**
 * Preloads chart components for better UX
 */
export const preloadChartComponents = (chartTypes: ChartType[]): Promise<void[]> => {
  return Promise.all(
    chartTypes.map(async (chartType) => {
      try {
        await loadChartComponent(chartType);
      } catch (error) {
        console.warn(`Failed to preload chart component: ${chartType}`, error);
      }
    })
  );
};

/**
 * Clears the chart component cache (useful for testing or memory management)
 */
export const clearChartCache = (): void => {
  chartComponentCache.clear();
};

/**
 * Gets cache status information
 */
export const getChartCacheInfo = () => ({
  size: chartComponentCache.size,
  cachedTypes: Array.from(chartComponentCache.keys()),
});
