/**
 * Performance Monitoring React Hook
 * Provides easy access to performance monitoring capabilities in React components
 */

import { useEffect, useCallback, useRef } from 'react';
import { 
  getPerformanceMonitor, 
  initializePerformanceMonitoring,
  measureChartRender,
  measureAsyncOperation,
  type CoreWebVitals,
  type CustomMetrics
} from '../services/performanceMonitor';

interface UsePerformanceMonitoringOptions {
  enabled?: boolean;
  componentName?: string;
  trackRenders?: boolean;
  trackEffects?: boolean;
}

interface PerformanceHookReturn {
  // Core Web Vitals
  coreWebVitals: CoreWebVitals;
  customMetrics: CustomMetrics;
  
  // Measurement functions
  measureRender: <T>(operation: () => T, operationName?: string) => T;
  measureAsync: <T>(operation: () => Promise<T>, operationName?: string) => Promise<T>;
  
  // Component performance tracking
  trackComponentMount: () => void;
  trackComponentUpdate: () => void;
  
  // Performance insights
  getPerformanceInsights: () => {
    renderCount: number;
    averageRenderTime: number;
    alerts: string[];
    recommendations: string[];
  };
}

export const usePerformanceMonitoring = (
  options: UsePerformanceMonitoringOptions = {}
): PerformanceHookReturn => {
  const {
    enabled = true,
    componentName = 'UnknownComponent',
    trackRenders = false,
    trackEffects = false
  } = options;
  
  const renderTimesRef = useRef<number[]>([]);
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number | null>(null);
  
  // Initialize performance monitoring on first use
  useEffect(() => {
    if (enabled && !getPerformanceMonitor()) {
      initializePerformanceMonitoring({
        enableCoreWebVitals: true,
        enableCustomMetrics: true,
        sampleRate: process.env.NODE_ENV === 'development' ? 1 : 0.1,
        debugMode: process.env.NODE_ENV === 'development'
      });
    }
  }, [enabled]);
  
  // Track component mount performance
  useEffect(() => {
    if (enabled && trackEffects) {
      mountTimeRef.current = performance.now();
      
      return () => {
        if (mountTimeRef.current) {
          const mountDuration = performance.now() - mountTimeRef.current;
          const monitor = getPerformanceMonitor();
          if (monitor) {
            monitor.measureChartRender(`${componentName}-Mount`, () => mountDuration);
          }
        }
      };
    }
  }, [enabled, trackEffects, componentName]);
  
  // Track renders if enabled
  useEffect(() => {
    if (enabled && trackRenders) {
      const renderStart = performance.now();
      renderCountRef.current += 1;
      
      // Measure render time in next tick
      setTimeout(() => {
        const renderTime = performance.now() - renderStart;
        renderTimesRef.current.push(renderTime);
        
        // Keep only last 10 render times
        if (renderTimesRef.current.length > 10) {
          renderTimesRef.current = renderTimesRef.current.slice(-10);
        }
      }, 0);
    }
  });
  
  // Measurement functions
  const measureRender = useCallback(<T>(
    operation: () => T, 
    operationName?: string
  ): T => {
    if (!enabled) return operation();
    
    const opName = operationName || `${componentName}-Operation`;
    return measureChartRender(opName, operation);
  }, [enabled, componentName]);
  
  const measureAsync = useCallback(async <T>(
    operation: () => Promise<T>, 
    operationName?: string
  ): Promise<T> => {
    if (!enabled) return operation();
    
    const opName = operationName || `${componentName}-AsyncOperation`;
    return measureAsyncOperation(opName, operation);
  }, [enabled, componentName]);
  
  // Component tracking functions
  const trackComponentMount = useCallback(() => {
    if (enabled) {
      const monitor = getPerformanceMonitor();
      if (monitor) {
        monitor.measureChartRender(`${componentName}-Mount`, () => 0);
      }
    }
  }, [enabled, componentName]);
  
  const trackComponentUpdate = useCallback(() => {
    if (enabled) {
      renderCountRef.current += 1;
      const monitor = getPerformanceMonitor();
      if (monitor) {
        monitor.measureChartRender(`${componentName}-Update`, () => 0);
      }
    }
  }, [enabled, componentName]);
  
  // Performance insights
  const getPerformanceInsights = useCallback(() => {
    const renderTimes = renderTimesRef.current;
    const renderCount = renderCountRef.current;
    const averageRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
      : 0;
    
    const alerts: string[] = [];
    const recommendations: string[] = [];
    
    // Component-specific performance analysis
    if (averageRenderTime > 16) {
      alerts.push(`${componentName} renders are slow (${averageRenderTime.toFixed(1)}ms avg)`);
      recommendations.push('Consider memoization with React.memo or useMemo');
    }
    
    if (renderCount > 10) {
      alerts.push(`${componentName} has re-rendered ${renderCount} times`);
      recommendations.push('Check dependencies in useEffect and useCallback hooks');
    }
    
    // Add global performance alerts
    const monitor = getPerformanceMonitor();
    if (monitor) {
      const globalInsights = monitor.checkPerformanceThresholds();
      alerts.push(...globalInsights.alerts);
      recommendations.push(...globalInsights.recommendations);
    }
    
    return {
      renderCount,
      averageRenderTime,
      alerts,
      recommendations
    };
  }, [componentName]);
  
  // Get current metrics
  const monitor = getPerformanceMonitor();
  const coreWebVitals = monitor?.getCoreWebVitals() || {};
  const customMetrics = monitor?.getCustomMetrics() || {};
  
  return {
    coreWebVitals,
    customMetrics,
    measureRender,
    measureAsync,
    trackComponentMount,
    trackComponentUpdate,
    getPerformanceInsights
  };
};

// Hook for monitoring specific chart components
export const useChartPerformance = (chartName: string, enabled: boolean = true) => {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  
  const measureChartOperation = useCallback(<T>(operation: () => T): T => {
    if (!enabled) return operation();
    
    const startTime = performance.now();
    const result = operation();
    const renderTime = performance.now() - startTime;
    
    renderCountRef.current += 1;
    renderTimesRef.current.push(renderTime);
    
    // Keep only last 5 measurements
    if (renderTimesRef.current.length > 5) {
      renderTimesRef.current = renderTimesRef.current.slice(-5);
    }
    
    // Use global performance monitor if available
    const monitor = getPerformanceMonitor();
    if (monitor) {
      monitor.measureChartRender(chartName, () => result);
    }
    
    return result;
  }, [enabled, chartName]);
  
  const getChartMetrics = useCallback(() => {
    const renderTimes = renderTimesRef.current;
    const avgRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
      : 0;
    
    return {
      chartName,
      renderCount: renderCountRef.current,
      averageRenderTime: avgRenderTime,
      lastRenderTime: renderTimes[renderTimes.length - 1] || 0,
      isPerformant: avgRenderTime < 100 // Consider < 100ms as performant
    };
  }, [chartName]);
  
  return {
    measureChartOperation,
    getChartMetrics
  };
};

export default usePerformanceMonitoring;
