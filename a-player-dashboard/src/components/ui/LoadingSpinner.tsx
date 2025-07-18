import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
  // Enhanced accessibility props
  ariaLabel?: string;
  role?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullScreen = false,
  ariaLabel,
  role = 'status'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const content = (
    <div className="text-center">
      <div 
        className={`animate-spin rounded-full border-b-2 border-primary-600 mx-auto ${sizeClasses[size]}`}
        role={role}
        aria-label={ariaLabel || (message ? `Loading: ${message}` : 'Loading content')}
        aria-live="polite"
      >
        <span className="sr-only">
          {message || 'Loading...'}
        </span>
      </div>
      {message && (
        <p className="mt-4 text-secondary-600" aria-hidden="true">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        role="main"
        aria-label="Loading page content"
      >
        {content}
      </div>
    );
  }

  return content;
}; 