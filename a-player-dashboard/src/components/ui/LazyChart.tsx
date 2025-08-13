/**
 * Lazy Chart Wrapper
 * Dynamically loads chart components to reduce initial bundle size
 */

import React, { useState, useEffect, Suspense } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';
import { loadChartComponent, type ChartType } from '../../services/chartLoader';

interface LazyChartProps {
  chartType: ChartType;
  data: any;
  className?: string;
  [key: string]: any; // Allow any other props to pass through
}

export const LazyChart: React.FC<LazyChartProps> = ({ 
  chartType, 
  data,
  className = '',
  ...props 
}) => {
  const [ChartComponent, setChartComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChart = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const Component = await loadChartComponent(chartType);
        setChartComponent(() => Component);
      } catch (err) {
        console.error(`Failed to load chart component: ${chartType}`, err);
        setError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setLoading(false);
      }
    };

    loadChart();
  }, [chartType]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <LoadingSpinner size="md" />
        <span className="ml-2 text-gray-600">Loading chart...</span>
      </div>
    );
  }

  if (error || !ChartComponent) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-sm">
            Failed to load chart component
          </div>
          {error && (
            <div className="text-gray-500 text-xs mt-1">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense 
        fallback={
          <div className={`flex items-center justify-center h-64 ${className}`}>
            <LoadingSpinner size="md" />
          </div>
        }
      >
        <ChartComponent 
          data={data}
          className={className}
          {...props}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazyChart;
