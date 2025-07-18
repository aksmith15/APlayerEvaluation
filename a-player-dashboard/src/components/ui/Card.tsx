import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  // Enhanced accessibility props
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tabIndex?: number;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hoverable = false, 
  onClick,
  role,
  ariaLabel,
  ariaDescribedBy,
  tabIndex
}) => {
  const isInteractive = Boolean(onClick);
  const cardRole = role || (isInteractive ? 'button' : undefined);
  const cardTabIndex = tabIndex ?? (isInteractive ? 0 : undefined);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  const baseClasses = 'card bg-white rounded-lg shadow-sm border border-secondary-200 p-6 transition-all duration-200';
  const hoverClasses = hoverable ? 'hover:shadow-md hover:border-secondary-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2' : '';
  const combinedClassName = `${baseClasses} ${hoverClasses} ${className}`;

  return (
    <div
      className={combinedClassName}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={cardRole}
      tabIndex={cardTabIndex}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </div>
  );
}; 