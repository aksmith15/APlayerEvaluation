import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const navigate = useNavigate();

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <svg 
                className="w-6 h-6 text-secondary-400 mx-1" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            
            {item.current ? (
              <span className="text-sm font-medium text-secondary-700" aria-current="page">
                {item.label}
              </span>
            ) : item.href ? (
              <button
                onClick={() => handleNavigation(item.href!)}
                className="text-sm font-medium text-secondary-500 hover:text-secondary-700 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-sm font-medium text-secondary-500">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Hook for generating breadcrumbs based on current route
export const useBreadcrumbs = () => {
  const generateBreadcrumbs = (currentPath: string, employeeName?: string): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always include dashboard/home
    breadcrumbs.push({
      label: 'Employee Selection',
      href: '/employees'
    });

    // Add specific breadcrumb based on current path
    if (currentPath.includes('/analytics')) {
      breadcrumbs.push({
        label: employeeName ? `${employeeName} Analytics` : 'Employee Analytics',
        current: true
      });
    }

    return breadcrumbs;
  };

  return { generateBreadcrumbs };
}; 