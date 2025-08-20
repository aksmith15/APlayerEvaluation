// CompanyContext - Manage selected company for super admins
// Purpose: Provide company switching context and data filtering
// Date: August 19, 2025

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

interface Company {
  id: string;
  name: string;
}

interface CompanyContextType {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (companyId: string) => void;
  isCompanySelected: boolean;
  getCompanyFilter: () => string | null;
  userDefaultCompanyId: string | null;
  companies: Company[];
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [userDefaultCompanyId, setUserDefaultCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.jwtRole === 'super_admin';

  useEffect(() => {
    if (user) {
      loadUserCompanyContext();
    }
  }, [user?.id, isSuperAdmin]);

  const loadUserCompanyContext = async () => {
    try {
      setLoading(true);

      // Get user's default company from people table
      const { data: peopleData } = await supabase
        .from('people')
        .select('company_id')
        .eq('email', user?.email)
        .eq('active', true)
        .single();

      if (peopleData?.company_id) {
        setUserDefaultCompanyId(peopleData.company_id);
      }

      if (isSuperAdmin) {
        // Load all companies for super admin
        const { data: allCompanies } = await supabase
          .from('companies')
          .select('id, name')
          .is('deleted_at', null)
          .order('name');

        setCompanies(allCompanies || []);

        // Try to restore from localStorage, fallback to user's default company
        const saved = localStorage.getItem('selectedCompanyId');
        if (saved && allCompanies?.find(c => c.id === saved)) {
          setSelectedCompanyIdState(saved);
        } else if (peopleData?.company_id) {
          setSelectedCompanyIdState(peopleData.company_id);
        } else if (allCompanies && allCompanies.length > 0) {
          setSelectedCompanyIdState(allCompanies[0].id);
        }
      } else {
        // Regular users: use their default company
        if (peopleData?.company_id) {
          setSelectedCompanyIdState(peopleData.company_id);
          
          // Load just their company info
          const { data: userCompany } = await supabase
            .from('companies')
            .select('id, name')
            .eq('id', peopleData.company_id)
            .single();
          
          if (userCompany) {
            setCompanies([userCompany]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load company context:', error);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedCompanyId = (companyId: string) => {
    setSelectedCompanyIdState(companyId);
    
    // Persist selection for super admins
    if (isSuperAdmin) {
      localStorage.setItem('selectedCompanyId', companyId);
    }
  };

  const getCompanyFilter = (): string | null => {
    if (isSuperAdmin) {
      // Super admins use selected company
      return selectedCompanyId;
    } else {
      // Regular users: we'd need to fetch their company_id from people table
      // For now, return null (this would need to be enhanced)
      return null;
    }
  };

  const isCompanySelected = selectedCompanyId !== null;

  const value: CompanyContextType = {
    selectedCompanyId,
    setSelectedCompanyId,
    isCompanySelected,
    getCompanyFilter,
    userDefaultCompanyId,
    companies,
    loading
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

// Optional version that returns null if no provider is available
export const useCompanyOptional = (): CompanyContextType | null => {
  const context = useContext(CompanyContext);
  return context || null;
};