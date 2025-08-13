/**
 * Higher-Order Component for Loading State Management
 * Standardizes loading patterns across components
 */

import React from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorMessage } from '../ErrorMessage';

interface LoadingStateProps {
  loading?: boolean;
  error?: string | null;
  loadingMessage?: string;
  errorTitle?: string;
  showErrorDetails?: boolean;
  onRetry?: () => void;
  minimumLoadingTime?: number;
  skeleton?: React.ComponentType;
}

interface WithLoadingStateOptions {
  defaultLoadingMessage?: string;
  defaultErrorTitle?: string;
  showRetryButton?: boolean;
  loadingComponent?: React.ComponentType<{ message?: string }>;
  errorComponent?: React.ComponentType<{ 
    message: string; 
    onRetry?: () => void;
  }>;
}

// HOC that wraps a component with loading and error state management
export function withLoadingState<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithLoadingStateOptions = {}
) {
  const {
    defaultLoadingMessage = 'Loading...',
    showRetryButton = true,
    loadingComponent: CustomLoadingComponent = LoadingSpinner,
    errorComponent: CustomErrorComponent = ErrorMessage
  } = options;

  const WithLoadingStateComponent: React.FC<P & LoadingStateProps> = ({
    loading = false,
    error = null,
    loadingMessage = defaultLoadingMessage,
    onRetry,
    minimumLoadingTime = 0,
    skeleton,
    ...props
  }) => {
    const [minimumLoadingMet, setMinimumLoadingMet] = React.useState(false);

    // Handle minimum loading time
    React.useEffect(() => {
      if (loading && minimumLoadingTime > 0) {
        setMinimumLoadingMet(false);
        const timer = setTimeout(() => {
          setMinimumLoadingMet(true);
        }, minimumLoadingTime);
        return () => clearTimeout(timer);
      } else {
        setMinimumLoadingMet(true);
      }
    }, [loading, minimumLoadingTime]);

    const shouldShowLoading = loading && (minimumLoadingTime === 0 || !minimumLoadingMet);

    // Show error state
    if (error && !loading) {
      return (
        <div className="error-state-container">
          <CustomErrorComponent
            message={error}
            onRetry={showRetryButton ? onRetry : undefined}
          />
        </div>
      );
    }

    // Show loading state
    if (shouldShowLoading) {
      if (skeleton) {
        const SkeletonComponent = skeleton;
        return <SkeletonComponent />;
      }

      return (
        <div className="loading-state-container">
          <CustomLoadingComponent message={loadingMessage} />
        </div>
      );
    }

    // Show the wrapped component
    return <WrappedComponent {...(props as P)} />;
  };

  WithLoadingStateComponent.displayName = `withLoadingState(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithLoadingStateComponent;
}

// Hook-based alternative to HOC for functional components
export function useLoadingState({
  loading = false,
  error = null,
  loadingMessage = 'Loading...',
  onRetry,
  minimumLoadingTime = 0,
  skeleton
}: LoadingStateProps = {}) {
  const [minimumLoadingMet, setMinimumLoadingMet] = React.useState(false);

  React.useEffect(() => {
    if (loading && minimumLoadingTime > 0) {
      setMinimumLoadingMet(false);
      const timer = setTimeout(() => {
        setMinimumLoadingMet(true);
      }, minimumLoadingTime);
      return () => clearTimeout(timer);
    } else {
      setMinimumLoadingMet(true);
    }
  }, [loading, minimumLoadingTime]);

  const shouldShowLoading = loading && (minimumLoadingTime === 0 || !minimumLoadingMet);

  const renderLoadingState = () => {
    if (error && !loading) {
      return (
        <div className="error-state-container">
          <ErrorMessage
            message={error}
            onRetry={onRetry}
          />
        </div>
      );
    }

    if (shouldShowLoading) {
      if (skeleton) {
        const SkeletonComponent = skeleton;
        return <SkeletonComponent />;
      }

      return (
        <div className="loading-state-container">
          <LoadingSpinner message={loadingMessage} />
        </div>
      );
    }

    return null;
  };

  return {
    isLoading: shouldShowLoading,
    hasError: !!error && !loading,
    renderLoadingState,
    shouldRenderContent: !shouldShowLoading && !error
  };
}

// Specialized loading HOCs for common use cases
export const withChartLoading = <P extends object>(
  Component: React.ComponentType<P>
) => withLoadingState(Component, {
  defaultLoadingMessage: 'Loading chart data...',
  showRetryButton: true
});

export const withDataTableLoading = <P extends object>(
  Component: React.ComponentType<P>
) => withLoadingState(Component, {
  defaultLoadingMessage: 'Loading table data...',
  showRetryButton: true
});

export const withFormLoading = <P extends object>(
  Component: React.ComponentType<P>
) => withLoadingState(Component, {
  defaultLoadingMessage: 'Saving...',
  showRetryButton: false
});

// Utility function to create loading skeleton
export const createSkeletonLoader = (
  rows: number = 3,
  height: string = 'h-4',
  className: string = ''
) => {
  const SkeletonLoader = () => (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`bg-secondary-200 rounded ${height}`}
          style={{ width: `${100 - (index * 10)}%` }}
        />
      ))}
    </div>
  );

  return SkeletonLoader;
};
