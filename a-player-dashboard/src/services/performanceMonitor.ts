/**
 * Performance Monitoring Service
 * Tracks Core Web Vitals (LCP, FID, CLS) and custom application metrics
 * Provides real-time performance insights for data-driven optimization decisions
 */

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userId?: string;
}

export interface CoreWebVitals {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
}

export interface CustomMetrics {
  chartRenderTime?: number;
  bundleLoadTime?: number;
  apiResponseTime?: number;
  pageLoadTime?: number;
  userInteractionDelay?: number;
}

// Performance monitoring configuration
interface PerformanceConfig {
  enableCoreWebVitals: boolean;
  enableCustomMetrics: boolean;
  sampleRate: number; // Percentage of sessions to monitor (0-1)
  debugMode: boolean;
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private coreWebVitals: CoreWebVitals = {};
  private customMetrics: CustomMetrics = {};
  
  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableCoreWebVitals: true,
      enableCustomMetrics: true,
      sampleRate: 0.1, // Monitor 10% of sessions by default
      debugMode: false,
      ...config
    };
    
    // Only initialize if we should monitor this session
    if (this.shouldMonitor()) {
      this.initialize();
    }
  }
  
  private shouldMonitor(): boolean {
    return Math.random() < this.config.sampleRate;
  }
  
  private initialize(): void {
    if (typeof window === 'undefined') return;
    
    this.log('🎯 Performance monitoring initialized');
    
    if (this.config.enableCoreWebVitals) {
      this.initializeCoreWebVitals();
    }
    
    if (this.config.enableCustomMetrics) {
      this.initializeCustomMetrics();
    }
  }
  
  private log(message: string, data?: any): void {
    if (this.config.debugMode) {
      console.log(`[PerformanceMonitor] ${message}`, data || '');
    }
  }
  
  // ===================================================================
  // CORE WEB VITALS MONITORING
  // ===================================================================
  
  private initializeCoreWebVitals(): void {
    // Use Web Vitals library if available, otherwise implement basic monitoring
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }
    
    // Fallback to Navigation Timing API
    this.measureNavigationTiming();
  }
  
  private setupPerformanceObserver(): void {
    try {
      // Monitor Largest Contentful Paint (LCP)
      this.observeMetric('largest-contentful-paint', (entry: any) => {
        this.coreWebVitals.LCP = entry.renderTime || entry.loadTime;
        if (this.coreWebVitals.LCP) {
          this.recordMetric('LCP', this.coreWebVitals.LCP);
        }
      });
      
      // Monitor First Input Delay (FID)
      this.observeMetric('first-input', (entry: any) => {
        this.coreWebVitals.FID = entry.processingStart - entry.startTime;
        this.recordMetric('FID', this.coreWebVitals.FID);
      });
      
      // Monitor Cumulative Layout Shift (CLS)
      this.observeMetric('layout-shift', (entry: any) => {
        if (!entry.hadRecentInput) {
          this.coreWebVitals.CLS = (this.coreWebVitals.CLS || 0) + entry.value;
          if (this.coreWebVitals.CLS !== undefined) {
            this.recordMetric('CLS', this.coreWebVitals.CLS);
          }
        }
      });
      
      // Monitor paint metrics
      this.observeMetric('paint', (entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          this.coreWebVitals.FCP = entry.startTime;
          if (this.coreWebVitals.FCP) {
            this.recordMetric('FCP', this.coreWebVitals.FCP);
          }
        }
      });
      
    } catch (error) {
      this.log('❌ Error setting up PerformanceObserver:', error);
    }
  }
  
  private observeMetric(entryType: string, callback: (entry: any) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      
      observer.observe({ entryTypes: [entryType] });
    } catch (error) {
      this.log(`❌ Error observing ${entryType}:`, error);
    }
  }
  
  private measureNavigationTiming(): void {
    // Measure Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.coreWebVitals.TTFB = navigation.responseStart - navigation.requestStart;
        this.recordMetric('TTFB', this.coreWebVitals.TTFB);
        
        // Page load time
        const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.customMetrics.pageLoadTime = pageLoadTime;
        this.recordMetric('PageLoadTime', pageLoadTime);
      }
    });
  }
  
  // ===================================================================
  // CUSTOM APPLICATION METRICS
  // ===================================================================
  
  private initializeCustomMetrics(): void {
    this.setupBundleLoadTracking();
    this.setupUserInteractionTracking();
  }
  
  private setupBundleLoadTracking(): void {
    // Track script loading times
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        if (resourceEntry.initiatorType === 'script' && resourceEntry.name.includes('assets/')) {
          const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart;
          this.recordMetric('BundleLoadTime', loadTime, {
            bundleName: resourceEntry.name.split('/').pop()
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
  
  private setupUserInteractionTracking(): void {
    let interactionStart = 0;
    
    // Track interaction delays
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionStart = performance.now();
      });
    });
    
    // Measure time to next frame after interaction
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        requestAnimationFrame(() => {
          const delay = performance.now() - interactionStart;
          if (delay > 16) { // Only record if > 1 frame
            this.customMetrics.userInteractionDelay = delay;
            this.recordMetric('UserInteractionDelay', delay);
          }
        });
      });
    });
  }
  
  // ===================================================================
  // CHART RENDERING PERFORMANCE
  // ===================================================================
  
  public measureChartRender<T>(chartName: string, renderFunction: () => T): T {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    this.customMetrics.chartRenderTime = renderTime;
    this.recordMetric('ChartRenderTime', renderTime, { chartName });
    
    this.log(`📊 Chart '${chartName}' rendered in ${renderTime.toFixed(2)}ms`);
    
    return result;
  }
  
  public async measureAsyncOperation<T>(
    operationName: string, 
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric('AsyncOperationTime', duration, { operationName });
      this.log(`⚡ ${operationName} completed in ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMetric('AsyncOperationError', duration, { operationName, error: true });
      throw error;
    }
  }
  
  // ===================================================================
  // METRIC RECORDING AND REPORTING
  // ===================================================================
  
  private recordMetric(name: string, value: number, metadata?: any): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname,
      ...metadata
    };
    
    this.metrics.push(metric);
    this.log(`📈 Recorded metric: ${name} = ${value.toFixed(2)}ms`, metadata);
    
    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }
  
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  public getCoreWebVitals(): CoreWebVitals {
    return { ...this.coreWebVitals };
  }
  
  public getCustomMetrics(): CustomMetrics {
    return { ...this.customMetrics };
  }
  
  public getPerformanceSummary(): {
    coreWebVitals: CoreWebVitals;
    customMetrics: CustomMetrics;
    averages: Record<string, number>;
  } {
    const averages: Record<string, number> = {};
    
    // Calculate averages for each metric type
    const metricGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.name]) groups[metric.name] = [];
      groups[metric.name].push(metric.value);
      return groups;
    }, {} as Record<string, number[]>);
    
    Object.entries(metricGroups).forEach(([name, values]) => {
      averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    return {
      coreWebVitals: this.getCoreWebVitals(),
      customMetrics: this.getCustomMetrics(),
      averages
    };
  }
  
  // ===================================================================
  // PERFORMANCE ALERTS
  // ===================================================================
  
  public checkPerformanceThresholds(): {
    alerts: string[];
    recommendations: string[];
  } {
    const alerts: string[] = [];
    const recommendations: string[] = [];
    
    // Core Web Vitals thresholds (Google recommendations)
    if (this.coreWebVitals.LCP && this.coreWebVitals.LCP > 2500) {
      alerts.push(`LCP is slow: ${this.coreWebVitals.LCP.toFixed(0)}ms (should be < 2500ms)`);
      recommendations.push('Optimize image loading and reduce render-blocking resources');
    }
    
    if (this.coreWebVitals.FID && this.coreWebVitals.FID > 100) {
      alerts.push(`FID is slow: ${this.coreWebVitals.FID.toFixed(0)}ms (should be < 100ms)`);
      recommendations.push('Reduce JavaScript execution time and break up long tasks');
    }
    
    if (this.coreWebVitals.CLS && this.coreWebVitals.CLS > 0.1) {
      alerts.push(`CLS is high: ${this.coreWebVitals.CLS.toFixed(3)} (should be < 0.1)`);
      recommendations.push('Add size attributes to images and avoid dynamic content injection');
    }
    
    // Custom metric thresholds
    if (this.customMetrics.chartRenderTime && this.customMetrics.chartRenderTime > 500) {
      alerts.push(`Chart rendering is slow: ${this.customMetrics.chartRenderTime.toFixed(0)}ms`);
      recommendations.push('Consider chart virtualization or data pagination');
    }
    
    return { alerts, recommendations };
  }
}

// Global performance monitor instance
let globalPerformanceMonitor: PerformanceMonitor | null = null;

export const initializePerformanceMonitoring = (config?: Partial<PerformanceConfig>): PerformanceMonitor => {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor(config);
  }
  return globalPerformanceMonitor;
};

export const getPerformanceMonitor = (): PerformanceMonitor | null => {
  return globalPerformanceMonitor;
};

// Convenience functions for common use cases
export const measureChartRender = <T>(chartName: string, renderFunction: () => T): T => {
  const monitor = getPerformanceMonitor();
  return monitor ? monitor.measureChartRender(chartName, renderFunction) : renderFunction();
};

export const measureAsyncOperation = async <T>(
  operationName: string, 
  operation: () => Promise<T>
): Promise<T> => {
  const monitor = getPerformanceMonitor();
  return monitor ? monitor.measureAsyncOperation(operationName, operation) : operation();
};

export default PerformanceMonitor;
