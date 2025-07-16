import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className = ''
}) => {
  const defaultIcon = (
    <svg className="w-16 h-16 text-secondary-300" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mb-4 flex justify-center">
        {icon || defaultIcon}
      </div>
      {title && (
        <h3 className="text-lg font-medium text-secondary-700 mb-2">{title}</h3>
      )}
      <p className="text-secondary-500 mb-6 max-w-md mx-auto">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Specific empty states for common scenarios
export const NoEmployeesFound: React.FC<{ onReset?: () => void }> = ({ onReset }) => (
  <EmptyState
    icon={
      <svg className="w-16 h-16 text-secondary-300" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    }
    title="No employees found"
    message="Try adjusting your search criteria or filters to find employees."
    action={onReset ? { label: "Clear Filters", onClick: onReset } : undefined}
  />
);

export const NoEvaluationData: React.FC<{ quarterName?: string }> = ({ quarterName }) => (
  <EmptyState
    icon={
      <svg className="w-16 h-16 text-secondary-300" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    }
    title="No evaluation data available"
    message={quarterName 
      ? `No evaluation data found for ${quarterName}. The employee may not have been evaluated in this quarter.`
      : "No evaluation data found for the selected quarter."
    }
  />
); 