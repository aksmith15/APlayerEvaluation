import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PersonaWidgetData, PersonaType } from '../../types/evaluation';
import { fetchPersonaWidget } from '../../services/personaService';

interface PersonaQuickGlanceWidgetProps {
  employeeId: string;
  quarterId: string;
  employeeName?: string;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (personaData: PersonaWidgetData) => void;
}

// Persona icons mapping
const PERSONA_ICONS: Record<PersonaType, string> = {
  'A-Player': '🌟',
  'Adaptive Leader': '👑',
  'Adaptable Veteran': '🔧',
  'Sharp & Eager Sprout': '🌱',
  'Reliable Contributor': '⚡',
  'Collaborative Specialist': '🤝',
  'Visionary Soloist': '💡',
  'Developing Contributor': '📈',
  'At-Risk': '⚠️'
};

// Performance level indicators
const PERFORMANCE_INDICATORS: Record<string, { symbol: string; description: string }> = {
  'Exceptional': { symbol: '★★★', description: 'Top performer' },
  'High': { symbol: '★★☆', description: 'High performer' },
  'High Potential': { symbol: '★☆☆', description: 'High potential' },
  'Solid': { symbol: '●●○', description: 'Solid contributor' },
  'Below Standards': { symbol: '●○○', description: 'Needs improvement' }
};

export const PersonaQuickGlanceWidget: React.FC<PersonaQuickGlanceWidgetProps> = ({
  employeeId,
  quarterId,
  employeeName,
  className = '',
  showTooltip = true,
  size = 'md',
  onClick
}) => {
  const [personaData, setPersonaData] = useState<PersonaWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTooltipModal, setShowTooltipModal] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, placement: 'bottom' });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const loadPersonaData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchPersonaWidget(employeeId, quarterId);
        setPersonaData(data);
      } catch (err) {
        console.error('Error loading persona data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load persona data');
      } finally {
        setLoading(false);
      }
    };

    if (employeeId && quarterId) {
      loadPersonaData();
    }
  }, [employeeId, quarterId]);

  // Calculate optimal tooltip position
  const calculateTooltipPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = 320; // w-80 = 320px
    const tooltipHeight = 400; // Approximate height
    const margin = 8; // Space between button and tooltip

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = buttonRect.bottom + margin;
    let left = buttonRect.left;
    let placement = 'bottom';

    // Check if tooltip would go off the right edge
    if (left + tooltipWidth > viewportWidth) {
      left = viewportWidth - tooltipWidth - margin;
    }

    // Check if tooltip would go off the left edge
    if (left < margin) {
      left = margin;
    }

    // Check if tooltip would go off the bottom edge
    if (top + tooltipHeight > viewportHeight) {
      // Try positioning above the button
      const topAbove = buttonRect.top - tooltipHeight - margin;
      if (topAbove >= margin) {
        top = topAbove;
        placement = 'top';
      } else {
        // If neither above nor below works, position to the side
        if (buttonRect.left > viewportWidth / 2) {
          // Position to the left
          left = buttonRect.left - tooltipWidth - margin;
          top = buttonRect.top;
          placement = 'left';
        } else {
          // Position to the right
          left = buttonRect.right + margin;
          top = buttonRect.top;
          placement = 'right';
        }
      }
    }

    setTooltipPosition({ top, left, placement });
  }, []);

  // Handle window resize and escape key while tooltip is open
  useEffect(() => {
    const handleResize = () => {
      if (showTooltipModal) {
        calculateTooltipPosition();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showTooltipModal) {
        setShowTooltipModal(false);
      }
    };

    if (showTooltipModal) {
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      document.addEventListener('keydown', handleEscape);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showTooltipModal, calculateTooltipPosition]);

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Loading state
  if (loading) {
    return (
      <div className={`inline-flex items-center space-x-2 ${sizeClasses[size]} bg-gray-100 text-gray-500 rounded-full border animate-pulse ${className}`}>
        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        <span>Loading...</span>
      </div>
    );
  }

  // Error state
  if (error || !personaData) {
    return (
      <div className={`inline-flex items-center space-x-2 ${sizeClasses[size]} bg-red-50 text-red-600 rounded-full border border-red-200 ${className}`}>
        <span className={iconSizeClasses[size]}>❌</span>
        <span>No Data</span>
      </div>
    );
  }

  const { persona_type, performance_level, hml_pattern, color_theme, development_summary } = personaData;
  const icon = PERSONA_ICONS[persona_type];
  const performanceIndicator = PERFORMANCE_INDICATORS[performance_level];

  const handleWidgetClick = () => {
    if (onClick) {
      onClick(personaData);
    } else if (showTooltip) {
      if (!showTooltipModal) {
        calculateTooltipPosition();
      }
      setShowTooltipModal(!showTooltipModal);
    }
  };

  return (
    <div className="relative persona-quick-glance-widget">
      {/* Main Widget Badge */}
      <button
        ref={buttonRef}
        onClick={handleWidgetClick}
        className={`
          inline-flex items-center space-x-2 ${sizeClasses[size]} rounded-full border transition-all duration-200
          hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          cursor-pointer ${className}
        `}
        style={{
          backgroundColor: color_theme.background,
          borderColor: color_theme.primary,
          color: color_theme.text
        }}
        aria-label={`${employeeName || 'Employee'} persona: ${persona_type}`}
        title={showTooltip ? `Click for ${persona_type} details` : undefined}
      >
        {/* Persona Icon */}
        <span className={`${iconSizeClasses[size]} flex-shrink-0`}>
          {icon}
        </span>
        
        {/* Persona Type */}
        <span className="font-medium whitespace-nowrap">
          {persona_type}
        </span>

        {/* H/M/L Pattern Badge */}
        <span 
          className="text-xs px-1.5 py-0.5 rounded-md font-mono"
          style={{
            backgroundColor: color_theme.primary,
            color: 'white'
          }}
          title={`Performance pattern: Competence/Character/Curiosity`}
        >
          {hml_pattern}
        </span>

        {/* Performance Level Indicator */}
        <span 
          className={`${iconSizeClasses[size]} flex-shrink-0`}
          title={performanceIndicator.description}
        >
          {performanceIndicator.symbol}
        </span>

        {/* Tooltip Arrow Indicator */}
        {showTooltip && (
          <span className="text-xs opacity-60">▼</span>
        )}
      </button>

      {/* Tooltip Modal */}
      {showTooltip && showTooltipModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setShowTooltipModal(false)}
          />
          
          {/* Tooltip Content */}
          <div 
            className="fixed w-80 bg-white rounded-lg shadow-xl border z-50 p-4 animate-in fade-in duration-200"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            {/* Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: color_theme.background }}
              >
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{persona_type}</h3>
                <p className="text-sm text-gray-500">{employeeName || 'Employee'}</p>
              </div>
              <button
                onClick={() => setShowTooltipModal(false)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Performance Breakdown */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Core Group Performance</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-blue-600">🎯 Competence</div>
                  <div className="text-lg font-bold">{personaData.core_group_breakdown.competence.level}</div>
                  <div className="text-gray-500">{personaData.core_group_breakdown.competence.score.toFixed(1)}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-green-600">👥 Character</div>
                  <div className="text-lg font-bold">{personaData.core_group_breakdown.character.level}</div>
                  <div className="text-gray-500">{personaData.core_group_breakdown.character.score.toFixed(1)}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-purple-600">🚀 Curiosity</div>
                  <div className="text-lg font-bold">{personaData.core_group_breakdown.curiosity.level}</div>
                  <div className="text-gray-500">{personaData.core_group_breakdown.curiosity.score.toFixed(1)}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{personaData.persona_description}</p>
            </div>

            {/* Development Focus */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Development Focus</h4>
              <p className="text-sm font-medium" style={{ color: color_theme.primary }}>
                {development_summary.primary_focus}
              </p>
            </div>

            {/* Key Recommendations */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Key Recommendations</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {development_summary.key_recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t text-xs text-gray-500 text-center">
              Performance Level: {performance_level} ({performanceIndicator.symbol})
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Compact version for use in lists/tables
export const PersonaQuickBadge: React.FC<Pick<PersonaQuickGlanceWidgetProps, 'employeeId' | 'quarterId' | 'className'>> = ({
  employeeId,
  quarterId,
  className = ''
}) => {
  return (
    <PersonaQuickGlanceWidget
      employeeId={employeeId}
      quarterId={quarterId}
      className={className}
      showTooltip={false}
      size="sm"
    />
  );
};

export default PersonaQuickGlanceWidget;