import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Performance monitoring configuration
interface PerformanceConfig {
  enableAnalytics: boolean;
  enableWebVitals: boolean;
  enableErrorTracking: boolean;
  reportingEndpoint?: string;
  debug?: boolean;
}

// Performance metrics interface
interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToFirstByte: number;
  memoryUsage?: number;
  connectionType?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

// User interaction tracking
interface UserInteraction {
  type: 'click' | 'navigation' | 'search' | 'filter' | 'download' | 'analysis_generation';
  element?: string;
  page: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  duration?: number;
}

// Error tracking
interface ErrorEvent {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  page: string;
  userAgent: string;
  url: string;
}

// Performance monitoring class
export class PerformanceMonitor {
  private config: PerformanceConfig;
  private sessionId: string;
  private metrics: Partial<PerformanceMetrics> = {};
  private interactions: UserInteraction[] = [];
  private errors: ErrorEvent[] = [];
  private startTime: number;

  constructor(config: PerformanceConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();
    
    if (this.config.enableWebVitals) {
      this.initWebVitals();
    }
    
    if (this.config.enableErrorTracking) {
      this.initErrorTracking();
    }
    
    this.initPerformanceObserver();
    this.trackPageLoad();
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize Core Web Vitals tracking
  private initWebVitals(): void {
    const reportMetric = (metric: Metric) => {
      (this.metrics as any)[metric.name] = metric.value;
      
      if (this.config.debug) {
        console.log(`[Performance] ${metric.name}:`, metric.value, metric.rating);
      }
      
      this.reportMetric(metric);
    };

    onCLS(reportMetric);
    onINP(reportMetric);
    onFCP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);
  }

  // Initialize error tracking
  private initErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // React error boundary integration
    window.addEventListener('react-error', (event: any) => {
      this.trackError({
        message: event.detail.message,
        stack: event.detail.stack,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });
  }

  // Initialize Performance Observer for additional metrics
  private initPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.timeToInteractive = navEntry.domInteractive - navEntry.fetchStart;
            this.metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.fetchStart;
          }
        });
      });

      try {
        navObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('[Performance] Navigation timing not supported');
      }

      // Resource timing for slow resources
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 1000) { // Resources taking more than 1s
            this.trackSlowResource(entry.name, entry.duration);
          }
        });
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.warn('[Performance] Resource timing not supported');
      }
    }
  }

  // Track page load performance
  private trackPageLoad(): void {
    if (document.readyState === 'complete') {
      this.capturePageLoadMetrics();
    } else {
      window.addEventListener('load', () => this.capturePageLoadMetrics());
    }
  }

  // Capture additional page load metrics
  private capturePageLoadMetrics(): void {
    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
    }

    // Connection information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.effectiveType;
    }

    // Device type detection
    this.metrics.deviceType = this.detectDeviceType();

    // Report page load complete
    this.reportPageLoad();
  }

  // Detect device type
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  // Track user interactions
  public trackInteraction(interaction: Omit<UserInteraction, 'sessionId' | 'timestamp'>): void {
    const fullInteraction: UserInteraction = {
      ...interaction,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };

    this.interactions.push(fullInteraction);

    if (this.config.debug) {
      console.log('[Performance] User interaction:', fullInteraction);
    }

    this.reportInteraction(fullInteraction);
  }

  // Track employee search performance
  public trackSearch(query: string, resultCount: number, duration: number): void {
    this.trackInteraction({
      type: 'search',
      element: `query: ${query}, results: ${resultCount}`,
      page: window.location.pathname,
      duration
    });
  }

  // Track chart rendering performance
  public trackChartRender(chartType: string, duration: number): void {
    this.trackInteraction({
      type: 'filter',
      element: `chart: ${chartType}`,
      page: window.location.pathname,
      duration
    });
  }

  // Track AI analysis generation
  public trackAnalysisGeneration(employeeId: string, quarter: string, duration: number): void {
    this.trackInteraction({
      type: 'analysis_generation',
      element: `employee: ${employeeId}, quarter: ${quarter}`,
      page: window.location.pathname,
      duration
    });
  }

  // Track download actions
  public trackDownload(type: 'analytics' | 'report' | 'pdf', employeeId?: string): void {
    this.trackInteraction({
      type: 'download',
      element: `type: ${type}, employee: ${employeeId || 'unknown'}`,
      page: window.location.pathname
    });
  }

  // Track navigation performance
  public trackNavigation(from: string, to: string, duration: number): void {
    this.trackInteraction({
      type: 'navigation',
      element: `from: ${from}, to: ${to}`,
      page: to,
      duration
    });
  }

  // Track error events
  private trackError(error: ErrorEvent): void {
    this.errors.push(error);

    if (this.config.debug) {
      console.error('[Performance] Error tracked:', error);
    }

    this.reportError(error);
  }

  // Track slow resources
  private trackSlowResource(url: string, duration: number): void {
    if (this.config.debug) {
      console.warn(`[Performance] Slow resource: ${url} (${duration}ms)`);
    }

    this.reportSlowResource(url, duration);
  }

  // Report metrics to analytics endpoint
  private reportMetric(metric: Metric): void {
    if (!this.config.reportingEndpoint) return;

    this.sendToAnalytics('web-vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      sessionId: this.sessionId,
      page: window.location.pathname,
      timestamp: Date.now()
    });
  }

  // Report page load metrics
  private reportPageLoad(): void {
    if (!this.config.reportingEndpoint) return;

    this.sendToAnalytics('page-load', {
      metrics: this.metrics,
      sessionId: this.sessionId,
      page: window.location.pathname,
      timestamp: Date.now()
    });
  }

  // Report user interactions
  private reportInteraction(interaction: UserInteraction): void {
    if (!this.config.reportingEndpoint) return;

    this.sendToAnalytics('user-interaction', interaction);
  }

  // Report errors
  private reportError(error: ErrorEvent): void {
    if (!this.config.reportingEndpoint) return;

    this.sendToAnalytics('error', error);
  }

  // Report slow resources
  private reportSlowResource(url: string, duration: number): void {
    if (!this.config.reportingEndpoint) return;

    this.sendToAnalytics('slow-resource', {
      url,
      duration,
      sessionId: this.sessionId,
      page: window.location.pathname,
      timestamp: Date.now()
    });
  }

  // Send data to analytics endpoint
  private async sendToAnalytics(type: string, data: any): Promise<void> {
    try {
      if (this.config.reportingEndpoint) {
        await fetch(this.config.reportingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, data }),
          keepalive: true
        });
      }

      // Also log to console in debug mode
      if (this.config.debug) {
        console.log(`[Analytics] ${type}:`, data);
      }
    } catch (error) {
      console.warn('[Performance] Failed to send analytics:', error);
    }
  }

  // Get current performance summary
  public getPerformanceSummary(): {
    metrics: Partial<PerformanceMetrics>;
    interactionCount: number;
    errorCount: number;
    sessionDuration: number;
  } {
    return {
      metrics: this.metrics,
      interactionCount: this.interactions.length,
      errorCount: this.errors.length,
      sessionDuration: performance.now() - this.startTime
    };
  }

  // Export session data for debugging
  public exportSessionData(): {
    sessionId: string;
    metrics: Partial<PerformanceMetrics>;
    interactions: UserInteraction[];
    errors: ErrorEvent[];
  } {
    return {
      sessionId: this.sessionId,
      metrics: this.metrics,
      interactions: this.interactions,
      errors: this.errors
    };
  }
}

// Global performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

// Initialize performance monitoring
export function initPerformanceMonitoring(config: Partial<PerformanceConfig> = {}): PerformanceMonitor {
  const defaultConfig: PerformanceConfig = {
    enableAnalytics: true,
    enableWebVitals: true,
    enableErrorTracking: true,
    debug: import.meta.env.DEV,
    reportingEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT
  };

  const finalConfig = { ...defaultConfig, ...config };
  performanceMonitor = new PerformanceMonitor(finalConfig);
  
  if (finalConfig.debug) {
    console.log('[Performance] Monitoring initialized with config:', finalConfig);
  }

  return performanceMonitor;
}

// Get the global performance monitor instance
export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

// Convenience functions for common tracking
export const trackUserAction = (action: string, details?: string) => {
  performanceMonitor?.trackInteraction({
    type: 'click',
    element: action,
    page: window.location.pathname,
    ...(details && { element: `${action}: ${details}` })
  });
};

export const trackPageView = (page: string) => {
  performanceMonitor?.trackInteraction({
    type: 'navigation',
    page,
    element: 'page_view'
  });
};

export const trackSearch = (query: string, resultCount: number, duration: number) => {
  performanceMonitor?.trackSearch(query, resultCount, duration);
};

export const trackChartRender = (chartType: string, duration: number) => {
  performanceMonitor?.trackChartRender(chartType, duration);
};

export const trackDownload = (type: 'analytics' | 'report' | 'pdf', employeeId?: string) => {
  performanceMonitor?.trackDownload(type, employeeId);
};

export const trackAnalysisGeneration = (employeeId: string, quarter: string, duration: number) => {
  performanceMonitor?.trackAnalysisGeneration(employeeId, quarter, duration);
}; 