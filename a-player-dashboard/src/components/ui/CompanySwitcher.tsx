import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { getUserCompanies, switchCompanyContext } from '../../lib/resolveCompany';
import { getCompanyContext } from '../../lib/tenantContext';
import { supabase } from '../../services/supabase';

interface Company {
  id: string;
  name: string;
  role?: string;
}

interface CompanySwitcherProps {
  className?: string;
  showLabel?: boolean;
}

// Company icon component
const CompanyIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
  </svg>
);

// Switch icon component  
const SwitchIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l-4-4" />
  </svg>
);

export const CompanySwitcher: React.FC<CompanySwitcherProps> = ({ 
  className = "", 
  showLabel = true 
}) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Only show for super_admin users
  const isSuperAdmin = user?.jwtRole === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) return;

    const loadCompanies = async () => {
      try {
        setLoading(true);
        const userCompanies = await getUserCompanies(supabase);
        setCompanies(userCompanies);

        // Get current company context
        try {
          const context = getCompanyContext();
          const current = userCompanies.find(c => c.id === context.companyId);
          setCurrentCompany(current || null);
        } catch {
          // Context not set, use first company
          setCurrentCompany(userCompanies[0] || null);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [isSuperAdmin]);

  const handleCompanySwitch = async (company: Company) => {
    if (!company || company.id === currentCompany?.id) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(true);
      console.log(`🔄 Switching to company: ${company.name} (${company.id})`);
      
      const result = await switchCompanyContext(supabase, company.id);
      
      if (result.success) {
        setCurrentCompany(company);
        setIsOpen(false);
        console.log(`✅ Successfully switched to: ${company.name}`);
        
        // Optionally reload the page to refresh all data
        window.location.reload();
      } else {
        console.error('❌ Failed to switch company:', result.message);
        alert(`Failed to switch company: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error switching company:', error);
      alert('An error occurred while switching companies');
    } finally {
      setSwitching(false);
    }
  };

  // Don't render for non-super admins
  if (!isSuperAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <LoadingSpinner size="sm" />
        {showLabel && <span className="text-sm text-gray-600">Loading companies...</span>}
      </div>
    );
  }

  // Don't show if only one company (no switching needed)
  if (companies.length <= 1) {
    return currentCompany && showLabel ? (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CompanyIcon className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">{currentCompany.name}</span>
      </div>
    ) : null;
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center space-x-2 min-w-0"
      >
        <CompanyIcon className="w-4 h-4 flex-shrink-0" />
        {showLabel && (
          <span className="truncate max-w-32">
            {currentCompany?.name || 'Select Company'}
          </span>
        )}
        <SwitchIcon className="w-3 h-3 flex-shrink-0" />
        {switching && <LoadingSpinner size="sm" />}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            <div className="py-1">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Switch Company Context
                </p>
              </div>
              
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanySwitch(company)}
                  disabled={switching}
                  className={`
                    w-full text-left px-3 py-2 text-sm transition-colors
                    ${company.id === currentCompany?.id 
                      ? 'bg-blue-50 text-blue-700 cursor-default' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                    ${switching ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CompanyIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{company.name}</span>
                    </div>
                    {company.id === currentCompany?.id && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompanySwitcher;
