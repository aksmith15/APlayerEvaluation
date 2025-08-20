// CompanySwitcher Component
// Purpose: Allow super admins to switch between company views
// Date: August 19, 2025

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

interface Company {
  id: string;
  name: string;
}

interface CompanySwitcherProps {
  currentCompanyId?: string;
  onCompanyChange?: (companyId: string) => void;
  className?: string;
}

export const CompanySwitcher: React.FC<CompanySwitcherProps> = ({
  currentCompanyId,
  onCompanyChange,
  className = ''
}) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only show for super admins
  const isSuperAdmin = user?.jwtRole === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      loadCompanies();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin, user]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Super admins can see all companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .is('deleted_at', null)
        .order('name');

      if (companiesError) {
        throw companiesError;
      }

      setCompanies(companiesData || []);

      // Auto-select first company if none selected and companies exist
      if (!currentCompanyId && companiesData && companiesData.length > 0) {
        onCompanyChange?.(companiesData[0].id);
      }

    } catch (err: any) {
      console.error('Failed to load companies:', err);
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCompanyId = event.target.value;
    if (selectedCompanyId) {
      onCompanyChange?.(selectedCompanyId);
      
      // Store selection in localStorage for persistence
      localStorage.setItem('selectedCompanyId', selectedCompanyId);
    }
  };

  // Don't render for non-super admins
  if (!isSuperAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm text-gray-500">Loading companies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm text-gray-500">No companies available</span>
      </div>
    );
  }

  const selectedCompany = companies.find(c => c.id === currentCompanyId);

  return (
    <div className={className}>
      <select
        id="company-switcher"
        value={currentCompanyId || ''}
        onChange={handleCompanyChange}
        title={selectedCompany ? selectedCompany.name : 'Select Company'}
        className="h-9 min-w-0 max-w-full px-3 text-sm border border-slate-300 rounded-md bg-white hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
      >
        {!currentCompanyId && (
          <option value="">Select Company</option>
        )}
        {companies.map(company => (
          <option key={company.id} value={company.id} title={company.name}>
            {company.name}
          </option>
        ))}
      </select>
    </div>
  );
};