import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface AssignmentManagementDropdownProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
  className?: string;
}

export const AssignmentManagementDropdown: React.FC<AssignmentManagementDropdownProps> = ({
  activeSubTab,
  onSubTabChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const assignmentTabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'create', name: 'Create Assignments' },
    { id: 'upload', name: 'Bulk Upload' },
    { id: 'manage', name: 'Manage Assignments' },
    { id: 'coverage', name: 'Coverage Tracking' }
  ];

  const activeTab = assignmentTabs.find(tab => tab.id === activeSubTab);
  const isAssignmentTabActive = assignmentTabs.some(tab => tab.id === activeSubTab);

  const handleSubTabClick = (tabId: string) => {
    onSubTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1 px-2 py-1.5 text-slate-600 hover:text-slate-900 transition-colors text-sm whitespace-nowrap
          ${isAssignmentTabActive ? 'font-medium text-slate-900 underline underline-offset-4' : ''}
        `}
        aria-expanded={isOpen}
      >
        <span>Assignment Management</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {assignmentTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSubTabClick(tab.id)}
                className={`
                  w-full px-4 py-2 text-left text-sm transition-colors
                  ${tab.id === activeSubTab 
                    ? 'bg-slate-100 text-slate-900 font-medium' 
                    : 'text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show current sub-tab when active */}
      {isAssignmentTabActive && activeTab && (
        <span className="ml-2 text-xs text-slate-500">
          ({activeTab.name})
        </span>
      )}
    </div>
  );
};
