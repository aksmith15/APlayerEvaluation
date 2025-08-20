import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { FEATURES } from '../../constants/config';

interface Tab {
  id: string;
  name: string;
  badge?: number;
}



interface ManagerDashboardNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export const ManagerDashboardNav: React.FC<ManagerDashboardNavProps> = ({
  activeTab,
  onTabChange,
  className = ''
}) => {
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] = useState(false);
  const assignmentDropdownRef = useRef<HTMLDivElement>(null);

  // Assignment Management sub-tabs
  const assignmentTabs: Tab[] = [
    { id: 'overview', name: 'Overview' },
    { id: 'create', name: 'Create Assignments' },
    { id: 'upload', name: 'Bulk Upload' },
    { id: 'manage', name: 'Manage Assignments' },
    { id: 'coverage', name: 'Coverage Tracking' }
  ];

  // Other top-level tabs
  const otherTabs: Tab[] = [
    { id: 'weights', name: 'Attribute Weights' },
    { id: 'invitations', name: 'Company Invitations' },
    ...(FEATURES.DEBUG_TABS ? [{ id: 'debug', name: 'Debug' }] : [])
  ];

  const allTabs = [...assignmentTabs, ...otherTabs];

  // Check if current active tab is under Assignment Management
  const isAssignmentTabActive = assignmentTabs.some(tab => tab.id === activeTab);
  const activeAssignmentTab = assignmentTabs.find(tab => tab.id === activeTab);

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assignmentDropdownRef.current && !assignmentDropdownRef.current.contains(event.target as Node)) {
        setIsAssignmentDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAssignmentDropdownOpen(false);
      }
    };

    if (isAssignmentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isAssignmentDropdownOpen]);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsAssignmentDropdownOpen(false);
  };

  const handleAssignmentDropdownToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsAssignmentDropdownOpen(!isAssignmentDropdownOpen);
  };

  const handleDropdownKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsAssignmentDropdownOpen(!isAssignmentDropdownOpen);
    } else if (event.key === 'Escape') {
      setIsAssignmentDropdownOpen(false);
    }
  };

  return (
    <nav className={`${className}`} role="navigation" aria-label="Manager Dashboard Navigation">
      {/* Desktop Navigation (≥1024px) */}
      <div className="hidden lg:flex items-center justify-center gap-6">
        {/* Assignment Management Dropdown */}
        <div className="relative" ref={assignmentDropdownRef}>
          <button
            onClick={handleAssignmentDropdownToggle}
            onKeyDown={handleDropdownKeyDown}
            className={`
              flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2
              ${isAssignmentTabActive 
                ? 'text-slate-900 bg-slate-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }
            `}
            aria-expanded={isAssignmentDropdownOpen}
            aria-haspopup="true"
            aria-label={`Assignment Management menu${isAssignmentTabActive && activeAssignmentTab ? ` - Currently viewing ${activeAssignmentTab.name}` : ''}`}
            id="assignment-dropdown-trigger"
          >
            <span>Assignment Management</span>
            {isAssignmentTabActive && activeAssignmentTab && (
              <span className="text-xs text-slate-500 font-normal">
                ({activeAssignmentTab.name})
              </span>
            )}
            <ChevronDown 
              size={16} 
              className={`transition-transform duration-200 ${isAssignmentDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Assignment Management Dropdown Menu */}
          {isAssignmentDropdownOpen && (
            <div 
              className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
              role="menu"
              aria-labelledby="assignment-dropdown-trigger"
            >
              <div className="py-1">
                {assignmentTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTabClick(tab.id);
                      }
                    }}
                    className={`
                      w-full px-4 py-2.5 text-left text-sm transition-colors focus:outline-none focus:bg-slate-50
                      ${tab.id === activeTab 
                        ? 'bg-slate-100 text-slate-900 font-medium' 
                        : 'text-slate-700 hover:bg-slate-50'
                      }
                    `}
                    role="menuitem"
                    tabIndex={isAssignmentDropdownOpen ? 0 : -1}
                  >
                    {tab.name}
                    {tab.badge && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-800 rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Other Top-Level Tabs */}
        {otherTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabClick(tab.id);
              }
            }}
            className={`
              px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md whitespace-nowrap
              focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2
              ${tab.id === activeTab 
                ? 'text-slate-900 bg-slate-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }
            `}
          >
            {tab.name}
            {tab.badge && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-800 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tablet/Mobile Navigation (<1024px) */}
      <div className="lg:hidden">
        {/* Horizontal Scrollable Tabs */}
        <div className="flex items-center justify-start gap-2">
          {/* Assignment Management Dropdown (Mobile) */}
          <div className="relative flex-shrink-0">
            <button
              onClick={handleAssignmentDropdownToggle}
              onKeyDown={handleDropdownKeyDown}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1
                ${isAssignmentTabActive 
                  ? 'text-slate-900 bg-slate-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
              aria-expanded={isAssignmentDropdownOpen}
              aria-haspopup="true"
              aria-label="Assignment Management menu"
            >
              <span className="truncate max-w-[100px]">
                {isAssignmentTabActive && activeAssignmentTab 
                  ? activeAssignmentTab.name 
                  : 'Assignment'
                }
              </span>
              <ChevronDown 
                size={14} 
                className={`transition-transform duration-200 ${isAssignmentDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Mobile Assignment Dropdown */}
            {isAssignmentDropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
                role="menu"
              >
                <div className="py-1">
                  {assignmentTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTabClick(tab.id);
                        }
                      }}
                      className={`
                        w-full px-4 py-2.5 text-left text-sm transition-colors focus:outline-none focus:bg-slate-50
                        ${tab.id === activeTab 
                          ? 'bg-slate-100 text-slate-900 font-medium' 
                          : 'text-slate-700 hover:bg-slate-50'
                        }
                      `}
                      role="menuitem"
                      tabIndex={isAssignmentDropdownOpen ? 0 : -1}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Horizontal scrollable other tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0">
            {otherTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTabClick(tab.id);
                  }
                }}
                className={`
                  px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md whitespace-nowrap flex-shrink-0 
                  focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1
                  ${tab.id === activeTab 
                    ? 'text-slate-900 bg-slate-100' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* More menu for extreme mobile if needed */}
          {/* This could be implemented if tabs don't fit even with scrolling */}
        </div>
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Current tab: {allTabs.find(tab => tab.id === activeTab)?.name || 'Unknown'}
      </div>
    </nav>
  );
};
