import React from 'react';

interface SkeletonLoaderProps {
  lines?: number;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  width?: 'full' | '3/4' | '1/2' | '1/4';
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  lines = 1,
  height = 'md',
  width = 'full',
  className = ''
}) => {
  const heightClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12'
  };

  const widthClasses = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/4': 'w-1/4'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-secondary-200 rounded animate-pulse ${heightClasses[height]} ${
            index === lines - 1 && lines > 1 ? widthClasses['3/4'] : widthClasses[width]
          }`}
        />
      ))}
    </div>
  );
};

// Card skeleton for employee cards
export const EmployeeCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-secondary-200 p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <SkeletonLoader height="lg" width="3/4" />
        <SkeletonLoader height="sm" width="1/2" />
      </div>
      <div className="w-16 h-6 bg-secondary-200 rounded-full"></div>
    </div>
    <div className="space-y-2">
      <SkeletonLoader height="sm" width="full" />
      <SkeletonLoader height="sm" width="1/4" />
    </div>
  </div>
);

// Chart skeleton for analytics
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-80' }) => (
  <div className={`bg-secondary-100 rounded-lg animate-pulse ${height} flex items-center justify-center`}>
    <div className="text-secondary-400">
      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
); 