// CSV Template Service
// Purpose: Generate downloadable CSV template for bulk invitations
// Date: August 19, 2025

export interface Company {
  id: string;
  name: string;
}

export interface BulkInviteRecord {
  email: string;
  company_id: string;
  company_role: 'admin' | 'member' | 'viewer' | 'owner';
  position: string;
  jwt_role?: 'hr_admin' | 'super_admin' | '';
}

export interface BulkInviteResult extends BulkInviteRecord {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Generates and downloads a CSV template for bulk invitations
 * @param companies Array of available companies to include as examples
 * @param selectedCompanyId The currently selected company ID to pre-fill
 * @param isSuperAdmin Whether the user is a super admin (can assign jwt_role)
 */
export const generateCSVTemplate = (
  companies: Company[] = [], 
  selectedCompanyId?: string,
  isSuperAdmin: boolean = false
) => {
  // Determine which company ID to use
  const targetCompanyId = selectedCompanyId || companies[0]?.id || '00000000-0000-0000-0000-000000000001';
  const targetCompanyName = companies.find(c => c.id === targetCompanyId)?.name || 'Selected Company';
  
  // Create clean CSV content WITHOUT comment lines to avoid Excel corruption
  const csvLines: string[] = [];
  
  // Add headers only (no comments to avoid confusion)
  if (isSuperAdmin) {
    csvLines.push('email,company_id,company_role,position,jwt_role');
  } else {
    csvLines.push('email,company_id,company_role,position');
  }
  
  // Add minimal sample rows with only company_id pre-filled
  if (isSuperAdmin) {
    csvLines.push(`,${targetCompanyId},,,`);
    csvLines.push(`,${targetCompanyId},,,`);
  } else {
    csvLines.push(`,${targetCompanyId},,`);
    csvLines.push(`,${targetCompanyId},,`);
  }
  
  const csvContent = csvLines.join('\n');
  
  // Create and download blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const companyPrefix = targetCompanyName.replace(/[^a-zA-Z0-9]/g, '_') || 'company';
  link.href = url;
  link.download = `bulk_invite_${companyPrefix}_${new Date().toISOString().split('T')[0]}.csv`;
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
  
  console.log(`CSV template downloaded for ${targetCompanyName} (${targetCompanyId})`);
};

/**
 * Validates email format
 * @param email Email address to validate
 * @returns True if email format is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Validates a single bulk invite record
 * @param record Record to validate
 * @param companies Available companies for validation
 * @param isSuperAdmin Whether the user is a super admin (affects jwt_role validation)
 * @returns Array of error messages (empty if valid)
 */
export const validateBulkInviteRecord = (
  record: BulkInviteRecord, 
  companies: Company[],
  isSuperAdmin: boolean = false
): string[] => {
  const errors: string[] = [];
  
  // Validate email
  if (!record.email || !isValidEmail(record.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate company ID - be more flexible if we don't have company data
  if (!record.company_id) {
    errors.push('Company ID is required');
  } else if (companies.length > 0 && !companies.find(c => c.id === record.company_id)) {
    // Only warn about invalid company ID if we have companies to validate against
    console.warn(`Company ID ${record.company_id} not found in available companies:`, companies.map(c => c.id));
    // For now, let's not fail validation on this - the backend will handle it
  }
  
  // Validate company role
  if (!record.company_role) {
    errors.push('Company role is required');
  } else if (!['admin', 'member', 'viewer', 'owner'].includes(record.company_role)) {
    errors.push(`Invalid company role: ${record.company_role}. Must be 'admin', 'member', 'viewer', or 'owner'`);
  }
  
  // Validate position
  if (!record.position || record.position.trim().length === 0) {
    errors.push('Position is required');
  }
  
  // Validate jwt_role if provided (only for super admins)
  if (record.jwt_role && record.jwt_role.trim() !== '') {
    if (!isSuperAdmin) {
      errors.push('jwt_role can only be set by super admins');
    } else if (!['hr_admin', 'super_admin'].includes(record.jwt_role)) {
      errors.push(`Invalid jwt_role: ${record.jwt_role}. Must be 'hr_admin', 'super_admin', or empty`);
    }
  }
  
  return errors;
};

/**
 * Validates an array of bulk invite records
 * @param records Records to validate
 * @param companies Available companies for validation
 * @param isSuperAdmin Whether the user is a super admin (affects validation)
 * @returns Array of validation error messages with row numbers
 */
export const validateBulkInviteData = (
  records: BulkInviteRecord[], 
  companies: Company[],
  isSuperAdmin: boolean = false
): string[] => {
  const errors: string[] = [];
  const emailSet = new Set<string>();
  
  console.log(`Validating ${records.length} records with ${companies.length} companies available`);
  
  records.forEach((record, index) => {
    const rowNumber = index + 2; // Account for header row and 0-based index
    
    console.log(`Validating row ${rowNumber}:`, record);
    
    // Validate individual record
    const recordErrors = validateBulkInviteRecord(record, companies, isSuperAdmin);
    recordErrors.forEach(error => {
      errors.push(`Row ${rowNumber}: ${error}`);
    });
    
    // Check for duplicate emails within the CSV
    if (record.email) {
      const normalizedEmail = record.email.trim().toLowerCase();
      if (emailSet.has(normalizedEmail)) {
        errors.push(`Row ${rowNumber}: Duplicate email: ${record.email}`);
      } else {
        emailSet.add(normalizedEmail);
      }
    }
  });
  
  console.log(`Validation complete. Found ${errors.length} errors:`, errors);
  return errors;
};

/**
 * Creates a formatted company list string for display in template instructions
 * @param companies Available companies
 * @returns Formatted string with company IDs and names
 */
export const formatCompanyList = (companies: Company[]): string => {
  if (companies.length === 0) {
    return 'No companies available';
  }
  
  return companies.map(company => `${company.id} (${company.name})`).join(', ');
};
