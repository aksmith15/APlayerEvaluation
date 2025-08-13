/**
 * Compound Tab System Components
 * Implements flexible tab pattern with compound component architecture
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// Tab Context
interface TabContextType {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: TabConfig[];
  registerTab: (tab: TabConfig) => void;
}

interface TabConfig {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

// Main Tabs Container Component
interface TabsProps {
  children: React.ReactNode;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  children, 
  defaultTab, 
  onChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || '');
  const [tabs, setTabs] = useState<TabConfig[]>([]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  }, [onChange]);

  const registerTab = useCallback((tab: TabConfig) => {
    setTabs(prev => {
      const exists = prev.find(t => t.id === tab.id);
      if (exists) {
        return prev.map(t => t.id === tab.id ? tab : t);
      }
      return [...prev, tab];
    });
    
    // Set first tab as active if no default specified
    if (!activeTab && !defaultTab) {
      setActiveTab(tab.id);
    }
  }, [activeTab, defaultTab]);

  const value: TabContextType = {
    activeTab,
    setActiveTab: handleTabChange,
    tabs,
    registerTab
  };

  return (
    <TabContext.Provider value={value}>
      <div className={`tab-system ${className}`}>
        {children}
      </div>
    </TabContext.Provider>
  );
};

// Tab List Component (renders the tab navigation)
interface TabListProps {
  children?: React.ReactNode;
  className?: string;
}

export const TabList: React.FC<TabListProps> = ({ 
  children, 
  className = '' 
}) => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('TabList must be used within Tabs');
  }

  const { tabs, activeTab, setActiveTab } = context;

  return (
    <div className={`tab-list ${className}`}>
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon && (
                  <span className="mr-2 flex-shrink-0">
                    {tab.icon}
                  </span>
                )}
                
                <span>{tab.label}</span>
                
                {tab.count !== undefined && (
                  <span className={`
                    ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium
                    ${isActive
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-secondary-100 text-secondary-900'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
};

// Individual Tab Component (registers itself and renders content when active)
interface TabProps {
  id: string;
  label: string;
  children: React.ReactNode;
  count?: number;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Tab: React.FC<TabProps> = ({ 
  id, 
  label, 
  children, 
  count, 
  disabled = false,
  icon,
  className = ''
}) => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('Tab must be used within Tabs');
  }

  const { activeTab, registerTab } = context;

  // Register this tab
  React.useEffect(() => {
    registerTab({ id, label, count, disabled, icon });
  }, [id, label, count, disabled, icon, registerTab]);

  // Only render content if this tab is active
  if (activeTab !== id) {
    return null;
  }

  return (
    <div className={`tab-content ${className}`} role="tabpanel" aria-labelledby={`tab-${id}`}>
      {children}
    </div>
  );
};

// Tab Panels Container (optional wrapper for consistent styling)
interface TabPanelsProps {
  children: React.ReactNode;
  className?: string;
}

export const TabPanels: React.FC<TabPanelsProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`tab-panels mt-6 ${className}`}>
      {children}
    </div>
  );
};

// Hook for accessing tab context
export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within Tabs');
  }
  return context;
};

// Convenience hook for tab state
export const useActiveTab = () => {
  const { activeTab, setActiveTab } = useTabContext();
  return [activeTab, setActiveTab] as const;
};
