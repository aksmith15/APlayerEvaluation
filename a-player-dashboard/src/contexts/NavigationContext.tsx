import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/config';

interface NavigationState {
  previousEmployee?: {
    id: string;
    name: string;
  };
  searchFilters?: {
    searchTerm: string;
    department: string;
  };
  lastVisitedQuarter?: string;
}

interface NavigationContextType {
  navigationState: NavigationState;
  updateNavigationState: (updates: Partial<NavigationState>) => void;
  navigateToEmployee: (employeeId: string, employeeName: string) => void;
  navigateToEmployeeSelection: (preserveFilters?: boolean) => void;
  navigateBack: () => void;
  clearNavigationState: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationState, setNavigationState] = useState<NavigationState>({});

  const updateNavigationState = useCallback((updates: Partial<NavigationState>) => {
    setNavigationState(prev => ({ ...prev, ...updates }));
  }, []);

  const navigateToEmployee = useCallback((employeeId: string, employeeName: string) => {
    // Store current employee info for navigation context
    updateNavigationState({
      previousEmployee: { id: employeeId, name: employeeName }
    });
    
    navigate(`${ROUTES.EMPLOYEE_ANALYTICS}?employeeId=${employeeId}`);
  }, [navigate, updateNavigationState]);

  const navigateToEmployeeSelection = useCallback((preserveFilters = true) => {
    // Navigate back to employee selection, optionally preserving search state
    navigate(ROUTES.EMPLOYEE_SELECTION, {
      state: preserveFilters ? { 
        searchFilters: navigationState.searchFilters 
      } : undefined
    });
  }, [navigate, navigationState.searchFilters]);

  const navigateBack = useCallback(() => {
    // Smart back navigation based on current location
    if (location.pathname.includes('/analytics')) {
      navigateToEmployeeSelection(true);
    } else {
      navigate(-1);
    }
  }, [location.pathname, navigate, navigateToEmployeeSelection]);

  const clearNavigationState = useCallback(() => {
    setNavigationState({});
  }, []);

  const value: NavigationContextType = {
    navigationState,
    updateNavigationState,
    navigateToEmployee,
    navigateToEmployeeSelection,
    navigateBack,
    clearNavigationState
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Custom hook for keyboard navigation shortcuts
export const useKeyboardNavigation = () => {
  const { navigateBack, navigateToEmployeeSelection } = useNavigation();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + B = Back navigation
      if (event.altKey && event.key === 'b') {
        event.preventDefault();
        navigateBack();
      }
      
      // Alt + H = Home (Employee Selection)
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        navigateToEmployeeSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigateBack, navigateToEmployeeSelection]);
}; 