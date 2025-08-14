/**
 * withLoadingState HOC Tests
 * Tests for the loading state higher-order component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { withLoadingState, useLoadingState, createSkeletonLoader } from '../withLoadingState';

// Test component to wrap with HOC
const TestComponent = ({ message }: { message: string }) => (
  <div data-testid="test-component">{message}</div>
);

// Test component using the hook
const HookTestComponent = ({ 
  loading, 
  error, 
  onRetry 
}: { 
  loading: boolean; 
  error: string | null; 
  onRetry?: () => void; 
}) => {
  const { isLoading, hasError, renderLoadingState, shouldRenderContent } = useLoadingState({
    loading,
    error,
    loadingMessage: 'Loading data...',
    onRetry
  });

  if (renderLoadingState()) {
    return renderLoadingState();
  }

  if (shouldRenderContent) {
    return <div data-testid="hook-content">Content loaded</div>;
  }

  return null;
};

describe('withLoadingState HOC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders wrapped component when not loading and no error', () => {
    const WrappedComponent = withLoadingState(TestComponent);

    render(
      <WrappedComponent 
        message="Hello World" 
        loading={false} 
        error={null}
      />
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    const WrappedComponent = withLoadingState(TestComponent);

    render(
      <WrappedComponent 
        message="Hello World" 
        loading={true} 
        error={null}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
  });

  it('shows error message when error is present', () => {
    const WrappedComponent = withLoadingState(TestComponent);

    render(
      <WrappedComponent 
        message="Hello World" 
        loading={false} 
        error="Something went wrong"
      />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetryMock = vi.fn();
    const WrappedComponent = withLoadingState(TestComponent, {
      showRetryButton: true
    });

    render(
      <WrappedComponent 
        message="Hello World" 
        loading={false} 
        error="Network error"
        onRetry={onRetryMock}
      />
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it('uses custom loading message', () => {
    const WrappedComponent = withLoadingState(TestComponent);

    render(
      <WrappedComponent 
        message="Hello World" 
        loading={true} 
        error={null}
        loadingMessage="Fetching data..."
      />
    );

    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('renders skeleton loader when provided', () => {
    const SkeletonLoader = createSkeletonLoader(3);
    const WrappedComponent = withLoadingState(TestComponent);

    render(
      <WrappedComponent 
        message="Hello World" 
        loading={true} 
        error={null}
        skeleton={SkeletonLoader}
      />
    );

    // Should render skeleton instead of loading spinner
    expect(screen.getByTestId('skeleton-loader') || document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('respects minimum loading time', async () => {
    const WrappedComponent = withLoadingState(TestComponent);

    const { rerender } = render(
      <WrappedComponent 
        message="Hello World" 
        loading={true} 
        error={null}
        minimumLoadingTime={500}
      />
    );

    // Should show loading
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Stop loading immediately
    rerender(
      <WrappedComponent 
        message="Hello World" 
        loading={false} 
        error={null}
        minimumLoadingTime={500}
      />
    );

    // Should still show loading due to minimum time
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // After minimum time, should show content
    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    }, { timeout: 600 });
  });

  it('applies custom options from HOC factory', () => {
    const WrappedComponent = withLoadingState(TestComponent, {
      defaultLoadingMessage: 'Custom loading...',
      showRetryButton: false
    });

    render(
      <WrappedComponent 
        message="Hello World" 
        loading={true} 
        error={null}
      />
    );

    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
  });

  it('preserves component display name', () => {
    const WrappedComponent = withLoadingState(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('withLoadingState(TestComponent)');
  });
});

describe('useLoadingState hook', () => {
  it('returns correct loading state', () => {
    render(
      <HookTestComponent 
        loading={true} 
        error={null}
      />
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('returns correct error state', () => {
    const onRetryMock = vi.fn();
    
    render(
      <HookTestComponent 
        loading={false} 
        error="Test error"
        onRetry={onRetryMock}
      />
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it('returns content when no loading or error', () => {
    render(
      <HookTestComponent 
        loading={false} 
        error={null}
      />
    );

    expect(screen.getByTestId('hook-content')).toBeInTheDocument();
    expect(screen.getByText('Content loaded')).toBeInTheDocument();
  });
});

describe('createSkeletonLoader utility', () => {
  it('creates skeleton loader with correct number of rows', () => {
    const SkeletonLoader = createSkeletonLoader(5, 'h-6', 'custom-class');
    
    render(<SkeletonLoader />);
    
    const skeletonRows = document.querySelectorAll('.bg-secondary-200');
    expect(skeletonRows).toHaveLength(5);
  });

  it('applies custom classes', () => {
    const SkeletonLoader = createSkeletonLoader(2, 'h-4', 'test-skeleton');
    
    render(<SkeletonLoader />);
    
    expect(document.querySelector('.test-skeleton')).toBeInTheDocument();
  });
});

describe('specialized HOCs', () => {
  it('withChartLoading applies chart-specific defaults', () => {
    const { withChartLoading } = require('../withLoadingState');
    const WrappedComponent = withChartLoading(TestComponent);

    render(
      <WrappedComponent 
        message="Chart" 
        loading={true} 
        error={null}
      />
    );

    expect(screen.getByText(/loading chart data/i)).toBeInTheDocument();
  });

  it('withFormLoading applies form-specific defaults', () => {
    const { withFormLoading } = require('../withLoadingState');
    const WrappedComponent = withFormLoading(TestComponent);

    render(
      <WrappedComponent 
        message="Form" 
        loading={true} 
        error={null}
      />
    );

    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });
});


