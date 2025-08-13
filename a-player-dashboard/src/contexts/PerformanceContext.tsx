/**
 * Performance Context
 * Provides component-level performance monitoring and metrics collection
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
// import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';

interface PerformanceMetric {
  id: string;
  componentName: string;
  operationType: 'render' | 'data_fetch' | 'user_interaction' | 'chart_render';
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceState {
  metrics: PerformanceMetric[];
  isMonitoring: boolean;
  totalMetrics: number;
}

interface PerformanceActions {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  recordMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => void;
  clearMetrics: () => void;
  getMetricsByComponent: (componentName: string) => PerformanceMetric[];
  getAverageRenderTime: (componentName?: string) => number;
}

interface PerformanceContextType {
  state: PerformanceState;
  actions: PerformanceActions;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

interface PerformanceProviderProps {
  children: React.ReactNode;
  maxMetrics?: number; // Limit stored metrics to prevent memory issues
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ 
  children, 
  maxMetrics = 1000 
}) => {
  const [performanceState, setPerformanceState] = useState<PerformanceState>({
    metrics: [],
    isMonitoring: process.env.NODE_ENV === 'development',
    totalMetrics: 0
  });

  const metricsRef = useRef<PerformanceMetric[]>([]);
  // const { performanceMonitor } = usePerformanceMonitoring();

  const actions = useCallback((): PerformanceActions => ({
    startMonitoring: () => {
      setPerformanceState(prev => ({ ...prev, isMonitoring: true }));
      console.log('🔍 Performance monitoring started');
    },

    stopMonitoring: () => {
      setPerformanceState(prev => ({ ...prev, isMonitoring: false }));
      console.log('🔍 Performance monitoring stopped');
    },

    recordMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => {
      if (!performanceState.isMonitoring) return;

      const newMetric: PerformanceMetric = {
        ...metric,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };

      // Update metrics array with size limit
      metricsRef.current = [...metricsRef.current, newMetric].slice(-maxMetrics);
      
      setPerformanceState(prev => ({
        ...prev,
        metrics: metricsRef.current,
        totalMetrics: prev.totalMetrics + 1
      }));

      // Also record to global performance monitor if available
      // if (performanceMonitor) {
      //   performanceMonitor.recordMetric({
      //     name: `${metric.componentName}.${metric.operationType}`,
      //     value: metric.duration,
      //     tags: { 
      //       component: metric.componentName, 
      //       operation: metric.operationType,
      //       ...metric.metadata 
      //     }
      //   });
      // }

      // Log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ Performance: ${metric.componentName}.${metric.operationType} took ${metric.duration.toFixed(2)}ms`);
      }
    },

    clearMetrics: () => {
      metricsRef.current = [];
      setPerformanceState(prev => ({ ...prev, metrics: [], totalMetrics: 0 }));
      console.log('🧹 Performance metrics cleared');
    },

    getMetricsByComponent: (componentName: string) => {
      return metricsRef.current.filter(metric => metric.componentName === componentName);
    },

    getAverageRenderTime: (componentName?: string) => {
      const relevantMetrics = componentName 
        ? metricsRef.current.filter(m => m.componentName === componentName && m.operationType === 'render')
        : metricsRef.current.filter(m => m.operationType === 'render');
      
      if (relevantMetrics.length === 0) return 0;
      
      const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
      return total / relevantMetrics.length;
    }
  }), [performanceState.isMonitoring, maxMetrics]);

  const value: PerformanceContextType = {
    state: performanceState,
    actions: actions()
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = (): PerformanceContextType => {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

// Convenience hooks for specific performance operations
export const useComponentPerformance = (componentName: string) => {
  const { state, actions } = usePerformance();
  
  const measureRender = useCallback((operation: () => void) => {
    const start = performance.now();
    operation();
    const duration = performance.now() - start;
    
    actions.recordMetric({
      componentName,
      operationType: 'render',
      duration
    });
  }, [componentName, actions]);

  const measureDataFetch = useCallback(async <T,>(
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      actions.recordMetric({
        componentName,
        operationType: 'data_fetch',
        duration,
        metadata: { success: true, ...metadata }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      actions.recordMetric({
        componentName,
        operationType: 'data_fetch',
        duration,
        metadata: { success: false, error: String(error), ...metadata }
      });
      
      throw error;
    }
  }, [componentName, actions]);

  const componentMetrics = actions.getMetricsByComponent(componentName);
  const averageRenderTime = actions.getAverageRenderTime(componentName);

  return {
    measureRender,
    measureDataFetch,
    metrics: componentMetrics,
    averageRenderTime,
    isMonitoring: state.isMonitoring
  };
};
