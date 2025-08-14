/**
 * PerformanceContext Tests
 * Tests for the performance monitoring context provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerformanceProvider, usePerformance, useComponentPerformance } from '../PerformanceContext';

// Test components to use the context
const PerformanceStatusComponent = () => {
  const { state } = usePerformance();
  
  return (
    <div>
      <div data-testid="monitoring-status">
        {state.isMonitoring ? 'monitoring' : 'not monitoring'}
      </div>
      <div data-testid="metrics-count">{state.metrics.length}</div>
      <div data-testid="total-metrics">{state.totalMetrics}</div>
    </div>
  );
};

const PerformanceActionsComponent = () => {
  const { actions } = usePerformance();
  
  return (
    <div>
      <button onClick={actions.startMonitoring} data-testid="start-button">
        Start Monitoring
      </button>
      <button onClick={actions.stopMonitoring} data-testid="stop-button">
        Stop Monitoring
      </button>
      <button onClick={actions.clearMetrics} data-testid="clear-button">
        Clear Metrics
      </button>
      <button 
        onClick={() => actions.recordMetric({
          componentName: 'TestComponent',
          operationType: 'render',
          duration: 25.5
        })} 
        data-testid="record-button"
      >
        Record Metric
      </button>
    </div>
  );
};

const ComponentPerformanceComponent = () => {
  const { 
    measureRender, 
    measureDataFetch, 
    averageRenderTime, 
    isMonitoring 
  } = useComponentPerformance('TestComponent');
  
  const handleMeasureRender = () => {
    measureRender(() => {
      // Simulate render work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }
    });
  };

  const handleMeasureDataFetch = async () => {
    await measureDataFetch(async () => {
      return new Promise(resolve => setTimeout(resolve, 50));
    });
  };

  return (
    <div>
      <div data-testid="component-monitoring">
        {isMonitoring ? 'monitoring' : 'not monitoring'}
      </div>
      <div data-testid="average-render-time">{averageRenderTime.toFixed(2)}</div>
      <button onClick={handleMeasureRender} data-testid="measure-render">
        Measure Render
      </button>
      <button onClick={handleMeasureDataFetch} data-testid="measure-fetch">
        Measure Fetch
      </button>
    </div>
  );
};

describe('PerformanceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  it('provides initial performance state', () => {
    render(
      <PerformanceProvider>
        <PerformanceStatusComponent />
      </PerformanceProvider>
    );

    expect(screen.getByTestId('monitoring-status')).toHaveTextContent('monitoring');
    expect(screen.getByTestId('metrics-count')).toHaveTextContent('0');
    expect(screen.getByTestId('total-metrics')).toHaveTextContent('0');
  });

  it('allows starting and stopping monitoring', async () => {
    render(
      <PerformanceProvider>
        <PerformanceStatusComponent />
        <PerformanceActionsComponent />
      </PerformanceProvider>
    );

    const statusElement = screen.getByTestId('monitoring-status');
    const stopButton = screen.getByTestId('stop-button');
    const startButton = screen.getByTestId('start-button');

    // Stop monitoring
    fireEvent.click(stopButton);
    await waitFor(() => {
      expect(statusElement).toHaveTextContent('not monitoring');
    });

    // Start monitoring
    fireEvent.click(startButton);
    await waitFor(() => {
      expect(statusElement).toHaveTextContent('monitoring');
    });
  });

  it('records performance metrics', async () => {
    render(
      <PerformanceProvider>
        <PerformanceStatusComponent />
        <PerformanceActionsComponent />
      </PerformanceProvider>
    );

    const metricsCount = screen.getByTestId('metrics-count');
    const totalMetrics = screen.getByTestId('total-metrics');
    const recordButton = screen.getByTestId('record-button');

    fireEvent.click(recordButton);

    await waitFor(() => {
      expect(metricsCount).toHaveTextContent('1');
      expect(totalMetrics).toHaveTextContent('1');
    });
  });

  it('clears metrics when requested', async () => {
    render(
      <PerformanceProvider>
        <PerformanceStatusComponent />
        <PerformanceActionsComponent />
      </PerformanceProvider>
    );

    const metricsCount = screen.getByTestId('metrics-count');
    const totalMetrics = screen.getByTestId('total-metrics');
    const recordButton = screen.getByTestId('record-button');
    const clearButton = screen.getByTestId('clear-button');

    // Record a metric
    fireEvent.click(recordButton);
    await waitFor(() => {
      expect(metricsCount).toHaveTextContent('1');
    });

    // Clear metrics
    fireEvent.click(clearButton);
    await waitFor(() => {
      expect(metricsCount).toHaveTextContent('0');
      expect(totalMetrics).toHaveTextContent('0');
    });
  });

  it('respects max metrics limit', async () => {
    render(
      <PerformanceProvider maxMetrics={2}>
        <PerformanceStatusComponent />
        <PerformanceActionsComponent />
      </PerformanceProvider>
    );

    const metricsCount = screen.getByTestId('metrics-count');
    const recordButton = screen.getByTestId('record-button');

    // Record 3 metrics
    fireEvent.click(recordButton);
    fireEvent.click(recordButton);
    fireEvent.click(recordButton);

    await waitFor(() => {
      // Should only keep the last 2 metrics
      expect(metricsCount).toHaveTextContent('2');
    });
  });

  it('provides component-specific performance hooks', () => {
    render(
      <PerformanceProvider>
        <ComponentPerformanceComponent />
      </PerformanceProvider>
    );

    expect(screen.getByTestId('component-monitoring')).toHaveTextContent('monitoring');
    expect(screen.getByTestId('average-render-time')).toHaveTextContent('0.00');
  });

  it('measures render performance', async () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1025); // End time (25ms duration)

    render(
      <PerformanceProvider>
        <ComponentPerformanceComponent />
        <PerformanceStatusComponent />
      </PerformanceProvider>
    );

    const measureButton = screen.getByTestId('measure-render');
    const metricsCount = screen.getByTestId('metrics-count');

    fireEvent.click(measureButton);

    await waitFor(() => {
      expect(metricsCount).toHaveTextContent('1');
    });
  });

  it('measures data fetch performance', async () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1050); // End time (50ms duration)

    render(
      <PerformanceProvider>
        <ComponentPerformanceComponent />
        <PerformanceStatusComponent />
      </PerformanceProvider>
    );

    const measureButton = screen.getByTestId('measure-fetch');
    const metricsCount = screen.getByTestId('metrics-count');

    fireEvent.click(measureButton);

    await waitFor(() => {
      expect(metricsCount).toHaveTextContent('1');
    });
  });

  it('calculates average render time correctly', async () => {
    // Mock performance.now to return predictable values
    let callCount = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      callCount++;
      if (callCount === 1) return 1000; // First render start
      if (callCount === 2) return 1020; // First render end (20ms)
      if (callCount === 3) return 2000; // Second render start  
      if (callCount === 4) return 2030; // Second render end (30ms)
      return 3000;
    });

    render(
      <PerformanceProvider>
        <ComponentPerformanceComponent />
      </PerformanceProvider>
    );

    const measureButton = screen.getByTestId('measure-render');
    const averageElement = screen.getByTestId('average-render-time');

    // Measure twice
    fireEvent.click(measureButton);
    fireEvent.click(measureButton);

    await waitFor(() => {
      // Average should be (20 + 30) / 2 = 25.00
      expect(averageElement).toHaveTextContent('25.00');
    });
  });

  it('does not record metrics when monitoring is disabled', async () => {
    render(
      <PerformanceProvider>
        <PerformanceStatusComponent />
        <PerformanceActionsComponent />
        <ComponentPerformanceComponent />
      </PerformanceProvider>
    );

    const stopButton = screen.getByTestId('stop-button');
    const measureButton = screen.getByTestId('measure-render');
    const metricsCount = screen.getByTestId('metrics-count');

    // Stop monitoring
    fireEvent.click(stopButton);

    // Try to record metric
    fireEvent.click(measureButton);

    await waitFor(() => {
      expect(metricsCount).toHaveTextContent('0');
    });
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<PerformanceStatusComponent />);
    }).toThrow('usePerformance must be used within a PerformanceProvider');

    consoleSpy.mockRestore();
  });

  it('logs performance metrics in development mode', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <PerformanceProvider>
        <PerformanceActionsComponent />
      </PerformanceProvider>
    );

    const recordButton = screen.getByTestId('record-button');
    fireEvent.click(recordButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚡ Performance: TestComponent.render took 25.50ms')
      );
    });

    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });
});


